# 같이타(GachiTa) 2인 팀 개발 역할 분담표

**문서 버전:** v1.1 · 이름·경로 정리: 2026-11-11  
**기준:** PRD v1.5 / 기능 정의서 v1.1 / 화면 설계서 v1.0  
**개발 인원:** 2명  
**목표:** 2개월 내 MVP 구현  
**개발 방식:** 기능 단위 분담, 각자 프론트엔드·백엔드 함께 개발

---

# 1. 최종 역할 분담

## 팀원 김동민 — 회원관리·택시방·참여 신청·정산

**담당 목표:** 회원가입부터 동승방 참여, 요금 정산까지 핵심 데이터를 처리한다.

### P0 필수 기능

| 기능 | 세부 개발 내용 | 담당 Java 파일 |
|---|---|---|
| 회원가입·로그인·로그아웃 | 계정 생성, 비밀번호 검증, 인증 관리 | `AuthController.java`, `AuthService.java` |
| 회원정보 관리 | 사용자 정보 저장·조회 | `UserController.java`, `UserService.java`, `UserRepository.java` |
| 택시방 생성 | 출발지·목적지·시간·인원 저장 | `RoomController.java`, `RoomService.java`, `RoomRepository.java` |
| 택시방 목록·검색·상세 | 목적지 검색 및 방 정보 조회 | `RoomController.java`, `RoomService.java` |
| 동승 신청·승인·거절·취소 | 사용자 참여 상태 처리 | `ParticipationController.java`, `ParticipationService.java`, `ParticipationRepository.java` |
| 정산 금액 계산 | 최대 4명 기준 1인당 요금 계산 | `SettlementService.java` |
| 요금 입력 및 수령 확인 | 방장의 '받았음' 처리 | `SettlementController.java`, `SettlementService.java`, `SettlementRepository.java` |

### 추가로 필요한 파일

기존 역할 분담표에 빠진 파일들이다.

**회원관리**

- `User.java` — 회원 Entity
- `SignupRequest.java` — 회원가입 요청 DTO
- `LoginRequest.java` — 로그인 요청 DTO
- `AuthResponse.java` — 로그인 응답 DTO
- `SecurityConfig.java` — 인증 및 접근 권한 설정

**택시방**

- `TaxiRoom.java` — 택시방 Entity
- `RoomCreateRequest.java` — 택시방 생성 요청 DTO
- `RoomResponse.java` — 택시방 조회 응답 DTO

**동승 신청**

- `Participation.java` — 동승 참여 Entity
- `ParticipationStatus.java` — 신청 및 참여 상태

**정산**

- `Settlement.java` — 정산 정보 Entity
- `SettlementParticipant.java` — 사용자별 부담 금액과 수령 상태
- `SettlementParticipantRepository.java` — 개인별 정산 정보 저장
- `SettlementRequest.java` — 최종 요금 입력 요청 DTO
- `SettlementResponse.java` — 정산 결과 응답 DTO

DTO와 상태 Enum 이름은 실제 코드 작성 시 팀원 간 합의하여 조정할 수 있다.

### 담당 React Native 화면

- 회원가입(S-01)
- 로그인(S-02)
- 메인(S-03)
- 택시방 목록(S-04)
- 택시방 생성(S-05)
- 택시방 상세(S-06~07)
- 동승자 승인·거절 관리(S-08~11)
- 요금 및 정산(S-17~21)
- 기본 마이페이지(S-22)

### P1 추가 기능

개발 시간이 남으면 다음 기능을 담당한다.

- 이용 내역 및 상세(S-23~24)
- 후기 작성 및 평점(S-25~26)

필요 파일:

- `HistoryController.java`
- `HistoryService.java`
- `ReviewController.java`
- `ReviewService.java`
- `ReviewRepository.java`
- `Review.java`

---

## 팀원 서민수 — 채팅·탑승 확인·지도·가상 택시

