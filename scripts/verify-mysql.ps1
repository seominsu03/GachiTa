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
Write-Host 'Verify local MySQL: creates one test account and three rooms, restarts its own server, checks persistence.'
Write-Host 'Existing application data is kept. Test records remain in your local database.'
$secret = Read-Host 'Enter the gachita database account password (not root)' -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
$env:DB_USERNAME = 'gachita'
$env:DB_URL = 'jdbc:mysql://localhost:3306/gachita?serverTimezone=UTC&characterEncoding=UTF-8'
$env:GACHITA_VERIFY_API_URL = 'http://localhost:18080'
if (-not $env:JAVA_HOME) { $env:JAVA_HOME = 'C:\Program Files\Java\jdk-21.0.12.1' }
$javaPath = Join-Path $env:JAVA_HOME 'bin/java.exe'
function Start-VerificationServer([string]$name) {
    $jarPath = Join-Path $backendPath 'target/gachita-backend-0.0.1-SNAPSHOT.jar'
    $outPath = Join-Path $logDirectory ($name + '.log')
    $errorPath = Join-Path $logDirectory ($name + '-error.log')
    $process = Start-Process -FilePath $javaPath -ArgumentList @('-jar', ('"' + $jarPath + '"'), '--spring.profiles.active=dev', '--server.address=127.0.0.1', '--server.port=18080') -WorkingDirectory $backendPath -WindowStyle Hidden -RedirectStandardOutput $outPath -RedirectStandardError $errorPath -PassThru
    try {
        for ($attempt = 0; $attempt -lt 90; $attempt++) {
            if ($process.HasExited) { throw ('Server failed. Check ' + $outPath + ' and ' + $errorPath) }
            try {
                $response = Invoke-WebRequest -Uri ($env:GACHITA_VERIFY_API_URL + '/api/v1/auth/csrf') -UseBasicParsing -TimeoutSec 1
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
