# PR #5 검토 지적 대응

기준일: 2026-11-16. 대상: feature/auth-implementation → dev. 병합하지 않습니다.

## 1. 100개 제한 뒤 출발지/시간 필터로 인한 검색 누락

원인: 서버가 목적지만 적용해 최대 100개를 반환하고 화면이 출발지·한국 시간대를 추가로 걸러, 앞의 100개 밖에 있는 실제 일치 방이 누락되었습니다.

수정:

- 기존 GET /api/v1/rooms와 destination query를 유지했습니다.
- 선택 query origin과 period(ALL/MORNING/AFTERNOON/EVENING)를 추가했습니다.
- 서버 SQL에서 목적지·출발지·시간대를 모두 적용한 뒤 출발 시각/방 ID순으로 최대 100개를 반환합니다.
- 시간대는 Asia/Seoul 기준 오전 [00:00,12:00), 오후 [12:00,18:00), 저녁 [18:00,24:00)입니다.
- 화면은 출발지·목적지·시간대가 모두 포함된 요청을 보내고 실제 서버 결과를 다시 필터하지 않습니다. 디자인 preview 필터는 별도입니다.
- 기존 getRooms('목적지') 호출과 응답 타입을 유지했습니다. 상세 계약은 API_SPEC.md에 기록했습니다.

검증:

- 백엔드 19개 테스트 통과: 앞의 100개는 불일치하고 101번째 방만 조건에 맞는 회귀 시나리오 포함.
- 출발지만 적용하거나 시간대만 적용해도 101번째 방을 찾는지 확인.
- 한국 시간 00:00, 11:59:59, 12:00, 17:59:59, 18:00, 23:59:59 경계 확인.
- 미지원 period는 400으로 거절하고 이름의 %, _는 평문 부분 문자열로 처리.
- 프론트 로직 8개 테스트, TypeScript, ESLint, 웹 export 통과.

## 2. 실제 MySQL 실행 및 영구 저장

MySQL84 서비스가 실행 중인 것은 확인했습니다. H2 테스트를 MySQL 검증으로 간주하지 않습니다.

실제 검증 스크립트 scripts/verify-mysql.ps1을 추가했습니다. 사용자가 로컬 보안 입력창에 DB 앱 계정 비밀번호를 입력하면:

1. 패키지 빌드 후 MySQL dev 서버를 별도 18080 포트로 실행합니다.
2. 초기 스키마 스크립트 및 JPA 테이블 검증을 통과해야 HTTP 요청을 시작합니다.
3. 시험 계정 1개·방 3개를 생성하고 MySQL에서 출발지/목적지/한국 시간 검색을 확인합니다.
4. 해당 검증 서버의 JVM 프로세스를 종료하고 새 프로세스로 다시 실행합니다.
5. 재로그인 및 같은 사용자 ID/방 ID 조회를 통해 데이터 유지를 확인합니다.

DB 비밀번호는 명령 인수·파일·GitHub에 저장하지 않으며 기존 데이터는 삭제하지 않습니다. 테스트 기록은 로컬 DB에 남습니다. 결과는 무시되는 .expo/mysql-persistence-report.json에 기록됩니다.

초기에는 검증 입력과 실행 결과를 기다렸으며, 아래 최종 검증 결과에서 실제 MySQL 실행 성공을 확인했습니다.
MySQL 검증 도구 보완: 사용자 실행에서 JAVA_HOME 경로 오류가 확인되어 JDK 21 설치 경로를 정규화·자동 탐색하도록 수정했습니다. 정상 경로와 잘못된 JAVA_HOME 환경 모두에서 비밀번호 입력 전 Java/Maven 사전 검사가 통과했습니다. 실제 DB 저장/재시작 검증 결과는 별도로 확인합니다.

실제 실행 확인: MySQL 8.4.13 JDBC 연결, dev 프로필의 스키마 초기화/JPA 검증, Started GachiTaApplication 및 검증 API HTTP 200을 확인했습니다. 자동 검사 응답 확인에서 시간 초과가 발생하여 서버 바인딩과 같은 IPv4 127.0.0.1을 사용하고 대기 시간을 5초로 보완했습니다. 회원·방 저장 및 JVM 재시작 후 유지 여부는 보완 스크립트의 최종 성공 보고서로 별도 확인합니다.

