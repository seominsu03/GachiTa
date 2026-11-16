# 구현 화면과 담당 범위

확인일: 2026-11-14. 화면 번호는 docs/team_roles.md 기준입니다.

| 화면 | 실제 Expo Router 파일 | 상태 |
|---|---|---|
| 회원가입 S-01 | src/app/(auth)/signup.tsx | 서버 연결 |
| 로그인 S-02 | src/app/(auth)/login.tsx | 서버 연결 |
| 메인 S-03 | src/app/(tabs)/index.tsx | 서버 방 목록 |
| 목록 S-04 | src/app/(tabs)/rooms.tsx | 목적지 검색·필터 |
| 생성 S-05 | src/app/rooms/create.tsx | 좌표가 있는 기본 위치 8개 선택 |
| 상세 S-06~07 | src/app/rooms/[roomId]/index.tsx | 신청·취소·정산 진입 |
| 동승 관리 S-08~11 | src/app/rooms/[roomId]/participants.tsx | 방장 승인·거절 |
| 정산 진입 S-17~21 | src/app/rooms/[roomId]/settlement/index.tsx | 승인된 참여자 조회 |
| 요금 입력·확인 | src/app/rooms/[roomId]/settlement/amount.tsx | SETTLING에서 방장 입력; step=confirm으로 결과 확인 |
| 수령 현황 | src/app/rooms/[roomId]/settlement/status.tsx | 방장 받았음 확인 |
| 정산 완료 | src/app/rooms/[roomId]/settlement/complete.tsx | 미수령이 있으면 현황 화면으로 표시 |
| 마이페이지 S-22 | src/app/(tabs)/mypage.tsx | 내 정보·내 동승방·로그아웃 |
| 디자인 예시 | src/app/preview.tsx | 실제 계정·서버와 분리한 샘플 |

실제 화면은 공통 RoomRoute/RoomScreens/SettlementScreens 컴포넌트를 재사용합니다. 웹의 /preview는 시안 점검용이며 서버 구현 완료를 뜻하지 않습니다.

서민수 담당 채팅·지도·가상 택시와 양 팀 P1 경로는 아직 빈 골격입니다. 김동민 담당 화면의 채팅 버튼은 현재 연결 안내만 표시합니다. 전체 완료 조건은 가상 운행 후 정산까지 이어진 두 계정 통합 시연입니다.
