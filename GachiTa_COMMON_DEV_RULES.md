# GachiTa 공통 개발 지시서

**문서명:** `GachiTa_COMMON_DEV_RULES.md`  
**버전:** v1.0  
**적용 대상:** 팀원 A, 팀원 B 및 각 팀원이 사용하는 Codex  
**기준 문서:** PRD v1.5 / 기능 정의서 v1.1 / 화면 설계서 v1.0

---

# 1. 최우선 개발 규칙

이 문서의 규칙은 팀원 A와 B 모두에게 적용한다.

1. 기존 GachiTa 프로젝트를 삭제하거나 새 Expo 프로젝트로 교체하지 않는다.
2. 기존 코드와 폴더를 먼저 분석한 후 수정한다.
3. 기능별 담당 영역을 구분하여 개발한다.
4. 공통 변수명, 함수명, API 경로, 데이터 타입을 임의로 변경하지 않는다.
5. 공통 파일 수정이 필요하면 상대 팀원에게 먼저 알린다.
6. `main` 브랜치에 직접 commit하거나 push하지 않는다.
7. 각 기능은 별도 브랜치에서 개발한다.
8. 기능 개발 후 테스트하고 PR을 통해 병합한다.
9. 기존 기능을 삭제하거나 변경하는 경우 반드시 변경 이유를 공유한다.
10. Codex가 임의로 프로젝트 구조, 기술 스택, 핵심 정책을 변경하지 못하도록 한다.

**규칙 간 충돌이 발생하면 임의로 수정하지 말고 두 팀원이 먼저 합의한다.**

---

# 2. 공통 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트엔드 | React Native + Expo |
| 프론트엔드 언어 | TypeScript |
| 화면 이동 | Expo Router |
| 백엔드 | Spring Boot |
| 백엔드 언어 | Java |
| 데이터베이스 | MySQL |
| API 통신 | REST API / JSON |
| 지도 | Kakao Maps |
| 경로 탐색 | Kakao Mobility Directions API |
| Git 저장소 | 기존 GachiTa 저장소 |

패키지 또는 라이브러리 버전은 실제 프로젝트에 설치된 버전을 우선 사용한다.

새로운 라이브러리를 설치할 때는 기존 의존성과 충돌하지 않는지 확인한다.

---

# 3. 공통 폴더 구조

기존 파일은 유지하면서 다음 구조를 기준으로 기능을 분리한다.

```text
GachiTa/
├── src/
│   ├── app/                 # Expo Router 화면
│   ├── components/          # 재사용 UI
│   │   ├── common/
│   │   ├── rooms/
│   │   ├── boarding/
│   │   ├── chat/
│   │   ├── maps/
│   │   └── settlement/
│   ├── features/            # 기능별 API 및 로직
│   │   ├── auth/
│   │   ├── rooms/
│   │   ├── participation/
│   │   ├── boarding/
│   │   ├── chat/
│   │   ├── maps/
│   │   ├── taxi/
│   │   └── settlement/
│   ├── services/
│   │   ├── api.ts
│   │   └── tokenStorage.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── contracts.ts
│   └── constants/
│       ├── routes.ts
│       └── theme.ts
│
├── backend/
│   └── src/main/
│       ├── java/com/gachita/
│       │   ├── auth/
│       │   ├── user/
│       │   ├── room/
│       │   ├── participation/
│       │   ├── boarding/
│       │   ├── chat/
│       │   ├── map/
│       │   ├── taxi/
│       │   ├── settlement/
│       │   └── common/
│       └── resources/
│           └── application.yml
│
├── docs/
├── assets/
├── .env.example
└── package.json
```

Spring Boot의 실제 패키지명은 최초 생성 시 두 팀원이 합의한다. 위 `com.gachita`는 권장 예시이다.

**주의:** 화면 경로인 `src/app`에 일반 API 함수나 비즈니스 로직을 무분별하게 작성하지 않는다.

---

# 4. 변수명 작성 규칙

## 4.1 TypeScript / Java 공통

변수명과 함수명은 `camelCase`를 사용한다.

