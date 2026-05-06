const { Agent } = require('undici');
const { TelebirrApiError, TelebirrConfigError } = require('./errors');
const { createNonce, signPayload, timestampSeconds } = require('./signature');

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function asAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new TelebirrConfigError('amount must be a positive number.');
  }
  return amount.toFixed(2);
}

function createMerchantOrderId() {
  return Date.now().toString();
}

function getResponseMessage(raw) {
  return raw?.msg || raw?.message || raw?.errorMsg || raw?.result || 'Telebirr request failed.';
}

function isSuccessCode(raw) {
  return String(raw?.code) === '0' || raw?.result === 'SUCCESS';
}

function createDispatcher(verifySsl) {
  if (verifySsl !== false) {
    return undefined;
  }

  return new Agent({
    connect: {
      rejectUnauthorized: false,
    },
  });
}

class TelebirrInAppClient {
  constructor(config) {
    this.config = {
      timeoutExpress: '120m',
      payeeType: '3000',
      verifySsl: true,
      ...config,
    };

    this.dispatcher = createDispatcher(this.config.verifySsl);

    for (const key of ['baseUrl', 'fabricAppId', 'appSecret', 'merchantAppId', 'shortCode', 'privateKey']) {
      if (!this.config[key]) {
        throw new TelebirrConfigError(`${key} is required.`);
      }
    }
  }

  async applyFabricToken() {
    const raw = await this.#post('/payment/v1/token', {
      appSecret: this.config.appSecret,
    });

    const token = raw?.token || raw?.biz_content?.token;
    if (!token) {
      throw new TelebirrApiError('Telebirr did not return a fabric token.', {
        code: raw?.code,
        raw,
      });
    }

    return { token, raw };
  }

  async createOrder(input) {
    const { token } = await this.applyFabricToken();
    const merchantOrderId = input.merchantOrderId || createMerchantOrderId();
    const request = this.#createOrderPayload({
      ...input,
      merchantOrderId,
    });

    const raw = await this.#post('/payment/v1/inapp/createOrder', request, token);
    const receiveCode = raw?.biz_content?.receiveCode || raw?.biz_content?.receive_code;
    const success = isSuccessCode(raw) || Boolean(receiveCode);

    return {
      success,
      code: raw?.code,
      message: success ? 'Order created.' : getResponseMessage(raw),
      merchantOrderId,
      receiveCode,
      raw,
    };
  }

  async queryOrder(input) {
    if (!input?.merchantOrderId) {
      throw new TelebirrConfigError('merchantOrderId is required.');
    }

    const { token } = await this.applyFabricToken();
    const request = this.#queryOrderPayload(input.merchantOrderId);
    const raw = await this.#post('/payment/v1/merchant/queryOrder', request, token);

    return {
      success: isSuccessCode(raw),
      code: raw?.code,
      message: getResponseMessage(raw),
      merchantOrderId: input.merchantOrderId,
      raw,
    };
  }

  #basePayload(method) {
    return {
      timestamp: timestampSeconds(),
      nonce_str: createNonce(),
      method,
      version: '1.0',
    };
  }

  #createOrderPayload(input) {
    if (!input?.title) {
      throw new TelebirrConfigError('title is required.');
    }

    const payload = {
      ...this.#basePayload('payment.preorder'),
      biz_content: {
        notify_url: input.notifyUrl || this.config.notifyUrl,
        redirect_url: input.redirectUrl || this.config.redirectUrl,
        trade_type: 'InApp',
        appid: this.config.merchantAppId,
        merch_code: this.config.shortCode,
        merch_order_id: input.merchantOrderId,
        title: input.title,
        total_amount: asAmount(input.amount),
        trans_currency: 'ETB',
        timeout_express: input.timeoutExpress || this.config.timeoutExpress,
        payee_identifier: this.config.shortCode,
        payee_identifier_type: '04',
        payee_type: input.payeeType || this.config.payeeType,
        callback_info: input.callbackInfo,
      },
    };

    payload.sign = signPayload(payload, this.config.privateKey);
    payload.sign_type = 'SHA256WithRSA';
    return payload;
  }

  #queryOrderPayload(merchantOrderId) {
    const payload = {
      ...this.#basePayload('payment.queryorder'),
      biz_content: {
        appid: this.config.merchantAppId,
        merch_code: this.config.shortCode,
        merch_order_id: merchantOrderId,
      },
    };

    payload.sign = signPayload(payload, this.config.privateKey);
    payload.sign_type = 'SHA256WithRSA';
    return payload;
  }

  async #post(path, body, fabricToken) {
    const response = await fetch(`${stripTrailingSlash(this.config.baseUrl)}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-APP-Key': this.config.fabricAppId,
        ...(fabricToken ? { Authorization: fabricToken } : {}),
      },
      ...(this.dispatcher ? { dispatcher: this.dispatcher } : {}),
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let raw;
    try {
      raw = text ? JSON.parse(text) : {};
    } catch (error) {
      throw new TelebirrApiError('Telebirr returned a non-JSON response.', {
        status: response.status,
        raw: text,
      });
    }

    if (!response.ok) {
      throw new TelebirrApiError(getResponseMessage(raw), {
        status: response.status,
        code: raw?.code,
        raw,
      });
    }

    return raw;
  }
}

module.exports = {
  TelebirrInAppClient,
  asAmount,
  createMerchantOrderId,
};
