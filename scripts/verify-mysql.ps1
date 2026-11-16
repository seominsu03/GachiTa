param([switch]$CheckJavaOnly)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot 'backend'
$logDirectory = Join-Path $projectRoot '.expo'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$previousPassword = $env:DB_PASSWORD
$previousUrl = $env:DB_URL
$previousUsername = $env:DB_USERNAME
$previousApi = $env:GACHITA_VERIFY_API_URL
$serverProcess = $null
# Resolve a real JDK 21 directory before asking for a database password.
$javaCandidates = @($env:JAVA_HOME)
$javaBase = Join-Path $env:ProgramFiles 'Java'
if (Test-Path -LiteralPath $javaBase) {
    $javaCandidates += Get-ChildItem -LiteralPath $javaBase -Directory -Filter 'jdk-21*' | Sort-Object Name -Descending | Select-Object -ExpandProperty FullName
}
$resolvedJavaHome = $null
foreach ($candidate in $javaCandidates) {
    if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
    try {
        $normalized = (Resolve-Path -LiteralPath $candidate.Trim('"') -ErrorAction Stop).ProviderPath
        $candidateCompiler = Join-Path $normalized 'bin\javac.exe'
        if (-not (Test-Path -LiteralPath $candidateCompiler)) { continue }
        $compilerVersion = (& $candidateCompiler -version 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -eq 0 -and $compilerVersion -match '^javac 21(\.|$)') { $resolvedJavaHome = $normalized; break }
    } catch { continue }
}
if (-not $resolvedJavaHome) { throw 'JDK 21 was not found. Set JAVA_HOME to the installed JDK 21 directory.' }
$env:JAVA_HOME = $resolvedJavaHome
$javaPath = Join-Path $resolvedJavaHome 'bin\java.exe'
Write-Host ('PASS: JDK 21 found at ' + $resolvedJavaHome)
if ($CheckJavaOnly) {
    Push-Location $backendPath
    try {
        & .\mvnw.cmd --version
        if ($LASTEXITCODE -ne 0) { throw 'Maven Wrapper Java preflight failed.' }
    } finally { Pop-Location }
    return
}
Write-Host 'Verify local MySQL: creates one test account and three rooms, restarts its own server, checks persistence.'
Write-Host 'Existing application data is kept. Test records remain in your local database.'
$secret = Read-Host 'Enter the gachita database account password (not root)' -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
$env:DB_USERNAME = 'gachita'
$env:DB_URL = 'jdbc:mysql://localhost:3306/gachita?serverTimezone=UTC&characterEncoding=UTF-8'
$env:GACHITA_VERIFY_API_URL = 'http://127.0.0.1:18080'
function Start-VerificationServer([string]$name) {
    $jarPath = Join-Path $backendPath 'target/gachita-backend-0.0.1-SNAPSHOT.jar'
    $outPath = Join-Path $logDirectory ($name + '.log')
    $errorPath = Join-Path $logDirectory ($name + '-error.log')
    $process = Start-Process -FilePath $javaPath -ArgumentList @('-jar', ('"' + $jarPath + '"'), '--spring.profiles.active=dev', '--server.address=127.0.0.1', '--server.port=18080', '--debug=false', '--logging.level.org.hibernate.SQL=WARN') -WorkingDirectory $backendPath -WindowStyle Hidden -RedirectStandardOutput $outPath -RedirectStandardError $errorPath -PassThru
    try {
        for ($attempt = 0; $attempt -lt 90; $attempt++) {
            if ($process.HasExited) { throw ('Server failed. Check ' + $outPath + ' and ' + $errorPath) }
            try {
                $response = Invoke-WebRequest -Uri ($env:GACHITA_VERIFY_API_URL + '/api/v1/auth/csrf') -UseBasicParsing -TimeoutSec 5
                if ($response.StatusCode -eq 200) { Write-Host ('PASS: dev server started, PID ' + $process.Id + ', JPA validated MySQL tables'); return $process }
            } catch { }
            Start-Sleep -Milliseconds 500
        }
        throw 'Server startup timed out.'
    } catch {
        if (-not $process.HasExited) { Stop-Process -Id $process.Id }
        throw
    }
}
try {
    if (Get-NetTCPConnection -State Listen -LocalPort 18080 -ErrorAction SilentlyContinue) { throw 'Port 18080 is already in use. Stop that server before verification.' }
    Push-Location $backendPath
    try {
        & .\mvnw.cmd package -DskipTests
        if ($LASTEXITCODE -ne 0) { throw 'Backend package failed.' }
    } finally { Pop-Location }
    $serverProcess = Start-VerificationServer 'mysql-before-restart'
    & node (Join-Path $PSScriptRoot 'check-mysql-persistence.cjs') prepare
    if ($LASTEXITCODE -ne 0) { throw 'MySQL preparation check failed.' }
    Stop-Process -Id $serverProcess.Id
    $serverProcess.WaitForExit()
    $serverProcess = $null
    $serverProcess = Start-VerificationServer 'mysql-after-restart'
    & node (Join-Path $PSScriptRoot 'check-mysql-persistence.cjs') check
    if ($LASTEXITCODE -ne 0) { throw 'MySQL persistence check failed.' }
    Write-Host 'SUCCESS: real MySQL verification complete.' -ForegroundColor Green
} catch {
    Write-Host ('FAILED: ' + $_.Exception.Message) -ForegroundColor Red
    throw
} finally {
    if ($serverProcess -and -not $serverProcess.HasExited) { Stop-Process -Id $serverProcess.Id }
    $env:DB_PASSWORD = $previousPassword
    $env:DB_URL = $previousUrl
    $env:DB_USERNAME = $previousUsername
    $env:GACHITA_VERIFY_API_URL = $previousApi
    $secret.Dispose()
}