| 올바른 예시 | 사용하지 않을 예시 |
|---|---|
| `userId` | `user_id`, `userid` |
| `roomId` | `room_id`, `roomID` |
| `hostUserId` | `host_id`, `leaderId` |
| `participationId` | `participant_id` |
| `boardingCheckId` | `boarding_id` |
| `totalFare` | `price`, `money` |
| `farePerPerson` | `eachMoney`, `userPrice` |
| `received` | `isPay`, `paidMoney` |
| `destination` | `goal`, `endPlace` |
| `latitude` | `latValue` |
| `longitude` | `lngValue` |

같은 의미의 변수는 모든 기능에서 같은 이름을 사용한다.

예를 들어 사용자 ID는 프론트엔드와 백엔드 모두 `userId`로 표현한다.

## 4.2 공통 변수명

| 변수명 | 의미 | 타입 |
|---|---|---|
| `userId` | 사용자 고유 ID | number / Long |
| `roomId` | 택시방 고유 ID | number / Long |
| `hostUserId` | 방장 사용자 ID | number / Long |
| `participationId` | 참여 신청 ID | number / Long |
| `boardingCheckId` | 탑승 확인 요청 ID | number / Long |
| `capacity` | 방장 포함 최대 모집 정원 | number / int |
| `participantCount` | 현재 승인된 인원(방장 포함) | number / int |
| `origin` | 출발지 정보 | 객체 |
| `destination` | 목적지 정보 | 객체 |
| `latitude` | 위도 | number / double |
| `longitude` | 경도 | number / double |
| `departureAt` | 출발 예정 일시 | ISO 날짜 문자열 |
| `requestedAt` | 요청 생성 시각 | ISO 날짜 문자열 |
| `expiresAt` | 요청 만료 시각 | ISO 날짜 문자열 |
| `totalFare` | 전체 택시요금 | 정수 |
| `farePerPerson` | 1인당 표시 금액 | 정수 |
| `remainderFare` | 원 단위 차액 | 정수 |
| `received` | 방장의 수령 확인 여부 | boolean |
| `status` | 해당 데이터의 현재 상태 | Enum 문자열 |

**예약어처럼 모호한 `id`, `data`, `value`, `state`만을 기능 간 데이터 전달에 사용하지 않는다.**

단, Entity 내부의 기본 키 필드 `id`는 허용한다.

---

# 5. 파일 및 클래스 이름 규칙

## 5.1 React Native

- 화면 파일: Expo Router 경로 규칙에 따른 소문자 파일명
- 컴포넌트: `PascalCase`
- 함수: `camelCase`
- 타입 및 인터페이스: `PascalCase`
- 상수: `UPPER_SNAKE_CASE`

예시:

- `RoomCard.tsx`
- `BoardingTimer.tsx`
- `SettlementCard.tsx`
- `getRoomById()`
- `createRoom()`
- `MAX_CAPACITY`

## 5.2 Spring Boot

- Controller: `기능명Controller.java`
- Service: `기능명Service.java`
- Repository: `기능명Repository.java`
- Entity: 단수형 `PascalCase`
- DTO: `기능명Request.java`, `기능명Response.java`

예시:

- `RoomController.java`
- `RoomService.java`
- `RoomRepository.java`
- `TaxiRoom.java`
- `RoomCreateRequest.java`
- `RoomResponse.java`

클래스 이름을 임의로 `RoomManager`, `RoomHandler` 등으로 변경하지 않는다.

실제 프로젝트에 이미 동일 목적의 클래스가 있다면 중복 생성하지 않고 팀원과 확인한다.

---

# 6. 공통 함수명

다음 이름을 공통 인터페이스의 기본 이름으로 사용한다.

