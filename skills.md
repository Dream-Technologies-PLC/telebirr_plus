# skills.md

Use this file as AI coding instructions when integrating or modifying
`telebirr_plus`.

## Package Role

This Node.js package is a secure backend package for Telebirr InApp Purchase.
It is designed to pair with the Flutter package
`telebirr_inapp_purchase_plus`.

It owns:

- Fabric Token requests
- RSA signing
- Create Order requests
- Query Order requests
- notify_url endpoint helpers
- Backend-only Telebirr credentials

Flutter must only receive `receiveCode` and safe order status fields.

## Install Flow

```bash
npm install telebirr_plus express cors dotenv
```

Required `.env` values:

```env
TELEBIRR_ENV=test
TELEBIRR_FABRIC_APP_ID=your_fabric_app_id
TELEBIRR_APP_SECRET=your_app_secret
TELEBIRR_MERCHANT_APP_ID=your_merchant_app_id
TELEBIRR_SHORT_CODE=your_business_short_code
TELEBIRR_PRIVATE_KEY_PATH=./keys/private_key.pem
TELEBIRR_NOTIFY_URL=https://yourdomain.com/api/telebirr/notify
TELEBIRR_VERIFY_SSL=true
```

## Express Usage

```js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const {
  TelebirrInAppClient,
  createTelebirrRouter,
  loadConfigFromEnv,
} = require('telebirr_plus');

const app = express();
const client = new TelebirrInAppClient(loadConfigFromEnv());

app.use(cors());
app.use(express.json());
app.use('/api/telebirr', createTelebirrRouter(client));

app.listen(3000);
```

Built-in routes:

```text
POST /api/telebirr/create-order
POST /api/telebirr/query-order
POST /api/telebirr/notify
```

## Flutter Pairing

Flutter calls:

```text
POST /api/telebirr/create-order
```

Backend returns:

```json
{
  "success": true,
  "merchantOrderId": "ORDER_ID",
  "receiveCode": "TELEBIRR$BUYGOODS$YOUR_SHORT_CODE$12.00$PREPAY_ID$120m"
}
```

Flutter starts payment:

```dart
await Telebirr.initialize(
  appId: 'YOUR_MERCHANT_APP_ID',
  shortCode: 'YOUR_SHORT_CODE',
  returnScheme: 'yourappscheme',
  environment: TelebirrEnvironment.test,
);

final result = await Telebirr.pay(receiveCode: receiveCodeFromBackend);
```

## Security Rules

- Never commit `.env` with real credentials.
- Never commit private keys.
- Never expose App Secret, private key, or Fabric Token to Flutter.
- Store private keys outside public/static folders.
- Use `TELEBIRR_VERIFY_SSL=true` in production.
- Use HTTPS for `TELEBIRR_NOTIFY_URL` in production.
- Confirm final payment on the backend using `notify_url` and/or `queryOrder`.

## Coding Rules

- Keep signing deterministic and tested.
- Keep amount formatting to two decimals.
- Keep response shape stable for Flutter:
  `success`, `merchantOrderId`, `receiveCode`, `code`, `message`, `raw`.
- Do not log secrets.
- Do not swallow Telebirr error codes such as `60200098`.

## Testing Checklist

Before release:

```bash
npm test
npm pack --dry-run
```

Scan for secrets:

```bash
rg "APP_SECRET|PRIVATE_KEY|MIIE|TELEBIRR_APP_SECRET|real_merchant"
```

## npm Release

Versions come from `package.json`.

```bash
npm version patch
git push origin main --tags
```

Package:

```text
telebirr_plus
```

