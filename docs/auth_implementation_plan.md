# 팀원 A 인증 구현 현황 및 계획

> 아래는 인증 구현 전의 분석 기록이다. 이후 `feature/auth-implementation`에서 실제 기능을 추가했다. 현재 구현·검증 결과는 [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md), 실행 방법은 [RUN_GUIDE.md](./RUN_GUIDE.md), 인증 계약은 [API_SPEC.md](./API_SPEC.md)를 참고한다.

확인일: 2026-11-11

이 문서는 저장소 분석 결과와 향후 구현 순서를 기록한다. 기능 구현 완료나 API 계약 변경을 의미하지 않는다. 요청자인 팀원 A는 `team_roles.md`의 김동민 담당 영역에 해당하며, 팀원 B는 서민수 담당 영역에 해당한다.

## 확인한 자료와 범위

- 프로젝트 루트의 `GachiTa_COMMON_DEV_RULES.md`, `AGENTS.md`, `docs/team_roles.md`를 기준으로 분석했다.
- PRD v1.5, 기능 정의서 v1.1은 위 문서에 언급돼 있지만 저장소와 앞서 확인한 첨부 ZIP에서 원문을 찾지 못했다. 원문을 읽거나 세부 요구사항을 검증한 것으로 간주하지 않는다.
- `docs/API_SPEC.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/SCREEN_MAP.md`, `docs/RUN_GUIDE.md`는 현재 빈 파일이다.
- 실제 확인한 브랜치는 `docs/auth-plan`이다. 이전에 `feature/auth`에서 분기해 만든 문서용 브랜치이며, 인증 구현 브랜치는 기존 `feature/auth`를 사용한다.
- 이번 작업은 이 문서 추가에 한정한다. 기존 코드, API 경로, 공통 타입, 데이터 구조, 의존성과 기술 스택을 변경하지 않는다.

## 1. 로그인 및 회원가입 관련 기존 파일

아래 파일은 현재 모두 0바이트이며, 경로만 준비된 상태다.

| 용도 | 실제 경로 |
|---|---|
| 로그인 화면 | `src/app/(auth)/login.tsx` |
| 회원가입 화면 | `src/app/(auth)/signup.tsx` |
| 인증 화면 레이아웃 | `src/app/(auth)/_layout.tsx` |
| 인증 API 함수 | `src/features/auth/api.ts` |
| 인증 입력 검증 | `src/features/auth/validation.ts` |
| 공통 API 통신 | `src/services/apiClient.ts` |
| 인증 정보 저장 | `src/services/authStorage.ts` |
| 인증 상태 관리 | `src/contexts/AuthContext.tsx` |
| 인증 타입 | `src/types/auth.ts` |
| 화면 경로 상수 | `src/constants/routes.ts` |
| 마이페이지 | `src/app/(tabs)/mypage.tsx` |

관련 공통 진입점인 `src/app/_layout.tsx`에는 Expo 템플릿 코드가 있다. 인증 상태 제공이나 인증 여부에 따른 화면 접근 제어는 구현돼 있지 않다.

백엔드는 `backend/src/main/java/com/gachita/GachiTaApplication.java`가 존재하지만 비어 있다. 인증·사용자 Controller, Service, Repository, Entity, DTO, Security 설정은 아직 없다.

## 2. 이미 구현된 부분과 미구현 기능

| 영역 | 확인 결과 |
|---|---|
| 앱 기본 코드 | Expo 시작 템플릿의 Home·Explore, 테마, 탭, 스플래시 관련 코드 존재. 실제 기기 동작 검증은 하지 않음 |
| `src/app` | 30개 중 27개가 빈 파일. 내용이 있는 파일은 루트 `_layout.tsx`, `index.tsx`, `explore.tsx` |
| `src/features` | 15개 파일 모두 비어 있음 |
| `src/services` | 2개 파일 모두 비어 있음 |
| `src/types`, `src/contexts` | 각각 5개, 1개 파일이 모두 비어 있음 |
| `backend` | 6개 파일 모두 비어 있음. `pom.xml`, 실행 클래스, 서버 설정도 미작성 |

회원가입, 중복 확인, 비밀번호 검증, DB 저장, 로그인, 인증 저장·복원, 로그아웃, 보호 화면 접근 제어, 내 정보 조회는 모두 미구현이다. 방·참여·정산·탑승 확인·지도·가상 택시도 관련 경로만 있으며 실제 기능은 미구현이다.

