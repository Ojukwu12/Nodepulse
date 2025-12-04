# NodePulse (backend)

NodePulse is a backend service to wrap and surface data from the Gensyn decentralized compute network.

This repository contains a modular Node.js + Express + MongoDB backend scaffold with placeholders and comments for integrating with Gensyn via JSON-RPC, ingesting sidecar metrics, and exposing APIs for a frontend dashboard.

Getting started

1. Copy `.env.example` to `.env` and fill required values. All sensitive values must come from environment variables. Do NOT hardcode secrets in code.

Required environment variables (minimum for production):

- `MONGO_URI` - MongoDB connection string (e.g. `mongodb://user:pass@host:27017/nodepulse`).
- `JWT_SECRET` - Secret used to sign JWT access tokens.
- `CHAIN_RPC_URL` - JSON-RPC endpoint for the EVM-compatible chain (Gensyn). Example: Infura or Alchemy URL.
- `CHAIN_CONTRACT_ADDRESS` - The on-chain Gensyn contract address to monitor.

Optional environment variables (useful in development/staging):

- `REDIS_URL` - Redis connection for background jobs/queues.
- `SIDECAR_KEY_SECRET` - Secret used to sign sidecar API keys.
- `SENTRY_DSN` - Sentry DSN for error tracking.

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Testing event decoding locally

1. The repo includes a small sample ABI at `config/gensyn.abi.json`. To test decoding without a real chain, run:

```bash
node scripts/test-decode.js
```

This script will synthesize two events (`JobCompleted` and `RewardPaid`) using the sample ABI and demonstrate that the decoder in `src/services/chainService.js` can parse them. It sets `GENSYN_ABI_PATH` automatically to `./config/gensyn.abi.json` if not set.

2. For real chain decoding, set `GENSYN_ABI_PATH` to your ABI file (or provide `CHAIN_EVENT_TOPICS`) and point `CHAIN_RPC_URL` to a JSON-RPC provider that has logs for your monitored contract. Then start the server and the `chainWatcher` will process logs.


Project structure

- `src/config` - DB, chain, logger config
- `src/middleware` - auth, request logging, error handling
- `src/models` - Mongoose models
- `src/routes` - Express routers
- `src/controllers` - Route handlers
- `src/services` - Business logic, chain integration
- `src/jobs` - Background jobs (chain watcher)
- `src/utils` - helper utilities and custom error classes

Notes

- Many functions contain TODO comments where project-specific logic (like decoding chain events) needs to be implemented.
- This scaffold uses `node-cron` for background job scheduling. In production, consider using a robust queue (BullMQ/Redis) for heavy workloads.

"NodePulse" comments and logging appear across the codebase to help find integration points.
# Nodepulse