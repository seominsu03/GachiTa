const assert = require('node:assert/strict');
const test = require('node:test');

const {
  advanceTaxiDemoStage,
  advanceTaxiDemoRoomStage,
  cancelTaxiDemoCall,
  cancelTaxiDemoRoomCall,
  getTaxiDemoRoomStage,
  getTaxiDemoProgress,
} = require('../src/features/taxi/stages.ts');

test('방장은 호출부터 운행 완료까지 정해진 순서로 진행한다', () => {
  let stage = 'BEFORE_CALL';
  for (const expected of ['TAXI_CALLING', 'TAXI_ASSIGNED', 'IN_RIDE', 'SETTLING']) {
    stage = advanceTaxiDemoStage(stage, true);
    assert.equal(stage, expected);
  }
  assert.equal(advanceTaxiDemoStage(stage, true), 'SETTLING');
});

test('참여자는 어떤 진행 단계에서도 상태를 넘길 수 없다', () => {
  for (const stage of ['BEFORE_CALL', 'TAXI_CALLING', 'TAXI_ASSIGNED', 'IN_RIDE', 'SETTLING']) {
    assert.equal(advanceTaxiDemoStage(stage, false), stage);
  }
});

test('호출 중인 방장만 호출을 취소할 수 있다', () => {
  assert.equal(cancelTaxiDemoCall('TAXI_CALLING', true), 'BEFORE_CALL');
  assert.equal(cancelTaxiDemoCall('TAXI_CALLING', false), 'TAXI_CALLING');
  assert.equal(cancelTaxiDemoCall('TAXI_ASSIGNED', true), 'TAXI_ASSIGNED');
});

test('진행 표시는 호출 전 0단계에서 운행 중 3단계로 이동한다', () => {
  assert.deepEqual(
    ['BEFORE_CALL', 'TAXI_CALLING', 'TAXI_ASSIGNED', 'IN_RIDE', 'SETTLING'].map(getTaxiDemoProgress),
    [0, 1, 2, 3, 3],
  );
});

test('채팅을 다녀와 같은 방을 다시 열면 마지막 택시 단계가 유지된다', () => {
  const firstRoomId = 91001;
  const otherRoomId = 91002;
  assert.equal(getTaxiDemoRoomStage(firstRoomId, true), 'BEFORE_CALL');
  assert.equal(advanceTaxiDemoRoomStage(firstRoomId, true), 'TAXI_CALLING');
  assert.equal(getTaxiDemoRoomStage(firstRoomId, true), 'TAXI_CALLING');
  assert.equal(getTaxiDemoRoomStage(otherRoomId, true), 'BEFORE_CALL');

  assert.equal(advanceTaxiDemoRoomStage(firstRoomId, true), 'TAXI_ASSIGNED');
  assert.equal(getTaxiDemoRoomStage(firstRoomId, true), 'TAXI_ASSIGNED');
  assert.equal(getTaxiDemoRoomStage(otherRoomId, true), 'BEFORE_CALL');
});

test('호출 취소도 저장되고 참여자는 저장된 단계를 바꿀 수 없다', () => {
  const roomId = 91003;
  assert.equal(advanceTaxiDemoRoomStage(roomId, true), 'TAXI_CALLING');
  assert.equal(advanceTaxiDemoRoomStage(roomId, false), 'TAXI_CALLING');
  assert.equal(cancelTaxiDemoRoomCall(roomId, false), 'TAXI_CALLING');
  assert.equal(cancelTaxiDemoRoomCall(roomId, true), 'BEFORE_CALL');
  assert.equal(getTaxiDemoRoomStage(roomId, true), 'BEFORE_CALL');
});
