# 김동민(A) 담당 구현 및 B 연결 안내

기준일: 2026-11-16. 기능 브랜치: feature/auth-implementation.

## 이번 브랜치에 포함하는 범위

회원가입·로그인·로그아웃, 내 정보 조회, 택시방 생성/목록/목적지 검색/상세, 동승 신청/승인/거절/취소, 내 동승방, 최종 요금 계산, 방장 수령 확인, 정산 완료 처리까지 P0 코드를 포함합니다. 각 기능의 화면·서비스·DB 처리가 연결되어 있습니다.

루트 README와 docs/RUN_GUIDE.md에서 실행하고 docs/API_SPEC.md에서 상세 계약을 확인합니다. P1 이용 내역·후기는 포함하지 않으며 B의 채팅·지도·탑승 확인·가상 택시 구현도 이 브랜치에서 대체하지 않습니다.

## 공통 파일 변경

- src/contexts/AuthContext.tsx: useAuth()로 검증된 user와 로그인/로그아웃 상태를 제공합니다.
- src/services/apiClient.ts: 세션 쿠키를 포함하고 CSRF 토큰을 처리합니다. B도 이 클라이언트를 재사용합니다.
- src/types/contracts.ts: 공통 RoomStatus/ParticipationStatus/LocationInfo를 정의합니다. 공통 지시서의 기존 상태명은 유지했습니다.
- src/app/_layout.tsx: AuthProvider와 인증 진입 화면을 연결했습니다. 신규 B 화면의 접근 권한과 이동은 연결 시 함께 확인합니다.
- src/hooks/use-remote.ts: 화면 복귀 재조회와 오래된 응답 무시를 처리합니다.
- backend 기본 Security/CORS/세션/MySQL 설정과 application-dev.yml, 로컬 일회성 application-demo.yml을 포함합니다.
- application.yml은 소수 요금/인원을 정수로 자동 잘라 저장하지 않도록 Jackson ACCEPT_FLOAT_AS_INT를 비활성화합니다. 요금·정원의 JSON 정수 계약을 엄격히 적용한 것이며 필드 이름과 상태는 바꾸지 않았습니다.
- package.json에 npm run typecheck와 npm test 명령을 추가했습니다. 새 라이브러리를 추가하지 않았습니다. 기존 인증 작업에 추가한 ESLint 의존성과 lock 파일을 함께 올립니다.

## B에서 연결할 데이터

| 연결 지점 | A 제공 정보 | B의 처리 |
|---|---|---|
| 승인 후 탑승 확인 | roomId, userId, participationId, APPROVED 상태 | 승인된 참여자만 요청 대상으로 선택 |
| 탑승 수락/만료 | participation과 방장 포함 participantCount | 트랜잭션/방 잠금 규칙을 유지하며 BOARDING_CONFIRMED/TIMED_OUT 처리 |
| 지도 선택 | origin/destination {name,latitude,longitude} | 공통 LocationInfo 구조로 선택 결과 전달 |
| 운행 완료 | roomId와 RoomStatus | 서버에서 IN_RIDE → SETTLING으로 검증해 전환 |
| 정산 화면 | /rooms/{roomId}/settlement | roomId를 넣어 이동. A 서버가 방장·확정 동승자 여부를 확인 |

방장은 participations 테이블의 별도 신청이 아니라 TaxiRoom.host로 저장합니다. participantCount는 항상 방장 포함입니다. SettlementService는 APPROVED 또는 BOARDING_CONFIRMED인 참여자와 방장을 계산하므로 미응답 퇴장자는 제외해야 합니다. 자동 퇴장은 B와 공유하는 방 잠금 및 인원 감소 처리를 한 트랜잭션에서 적용해야 합니다. 현재 A 브랜치는 이미 TIMED_OUT인 사용자의 재신청을 거절하지만 만료 스케줄러나 room_bans 저장을 대신 구현하지 않았습니다.

정산은 SETTLING에서만 시작합니다. 총 요금은 1~10,000,000원의 정수이며 방장 포함 1~4명으로 원 미만 버림 계산합니다. 나머지 0~3원은 remainderFare로 표시하고 임의로 자동 송금/배분하지 않습니다. 방장만 received=true로 수령을 확인합니다. 모두 확인하면 COMPLETED입니다.

## 검사와 알려진 제한

- GitHub Actions는 기능 브랜치 push와 main/dev 대상 PR에서 프론트 타입·린트·로직·웹 빌드와 Java/H2 통합 테스트를 실행합니다.
- 로컬 상세 검증 결과는 IMPLEMENTATION_STATUS.md를 참고합니다. H2 검증은 MySQL 검증이 아닙니다.
- 실제 MySQL 연결, Android/iOS 실기기 쿠키/화면, B 기능을 포함한 전체 이용 흐름은 별도 통합 검증이 필요합니다.
- 빈 B/P1 라우트의 default export 경고는 남아 있습니다. B의 브랜치를 병합할 때 경로·공통 타입·DB 설정 충돌을 검토합니다.
- 김동민 P0 구현과 P1 예정 항목, 실제 동작과 디자인 preview를 구분합니다.

CI 호환 보완: src/types/expo.d.ts가 Expo의 공식 전역/CSS 타입을 직접 참조하여 최초 체크아웃에서도 Expo 자동 생성 파일 없이 타입 검사를 수행합니다. 자동 생성 expo-env.d.ts와 .expo는 커밋하지 않습니다. GitHub Actions는 공식 현재 버전의 Node 24 기반 액션을 사용합니다.

GitHub CI에서는 호스팅 러너에 제공되는 Maven CLI로 동일한 pom.xml 테스트를 실행하며, Windows 로컬 실행은 저장소의 Maven Wrapper를 유지합니다.
