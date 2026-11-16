# 같이타 API

이번 구현은 기존 공통 규칙의 `/api/v1/auth/signup`, `/api/v1/auth/login`, `/api/v1/users/me`를 유지한다. 요청자의 요구대로 닉네임·아이디·비밀번호를 사용한다. 기존 타입 파일이 비어 있어 아래 인증 타입을 추가했으며, 인증 외 방·참여·정산 API는 아래 표를 참고한다.

## 공통 응답과 인증

- 성공: `{ "success": true, "data": ..., "message": "..." }`
- 실패: `{ "success": false, "error": { "code": "...", "message": "..." } }`
- 인증: 서버 세션의 HttpOnly `JSESSIONID` 쿠키. 클라이언트는 모든 요청에 `credentials: 'include'`를 사용한다.
- 변경 요청은 CSRF 토큰이 필요하다. `GET /api/v1/auth/csrf`로 토큰과 헤더 이름을 받은 후 해당 헤더에 토큰을 보낸다.
- 로그인 시 세션 ID와 CSRF 토큰을 교체한다. 클라이언트는 로그인 성공 후 CSRF 캐시를 비우고 다음 변경 요청 전에 새 토큰을 받는다.
- 로그인 세션의 principal은 서버에서 검증한 `userId`다. `/users/me`는 요청 body/query의 사용자 ID를 신뢰하지 않는다.

## 회원가입

`POST /api/v1/auth/signup` → 201

```json
{
  "nickname": "같이타",
  "username": "rider_01",
  "password": "Password123!"
}
```

- `username`: 영문·숫자·밑줄 4~20자. 소문자로 정규화해 대소문자를 구분하지 않으며 DB unique 제약으로 중복 가입을 방지한다.
- `nickname`: 공백 제거 후 2~20자. 중복 닉네임은 허용한다.
- `password`: 공백 없는 ASCII 영문·숫자·기호 8~64자. BCrypt 해시로만 저장한다.
- 비밀번호 확인은 화면에서만 사용하며 서버로 전송하지 않는다.
- 응답 `data`: `{ "userId": 1, "username": "rider_01", "nickname": "같이타" }`. 비밀번호와 해시는 반환하지 않는다.
- 가입 후 자동 로그인하지 않고 로그인 화면에 완료 안내를 표시한다.

위 길이·문자 제한은 이번 구현의 기본 검증 정책이며 PRD 원문으로 확인한 정책은 아니다.

## 로그인

`POST /api/v1/auth/login` → 200

```json
{ "username": "rider_01", "password": "Password123!" }
```

응답 `data`는 회원가입과 같은 사용자 정보다. 잘못된 아이디와 비밀번호는 같은 `INVALID_CREDENTIALS` 오류로 응답한다.

## 내 정보

`GET /api/v1/users/me` → 200, 인증 필요.

응답 `data`는 `{ "userId": 1, "username": "rider_01", "nickname": "같이타" }`다. 앱 시작 시 서버 조회로 인증 상태를 복원한다. 장기 자동 로그인 기능은 포함하지 않는다. 서버 재시작·세션 만료·플랫폼 쿠키 소실 시 다시 로그인해야 한다.

## 추가한 보조 API

| 메서드 | 경로 | 응답 data | 용도 |
|---|---|---|---|
| GET | `/api/v1/auth/csrf` | `{ "token": "...", "headerName": "X-CSRF-TOKEN" }` | 세션에 연결된 CSRF 토큰 발급 |
| POST | `/api/v1/auth/logout` | `null` | 세션 무효화 및 쿠키 제거 |

## 주요 오류

| HTTP | code | 의미 |
|---|---|---|
| 400 | `INVALID_INPUT` | 입력 조건 또는 JSON 형식 오류 |
| 401 | `INVALID_CREDENTIALS` | 로그인 정보 불일치 |
| 401 | `UNAUTHENTICATED` | 로그인 필요 또는 사용자 없음 |
| 403 | `CSRF_INVALID` | CSRF 토큰 없음·만료·불일치 |
| 403 | `FORBIDDEN` | 접근 권한 없음 |
| 409 | `USERNAME_TAKEN` | 중복 아이디 |
| 500 | `INTERNAL_ERROR` | 서버 내부 오류 |

공통 클라이언트는 CSRF 거절에 한해서 토큰을 갱신하고 한 번 재시도한다. 네트워크 오류나 가입·로그인 실패를 자동 재전송하지 않는다. CORS의 비허용 origin은 Spring CORS 필터가 403으로 차단하며 JSON 응답 형식이 아닐 수 있다.


## 회원 정보 추가 필드

현재 웹 회원가입 폼은 name(이름 2~50자), phoneNumber(휴대폰 형식)를 함께 입력합니다. 하위 호환을 위해 API에서는 두 필드를 생략할 수 있으며 nullable입니다. 사용자 응답에 name/phoneNumber가 추가됩니다. 방장/참여자의 공개 프로필 응답에는 전화번호·이름을 포함하지 않습니다. 전화번호 입력은 OTP 본인 인증이 아닙니다.

## 방·참여·정산 API

모두 세션 인증이 필요하며 변경 요청에는 CSRF 헤더가 필요합니다. 성공/실패 응답은 위 공통 규칙을 유지합니다.

