const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.GACHITA_VERIFY_API_URL || 'http://127.0.0.1:18080';
const stateFile = path.join(__dirname, '..', '.expo', 'mysql-persistence.json');
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Only a local verification server is supported.');
let cookie = '';
async function request(method, endpoint, body, expected = 200) {
  const headers = { 'Content-Type': 'application/json' };
  if (method !== 'GET') {
    const csrf = await request('GET', '/api/v1/auth/csrf');
    headers[csrf.headerName] = csrf.token;
  }
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(base + endpoint, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  for (const entry of response.headers.getSetCookie()) if (entry.startsWith('JSESSIONID=')) cookie = entry.split(';')[0];
  const result = await response.json();
  assert.equal(response.status, expected, endpoint + ': ' + JSON.stringify(result.error));
  return result.data;
}
function departure(hour, minute) {
  const date = new Date(Date.now() + 9 * 3600000);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 2, hour - 9, minute)).toISOString();
}
async function verifySearch(state) {
  for (const [i, period] of ['MORNING', 'AFTERNOON', 'EVENING'].entries()) {
    const query = new URLSearchParams({ origin: state.origin, destination: state.destination, period });
    const rooms = await request('GET', '/api/v1/rooms?' + query);
    assert.deepEqual(rooms.map(room => room.roomId), [state.roomIds[i]]);
  }
  console.log('PASS: MySQL origin/destination and Korean time boundaries (11:59, 12:00, 18:00)');
}
async function main() {
  const mode = process.argv[2];
  if (!['prepare', 'check'].includes(mode)) throw Error('Usage: node scripts/check-mysql-persistence.cjs prepare|check');
  let state;
  if (mode === 'prepare') {
    const suffix = Date.now().toString(36);
    state = { username: 'persist_' + suffix, origin: '검증출발' + suffix, destination: '검증도착' + suffix, roomIds: [] };
    const user = await request('POST', '/api/v1/auth/signup', { username: state.username, nickname: 'MySQL검증', password: 'PersistenceTest123!' }, 201);
    state.userId = user.userId;
    await request('POST', '/api/v1/auth/login', { username: state.username, password: 'PersistenceTest123!' });
    for (const [hour, minute] of [[11, 59], [12, 0], [18, 0]]) {
      const room = await request('POST', '/api/v1/rooms', { origin: { name: state.origin, latitude: 37.2657, longitude: 127.0007 }, destination: { name: state.destination, latitude: 37.4979, longitude: 127.0276 }, departureAt: departure(hour, minute), capacity: 4 }, 201);
      state.roomIds.push(room.roomId);
    }
    await verifySearch(state);
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    console.log('PASS: test account and three rooms saved through the real API');
  } else {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const user = await request('POST', '/api/v1/auth/login', { username: state.username, password: 'PersistenceTest123!' });
    assert.equal(user.userId, state.userId);
    assert.equal((await request('GET', '/api/v1/users/me')).username, state.username);
    const rooms = await request('GET', '/api/v1/rooms/mine');
    for (const roomId of state.roomIds) {
      assert.ok(rooms.some(room => room.roomId === roomId));
      assert.equal((await request('GET', '/api/v1/rooms/' + roomId)).hostUserId, state.userId);
    }
    await verifySearch(state);
    fs.writeFileSync(path.join(path.dirname(stateFile), 'mysql-persistence-report.json'), JSON.stringify({ success: true, verifiedAt: new Date().toISOString(), userId: state.userId, roomIds: state.roomIds, checks: ['MySQL dev startup and JPA schema validation', 'signup', 'room creation', 'origin and KST period search', 'login and records after full JVM restart'] }, null, 2));
    console.log('PASS: account and all rooms persist after a full server process restart');
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
