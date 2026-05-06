const fs = require('fs');
const path = require('path');
const { TelebirrConfigError } = require('./errors');

const TEST_BASE_URL = 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway';
const PRODUCTION_BASE_URL = 'https://telebirrappcube.ethiomobilemoney.et:38443/apiaccess/payment/gateway';

function baseUrlForEnvironment(environment = 'test') {
  if (environment === 'production') {
    return PRODUCTION_BASE_URL;
  }

  if (environment === 'test') {
    return TEST_BASE_URL;
  }

  throw new TelebirrConfigError('TELEBIRR_ENV must be "test" or "production".');
}

function normalizePrivateKey(value) {
  if (!value) {
    return value;
  }

  const trimmed = value.trim().replace(/\\n/g, '\n');
  if (trimmed.includes('BEGIN PRIVATE KEY') || trimmed.includes('BEGIN RSA PRIVATE KEY')) {
    return trimmed;
  }

  return `-----BEGIN PRIVATE KEY-----\n${trimmed.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
}

function readPrivateKey(env, cwd) {
  if (env.TELEBIRR_PRIVATE_KEY) {
    return normalizePrivateKey(env.TELEBIRR_PRIVATE_KEY);
  }

  if (!env.TELEBIRR_PRIVATE_KEY_PATH) {
    return undefined;
  }

  const keyPath = path.resolve(cwd, env.TELEBIRR_PRIVATE_KEY_PATH);
  if (!fs.existsSync(keyPath)) {
    throw new TelebirrConfigError(`Private key file was not found: ${keyPath}`);
  }

  return normalizePrivateKey(fs.readFileSync(keyPath, 'utf8'));
}

function requireValue(config, key, label) {
  if (!config[key]) {
    throw new TelebirrConfigError(`${label} is required. Set ${key} in your environment.`);
  }
}

function loadConfigFromEnv(env = process.env, options = {}) {
  const cwd = options.cwd || process.cwd();
  const environment = env.TELEBIRR_ENV || 'test';
  const config = {
    environment,
    baseUrl: env.TELEBIRR_BASE_URL || baseUrlForEnvironment(environment),
    fabricAppId: env.TELEBIRR_FABRIC_APP_ID,
    appSecret: env.TELEBIRR_APP_SECRET,
    merchantAppId: env.TELEBIRR_MERCHANT_APP_ID,
    shortCode: env.TELEBIRR_SHORT_CODE,
    privateKey: readPrivateKey(env, cwd),
    notifyUrl: env.TELEBIRR_NOTIFY_URL,
    redirectUrl: env.TELEBIRR_REDIRECT_URL,
    timeoutExpress: env.TELEBIRR_TIMEOUT || '120m',
    payeeType: env.TELEBIRR_PAYEE_TYPE || '3000',
    verifySsl: env.TELEBIRR_VERIFY_SSL !== 'false',
  };

  requireValue(config, 'fabricAppId', 'Fabric App ID');
  requireValue(config, 'appSecret', 'App Secret');
  requireValue(config, 'merchantAppId', 'Merchant App ID');
  requireValue(config, 'shortCode', 'Short code');
  requireValue(config, 'privateKey', 'Private key');

  return config;
}

module.exports = {
  PRODUCTION_BASE_URL,
  TEST_BASE_URL,
  baseUrlForEnvironment,
  loadConfigFromEnv,
  normalizePrivateKey,
};
