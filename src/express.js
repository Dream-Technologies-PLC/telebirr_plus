const express = require('express');
const { TelebirrApiError, TelebirrConfigError } = require('./errors');
const { TelebirrInAppClient } = require('./client');

function statusForError(error) {
  if (error instanceof TelebirrConfigError) {
    return 400;
  }

  if (error instanceof TelebirrApiError) {
    return error.status && error.status >= 400 && error.status < 600 ? error.status : 502;
  }

  return 500;
}

function errorBody(error) {
  return {
    success: false,
    message: error.message,
    code: error.code,
    raw: error.raw,
  };
}

function createTelebirrRouter(clientOrConfig, options = {}) {
  const router = express.Router();
  const client = clientOrConfig instanceof TelebirrInAppClient
    ? clientOrConfig
    : new TelebirrInAppClient(clientOrConfig);

  router.post('/create-order', async (req, res) => {
    try {
      const result = await client.createOrder({
        title: req.body.title,
        amount: req.body.amount,
        merchantOrderId: req.body.merchantOrderId,
        notifyUrl: req.body.notifyUrl,
        redirectUrl: req.body.redirectUrl,
        callbackInfo: req.body.callbackInfo,
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(statusForError(error)).json(errorBody(error));
    }
  });

  router.post('/query-order', async (req, res) => {
    try {
      const result = await client.queryOrder({
        merchantOrderId: req.body.merchantOrderId,
      });

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(statusForError(error)).json(errorBody(error));
    }
  });

  router.post('/notify', async (req, res) => {
    if (typeof options.onNotify === 'function') {
      await options.onNotify(req.body, req);
    }

    res.json({ received: true });
  });

  return router;
}

module.exports = {
  createTelebirrRouter,
};
