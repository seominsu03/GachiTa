# 같이타 실행 안내

확인일: 2026-11-16. Windows PowerShell 기준입니다.

실제 프로젝트: C:\Users\user\gachita\GachiTa

Node.js와 JDK 21이 필요합니다. Maven은 저장소의 Wrapper를 사용합니다. 처음 실행하는 환경은 npm ci와 Maven 의존성 다운로드에 네트워크가 필요합니다. node_modules가 이미 있고 의존성을 바꾸지 않았다면 npm ci를 반복하지 않아도 됩니다.

## 1. 가장 빠른 실행: MySQL 없는 로컬 데모

터미널 1에서:

~~~powershell
Set-Location C:\Users\user\gachita\GachiTa\backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.12.1'
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.useTestClasspath=true" "-Dspring-boot.run.profiles=demo"
~~~

JAVA_HOME은 설치된 JDK 21 경로에 맞춥니다. 로그에 demo 프로필, jdbc:h2:mem:gachita_demo, Tomcat started on port 8080이 나오는지 확인합니다.

- demo는 127.0.0.1에만 서버를 열고 별도의 메모리 H2 DB를 사용합니다.
- 서버를 종료·재시작하면 가입 계정과 방 데이터가 사라집니다.
- H2는 기존 test 범위 의존성을 재사용하므로 useTestClasspath=true를 생략하면 실행할 수 없습니다.
- Maven run의 test classpath 옵션만으로 src/test/resources의 test 프로필 설정이 로드되는 것은 아니므로, 수동 실행에는 별도 application-demo.yml을 사용합니다.
- 이 모드는 개발 편의용입니다. 실제 MySQL 저장이나 휴대폰 검증을 대신하지 않습니다.

터미널 2에서:

~~~powershell
Set-Location C:\Users\user\gachita\GachiTa
# 처음 설치할 때만: npm ci
$env:EXPO_PUBLIC_API_URL='http://localhost:8080'
npx expo start --web --port 8081 --localhost
~~~

브라우저에서 http://localhost:8081 을 엽니다. localhost와 127.0.0.1을 혼용하지 않습니다. API 설정을 바꿨다면 Expo를 재시작합니다. 서버 종료는 각 터미널에서 Ctrl+C입니다.

## 2. 두 계정으로 직접 확인하기

1. 일반 브라우저에서 회원가입(이름·닉네임·아이디·비밀번호·비밀번호 확인·전화번호) 후 로그인합니다. 휴대폰 OTP 인증 기능은 아직 없습니다.
2. 택시방 만들기 → 출발지·목적지 선택 → 미래 날짜/시간 → 방장 포함 2~4명 → 생성합니다.
3. 다른 브라우저 또는 별도 시크릿 창에서 두 번째 계정을 가입·로그인합니다. 같은 브라우저의 일반 탭끼리는 쿠키를 공유하므로 계정 분리에 적합하지 않습니다.
4. 두 번째 계정으로 목적지를 검색하고 방 상세에서 동승을 신청합니다.
5. 방장 화면에서 새로고침 → 수락 또는 거절합니다.
6. 동승자 화면에서 새로고침하면 확정 상태를 확인할 수 있습니다. 다른 화면으로 이동했다 돌아와도 다시 조회합니다. 실시간 푸시 갱신은 아닙니다.
7. 마이페이지 → 내 동승방에서 본인이 만든 방 또는 신청 중/승인된 방을 다시 엽니다. 모집이 끝나도 찾을 수 있으며, 거절·취소·미응답 퇴장한 방은 제외합니다.
8. 요금 및 정산은 방장과 승인된 동승자에게 보입니다. 현재 가상 운행 연결이 없어 모집 상태에서는 요금 입력이 비활성화됩니다.

운행 전 정산 차단은 정상 동작입니다. 정산을 시연하려고 운영 API의 상태 검증을 제거하거나 임의 상태 변경 API를 추가하지 않았습니다. 서민수 담당 가상 운행이 완료되어 방 상태가 SETTLING이 되면 방장이 총요금을 입력하고, 동승자는 앱 밖에서 송금하고, 방장이 받았음을 확인합니다. 모든 수령 확인 후 COMPLETED가 됩니다.

## 3. 실제 서버에 자동 HTTP 검사 실행