**담당 목표:** 동승 승인 이후 탑승 준비부터 가상 택시 이용까지의 흐름을 처리한다.

### P0 필수 기능

| 기능 | 세부 개발 내용 | 담당 Java 파일 |
|---|---|---|
| 탑승 확인 요청·수락 | 방장의 '부르기', 참여자의 수락 | `BoardingController.java`, `BoardingService.java` |
| 60초 제한 및 자동 퇴장 | 요청 만료, 자동 참여 취소 | `BoardingService.java`, `BoardingExpiryScheduler.java` |
| 동일 방 재참여 제한 | 미응답자 재신청 방지 | `RoomBanRepository.java` |
| 채팅 기본 UI | 메시지 입력·표시, 탑승 요청 카드 | React Native 채팅 화면 |
| 지도 및 위치 선택 | 출발지·목적지 마커 이동 | React Native 지도 화면 |
| 자동차 최단 거리 경로 | Kakao Mobility 경로 탐색 | `MapController.java`, `MapService.java` |
| 가상 택시 호출 | 호출·배차·운행 단계 상태 처리 | `TaxiController.java`, `TaxiService.java` |

### 추가로 필요한 파일

**탑승 확인**

- `BoardingRequest.java` — 탑승 확인 요청 Entity
- `BoardingRequestRepository.java` — 요청 및 만료 시각 저장
- `BoardingExpiryScheduler.java` — 만료된 탑승 요청 자동 처리
- `RoomBan.java` — 동일 방 재참여 금지 기록 Entity
- `RoomBanRepository.java` — 재참여 제한 조회·저장
- `BoardingRequestDto.java` — 요청 및 응답 데이터 전달

**채팅**

MVP에서는 기본 UI를 우선 구현한다.

실제 메시지 연동 시 추가:

- `ChatController.java`
- `ChatService.java`
- `ChatMessage.java`
- `ChatMessageRepository.java`
- 필요 시 WebSocket 설정 파일

**지도**

- `MapController.java`
- `MapService.java`
- `DirectionsResponse.java` — 경로 탐색 결과 DTO
- Kakao API 관련 설정 파일

**가상 택시**

- `TaxiController.java`
- `TaxiService.java`
- `TaxiRide.java` — 진행 상태를 DB에 저장할 경우
- `TaxiRideRepository.java` — DB 저장이 필요할 경우

### 담당 React Native 화면

- 택시방 채팅(S-12)
- 60초 탑승 확인 타이머 및 요청 UI
- 미응답 자동 퇴장 안내
- 지도 위치 선택 UI
- 출발지·목적지 마커 이동
- 자동차 최단 거리 경로 표시
- 가상 택시 호출 전(S-13)
- 가상 택시 호출 중(S-14)
- 배차 완료(S-15)
- 운행 중(S-16)

### P1 추가 기능

개발 시간이 남으면 다음 기능을 담당한다.

- 친구 목록 및 추가(S-27~29, S-32)
- 사용자 신고(S-30~31, S-33)
- 실제 채팅 메시지 송수신

필요 파일:

- `FriendController.java`
- `FriendService.java`
- `FriendRepository.java`
- `Friend.java`
- `ReportController.java`
- `ReportService.java`
- `ReportRepository.java`
- `Report.java`

---

# 2. 통일된 프로젝트 폴더 구조