## 최종 실제 MySQL 검증 결과 — 2026-11-16

MySQL 8.4.13의 dev 서버 실행과 스키마 초기화/JPA 검증을 확인했습니다. 실제 HTTP로 시험 계정 1개와 방 3개를 생성하고 한국 시간대 11:59/12:00/18:00 검색을 검사했습니다. 첫 JVM(PID 16848)을 종료한 뒤 다른 JVM(PID 23816)으로 서버를 다시 시작했고, 재로그인·사용자 ID 유지·동일 방 ID 3개 조회와 검색이 모두 통과했습니다.

검증 시각(UTC): 2026-11-16T07:51:04.930Z. [비밀번호 없는 검증 결과](verification/mysql-2026-11-16.json)를 참고하세요. 시험 기록은 로컬 DB에 남아 있으며 실제 DB 비밀번호는 저장소에 포함하지 않았습니다. 이 검증에서 기존 데이터 삭제나 dev 병합은 수행하지 않았습니다.

PR #5의 검색 누락과 MySQL 실행 검증 지적을 코드 수정 및 로컬 실행으로 확인했습니다. 최종 검토 결과는 PR 소스 브랜치의 이 문서로 공유합니다. 세션·CSRF, 공통 타입·API 경로, DB 설정에 대한 팀원 검토가 끝나기 전에는 dev에 병합하지 않습니다.

## 세션·CSRF, 공통 계약 및 DB 설정 검토

이번 문서 수정에서 애플리케이션 코드나 API 계약은 변경하지 않았습니다. 아래 항목은 현재 코드와 기존 검사 결과를 대조한 A 측 검토이며, 팀원과의 최종 검토 및 병합 승인을 대신하지 않습니다.

| 영역 | 확인한 내용 | 팀원과 남은 확인 |
|---|---|---|
| 세션·CSRF | HttpOnly 세션 쿠키, 로그인 세션 ID 교체, 로그인 후 CSRF 토큰 무효화와 클라이언트 캐시 초기화, 로그아웃 세션 무효화. 변경 요청은 CSRF 검증 후 처리하고 CSRF_INVALID에서만 한 번 재시도 | Android/iOS 기기 쿠키 유지와 B 화면의 세션 만료 처리 |
| CORS·쿠키 | 허용 origin 목록과 credentials 사용, 운영 기본 Secure 쿠키·SameSite=Lax, 로컬 dev만 Secure 해제 | 배포 환경의 HTTPS·프록시·프런트 origin 확정 |
| 공통 타입·API | RoomStatus/ParticipationStatus 문자열 일치, userId/roomId/participationId 및 LocationInfo 필드 일치. 방장 권한은 principal 기준. 기존 destination 요청을 유지하고 origin/period는 선택 query로 추가 | B의 탑승 상태 전환, 자동 퇴장 시 인원 갱신·잠금, IN_RIDE → SETTLING 연결 |
| DB | MySQL 접속 값은 환경 변수 사용. UTC 저장, 기본 ddl-auto=validate와 SQL 초기화 비활성화. dev는 CREATE TABLE IF NOT EXISTS로 초기화. 실제 MySQL 저장·프로세스 재시작 후 유지 검증 완료 | 기존 DB의 name/phone_number 수동 마이그레이션 사전 검토, 실기기 및 B 포함 전체 흐름 |

근거 코드: AuthController.java, SecurityConfig.java, apiClient.ts, auth/api.ts, contracts.ts, RoomController.java, RoomRepository.java, application.yml 및 application-dev.yml.

검사 근거: 백엔드 테스트 19개·프런트 로직 테스트 8개, 타입 검사·린트·웹 빌드 통과 기록과 실제 MySQL 검증 JSON. 이번 커밋의 GitHub 프런트엔드·백엔드 검사는 업로드 후 별도로 확인합니다.

- [ ] B 담당자의 공통 계약·인증 처리 검토
- [ ] 위 남은 확인 항목의 검증 범위와 후속 작업 합의
- [ ] 검토 완료 후 별도 dev 병합 승인