| 기능 | 함수명 |
|---|---|
| 회원가입 | `signup()` |
| 로그인 | `login()` |
| 로그아웃 | `logout()` |
| 내 정보 조회 | `getMyProfile()` |
| 택시방 생성 | `createRoom()` |
| 택시방 목록 조회 | `getRooms()` |
| 목적지 검색 | `searchRoomsByDestination()` |
| 택시방 상세 조회 | `getRoomById()` |
| 참여 신청 | `requestParticipation()` |
| 참여 승인 | `approveParticipation()` |
| 참여 거절 | `rejectParticipation()` |
| 참여 취소 | `cancelParticipation()` |
| 탑승 확인 요청 | `requestBoardingCheck()` |
| 탑승 수락 | `acceptBoardingCheck()` |
| 현재 탑승 확인 조회 | `getCurrentBoardingCheck()` |
| 자동차 경로 조회 | `getDrivingRoute()` |
| 가상 택시 상태 조회 | `getTaxiStatus()` |
| 가상 택시 다음 단계 | `advanceTaxiStatus()` |
| 최종 요금 등록 | `createSettlement()` |
| 정산 정보 조회 | `getSettlement()` |
| 방장 수령 확인 | `confirmReceipt()` |

프론트엔드 API 호출 함수는 위 이름을 기준으로 작성한다.

Spring Boot Service의 메서드 역시 가능한 한 같은 의미의 이름을 사용한다.

단, 클래스 내부의 보조 함수는 용도를 명확히 표현하는 이름으로 자유롭게 추가할 수 있다.

**한 번 합의해 사용하기 시작한 공통 함수의 이름과 매개변수 형식은 다른 팀원의 동의 없이 변경하지 않는다.**

---

# 7. 공통 데이터 구조

## 7.1 위치 정보

출발지와 목적지는 동일한 구조를 사용한다.

```json
{
  "name": "수원역",
  "latitude": 37.266,
  "longitude": 127.000
}
```

- `name`: 위치명
- `latitude`: 위도
- `longitude`: 경도

프론트엔드와 백엔드 모두 같은 필드명을 사용한다.

지도에서 마커를 이동하면 좌표를 갱신한다.

## 7.2 택시방 정보

공통 API 데이터 구조의 기준은 다음과 같다.

```json
{
  "roomId": 1,
  "hostUserId": 10,
  "origin": {
    "name": "수원역",
    "latitude": 37.266,
    "longitude": 127.000
  },
  "destination": {
    "name": "광교중앙역",
    "latitude": 37.288,
    "longitude": 127.051
  },
  "departureAt": "2026-11-04T09:00:00Z",
  "capacity": 4,
  "participantCount": 2,
  "status": "RECRUITING"
}
```

이 데이터는 **형식 예시이며 실제 등록된 택시방 데이터가 아니다.**

### 공통 원칙

- `roomId`는 택시방의 고유 ID다.
- `hostUserId`는 방장의 사용자 ID다.
- `capacity`는 방장을 포함한다.
- `participantCount`도 방장을 포함한다.
- 최대 탑승 인원은 4명이다.
- `departureAt`은 시간대 정보가 있는 ISO 8601 형식을 사용한다.
- 서버에서는 시간을 일관되게 저장하고, 앱에서는 한국 시간으로 표시한다.

## 7.3 참여 상태값

참여 상태 문자열은 다음 표기를 사용한다.

| 상태값 | 의미 |
|---|---|
| `PENDING` | 승인 대기 |
| `APPROVED` | 승인 완료 |
| `REJECTED` | 신청 거절 |
| `CANCELLED` | 자발적 참여 취소 |
| `BOARDING_CONFIRMED` | 탑승 확인 수락 |
| `TIMED_OUT` | 미응답 자동 퇴장 |

프론트엔드와 백엔드가 서로 다른 상태값을 사용하면 안 된다.

예를 들어 서버에서 `APPROVED`를 보내는데 프론트엔드에서 `ACCEPTED`를 기대하는 상황을 방지해야 한다.

## 7.4 택시방 진행 상태

| 상태값 | 의미 |
|---|---|
| `RECRUITING` | 참여자 모집 중 |
| `BOARDING_CHECK` | 최종 탑승 확인 중 |
| `TAXI_CALLING` | 가상 택시 호출 중 |
| `TAXI_ASSIGNED` | 가상 배차 완료 |
| `IN_RIDE` | 가상 운행 중 |
| `SETTLING` | 정산 중 |
| `COMPLETED` | 정산 완료 |

