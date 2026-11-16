// Creates disposable demo accounts and one room on a running LOCAL backend.
// Recommended: isolated in-memory test profile (see docs/RUN_GUIDE.md).
const assert = require('node:assert/strict');
const base = process.env.GACHITA_SMOKE_API_URL || 'http://localhost:8080';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname)) throw Error('Use a local backend for smoke testing.');

function session() {
  let cookie = '';
  async function request(method, endpoint, body, expected = 200) {
    const headers = { 'Content-Type': 'application/json', Origin: 'http://localhost:8081' };
    if (method !== 'GET') {
      const csrf = await request('GET', '/api/v1/auth/csrf');
      headers[csrf.headerName] = csrf.token;
    }
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(base + endpoint, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    for (const entry of response.headers.getSetCookie()) if (entry.startsWith('JSESSIONID=')) cookie = entry.split(';')[0];
    const result = await response.json();
    assert.equal(response.status, expected, method + ' ' + endpoint + ': ' + JSON.stringify(result));
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:8081');
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
    return result.data ?? result.error;
  }
  return request;
}

async function main() {
  const suffix = Date.now().toString(36);
  const host = session(), rider = session(), anonymous = session();
  const accounts = [host, rider];
  const profiles = [];
  for (const [i, request] of accounts.entries()) {
    const account = { username: 'smoke' + i + '_' + suffix, nickname: i ? '테스트동승자' : '테스트방장', password: 'SmokeTest123!' };
    await request('POST', '/api/v1/auth/signup', account, 201);
    profiles.push(await request('POST', '/api/v1/auth/login', account));
    assert.equal((await request('GET', '/api/v1/users/me')).username, account.username);
  }
  console.log('PASS: signup, login, session cookies, CSRF, profile and credential CORS');
  await anonymous('GET', '/api/v1/rooms/mine', undefined, 401);
  const room = await host('POST', '/api/v1/rooms', {
    origin: { name: '수원역', latitude: 37.2657, longitude: 127.0007 },
    destination: { name: '강남역', latitude: 37.4979, longitude: 127.0276 },
    departureAt: new Date(Date.now() + 86400000).toISOString(), capacity: 2,
  }, 201);
  const roomPath = '/api/v1/rooms/' + room.roomId;
  assert.ok((await rider('GET', '/api/v1/rooms?destination=' + encodeURIComponent('강남'))).some(r => r.roomId === room.roomId));
  assert.equal((await rider('GET', '/api/v1/rooms?destination=not_a_destination')).length, 0);
  assert.equal(room.host.phoneNumber, undefined);
  console.log('PASS: room creation, destination search and public profile privacy');
  let application = await rider('POST', roomPath + '/participations', undefined, 201);
  await rider('POST', roomPath + '/participations', undefined, 409);
  const memberPath = roomPath + '/participations/' + application.participationId;
  await rider('POST', memberPath + '/approve', undefined, 403);
  await host('POST', memberPath + '/reject');
  assert.ok(!(await rider('GET', '/api/v1/rooms/mine')).some(r => r.roomId === room.roomId));
  application = await rider('POST', roomPath + '/participations', undefined, 201);
  await rider('POST', roomPath + '/participations/' + application.participationId + '/cancel');
  application = await rider('POST', roomPath + '/participations', undefined, 201);
  await host('POST', roomPath + '/participations/' + application.participationId + '/approve');
  assert.equal((await rider('GET', roomPath)).participantCount, 2);
  for (const request of accounts) assert.ok((await request('GET', '/api/v1/rooms/mine')).some(r => r.roomId === room.roomId));
  console.log('PASS: request, duplicate prevention, host-only approval, rejection, cancellation and my rooms');
  await host('POST', roomPath + '/settlement', { totalFare: 10003 }, 409);
  console.log('PASS: settlement is blocked before ride completion');
  await rider('POST', '/api/v1/auth/logout');
  await rider('GET', '/api/v1/users/me', undefined, 401);
  console.log('PASS: logout invalidates session');
  console.log(JSON.stringify({ roomId: room.roomId, demoAccounts: profiles.map(p => p.username) }));
  console.log('Ride completion and receipt completion are tested in backend integration tests using a SETTLING fixture, not by bypassing production APIs.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
