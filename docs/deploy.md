# Deployment and Testing Guide — NodePulse

This document covers deployment options (Docker Compose and Kubernetes), required environment variables, how to set them securely, and step-by-step testing instructions for each API route with example `curl` commands and expected responses.

**Security note:** Do NOT commit real secrets to the repository. Store secrets in environment variables, Docker secrets, or your cloud provider's secrets manager.

## Required environment variables
- `NODE_ENV` - `production` or `development` (default `development`)
- `PORT` - server port (default `4000`)
- `MONGO_URI` - MongoDB connection string (required in production)
- `JWT_SECRET` - secret for signing JWTs (required in production)
- `CHAIN_RPC_URL` - Alchemy/Infura RPC endpoint for the Gensyn chain
- `CHAIN_CONTRACT_ADDRESS` - Gensyn contract address (default provided in code)
- `GENSYN_ABI_PATH` - optional path to ABI JSON for decoding events
- `CHAIN_EVENT_NAMES` - optional comma-separated event names (e.g., `JobCompleted,RewardPaid`)
- `SIDECAR_KEY_SECRET` - secret used to sign sidecar API keys
- `REDIS_URL` - optional Redis URL for future queue integration

Set these in a `.env` file for development (see `.env.example`). In production, use your host's secret mechanism.

## Deploy with Docker Compose (local)

1. Copy `.env.example` to `.env` and fill values (do not commit `.env`).
2. Build and run:

```bash
docker compose up --build -d
```

3. Verify logs:

```bash
docker compose logs -f nodepulse
```

## Deploy to Kubernetes (production)

1. Create Kubernetes secret (values must be base64-encoded) or use `kubectl create secret generic`:

```bash
kubectl create secret generic nodepulse-secrets \
  --from-literal=JWT_SECRET='your_jwt_secret' \
  --from-literal=MONGO_URI='mongodb://user:pass@mongo:27017/nodepulse' \
  --from-literal=CHAIN_RPC_URL='https://...'
```

2. Apply manifests:

```bash
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

3. Expose via Ingress or LoadBalancer depending on cluster.

## CI/CD
- A sample GitHub Actions workflow is provided in `.github/workflows/ci.yml` to run tests and build an image. Configure registry secrets and extend workflow to push images to your container registry.

## How to test API routes (examples)

Assume base URL: `http://localhost:4000/api/v1` (adjust for your host).

1) Health

Request:
```bash
curl -s http://localhost:4000/healthz | jq
```

Expected response:
```json
{ "status": "ok", "service": "NodePulse" }
```

2) Register user

Request:
```bash
curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"secret123","name":"Alice"}' | jq
```

Expected response example:
```json
{
  "success": true,
  "user": { "id": "<userId>", "email": "alice@example.com", "name": "Alice" },
  "token": "<jwt>"
}
```

3) Login

Request:
```bash
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"secret123"}' | jq
```

Expected response:
```json
{ "success": true, "token": "<jwt>", "user": { ... } }
```

4) Link wallet (signature verification)

- Frontend obtains `message` (nonce) and `signature` using wallet. Current scaffold expects `{ address, message, signature }`.

Request (example):
```bash
curl -s -X POST http://localhost:4000/api/v1/auth/wallet/verify \
  -H "Authorization: Bearer <jwt>" \
  -H 'Content-Type: application/json' \
  -d '{"address":"0xabc...","message":"Sign this message","signature":"0xsig..."}' | jq
```

Expected response (if verified and linked):
```json
{ "success": true, "address": "0xabc...", "linked": true }
```

5) Register node (authenticated)

Request:
```bash
curl -s -X POST http://localhost:4000/api/v1/nodes \
  -H "Authorization: Bearer <jwt>" \
  -H 'Content-Type: application/json' \
  -d '{"nodeId":"node-1","walletAddress":"0xabc...","name":"GPU-1"}' | jq
```

Expected response:
```json
{ "success": true, "node": { "nodeId": "node-1", "walletAddress": "0xabc...", ... } }
```

6) Ingest metrics (sidecar)

Request (sidecar sends metrics; API key auth will be added later):
```bash
curl -s -X POST http://localhost:4000/api/v1/nodes/node-1/metrics \
  -H 'Content-Type: application/json' \
  -d '{"timestamp":"2025-12-04T12:00:00Z","cpu":{"usagePct":10},"memory":{"totalMB":32000,"usedMB":12000},"gpus":[{"index":0,"utilizationPct":45}],"uptimeSeconds":3600}' | jq
```

Expected response:
```json
{ "success": true, "inserted": 1 }
```

7) Get node metrics

Request:
```bash
curl -s -H "Authorization: Bearer <jwt>" "http://localhost:4000/api/v1/stats/nodes/node-1?from=2025-12-03T00:00:00Z&to=2025-12-05T00:00:00Z" | jq
```

Expected response: JSON object with `series` array of metric entries.

8) List payouts

Request:
```bash
curl -s -H "Authorization: Bearer <jwt>" http://localhost:4000/api/v1/payouts | jq
```

Expected response: array of payout documents

## ABI & Chain decoding (fetching via Alchemy)
- To fetch the ABI programmatically using Alchemy, set `CHAIN_RPC_URL` to your Alchemy RPC URL (it contains the API key). NodePulse can then fetch the ABI (or you can place ABI JSON at `config/gensyn.abi.json` and set `GENSYN_ABI_PATH`).

## Testing chain decoding locally
1. Place ABI at `config/gensyn.abi.json` or set `GENSYN_ABI_PATH` env var.
2. Configure `CHAIN_EVENT_NAMES=JobCompleted,RewardPaid` and `CHAIN_RPC_URL` to point to Alchemy.
3. Run server and monitor logs; `chainWatcher` will poll and upsert Job/Payout documents.

## Troubleshooting
- If chain features are disabled, check `CHAIN_RPC_URL` and `CHAIN_CONTRACT_ADDRESS`.
- Use logs to inspect decoding errors: `docker compose logs -f nodepulse` or `kubectl logs -l app=nodepulse`.