위 로컬 데모 서버를 켠 상태에서 프로젝트 루트의 별도 터미널에서:

~~~powershell
node scripts/smoke-ride-api.cjs
~~~

이 스크립트는 계정 2개와 방 1개를 실제 생성합니다. 메모리 데모 서버에서 사용하면 종료 시 데이터가 사라집니다. 아이디는 매번 달라지며 마지막 출력에서 확인할 수 있습니다. 생성 계정의 데모 비밀번호는 SmokeTest123!입니다. 실제 MySQL 개발 서버에 실행하면 데이터가 DB에 남습니다. 루프백 서버 주소만 허용합니다.

확인 항목: 회원가입·로그인·쿠키·CSRF·CORS·내 정보·방 생성·검색·신청·중복 방지·승인 권한·거절·취소·재신청·내 동승방·운행 전 정산 차단·로그아웃.

정산 생성·나눗셈·차액·수령 권한·완료 처리는 아래 백엔드 통합 테스트에서 SETTLING 상태의 테스트 데이터를 준비해 확인합니다. 이 준비 단계는 실제 탑승/운행 구현을 의미하지 않습니다.

## 4. 영구 저장: MySQL 개발 환경

MySQL에 gachita DB와 전용 계정을 먼저 준비합니다. 기존 DB는 백업·스키마 비교 후 사용하며 삭제하지 않습니다.

~~~powershell
Set-Location C:\Users\user\gachita\GachiTa\backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.12.1'
$env:DB_URL='jdbc:mysql://localhost:3306/gachita?serverTimezone=UTC&characterEncoding=UTF-8'
$env:DB_USERNAME='gachita'
$env:DB_PASSWORD='자신의 로컬 DB 비밀번호'
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
~~~

dev는 schema.sql과 db/migrations/20261111_room_settlement.sql로 없는 테이블을 생성합니다. 테이블은 users, taxi_rooms, participations, settlements, settlement_receipts입니다. 기존 users 테이블에 name/phone_number가 없다면 db/migrations/20261111_user_contact.sql을 검토 후 한 번만 적용합니다. 이 ALTER 스크립트는 자동 실행되지 않습니다.

기본 프로필은 스키마를 자동 생성하지 않고 검증하며 Secure 쿠키를 사용하므로 HTTPS가 필요합니다. .env.example과 backend/.env.example은 참고 파일이며 Spring에서 자동 로드되지 않습니다. DB 비밀번호를 커밋하지 않습니다.

## 5. 모바일 실행

실제 휴대폰은 MySQL을 사용하는 dev 서버와 같은 네트워크에서 별도로 검증해야 합니다. demo는 루프백에만 열리므로 휴대폰 접속용이 아닙니다.

| 환경 | EXPO_PUBLIC_API_URL |
|---|---|
| PC 웹 | http://localhost:8080 |
| Android 기본 에뮬레이터 | http://10.0.2.2:8080 |
| 실물 휴대폰 | http://PC의_LAN_IP:8080 |

주소에 /api/v1을 붙이지 않습니다. 휴대폰용으로 환경 변수를 설정한 후 npx expo start를 실행합니다. PC 방화벽·동일 네트워크·설치된 Expo SDK와 클라이언트 호환성을 확인합니다. Android/iOS 기기의 쿠키 유지·화면 동작은 이번에 검증하지 않았습니다.

## 6. 검사 명령과 알려진 제한

~~~powershell
# 프로젝트 루트
npx tsc --noEmit
npx expo lint
node --test scripts/test-auth.cjs

# backend
.\mvnw.cmd test
~~~

상세 결과는 IMPLEMENTATION_STATUS.md를 참고합니다. 아직 비어 있는 채팅·지도·택시·P1 화면 경로에는 default export 누락 경고가 남아 있습니다. 김동민 P0 화면은 연결되어 있으나 이 경고가 전체 앱의 완성을 의미하지는 않습니다.

현재 브랜치는 feature/auth-implementation이며 기존 미커밋 변경을 유지했습니다. A P0 업로드 대상은 feature/auth-implementation 브랜치입니다. main 병합은 팀원 검토 후 별도로 진행합니다.

공식 참고: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [Expo Router](https://docs.expo.dev/versions/v58.0.0/sdk/router/).