위 상태값을 변경할 때는 서버에서 가능한 상태 전환인지 확인한다.

## 7.5 정산 정보

```json
{
  "roomId": 1,
  "totalFare": 10003,
  "farePerPerson": 2500,
  "remainderFare": 3,
  "participantCount": 4
}
```

- 요금은 원 단위 정수로 처리한다.
- 방장 포함 최대 4명이다.
- 1인당 금액은 원 미만 버림으로 계산한다.
- 나머지 차액은 최대 3원이다.
- 실제 차액 지급 기능은 구현하지 않는다.
- 참여자는 앱 밖에서 직접 송금한다.
- 방장이 수령 여부를 확인한다.

---

# 8. 공통 REST API 규칙

모든 백엔드 API는 다음 주소 체계를 기본으로 한다.

`/api/v1`

## 8.1 API 경로

| 메서드 | 경로 | 기능 |
|---|---|---|
| POST | `/api/v1/auth/signup` | 회원가입 |
| POST | `/api/v1/auth/login` | 로그인 |
| GET | `/api/v1/users/me` | 내 정보 조회 |
| POST | `/api/v1/rooms` | 택시방 생성 |
| GET | `/api/v1/rooms` | 택시방 목록 및 목적지 검색 |
| GET | `/api/v1/rooms/{roomId}` | 택시방 상세 |
| POST | `/api/v1/rooms/{roomId}/participations` | 참여 신청 |
| GET | `/api/v1/rooms/{roomId}/participations` | 신청·참여 목록 |
| POST | `/api/v1/rooms/{roomId}/participations/{participationId}/approve` | 참여 승인 |
| POST | `/api/v1/rooms/{roomId}/participations/{participationId}/reject` | 참여 거절 |
| POST | `/api/v1/rooms/{roomId}/participations/{participationId}/cancel` | 참여 취소 |
| POST | `/api/v1/rooms/{roomId}/boarding-checks` | 탑승 확인 요청 |
| GET | `/api/v1/rooms/{roomId}/boarding-checks/current` | 현재 확인 요청 조회 |
| POST | `/api/v1/rooms/{roomId}/boarding-checks/{boardingCheckId}/accept` | 탑승 수락 |
| POST | `/api/v1/maps/route` | 자동차 최단 거리 조회 |
| GET | `/api/v1/rooms/{roomId}/taxi` | 가상 택시 상태 |
| POST | `/api/v1/rooms/{roomId}/taxi/advance` | 가상 택시 다음 단계 |
| POST | `/api/v1/rooms/{roomId}/settlement` | 요금 입력 및 정산 생성 |
| GET | `/api/v1/rooms/{roomId}/settlement` | 정산 조회 |
| PATCH | `/api/v1/rooms/{roomId}/settlement/receipts/{userId}` | 수령 확인 |

목적지 검색은 다음과 같이 요청한다.

`GET /api/v1/rooms?destination=광교중앙역`

API 주소를 기능별로 다른 이름으로 임의 생성하지 않는다.

## 8.2 API 응답 형식

성공 응답은 다음 구조를 기준으로 한다.

```json
{
  "success": true,
  "data": {},
  "message": "요청이 완료되었습니다."
}
```

오류 응답은 다음 구조를 기준으로 한다.

```json
{
  "success": false,
  "error": {
    "code": "ROOM_FULL",
    "message": "모집 인원이 가득 찼습니다."
  }
}
```

HTTP 상태 코드도 오류에 맞게 사용한다.

- `200`: 정상 조회·수정
- `201`: 정상 생성
- `400`: 잘못된 입력값
- `401`: 로그인 필요 또는 인증 실패
- `403`: 권한 없음
- `404`: 데이터 없음
- `409`: 현재 상태 충돌 또는 중복 처리
- `500`: 서버 오류

프론트엔드가 모든 API에 대해 같은 형식으로 성공과 실패를 처리할 수 있도록 한다.

---

# 9. 공통 비즈니스 규칙

## 9.1 택시방 인원