| 메서드 | 경로 | 기능 |
|---|---|---|
| POST | /api/v1/rooms | 방 생성(201) |
| GET | /api/v1/rooms?destination=강남 | 모집 중이며 미래 출발인 방 최대 100개, 출발일 오름차순 |
| GET | /api/v1/rooms/mine | 로그인 사용자의 방 최대 100개, 출발일·방 번호 내림차순 |
| GET | /api/v1/rooms/{roomId} | 방 상세 |
| GET | /api/v1/rooms/{roomId}/participations | 권한에 맞는 참여 목록 |
| POST | /api/v1/rooms/{roomId}/participations | 본인 신청(201) |
| POST | /api/v1/rooms/{roomId}/participations/{participationId}/approve | 방장 승인 |
| POST | /api/v1/rooms/{roomId}/participations/{participationId}/reject | 방장 거절 |
| POST | /api/v1/rooms/{roomId}/participations/{participationId}/cancel | 본인 취소 |
| POST | /api/v1/rooms/{roomId}/settlement | 방장 최종 요금 등록(201) |
| GET | /api/v1/rooms/{roomId}/settlement | 방장·승인된 동승자 정산 조회 |
| PATCH | /api/v1/rooms/{roomId}/settlement/receipts/{userId} | 방장 수령 확인 |

### 생성 요청과 응답

~~~json
{
  "origin": { "name": "수원역", "latitude": 37.2657, "longitude": 127.0007 },
  "destination": { "name": "강남역", "latitude": 37.4979, "longitude": 127.0276 },
  "departureAt": "2030-01-01T09:30:00Z",
  "capacity": 4
}
~~~

예시 날짜는 형식 설명이며 실제 사용할 때 미래의 출발 시간으로 정합니다. 출발·도착은 다른 이름/좌표, 정원은 방장 포함 2~4명, 출발은 미래 ISO 시각이어야 합니다.

RoomResponse: roomId, hostUserId, host {userId, nickname}, origin, destination, departureAt, capacity, participantCount, status. 참여 응답: participationId, roomId, userId, nickname, status. 상태값은 기존 공통 contracts.ts를 유지합니다.

### 내 동승방 조회(2026-11-14 추가)

GET /api/v1/rooms/mine은 요청 userId가 아닌 인증된 principal의 ID로 조회합니다. 본인이 방장이거나 본인의 참여 상태가 PENDING/APPROVED/BOARDING_CONFIRMED인 방을 반환합니다. 모집 종료·출발 시간 경과·정산 완료로 제외하지 않습니다. CANCELLED/REJECTED/TIMED_OUT 참여는 제외합니다. P1 탑승 이력/후기 API가 아닙니다.

### 참여와 정산 정책

- 승인 전 신청은 PENDING이며 정원에 포함하지 않습니다. 방장만 미래 출발 RECRUITING 방의 PENDING 신청을 승인·거절할 수 있습니다.
- 승인 시 방 행을 잠가 동시에 처리해도 정원을 넘지 않게 합니다. 중복 신청은 409, 정원 초과 승인은 ROOM_FULL(409)입니다.
- 본인은 RECRUITING/BOARDING_CHECK 단계에서 PENDING/APPROVED 참여를 취소할 수 있습니다. BOARDING_CONFIRMED 이후 취소는 차단합니다. TIMED_OUT 후 재신청도 차단합니다.
- 방장은 전체 참여 목록, 일반 사용자는 본인 신청과 공개된 승인/탑승확인 참여자만 볼 수 있습니다.
- 최종 요금 요청: {"totalFare":10003}. SETTLING 상태의 방장만 한 번 등록할 수 있습니다. 요금은 1~10,000,000원 정수입니다.
- 정산 응답: roomId, totalFare, farePerPerson, remainderFare, participantCount, receipts[{userId,nickname,received}]. 방장 포함 1~4명으로 계산하고 버림 차액을 별도 표시합니다.
- 수령 요청: {"received":true}. 방장만 수령을 확인할 수 있습니다. 방장 본인 부담은 처음부터 확인 처리하며, 전원이 확인되면 방 상태가 COMPLETED가 됩니다.
- 가상 운행과 SETTLING 전환은 서민수 담당 연결 지점입니다. 일반 클라이언트가 방 상태를 임의로 바꾸는 API는 제공하지 않습니다.

2026-11-16 보완: totalFare와 capacity에 소수 JSON 숫자를 보내면 자동 버림하지 않고 INVALID_INPUT(400)으로 거절합니다. 정산의 최대 허용 금액 10,000,000원은 화면에서도 쉼표 포함 10자리까지 입력할 수 있습니다.

## PR #5 검색 누락 수정

GET /api/v1/rooms는 기존 destination 조건에 선택 조건 origin과 period를 추가합니다. 기존 목적지 단독 요청은 그대로 동작합니다.

- origin/destination: 앞뒤 공백 제거, 대소문자 무시 부분 일치. %와 _는 일반 문자입니다.
- period: ALL(기본), MORNING, AFTERNOON, EVENING. 잘못된 값은 INVALID_INPUT(400)입니다.
- 한국 시간(Asia/Seoul) 기준: MORNING 00:00 이상 12:00 미만, AFTERNOON 12:00 이상 18:00 미만, EVENING 18:00 이상 24:00 미만입니다. 날짜 제한은 추가하지 않습니다.
- 모집 상태·미래 출발·출발지·목적지·시간대 조건을 DB에서 먼저 모두 적용한 뒤, departureAt과 roomId 오름차순으로 최대 100개를 반환합니다.
- 화면은 모든 검색 조건을 서버에 보내며 서버 결과를 다시 잘라내지 않습니다. 디자인 preview의 샘플 데이터 필터는 별도입니다.

예시: GET /api/v1/rooms?origin=수원&destination=강남&period=EVENING

클라이언트 getRooms('강남') 호환을 유지하며 getRooms({origin:'수원',destination:'강남',period:'EVENING'})도 지원합니다. 화면의 전체/오전/오후/저녁은 API 코드로 변환합니다. 공통 계약 변경은 이번 PR 검토 항목입니다.
