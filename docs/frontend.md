# Frontend Integration Guide — NodePulse

This document explains how the frontend should integrate with the NodePulse backend.
Place this file in the `docs/` folder so frontend engineers can find API expectations, auth flows, and sample requests.

## Base URL
- During development: `http://localhost:4000/api/v1`
- In production: your deployed NodePulse API base URL (e.g., `https://api.nodepulse.example/api/v1`)

## Authentication
- NodePulse supports email/password auth (JWT). Endpoints:
  - `POST /api/v1/auth/register` — body: `{ email, password, name? }`. Returns `{ token, user }`.
  - `POST /api/v1/auth/login` — body: `{ email, password }`. Returns `{ token, user }`.

- Include JWT in requests as `Authorization: Bearer <token>`.

- Wallet verification (to link wallets to users) uses signature verification:
  - `POST /api/v1/auth/wallet/verify` — body: `{ address, message, signature }`.
  - If logged-in, this will attach the wallet to the user. If not, it returns success and the client may claim later.

## Nodes & Sidecar
- Register a node (authenticated): `POST /api/v1/nodes` — body: `{ nodeId, walletAddress, name, hardware? }`.
- Ingest metrics (sidecar or client): `POST /api/v1/nodes/:nodeId/metrics` — accepts a single metric object or an array.
  - Sidecar should authenticate via API key (future) or wallet-signed flow. Currently the endpoint accepts payloads; backend will validate keys when configured.

Example metrics payload:

```json
{
  "timestamp": "2025-12-04T12:00:00Z",
  "cpu": { "usagePct": 12 },
  "memory": { "totalMB": 32000, "usedMB": 12345 },
  "gpus": [ { "index": 0, "utilizationPct": 45, "temperatureC": 70 } ],
  "uptimeSeconds": 3600
}
```

## Jobs and Payouts
- List payouts for authenticated user: `GET /api/v1/payouts`.
- List jobs for a wallet: `GET /api/v1/jobs?wallet=0x...` (future; jobs model exists server-side).

## Dashboard endpoints
- Node metrics: `GET /api/v1/stats/nodes/:nodeId?from=...&to=...`
- Dashboard summary: `GET /api/v1/stats/dashboard/summary`

## CORS and Local Development
- During local development, enable CORS in the frontend to call `http://localhost:4000`. If hosting frontend separately, ensure CORS is configured on the server (not included in scaffold yet; frontend devs can use a proxy during dev).

## Example: Link wallet flow (frontend)
1. Generate a challenge message from the server (not implemented in scaffold; generate client-side nonce), or use a known message.
2. Ask the user to sign the message with their wallet (e.g., MetaMask `personal_sign`).
3. Send `POST /api/v1/auth/wallet/verify` with `{ address, message, signature }`.
4. If user is logged in, the wallet will be attached to their account.

## Notes for Frontend Engineers
- All endpoints return JSON with `success: true/false` and relevant data in the current scaffold.
- In production, the server expects environment variables to be set for secrets and RPC endpoints; frontend should not include secrets.
- If you need additional endpoints (jobs by wallet, aggregated earnings series), open an issue or request the routes — they can be added in the `src/routes` and `src/controllers` folders.

---
For more backend development notes and architecture, see `README.md` in the repository root.