`package.json`에 선언된 버전은 Expo `~58.0.20`, React `19.3.0`, React Native `0.88.0`, TypeScript `~6.0.3`, Expo Router `~58.0.27`이다. Spring Boot·Java·MySQL, REST API/JSON, Kakao Maps, Kakao Mobility Directions API는 문서의 기술 스택이다. 백엔드 버전과 DB 연결은 아직 구성되지 않았다. `package-lock.json`이 있고 `bun.lock`은 없다.

## 3. 팀원 A의 프론트엔드 및 백엔드 담당

각 담당 기능은 프론트엔드, 백엔드, 데이터 처리까지 A가 책임진다.

| 범위 | 프론트엔드 | 백엔드·데이터 처리 |
|---|---|---|
| 회원관리 | 가입 S-01, 로그인 S-02, 로그아웃, 기본 마이페이지 S-22 | 계정 생성, 비밀번호 검증, 인증 관리, 사용자 저장·조회 |
| 택시방 | 메인 S-03, 목록 S-04, 생성 S-05, 상세 S-06~07 | 방 생성·목록·목적지 검색·상세 |
| 참여 | 승인·거절 관리 S-08~11, 신청·취소 UI | 참여 신청·승인·거절·취소, 참여자 목록과 상태 |
| 정산 | 요금·정산 S-17~21 | 최종 요금 저장, 개인별 금액 계산, 방장의 수령 확인 |
| P1 | 이용 내역·상세 S-23~24, 후기·평점 S-25~26 | 이력 조회, 후기 저장·조회 |

인증 관련 예정 파일은 역할표의 `AuthController.java`, `AuthService.java`, `UserController.java`, `UserService.java`, `UserRepository.java`, `User.java`, `SignupRequest.java`, `LoginRequest.java`, `AuthResponse.java`, `SecurityConfig.java`다. 이는 현재 존재하는 구현이 아니라 향후 작업 목록이다.

A는 Spring Boot 기본 구성, MySQL 연결, 인증 및 공통 API 설정의 주 담당이다. 공통 파일 변경과 DB 관계는 B에게 사전 공유·협의한다. 현재 `feature/auth`에서는 인증과 필요한 기반 작업에 집중하고, 방·참여·정산은 별도 기능 브랜치에서 진행한다.

## 4. 기존 구조를 유지하는 구현 순서

1. PRD·기능 정의서 원문을 확보해 가입 입력 필드, 로그인 식별자, 비밀번호 조건을 확인한다. JWT·세션, 응답 필드, 만료·갱신 정책은 현재 확인된 자료만으로 확정하지 않는다.
2. A와 B가 인증 상태 제공 방식, 사용자 식별, 공통 요청·오류 처리, 서버 인증 설정과 변경할 공통 파일을 협의한다.
3. 기존 `backend` 안에서 `pom.xml`, 실행 클래스와 설정 파일을 구성하고 MySQL 연결, 공통 응답 및 오류 처리를 준비한다. 새 프로젝트로 교체하지 않는다.
4. 사용자 Entity·Repository와 가입 DTO·Service·Controller를 구현한다. 서버 입력 검증, 중복 처리, 비밀번호 해시 저장을 포함한다.
5. 로그인 비밀번호 검증, 합의한 인증 방식, 내 정보 조회와 서버 접근 제어를 구현한다. 클라이언트가 보낸 `userId`만으로 권한을 판단하지 않는다.
6. 기존 `src/types/auth.ts`, `apiClient.ts`, `features/auth/api.ts`, `authStorage.ts`, `AuthContext.tsx`에 타입·통신·저장·인증 상태를 연결한다. 세부 타입은 합의된 계약을 따른다.
7. 기존 가입·로그인 화면과 `validation.ts`를 채우고 로딩·오류·완료 상태를 구현한다. API 주소와 비즈니스 로직은 화면 밖에 둔다.
8. 공통 레이아웃과 인증 복원·화면 접근 제어·로그아웃을 연결한다. B의 화면 경로를 함께 확인하고 Android·iOS·웹의 차이를 검증한다.
9. 실제 서버·DB로 가입 성공, 중복 가입, 잘못된 비밀번호, 미인증 접근, 인증 복원, 로그아웃을 검증한다. lint·타입검사 후 두 계정의 후속 기능 연동을 확인한다.

Expo·React Native API를 사용하는 코드를 작성하기 전에는 `AGENTS.md`에 따라 실제 Expo 메이저 버전과 일치하는 공식 문서를 확인한다. 의존성 추가가 필요하면 사전 공유 후 SDK 호환 설치 명령을 사용한다.

### 유지할 기존 문서 계약

| 메서드 | API 경로 | 함수명 |
|---|---|---|
| POST | `/api/v1/auth/signup` | `signup()` |
| POST | `/api/v1/auth/login` | `login()` |
| GET | `/api/v1/users/me` | `getMyProfile()` |