- 방장 포함 최대 4명이다.
- 모집 정원을 초과하여 승인할 수 없다.
- 승인 대기자는 현재 참여 인원에 포함하지 않는다.
- 승인된 참여자가 취소하면 참여 인원을 갱신한다.

## 9.2 참여 취소

- 최종 탑승 확인 수락 전까지 취소할 수 있다.
- 수락 이후에는 일반 참여 취소를 허용하지 않는다.
- 서버가 현재 상태를 확인한 후 취소 여부를 결정한다.

## 9.3 60초 탑승 확인

- 방장이 '부르기' 버튼으로 요청한다.
- 참여자는 60초 이내에 수락해야 한다.
- 미응답 시 자동 퇴장한다.
- 미응답 퇴장자는 동일 방에 다시 참여할 수 없다.
- 다른 방에는 정상 참여할 수 있다.
- 실제 계정 정지나 벌점 제재는 적용하지 않는다.

**중요:** 60초 만료 여부는 앱이 아닌 서버의 시각으로 검증한다.

자동 퇴장은 앱이 종료된 상태에서도 적용될 수 있어야 한다.

## 9.4 지도 및 경로

- 출발지와 목적지는 마커 이동으로 설정한다.
- 위도와 경도는 공통 필드명을 사용한다.
- 자동차 최단 거리 경로를 표시한다.
- 실제 도로 경로 탐색에는 Kakao Mobility Directions API를 사용한다.
- 외부 API 비밀키는 서버에서 관리한다.

## 9.5 가상 택시 호출

- 실제 택시 호출 API를 사용하지 않는다.
- 방장이 버튼을 눌러 다음 단계로 이동한다.
- 호출 중 → 배차 완료 → 운행 중 → 정산 단계로 진행한다.
- 자동 타이머로 화면을 변경하지 않는다.

## 9.6 요금 정산

- 방장이 최종 요금을 입력한다.
- 방장 포함 전체 인원으로 나눈다.
- 금액은 원 단위 정수로 표시한다.
- 최대 3원 차액 지원은 향후 정책으로만 표시한다.
- 참여자는 방장에게 앱 외부에서 송금한다.
- 방장만 '받았음' 상태를 변경한다.
- 실제 송금 및 자동 입금 확인 기능은 없다.

---

# 10. 데이터베이스 규칙

## 10.1 테이블명

MySQL 테이블명은 `snake_case`를 사용한다.

| 테이블 | 용도 |
|---|---|
| `users` | 회원 |
| `taxi_rooms` | 택시방 |
| `participations` | 참여 신청·상태 |
| `boarding_checks` | 탑승 확인 요청 |
| `boarding_responses` | 사용자별 탑승 응답 |
| `room_bans` | 동일 방 재참여 제한 |
| `settlements` | 택시비 정산 |
| `settlement_receipts` | 사용자별 수령 상태 |

## 10.2 컬럼명

DB 컬럼은 `snake_case`, Java·TypeScript 필드는 `camelCase`를 사용한다.

| DB 컬럼 | Java / TypeScript |
|---|---|
| `user_id` | `userId` |
| `room_id` | `roomId` |
| `host_user_id` | `hostUserId` |
| `departure_at` | `departureAt` |
| `requested_at` | `requestedAt` |
| `expires_at` | `expiresAt` |
| `total_fare` | `totalFare` |
| `fare_per_person` | `farePerPerson` |

## 10.3 DB 공통 규칙

- 기본 키는 `BIGINT` 기반으로 통일한다.
- 테이블 간 관계에는 외래 키를 사용한다.
- 같은 정보를 여러 테이블에 불필요하게 중복 저장하지 않는다.
- 다른 담당자의 테이블을 직접 수정하기 전에 협의한다.
- 삭제·변경하는 DB 스키마는 반드시 팀원에게 공유한다.
- 비밀번호는 해시값으로 저장한다.
- 날짜·시간 저장 방식은 UTC 기준으로 통일하고 사용자 화면에서는 한국 시간으로 표시한다.

테이블의 실제 세부 컬럼과 관계는 두 팀원이 DB 설계 시 확정한다.

