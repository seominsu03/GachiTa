# MySQL 설치 및 로컬 계정 접속 확인

확인일: 2026-11-16. 사용자 PC에서 수행한 설정이며 비밀번호는 기록하지 않습니다.

## 완료한 작업

- MySQL Server 8.4.13 LTS를 Windows에 설치했습니다.
- Development Computer, TCP/IP 3306, Windows 서비스 MySQL84로 설정했습니다.
- 샘플 DB는 설치하지 않았습니다.
- root 관리자 계정으로 MySQL CLI에 접속했습니다.
- gachita 데이터베이스를 utf8mb4로 생성했습니다.
- gachita@localhost 앱 전용 계정을 만들고 gachita DB에 권한을 부여했습니다.
- 앱 계정의 비밀번호를 다시 설정한 뒤, 아래 명령으로 해당 DB에 접속하여 mysql> 프롬프트가 나타나는 것을 사용자가 확인했습니다.

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u gachita -p gachita
```

root 비밀번호와 앱 계정 비밀번호는 서로 다른 계정의 인증 정보입니다. 위 명령의 비밀번호 입력에는 gachita 앱 계정에서 정한 값을 사용합니다.

## DB와 계정을 처음 만들 때의 명령

다음 SQL은 설치 기록과 다른 개발자의 초기 설정을 위한 예시입니다. 이미 완료한 PC에서 다시 실행할 필요는 없습니다. APP_PASSWORD_PLACEHOLDER는 실제 비밀번호가 아니며 각 개발자가 로컬에서 직접 정해 대체합니다.

```sql
CREATE DATABASE gachita CHARACTER SET utf8mb4;
```

```sql
CREATE USER 'gachita'@'localhost' IDENTIFIED BY 'APP_PASSWORD_PLACEHOLDER';
```

```sql
GRANT ALL PRIVILEGES ON gachita.* TO 'gachita'@'localhost';
```

1045 Access denied가 발생했을 때는 먼저 root 관리자 접속 성공을 확인하고, root로 접속한 mysql> 창에서 앱 계정의 비밀번호를 설정했습니다. ALTER USER의 Query OK를 확인한 뒤 앱 계정으로 별도 접속했습니다.

```sql
ALTER USER 'gachita'@'localhost' IDENTIFIED BY 'APP_PASSWORD_PLACEHOLDER';
```

## 아직 확인할 작업

앱 계정의 CLI 접속 성공과 Spring Boot의 DB 연결 성공은 별개의 확인 항목입니다. 초기 백엔드 실행은 DB 인증 오류로 실패했으며, 계정 접속 성공 이후의 dev 서버 시작 성공은 아직 확인하지 않았습니다.

1. backend를 실행할 PowerShell에서 DB_USERNAME을 gachita로 설정합니다.
2. DB_PASSWORD를 방금 CLI 접속에 성공한 앱 계정 비밀번호와 같게 설정합니다. root 비밀번호가 아닙니다.
3. [실행 안내](RUN_GUIDE.md)의 MySQL dev 명령으로 백엔드를 실행합니다.
4. Started GachiTaApplication 로그를 확인합니다.
5. 앱에서 회원가입·방 생성 후 MySQL 테이블의 저장 결과를 확인합니다.
6. 백엔드를 재시작해 데이터가 유지되는지 확인합니다.

## GitHub에 포함하는 것

설치 절차, 비밀번호가 없는 설정 예시, 스키마 생성 SQL과 접속 확인 기록을 공유합니다. PC에 설치한 Windows 서비스, 실제 MySQL 계정·데이터·비밀번호와 PowerShell의 DB_PASSWORD 환경 변수는 GitHub에 올리지 않습니다. 다른 개발자는 자신의 PC에서 MySQL과 로컬 계정을 설정해야 합니다.
## 실제 MySQL 자동 검증

프로젝트 루트 PowerShell에서 실행합니다. 비밀번호는 채팅에 보내지 않고 해당 창의 보안 입력으로만 입력합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-mysql.ps1
```

이 스크립트는 실제 gachita MySQL DB를 dev 프로필에 연결합니다. 기존 테이블을 삭제하지 않고 시험 계정 1개와 방 3개를 생성하므로 테스트 기록은 로컬 DB에 남습니다. 별도 18080 포트를 사용하여 본인이 시작한 검증 서버 프로세스만 종료·재시작합니다. 앱 계정의 DB 비밀번호는 명령 인수나 파일에 저장하지 않습니다.

검사 순서: 패키지 빌드 → MySQL dev 서버 시작 및 JPA 스키마 검증 → 실제 HTTP 회원가입·방 생성·한국 시간 검색 → JVM 서버 프로세스 종료/재시작 → 재로그인·사용자/방 데이터 유지 확인. JPA가 users/taxi_rooms/participations/settlements/settlement_receipts를 검증합니다.

성공 결과는 무시되는 .expo/mysql-persistence-report.json에 저장됩니다. 서버 로그는 .expo/mysql-before-restart.log와 .expo/mysql-after-restart.log에 남습니다. 실패 시 로그의 오류 원인을 확인하며 완료하지 않은 항목을 성공으로 보고하지 않습니다. 이 결과와 비밀번호를 저장소에 자동 업로드하지 않습니다.


## ?? ?? MySQL ?? ?? ? 2026-11-16

MySQL 8.4.13? dev ?? ??? ??? ???/JPA ??? ??????. ?? HTTP? ?? ?? 1?? ? 3?? ???? ?? ??? 11:59/12:00/18:00 ??? ??????. ? JVM(PID 16848)? ??? ? ?? JVM(PID 23816)?? ??? ?? ????, ???????? ID ????? ? ID 3? ??? ??? ?? ??????.

?? ??(UTC): 2026-11-16T07:51:04.930Z. [???? ?? ?? ??](verification/mysql-2026-11-16.json). ?? ??? ?? DB? ?? ??? ?? DB ????? ???? ???? ????. ? ???? ??? ??? dev ??? ???? ?????.

PR #5? ? ??? ??/?? ?? ???? ??????. GitHub ?? ?? ??? ?? ???? ??, ?? ??? ?? PR? ?? ???? ??? ? ??? ?????.