기존 `GachiTa` Expo 프로젝트와 빈 골격을 유지한다. 이름과 경로는 [공통 개발 지시서 3.1절](../GachiTa_COMMON_DEV_RULES.md#31-통일된-파일폴더-이름)을 기준으로 한다. `[예정]` 경로와 위 Java 클래스 목록은 해당 기능 개발 시 생성하며, 현재 구현 완료를 뜻하지 않는다.

```text
GachiTa/
│
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx           [공통 · 기존 진입 화면]
│   │   ├── explore.tsx         [기존 Expo 예제]
│   │   │
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx           [김동민]
│   │   │   └── signup.tsx          [김동민]
│   │   │
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx           [김동민]
│   │   │   ├── rooms.tsx           [김동민]
│   │   │   ├── chats.tsx           [서민수]
│   │   │   └── mypage.tsx          [김동민]
│   │   │
│   │   ├── rooms/
│   │   │   ├── create.tsx          [김동민]
│   │   │   └── [roomId]/
│   │   │       ├── index.tsx       [김동민]
│   │   │       ├── participants.tsx [김동민]
│   │   │       ├── chat.tsx        [서민수]
│   │   │       ├── taxi.tsx        [서민수]
│   │   │       └── settlement/     [김동민]
│   │   │           ├── index.tsx
│   │   │           ├── amount.tsx
│   │   │           ├── status.tsx
│   │   │           └── complete.tsx
│   │   │
│   │   ├── map/
│   │   │   └── picker.tsx          [서민수]
│   │   │
│   │   ├── history/               [김동민 · P1]
│   │   ├── reviews/               [김동민 · P1]
│   │   ├── friends/               [서민수 · P1]
│   │   └── reports/               [서민수 · P1]
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── rooms/                 [김동민]
│   │   ├── settlement/            [김동민]
│   │   ├── boarding/              [서민수]
│   │   ├── chat/                  [서민수 · 예정]
│   │   ├── taxi/                  [서민수]
│   │   └── maps/                  [서민수]
│   │
│   ├── features/
│   │   ├── auth/                  [김동민]
│   │   ├── rooms/                 [김동민]
│   │   ├── participation/         [김동민 · 예정]
│   │   ├── settlement/            [김동민]
│   │   ├── boarding/              [서민수]
│   │   ├── chat/                  [서민수]
│   │   ├── maps/                  [서민수]
│   │   ├── taxi/                  [서민수]
│   │   └── history/               [김동민 · P1]
│   │
│   ├── services/
│   │   ├── apiClient.ts
│   │   └── authStorage.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   ├── contracts.ts
│   │   ├── auth.ts
│   │   ├── room.ts
│   │   ├── boarding.ts
│   │   ├── map.ts
│   │   └── settlement.ts
│   └── constants/
│       ├── routes.ts
│       └── theme.ts
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/gachita/
│   │       │   ├── auth/          [김동민]
│   │       │   ├── user/          [김동민]
│   │       │   ├── room/          [김동민]
│   │       │   ├── participation/ [김동민]
│   │       │   ├── settlement/    [김동민]
│   │       │   ├── history/       [김동민 · P1]
│   │       │   ├── review/        [김동민 · P1 · 예정]
│   │       │   ├── boarding/      [서민수]
│   │       │   ├── chat/          [서민수 · 예정]
│   │       │   ├── map/           [서민수]
│   │       │   ├── taxi/          [서민수]
│   │       │   ├── friend/        [서민수 · P1 · 예정]
│   │       │   ├── report/        [서민수 · P1 · 예정]
│   │       │   └── common/
│   │       │
│   │       └── resources/
│   │           └── application.yml
│   │
│   └── src/test/
│
├── assets/
├── docs/
├── .env.example
└── package.json
```

`[김동민]`, `[서민수]`는 담당자 표시이며 실제 폴더명이나 파일명에 포함하지 않는다.

Spring Boot 패키지명은 현재 골격과 같은 `com.gachita`를 사용한다. 변경이 필요하면 공통 지시서와 함께 갱신한다.

---

# 3. 두 팀원이 함께 사용하는 부분

기능별 담당자는 나누되, 다음 파일은 공통으로 사용한다.

| 공통 파일·영역 | 권장 기본 담당 | 협업 규칙 |
|---|---|---|
| `package.json` | 김동민 | 라이브러리 추가 전 서로 공유 |
| `src/app/_layout.tsx` | 김동민 | 서민수의 화면 경로 추가 시 협의 |
| `src/services/apiClient.ts` | 김동민 | API 주소와 공통 요청 방식 통일 |
| `src/services/authStorage.ts` | 김동민 | 인증 토큰 저장 방식 공통 사용 |
| `src/types/contracts.ts` | 공동 협의 | 공통 API 타입·상태 Enum을 한 곳에서 관리 |
| 인증 상태 관리 | 김동민 | 서민수는 제공된 인증 정보를 재사용 |
| `application.yml` | 김동민 | 서민수가 필요한 지도 설정은 협의 후 추가 |
| Spring Boot 공통 설정 | 김동민 | CORS·인증 설정 공유 |
| DB 테이블 관계 | 공동 협의 | 각 기능의 테이블은 담당자가 관리 |
| 서버 API 명세 | 공동 | 프론트엔드와 백엔드가 동일하게 사용 |
| 통합 테스트 | 김동민 + 서민수 | 두 사용자 계정으로 전체 흐름 테스트 |

**주의:** 공통 파일의 기본 담당이 김동민이라는 뜻이지, 김동민이 서민수의 기능까지 모두 구현한다는 뜻은 아니다.

---

# 4. 두 팀원 사이의 기능 연결

기능을 나누더라도 데이터는 연결되어야 한다.

## 연결 1. 택시방 참여 → 탑승 확인

**김동민 담당**

- 참여 신청
- 참여 승인
- 참여 취소
- 참여자 목록

**서민수 담당**

- 승인된 참여자에게 탑승 확인 요청
- 60초 제한 시간 검증
- 미응답 자동 퇴장
- 동일 방 재참여 제한

서민수는 김동민이 구현한 참여자 데이터를 사용한다.

따라서 참여자 ID, 방 ID, 참여 상태값을 미리 통일해야 한다.

특히 자동 퇴장 시 참여 상태 변경은 한 서비스에서 일관되게 처리하도록 두 팀원이 협의해야 한다.

## 연결 2. 택시방 생성 → 지도 선택

**김동민 담당**

- 택시방 생성 화면
- 출발지·목적지 저장

**서민수 담당**

- 지도 화면
- 마커 이동
- 최단 거리 경로 조회

서민수는 선택한 출발지와 목적지 좌표를 김동민의 방 생성 화면으로 전달한다.

두 팀원은 위도·경도 데이터 형식과 전달 방식을 통일해야 한다.

## 연결 3. 가상 운행 완료 → 정산

**서민수 담당**

- 가상 택시 호출
- 배차 완료
- 운행 중
- 운행 완료

**김동민 담당**

- 최종 요금 입력
- 금액 계산
- 수령 확인
- 정산 완료

가상 운행이 완료되면 서민수가 구현한 화면에서 김동민의 정산 화면으로 이동한다.

정산을 시작할 수 있는 방 상태를 서버에서도 확인한다.

---

# 5. 개발 순서

## 1단계 — 프로젝트 공통 설정

**김동민**

- 기존 Expo 구조 확인
- Spring Boot 프로젝트 기본 구성
- MySQL 연결 설정
- 로그인 인증 방식 및 공통 API 설정

**서민수**

- 기존 Figma와 화면 설계서 확인
- 지도 SDK 연동 방식 검토
- 채팅·탑승 UI 공통 컴포넌트 준비
- Kakao Mobility API 테스트

두 팀원 모두 새 프로젝트를 중복 생성하지 않는다.

## 2단계 — 핵심 기능 개발

**김동민**

- 회원가입·로그인
- 택시방 생성·목록·목적지 검색
- 동승 신청·승인·거절·취소

**서민수**

- 채팅 기본 UI
- 탑승 확인 요청
- 60초 자동 퇴장
- 재참여 제한
- 지도 마커 및 경로

## 3단계 — 전체 이용 흐름 연결

**김동민**

- 최종 요금 입력
- 1인당 금액 계산
- 방장 수령 확인
- 정산 완료

**서민수**

- 가상 택시 호출
- 버튼 기반 단계 전환
- 운행 완료 후 정산 화면 이동

## 4단계 — 통합 및 추가 기능

**공동**

- 회원가입부터 정산까지 통합 테스트
- 두 사용자 계정으로 승인·탑승 시나리오 테스트
- API 오류 수정
- UI 개선
- P1 기능 추가

---

# 6. GitHub 브랜치 분담

두 팀원은 같은 `main` 브랜치를 기준으로 작업한다.

### 김동민의 브랜치 예시

- `feature/auth`
- `feature/room`
- `feature/participation`
- `feature/settlement`

### 서민수의 브랜치 예시

- `feature/boarding`
- `feature/kakao-map`
- `feature/taxi-chat`

실제 작업 시 필요한 브랜치만 만든다.

**개발 규칙**

1. `main`에 직접 push하지 않는다.
2. 기능별 브랜치에서 개발한다.
3. 작업 완료 후 Pull Request를 생성한다.
4. 상대 팀원이 변경 내용을 확인한다.
5. 검토 후 `main`에 병합한다.
6. 병합 후 최신 `main`을 기준으로 다음 기능을 개발한다.
7. 공통 파일 변경은 사전에 공유한다.

---

# 7. 개발 완료 확인 기준

## 팀원 김동민 완료 기준

- 회원가입 및 로그인이 실제 동작한다.
- 사용자 정보가 DB에 저장된다.
- 택시방을 생성하고 조회할 수 있다.
- 목적지 검색이 정상 동작한다.
- 참여 신청·승인·거절·취소가 가능하다.
- 최대 4명 제한이 적용된다.
- 최종 요금을 입력할 수 있다.
- 개인별 부담 금액이 계산된다.
- 방장이 '받았음'을 누르면 수령 상태가 저장된다.

## 팀원 서민수 완료 기준

- 채팅 기본 화면이 동작한다.
- 방장이 탑승 확인 요청을 보낼 수 있다.
- 60초 이내 수락이 가능하다.
- 60초 미응답 시 자동 퇴장한다.
- 자동 퇴장자는 동일한 방에 재참여할 수 없다.
- 지도 마커를 이동할 수 있다.
- 자동차 최단 거리 경로가 표시된다.
- 가상 택시 호출 화면이 버튼으로 전환된다.
- 운행 완료 후 정산 화면으로 이동한다.

## 공동 완료 기준

두 사용자 계정으로 다음 흐름을 시연할 수 있어야 한다.

회원가입 → 로그인 → 택시방 생성 → 목적지 검색 → 참여 신청 → 승인 → 탑승 확인 → 가상 택시 호출 → 요금 계산 → 수령 확인 → 정산 완료

---

# 8. 최종 역할 분담 요약

| 구분 | 팀원 김동민 | 팀원 서민수 |
|---|---|---|
| 회원가입·로그인 | 담당 | |
| 사용자 관리 | 담당 | |
| 택시방 생성·검색 | 담당 | |
| 동승 신청·승인·취소 | 담당 | |
| 채팅 기본 UI | | 담당 |
| 탑승 확인 60초 | | 담당 |
| 자동 퇴장·재참여 제한 | | 담당 |
| 지도 및 경로 | | 담당 |
| 가상 택시 호출 | | 담당 |
| 요금 계산 | 담당 | |
| 방장 수령 확인 | 담당 | |
| 이용 내역·후기(P1) | 담당 | |
| 친구·신고(P1) | | 담당 |
| 프로젝트 기본 설정 | 주 담당 | 협의 |
| 전체 통합 테스트 | 공동 | 공동 |

**최종 원칙: 각 팀원이 자신이 담당한 기능의 프론트엔드, 백엔드, 데이터 처리를 끝까지 책임지되 공통 파일과 기능 사이의 데이터 연결은 함께 협의한다.**
