const assert = require('node:assert/strict');
const test = require('node:test');

const { createDemoMessage, getRoomMessages, MAX_MESSAGE_LENGTH } = require('../src/features/chat/messages.ts');
const { getDemoRoom, DEMO_ROOMS } = require('../src/features/chat/mockMessages.ts');

const existing = [
  { messageId: 1, roomId: 101, userId: 2, nickname: '동승자', text: '안녕하세요', createdAt: '2026-11-11T01:00:00Z' },
  { messageId: 2, roomId: 102, userId: 2, nickname: '동승자', text: '다른 방 메시지', createdAt: '2026-11-11T01:00:00Z' },
];

test('공백만 있는 메시지는 생성하지 않는다', () => {
  assert.equal(createDemoMessage(existing, 101, ' \n\t ', '2026-11-11T01:01:00Z'), null);
});

test('입력을 정리해 시연용 본인 메시지를 생성하며 기존 배열은 변경하지 않는다', () => {
  const before = JSON.stringify(existing);
  const result = createDemoMessage(existing, 101, '  도착했습니다\n같이 타요  ', '2026-11-11T01:01:00Z');
  assert.equal(result.text, '도착했습니다\n같이 타요');
  assert.equal(result.roomId, 101);
  assert.equal(result.userId, 1);
  assert.equal(result.messageId, 3);
  assert.equal(result.createdAt, '2026-11-11T01:01:00Z');
  assert.equal(JSON.stringify(existing), before);
});

test('최대 길이는 허용하고 초과 메시지는 거부한다', () => {
  assert.equal(MAX_MESSAGE_LENGTH, 500);
  assert.equal(createDemoMessage(existing, 101, '가'.repeat(500), '2026-11-11T01:01:00Z').text.length, 500);
  assert.equal(createDemoMessage(existing, 101, '가'.repeat(501), '2026-11-11T01:01:00Z'), null);
});

test('같은 시각 연속 메시지도 서로 다른 ID로 생성한다', () => {
  const first = createDemoMessage(existing, 101, '첫 메시지', '2026-11-11T01:01:00Z');
  const second = createDemoMessage([...existing, first], 101, '두 번째', '2026-11-11T01:01:00Z');
  assert.notEqual(first.messageId, second.messageId);
});

test('선택한 방 메시지만 순서대로 반환하고 비어 있는 방은 빈 배열이다', () => {
  assert.deepEqual(getRoomMessages(existing, 101).map((message) => message.text), ['안녕하세요']);
  assert.deepEqual(getRoomMessages(existing, 999), []);
});

test('알려진 방만 열 수 있고 잘못된 ID를 임의의 시연 방으로 바꾸지 않는다', () => {
  assert.equal(getDemoRoom('101').roomId, 101);
  for (const value of [undefined, '', '999', '101abc', '0101', '-1']) {
    assert.equal(getDemoRoom(value), undefined);
  }
  assert.equal(new Set(DEMO_ROOMS.map((room) => room.roomId)).size, DEMO_ROOMS.length);
});