---

# 11. 공통 파일 수정 규칙

다음 파일은 여러 기능에 영향을 주므로 공통 관리 대상으로 지정한다.

| 파일·영역 | 규칙 |
|---|---|
| `package.json` | 라이브러리 추가 전 공유 |
| `package-lock.json` | 의존성 변경 시 함께 반영 |
| `src/app/_layout.tsx` | 화면 경로 변경 시 협의 |
| `src/services/api.ts` | API 통신 공통 함수 유지 |
| `src/types/contracts.ts` | 공통 타입 및 Enum 관리 |
| `src/constants/routes.ts` | 화면 이동 경로 통일 |
| `src/contexts/AuthContext.tsx` | 사용자 인증 상태 공통 사용 |
| `application.yml` | DB 및 서버 설정 협의 |
| Spring Boot Security 설정 | 권한·인증 방식 통일 |
| DB Entity 관계 | 상대 기능에 영향이 있으면 협의 |

공통 파일 수정 시에는 다음 순서를 따른다.

1. 변경이 필요한 이유를 팀원에게 알린다.
2. 수정할 변수·함수·타입을 공유한다.
3. 영향을 받는 기능을 확인한다.
4. 코드를 수정한다.
5. 실행 및 테스트 후 PR을 생성한다.

---

# 12. 프론트엔드 개발 규칙

1. 모든 신규 화면 및 로직은 TypeScript를 사용한다.
2. `any` 타입 사용을 최소화하고 공통 타입을 재사용한다.
3. API 주소를 화면 파일에 직접 반복 작성하지 않는다.
4. 공통 API 호출 함수는 `features/` 또는 `services/`에 배치한다.
5. 공통 버튼, 입력창, 카드 등은 컴포넌트로 분리한다.
6. 화면 이동에는 Expo Router를 사용한다.
7. API 로딩·오류·완료 상태를 구분한다.
8. 서버에 저장할 데이터는 화면 상태만 변경하고 끝내지 않는다.
9. 사용자 권한에 따라 방장 전용 버튼을 구분한다.
10. 개발 중 임시로 사용한 Mock 데이터는 실제 데이터와 구분한다.

---

# 13. 백엔드 개발 규칙

1. Controller에서 복잡한 비즈니스 로직을 직접 처리하지 않는다.
2. 비즈니스 로직은 Service에서 처리한다.
3. Repository는 데이터베이스 조회와 저장을 담당한다.
4. API 요청 및 응답에는 DTO를 사용한다.
5. Entity를 API 응답으로 직접 무분별하게 반환하지 않는다.
6. 서버에서 사용자 권한을 검증한다.
7. 클라이언트가 전달한 `userId`만 믿고 사용자 권한을 결정하지 않는다.
8. 동시에 여러 요청이 들어와도 모집 정원이 초과되지 않도록 처리한다.
9. 탑승 확인 시간제한은 서버에서 검사한다.
10. 자동 퇴장과 재참여 제한은 데이터베이스에 반영한다.
11. 실제 결제·실제 택시 배차 기능을 임의로 구현하지 않는다.
12. 오류 응답은 공통 형식으로 반환한다.

---

# 14. Git 및 브랜치 규칙

## 14.1 브랜치 이름

기능별 브랜치를 사용한다.

예시:

- `feature/auth`
- `feature/room`
- `feature/participation`
- `feature/boarding`
- `feature/chat`
- `feature/kakao-map`
- `feature/taxi-simulation`
- `feature/settlement`

기존 브랜치에 작업한 내용이 있으면 먼저 확인하고 재사용 여부를 결정한다.

## 14.2 Git 규칙

1. `main`에서 직접 개발하지 않는다.
2. 기능별 브랜치에서 작업한다.
3. 작업을 시작하기 전에 현재 브랜치와 변경 파일을 확인한다.
4. 다른 팀원의 미완성 코드를 임의로 삭제하지 않는다.
5. 하나의 PR에는 가급적 하나의 기능을 포함한다.
6. PR을 생성하고 상대 팀원의 검토를 받은 후 병합한다.
7. 병합 후 최신 `main`을 반영하고 다음 기능을 개발한다.
8. 원격 push, PR 병합, 브랜치 삭제는 본인 확인 후 진행한다.

