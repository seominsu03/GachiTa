const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Execute only the plain TypeScript auth modules; no React Native runtime or new test dependency.
function loadAuthModules(fetch) {
  const cache = new Map();
  const environment = { EXPO_PUBLIC_API_URL: 'https://api.example.test' };
  const context = vm.createContext({ fetch, process: { env: environment }, AbortController, setTimeout, clearTimeout });
  function load(relativePath) {
    const filename = path.join(__dirname, '..', 'src', `${relativePath}.ts`);
    if (cache.has(filename)) return cache.get(filename);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const exports = {};
    cache.set(filename, exports);
    const execute = vm.runInContext(`(function(exports, require) { ${source}\n})`, context, { filename });
    execute(exports, id => {
      assert.ok(id.startsWith('@/'), `Unexpected dependency: ${id}`);
      return load(id.slice(2));
    });
    return exports;
  }
  return { load, environment };
}

const success = data => ({ ok: true, status: 200, json: async () => ({ success: true, data, message: 'OK' }) });
const failure = (status, code) => ({ ok: false, status, json: async () => ({ success: false, error: { code, message: code } }) });

test('signup validation checks confirmation and identifier/password boundaries', () => {
  const { load } = loadAuthModules();
  const { validateSignup } = load('features/auth/validation');
  const valid = { username: 'rider_01', nickname: '같이타', password: 'Password123!' };
  assert.equal(validateSignup(valid, valid.password), null);
  for (const change of [{ username: '한글아이디' }, { username: 'abc' }, { nickname: ' ' }, { password: '1234567' }, { password: 'pass word123' }, { password: 'x'.repeat(65) }]) {
    assert.equal(typeof validateSignup({ ...valid, ...change }, valid.password), 'string');
  }
  assert.equal(typeof validateSignup(valid, 'mismatch'), 'string');
});

test('CSRF rejection refreshes the token once and includes session credentials', async () => {
  const calls = [];
  let token = 0;
  const { load } = loadAuthModules(async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/csrf')) return success({ token: `token-${++token}`, headerName: 'X-CSRF-TOKEN' });
    return token === 1 ? failure(403, 'CSRF_INVALID') : success({ userId: 1 });
  });
  const { apiRequest } = load('services/apiClient');
  const result = await apiRequest('/api/v1/auth/signup', { method: 'POST', body: { username: 'rider' } });
  assert.equal(result.userId, 1);
  assert.equal(calls.length, 4);
  assert.equal(calls[3].options.headers['X-CSRF-TOKEN'], 'token-2');
  assert.ok(calls.every(call => call.options.credentials === 'include'));
});

test('credential and network failures are not replayed', async () => {
  let attempts = 0;
  const { load } = loadAuthModules(async url => {
    if (url.endsWith('/csrf')) return success({ token: 'token', headerName: 'X-CSRF-TOKEN' });
    attempts++;
    return failure(401, 'INVALID_CREDENTIALS');
  });
  await assert.rejects(load('features/auth/api').login({ username: 'rider', password: 'wrong' }), error => error.code === 'INVALID_CREDENTIALS');
  assert.equal(attempts, 1);
  const offline = loadAuthModules(async () => { throw new Error('offline'); });
  await assert.rejects(offline.load('features/auth/api').getMyProfile(), error => error.code === 'NETWORK_ERROR');
});

test('login clears the old CSRF token and malformed responses report an error', async () => {
  const { load } = loadAuthModules(async () => success({ userId: 1, username: 'rider', nickname: '같이타' }));
  const { authStorage } = load('services/authStorage');
  authStorage.setCsrfToken({ token: 'old', headerName: 'X-CSRF-TOKEN' });
  await load('features/auth/api').login({ username: 'rider', password: 'Password123!' });
  assert.equal(authStorage.getCsrfToken(), null);
  const malformed = loadAuthModules(async () => ({ ok: false, status: 502, json: async () => { throw new Error('HTML'); } }));
  await assert.rejects(malformed.load('features/auth/api').getMyProfile(), error => error.code === 'INVALID_RESPONSE');
});

test('signup validates added name and phone fields while retaining legacy input compatibility', () => {
  const { load } = loadAuthModules(); const { validateSignup } = load('features/auth/validation');
  const input = { username: 'rider_01', nickname: '같이타', password: 'Password123!', name: '홍길동', phoneNumber: '010-1234-5678' };
  assert.equal(validateSignup(input, input.password), null);
  assert.equal(typeof validateSignup({ ...input, name: ' ' }, input.password), 'string');
  assert.equal(typeof validateSignup({ ...input, phoneNumber: '1234' }, input.password), 'string');
});

test('settlement uses integer division and enforces safe input boundaries', () => {
  const { load } = loadAuthModules(); const { calculateSettlement } = load('features/settlement/calculations');
  const bill = calculateSettlement(10003, 4);
  assert.equal(bill.farePerPerson, 2500); assert.equal(bill.remainderFare, 3);
  assert.equal(bill.farePerPerson * bill.participantCount + bill.remainderFare, bill.totalFare);
  for (const [fare, count] of [[-1, 4], [0, 4], [1.5, 4], [10000001, 4], [24000, 0], [24000, 5]]) assert.throws(() => calculateSettlement(fare, count));
});
