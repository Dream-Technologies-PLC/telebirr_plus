const { TelebirrInAppClient, asAmount, createMerchantOrderId } = require('./client');
const { baseUrlForEnvironment, loadConfigFromEnv, normalizePrivateKey } = require('./config');
const { TelebirrApiError, TelebirrConfigError } = require('./errors');
const {
  buildSignString,
  createNonce,
  flattenSignableFields,
  signPayload,
  signString,
  timestampSeconds,
} = require('./signature');
const { createTelebirrRouter } = require('./express');

module.exports = {
  TelebirrApiError,
  TelebirrConfigError,
  TelebirrInAppClient,
  asAmount,
  baseUrlForEnvironment,
  buildSignString,
  createMerchantOrderId,
  createNonce,
  createTelebirrRouter,
  flattenSignableFields,
  loadConfigFromEnv,
  normalizePrivateKey,
  signPayload,
  signString,
  timestampSeconds,
};
