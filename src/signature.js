const crypto = require('crypto');

const EXCLUDED_SIGN_FIELDS = new Set([
  'sign',
  'sign_type',
  'header',
  'refund_info',
  'openType',
  'raw_request',
  'biz_content',
]);

function createNonce(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();
}

function timestampSeconds(date = new Date()) {
  return Math.floor(date.getTime() / 1000).toString();
}

function isSignableValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function flattenSignableFields(payload) {
  const fieldMap = {};

  for (const [key, value] of Object.entries(payload || {})) {
    if (!EXCLUDED_SIGN_FIELDS.has(key) && isSignableValue(value)) {
      fieldMap[key] = value;
    }
  }

  for (const [key, value] of Object.entries(payload?.biz_content || {})) {
    if (!EXCLUDED_SIGN_FIELDS.has(key) && isSignableValue(value)) {
      fieldMap[key] = value;
    }
  }

  return fieldMap;
}

function buildSignString(payload) {
  const fields = flattenSignableFields(payload);
  return Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('&');
}

function signString(text, privateKey) {
  const signature = crypto.sign('sha256', Buffer.from(text), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return signature.toString('base64');
}

function signPayload(payload, privateKey) {
  return signString(buildSignString(payload), privateKey);
}

module.exports = {
  EXCLUDED_SIGN_FIELDS,
  buildSignString,
  createNonce,
  flattenSignableFields,
  signPayload,
  signString,
  timestampSeconds,
};
