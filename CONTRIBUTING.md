# Contributing to ZodiacChain MVP

Thank you for helping build the ZodiacChain MVP.

This repository is focused on testnet-first implementation work. Contributions should support the verifiable draw MVP, Chainlink VRF and Automation integration, deterministic result derivation, the frontend demo, the Fairness Dashboard, or supporting scripts and documentation.

## Scope Rules

Contributions must not imply or introduce:

- regulated commercial operation;
- real-money wagering;
- mainnet launch readiness;
- token presale, token issuance, or investment offering;
- production treasury management;
- KYC/AML implementation unless explicitly scoped in a future compliance issue.

## Development Flow

1. Open or reference a GitHub issue before starting meaningful work.
2. Create a feature branch from `main`.
3. Keep pull requests focused and reviewable.
4. Include tests or validation notes when behavior changes.
5. Keep public-facing language aligned with the testnet MVP scope.

## Pull Request Expectations

A pull request should include:

- a short summary of the change;
- the issue it addresses, when applicable;
- test or validation notes;
- screenshots or demo notes for frontend-facing changes;
- any known limitations or follow-up work.

## Security and Secrets

Never commit private keys, mnemonics, API keys, RPC credentials, deployment secrets, or production configuration. Use `.env` files locally and commit only safe examples such as `.env.example`.
