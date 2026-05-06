# Contributing

Thanks for helping improve `telebirr_plus`.

## Local Setup

```bash
npm install
npm test
```

Use `.env.example` as the template for local testing. Never commit merchant credentials, App Secret values, private keys, or real notify URLs that expose private infrastructure.

## Pull Requests

- Keep public API changes small and documented.
- Add tests for signing, request creation, and response normalization.
- Test with Telebirr testbed credentials before recommending a release.
