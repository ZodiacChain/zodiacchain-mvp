# Frontend

React + TypeScript frontend demo and Fairness Dashboard for the ZodiacChain MVP.

This workspace is a Vite-powered testnet MVP demo app. It uses static mock data
until later backend, contract, and testnet integration issues connect live demo
read models.

Initial responsibilities:

- active draw screen;
- test entry flow;
- draw lifecycle visualization;
- result screen;
- Fairness Dashboard with verification evidence;
- clear testnet-only disclaimers.

The frontend should make the verification path understandable for reviewers and non-technical users. It must clearly communicate testnet-only scope and avoid implying regulated commercial operation.

## Local Commands

Install dependencies from the repository root:

```bash
npm install
```

PowerShell-safe equivalent:

```bash
npm.cmd install
```

Run the frontend dev server:

```bash
npm run dev -w @zodiacchain/frontend
```

PowerShell-safe equivalent:

```bash
npm.cmd run dev -w @zodiacchain/frontend
```

Build and preview the frontend:

```bash
npm run build -w @zodiacchain/frontend
npm run preview -w @zodiacchain/frontend
```

PowerShell-safe equivalents:

```bash
npm.cmd run build -w @zodiacchain/frontend
npm.cmd run preview -w @zodiacchain/frontend
```

Type-check only:

```bash
npm run typecheck -w @zodiacchain/frontend
```

PowerShell-safe equivalent:

```bash
npm.cmd run typecheck -w @zodiacchain/frontend
```
