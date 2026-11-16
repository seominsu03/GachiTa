# 같이타(GachiTa)

같은 방향의 동승자를 찾아 택시비를 나누는 Expo/React Native + Spring Boot 앱입니다.

김동민 담당 P0인 회원관리·택시방·참여 신청·정산은 프론트엔드와 서버 코드가 있습니다. 회원가입부터 동승 승인까지는 로컬 실행으로 확인할 수 있습니다. 채팅·탑승 확인·지도·가상 운행 연결과 실제 MySQL·모바일 기기 검증이 남아 있어 전체 MVP 완료 상태는 아닙니다.

- [바로 실행하기: MySQL 없는 데모와 MySQL 개발 환경](docs/RUN_GUIDE.md)
- [진행 상황과 실제 검증 범위](docs/IMPLEMENTATION_STATUS.md)
- [서버 API](docs/API_SPEC.md)
- [A 담당 구현 및 B 연결 안내](docs/TEAM_A_HANDOFF.md)
- [구현 화면](docs/SCREEN_MAP.md)
- [김동민·서민수 역할 분담](docs/team_roles.md)
- [공통 개발 규칙](GachiTa_COMMON_DEV_RULES.md)

실제 작업 폴더는 이 README가 있는 저장소입니다. 바탕 화면의 별도 Gachita 정적 웹 골격과 혼용하지 않습니다.

## 기술 구성

- Expo SDK 58, React Native, TypeScript, Expo Router
- Java 21, Spring Boot 3.5.16, Spring Security, JPA
- MySQL(개발/운영), H2(테스트/로컬 일회성 데모)
- 세션 쿠키 인증, 변경 요청의 CSRF 검증, 공통 REST API 응답

## 검사

프로젝트 루트에서:

~~~powershell
npx tsc --noEmit
npx expo lint
node --test scripts/test-auth.cjs
cd backend
.\mvnw.cmd test
~~~

경로·상태·API 이름은 공통 개발 규칙을 따릅니다. 서민수 담당 화면은 해당 팀원이 구현한 뒤 연결해야 하며, 임시 데이터 화면인 /preview는 실제 서버 데이터와 분리되어 있습니다.
