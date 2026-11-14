const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createBoardingDemoRequest,
  expireBoardingDemoRequest,
  getBoardingDemoTimeline,
  respondToBoardingDemoRequest,
} = require('../src/features/boarding/demo.ts');
const { formatBoardingTime, getRemainingSeconds } = require('../src/features/boarding/countdown.ts');

test('탑승 요청은 생성 시각으로부터 60초 뒤 만료된다', () => {
  assert.deepEqual(createBoardingDemoRequest(1_000), {
    status: 'pending', requestedAt: 1_000, expiresAt: 61_000,
  });
});

test('60초가 지나면 남은 시간은 0이며 음수가 되지 않는다', () => {
  assert.equal(getRemainingSeconds(61_000, 1_000), 60);
  assert.equal(getRemainingSeconds(61_000, 60_001), 1);
  assert.equal(getRemainingSeconds(61_000, 61_000), 0);
  assert.equal(getRemainingSeconds(61_000, 70_000), 0);
  assert.equal(formatBoardingTime(60), '01:00');
  assert.equal(formatBoardingTime(9), '00:09');
});

test('참여자는 만료 직전까지 탑승을 수락할 수 있다', () => {
  const request = createBoardingDemoRequest(1_000);
  assert.deepEqual(respondToBoardingDemoRequest(request, 'accepted', 60_999), {
    ...request, status: 'accepted', respondedAt: 60_999,
  });
});

test('만료 시각에 누른 수락은 만료 상태가 된다', () => {
  const request = createBoardingDemoRequest(1_000);
  assert.equal(respondToBoardingDemoRequest(request, 'accepted', 61_000).status, 'expired');
});

test('명시적 탑승 포기는 미응답 만료와 구분된다', () => {
  const request = createBoardingDemoRequest(1_000);
  assert.equal(respondToBoardingDemoRequest(request, 'declined', 2_000).status, 'declined');
  assert.equal(expireBoardingDemoRequest(request, 61_000).status, 'expired');
});

test('시계가 만료 전일 때는 대기 중이고 수락 후에는 만료로 바뀌지 않는다', () => {
  const request = createBoardingDemoRequest(1_000);
  assert.equal(expireBoardingDemoRequest(request, 60_999), request);
  const accepted = respondToBoardingDemoRequest(request, 'accepted', 2_000);
  assert.equal(expireBoardingDemoRequest(accepted, 61_000), accepted);
});

test('요청이 없거나 이미 응답했다면 중복 응답하지 않는다', () => {
  const idle = { status: 'idle' };
  assert.equal(respondToBoardingDemoRequest(idle, 'accepted', 2_000), idle);
  const request = createBoardingDemoRequest(1_000);
  const declined = respondToBoardingDemoRequest(request, 'declined', 2_000);
  assert.equal(respondToBoardingDemoRequest(declined, 'accepted', 3_000), declined);
});

test('탑승 카드는 기존 메시지 뒤에 있고 새 메시지는 카드 뒤에 쌓인다', () => {
  const messages = [
    { messageId: 1, roomId: 101, text: '기존 인사' },
    { messageId: 2, roomId: 101, text: '새 인사' },
  ];
  const timeline = getBoardingDemoTimeline(messages, 1, 101);
  assert.deepEqual(timeline.map((item) => item.kind), ['message', 'boarding', 'message']);
  assert.equal(timeline[0].message.text, '기존 인사');
  assert.equal(timeline[2].message.text, '새 인사');
});
