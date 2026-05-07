# skills.md

## Best Package Description

`telebirr_plus` is the Node.js backend package for Telebirr InApp Purchase. Use
it inside an existing Node or Express backend to securely apply Fabric Token,
sign requests, create orders, receive notify callbacks, and return
`receiveCode` to a Flutter app.

Copy this file into an existing Node.js backend to guide an AI coding assistant
while adding Telebirr backend support with `telebirr_plus`.

This file is only for adding Telebirr payments to an existing Node.js backend.

## AI Must Ask First

Before changing code, ask the developer for these values:

- Target environment: `test` or `production`.
- Fabric App ID.
- Merchant App ID.
- Business Short Code.
- App Secret storage location.
- Private key file location.
- Public HTTPS notify URL for production.
- Existing order/payment model or collection names.
- Existing checkout route or controller.
- Whether the app uses Express or another Node framework.

Also confirm:

- Organization and product contract are approved in the Ethio Telecom developer portal.
- The private key is stored outside public/static folders.
- The backend will persist local order/payment status.
- Flutter will only receive `receiveCode` and safe order fields.

## Developer Actions Before AI Starts

The developer must:

- Add Telebirr credentials to `.env`, not source code.
- Place the private key in a backend-only path.
- Decide the local order/payment status names.
- Decide whether to use `createTelebirrRouter` or call `TelebirrInAppClient` from existing controllers.
- Provide the Flutter app team with the create-order URL.

## Goal

Add a secure Telebirr InApp backend to the current Node.js system.

The Node backend must:

1. Keep Telebirr credentials on the backend.
2. Create Telebirr InApp orders.
3. Return `receiveCode` to Flutter.
4. Receive Telebirr `notify_url` callbacks.
5. Query Telebirr when final payment confirmation is needed.

## Install

```bash
npm install telebirr_plus express cors dotenv
```

## Environment Variables

Add to the backend `.env`:

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

Store the private key outside public/static folders.

## Express Integration

If the app uses Express, add:

```js
require('dotenv').config();

const {
  TelebirrInAppClient,
  createTelebirrRouter,
  loadConfigFromEnv,
} = require('telebirr_plus');

const telebirr = new TelebirrInAppClient(loadConfigFromEnv());

app.use('/api/telebirr', createTelebirrRouter(telebirr, {
  onNotify: async (payload) => {
    // Update app-specific order/payment records here.
  },
}));
```

Built-in routes:

```text
POST /api/telebirr/create-order
POST /api/telebirr/query-order
POST /api/telebirr/notify
```

## Existing System Integration

If the Node app already has orders, checkout, rides, invoices, or payment
tables:

1. Create the local order first.
2. Call Telebirr create-order.
3. Save `merchantOrderId` with the local order.
4. Return `receiveCode` to Flutter.
5. On notify callback, update the local order status.
6. Use query-order when callback is delayed or payment state is unclear.

## Flutter Contract

Flutter calls:

```text
POST /api/telebirr/create-order
```

with:

```json
{
  "title": "Example order",
  "amount": "12.00"
}
```

Backend returns:

```json
{
  "success": true,
  "merchantOrderId": "ORDER_ID",
  "receiveCode": "TELEBIRR$BUYGOODS$YOUR_SHORT_CODE$12.00$PREPAY_ID$120m"
}
```

## Security Rules

- Do not expose App Secret or private key to Flutter.
- Do not commit `.env`.
- Do not commit private keys.
- Use HTTPS for production `TELEBIRR_NOTIFY_URL`.
- Use `TELEBIRR_VERIFY_SSL=true` in production.
- Do not trust Flutter callback as final payment confirmation.
- Confirm final payment through backend notify callback or query-order.

## Local Testing

Run Node:

```bash
npm start
```

From Flutter on a real phone, use LAN IP, not `localhost`:

```text
http://192.168.x.x:3000/api/telebirr/create-order
```
