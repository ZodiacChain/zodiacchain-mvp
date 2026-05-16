# Backend

Fastify + TypeScript mock API and read layer for the ZodiacChain MVP.

The backend starts as an MVP read/mock layer. It stays testnet-first and avoids production treasury, wagering, mainnet, secret, or credential assumptions.

## Run Commands

Install dependencies from the repository root:

```bash
npm install
```

If PowerShell blocks the npm shim, use:

```bash
npm.cmd install
```

Start the local mock API:

```bash
npm run dev -w @zodiacchain/backend
```

The server listens on `127.0.0.1:4000` by default. Override with `HOST` and `PORT` when needed.

Production-style build and start:

```bash
npm run build -w @zodiacchain/backend
npm run start -w @zodiacchain/backend
```

Validation commands:

```bash
npm run typecheck -w @zodiacchain/backend
npm test -w @zodiacchain/backend
```

## Endpoints

| Method | Path                               | Purpose                         |
| ------ | ---------------------------------- | ------------------------------- |
| GET    | `/health`                          | Service health check            |
| GET    | `/api/v1/draws`                    | List draw summaries             |
| GET    | `/api/v1/draws/active`             | Return the active reviewer draw |
| GET    | `/api/v1/draws/:drawId`            | Return draw details             |
| GET    | `/api/v1/draws/:drawId/events`     | Return mock event history       |
| GET    | `/api/v1/draws/:drawId/randomness` | Return mock randomness data     |
| GET    | `/api/v1/draws/:drawId/fairness`   | Return fairness dashboard data  |

Unknown draw IDs return a `404` response with a stable `DRAW_NOT_FOUND` error payload.

## Mock Data

The initial data set uses `AMOY-DEMO-042`, a safe Polygon Amoy testnet placeholder aligned with the frontend demo. It contains only public mock values for draw state, lifecycle, events, randomness references, and fairness checks.
