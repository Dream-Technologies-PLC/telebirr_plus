const assert = require('node:assert/strict');
const test = require('node:test');
const { asAmount } = require('../src/client');
const {
  buildSignString,
  flattenSignableFields,
  normalizePrivateKey,
} = require('../src');

test('buildSignString sorts root and biz_content fields and excludes signature fields', () => {
  const payload = {
    sign: 'ignored',
    sign_type: 'ignored',
    timestamp: '1700000000',
    nonce_str: 'ABC',
    method: 'payment.preorder',
    version: '1.0',
    biz_content: {
      title: 'Ride',
      appid: 'app-1',
      merch_code: '772770',
      empty: '',
      sign: 'ignored',
    },
  };

  assert.deepEqual(flattenSignableFields(payload), {
    timestamp: '1700000000',
    nonce_str: 'ABC',
    method: 'payment.preorder',
    version: '1.0',
    title: 'Ride',
    appid: 'app-1',
    merch_code: '772770',
  });

  assert.equal(
    buildSignString(payload),
    'appid=app-1&merch_code=772770&method=payment.preorder&nonce_str=ABC&timestamp=1700000000&title=Ride&version=1.0',
  );
});

test('asAmount formats positive values to two decimals', () => {
  assert.equal(asAmount('12'), '12.00');
  assert.equal(asAmount(12.5), '12.50');
  assert.throws(() => asAmount(0), /positive number/);
});

test('normalizePrivateKey wraps raw base64 private key text', () => {
  assert.equal(
    normalizePrivateKey('ABCDEF'),
    '-----BEGIN PRIVATE KEY-----\nABCDEF\n-----END PRIVATE KEY-----',
  );
});
