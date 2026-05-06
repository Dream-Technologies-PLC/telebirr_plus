require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');
const {
  TelebirrInAppClient,
  createTelebirrRouter,
  loadConfigFromEnv,
} = require('../../src');

const app = express();
const port = Number(process.env.PORT || 3000);
const config = loadConfigFromEnv();
const client = new TelebirrInAppClient(config);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web')));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/demo-config', (req, res) => {
  res.json({
    environment: config.environment,
    merchantAppId: config.merchantAppId,
    shortCode: config.shortCode,
    createOrderUrl: `http://localhost:${port}/api/telebirr/create-order`,
    queryOrderUrl: `http://localhost:${port}/api/telebirr/query-order`,
  });
});

app.use('/api/telebirr', createTelebirrRouter(client, {
  onNotify: async (payload) => {
    console.log('Telebirr notify_url payload:', payload);
  },
}));

app.listen(port, () => {
  console.log(`Telebirr backend example running on http://localhost:${port}`);
  console.log(`Test website running on http://localhost:${port}`);
});