`logout()`도 문서의 공통 함수명이다. 로그아웃 서버 API 경로는 지정돼 있지 않으므로 임의로 확정하지 않는다.

성공 응답은 `success`, `data`, `message`, 오류 응답은 `success: false`, `error.code`, `error.message` 구조를 유지한다. 인증의 세부 요청·응답 필드는 미확정이다. 공통 `userId`는 TypeScript `number` / Java `Long`, DB 기본 키는 `BIGINT` 기준이다. 비밀번호는 해시로 저장하고 시간은 UTC 저장·한국 시간 표시 원칙을 따른다.

## 5. 공통 파일 및 팀원 B와의 충돌 가능성

| 대상 | 영향 및 협의 사항 |
|---|---|
| `src/app/_layout.tsx` | 현재 템플릿 탭을 직접 렌더링. 인증 화면 분리는 B의 채팅·지도·택시 화면 진입에도 영향 |
| `src/app/(tabs)/_layout.tsx` | A의 메인·방·마이페이지와 B의 채팅 탭을 함께 구성 |
| `apiClient.ts`, `authStorage.ts`, `AuthContext.tsx` | B도 같은 인증 정보·공통 요청 방식을 사용해야 함 |
| `src/types/*`, `src/constants/routes.ts` | 사용자 ID, 공통 상태값, 경로는 기능 간 연결 기준 |
| `package.json`, `package-lock.json` | 의존성 추가는 B의 개발 환경에도 영향 |
| `backend/pom.xml`, `application.yml`, Security·CORS | B의 API·지도 설정에도 영향 |
| 사용자 Entity와 DB 관계 | B의 채팅·탑승 확인·재참여 제한이 사용자 데이터를 참조 |

B의 담당은 채팅 기본 UI, 60초 탑승 확인·자동 퇴장·동일 방 재참여 제한, 지도·경로, 가상 택시이며 P1은 친구·신고·실제 메시지 송수신이다. 관련 화면과 `features/boarding`, `chat`, `maps`, `taxi`를 A가 임의로 수정하지 않는다.

후속 기능의 협의 지점은 다음과 같다.

- 참여 승인 → 탑승 확인: `roomId`, `userId`, `participationId`, 참여 상태를 공유한다. 자동 퇴장 시 참여 상태 갱신 책임을 합의한다.
- 방 생성 → 지도 선택: `origin`, `destination`은 기존 `name`, `latitude`, `longitude` 구조를 유지하고 반환 방식을 합의한다.
- 가상 운행 완료 → 정산: B의 택시 화면에서 A의 정산 화면으로 이동하며 서버에서도 정산 가능 상태를 검증한다.

### 문서 예시와 실제 경로의 차이

| 문서 예시 | 실제 저장소 |
|---|---|
| `src/services/api.ts` | `src/services/apiClient.ts` |
| `src/services/tokenStorage.ts` | `src/services/authStorage.ts` |
| `src/types/contracts.ts` | 기능별 `src/types/*.ts` |
| `rooms/[id]/applications.tsx` | `rooms/[roomId]/participants.tsx` |
| `maps/picker.tsx` | `map/picker.tsx` |
| 단일 `settlement.tsx` 화면 | `rooms/[roomId]/settlement/` 하위 화면들 |

실제 경로를 유지하고 예시에 맞춘 일괄 이름 변경이나 중복 파일 생성은 하지 않는다. 역할표의 정산 `payment`·`PaymentService`와 공통 규칙의 `settlement`·`SettlementService` 표기는 해당 기능 구현 전 합의가 필요하다. 기존 `/settlement` API를 임의로 변경하지 않는다.

## 검증 기록

문서 추가 후 다시 실행한 검사 결과는 다음과 같다.

- 타입검사: `tsc --noEmit --incremental false` 실패. `src/components/app-tabs.web.tsx:38`에서 `ref` 타입 불일치(TS2322).
- lint: `expo lint`가 ESLint 설정 부재로 자동 설치를 시도해 중단했다. 자동으로 추가된 `package.json` 항목은 검사 전 상태로 복구했다. 앞선 검사도 네트워크 `EACCES`로 중단돼 lint 통과 여부는 확인하지 못했다.
- 백엔드 실행·DB 연동·인증 통합 테스트: 실행 가능한 구현이 없어 미검증.

이 문서는 기존 오류 수정이나 기능 구현을 포함하지 않는다. PRD·기능 정의서의 상세 계약과 인증 방식이 확정되면 구현 전에 계획을 보완한다.