---

# 15. Codex 사용 규칙

팀원 A와 B는 Codex에 개발을 요청할 때 반드시 다음 원칙을 적용한다.

### Codex 공통 지시

- 작업 시작 전에 이 문서를 읽는다.
- 기존 프로젝트와 현재 브랜치를 확인한다.
- 요청받은 담당 기능만 개발한다.
- 다른 담당자의 파일을 임의로 수정하지 않는다.
- 공통 파일 변경이 필요하면 변경 내용을 먼저 보고한다.
- 공통 변수명과 함수명을 유지한다.
- 공통 API 경로와 응답 구조를 유지한다.
- 새로운 라이브러리를 무분별하게 설치하지 않는다.
- 기존 파일을 삭제하거나 새 프로젝트로 대체하지 않는다.
- 실제 API 키 및 비밀번호를 코드에 직접 작성하지 않는다.
- 코드 작성 후 가능한 범위에서 빌드와 테스트를 수행한다.
- 테스트하지 못한 항목은 성공했다고 보고하지 않는다.
- 작업이 끝나면 수정 파일과 테스트 결과를 정리한다.
- 사용자 승인 없이 `main`에 병합하지 않는다.

### Codex 작업 결과 보고 형식

작업 완료 후 다음 내용을 보고한다.

1. 작업한 기능
2. 생성한 파일
3. 수정한 파일
4. 추가한 API
5. 변경한 데이터 구조
6. 변경한 공통 파일
7. 실행한 테스트와 결과
8. 남아 있는 오류
9. 다른 팀원이 확인해야 할 사항

---

# 16. 공통 테스트 규칙

두 팀원은 담당 기능을 개발한 후 다음 사항을 확인한다.

- API 요청과 응답 형식이 일치하는지 확인
- 프론트엔드와 백엔드의 변수명 일치 확인
- 공통 상태값 일치 확인
- 로그인 사용자와 방장 권한 확인
- 데이터베이스 저장 및 조회 확인
- 다른 팀원 기능에 영향을 주는 오류 확인
- Android 에뮬레이터에서 화면 동작 확인

### 필수 통합 시나리오

회원가입 → 로그인 → 택시방 생성 → 목적지 검색 → 참여 신청 → 승인 → 탑승 확인 → 가상 택시 호출 → 요금 계산 → 수령 확인 → 정산 완료

### 예외 시나리오

- 최대 4명 정원 초과
- 중복 신청
- 수락 전 참여 취소
- 수락 후 취소 제한
- 60초 미응답 자동 퇴장
- 동일 방 재참여 거절
- 방장이 아닌 사용자의 수령 완료 처리 거절

---

# 17. 공통 지시서 수정 및 확정 규칙

이 문서는 팀원 A와 B가 함께 사용하는 공통 개발 기준이다.

- 개발 시작 전에 두 팀원이 내용에 동의한다.
- 공통 이름이나 데이터 구조를 변경해야 할 경우 먼저 협의한다.
- 변경이 확정되면 문서 버전을 갱신한다.
- 관련 코드를 함께 수정한다.
- 이미 사용 중인 API 및 데이터 구조를 한 팀원이 일방적으로 변경하지 않는다.

**이 문서의 목적은 두 사람이 따로 개발하더라도 하나의 프로젝트로 정상 연결되도록 하는 것이다.**

---

# Codex에 공통으로 입력할 문장

> 개발을 시작하기 전에 프로젝트 루트의 `GachiTa_COMMON_DEV_RULES.md`를 읽고 모든 공통 규칙을 준수해줘. 변수명, 함수명, API 경로, 데이터 구조와 상태값을 임의로 변경하지 마. 기존 코드와 충돌하거나 공통 파일 수정이 필요하면 먼저 변경 사항을 알려줘. 내 담당 기능만 개발하고, 테스트 결과를 보고해줘.
