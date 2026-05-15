# ZodiacChain MVP

**Testnet-first implementation repository for verifiable draw infrastructure.**

ZodiacChain MVP contains the implementation work for the testnet demonstration of the ZodiacChain protocol. It is separated from [`zodiacchain-docs`](https://github.com/ZodiacChain/zodiacchain-docs), which remains the public documentation hub.

The purpose of this repository is to build and validate the technical foundation for transparent, deterministic, and publicly auditable draw flows using Polygon Amoy Testnet, Chainlink VRF, and Chainlink Automation.

---

## Current Scope

This repository is for MVP implementation only:

- smart contract scaffolding and testnet integration planning;
- Fastify + TypeScript mock API and read layer;
- React + TypeScript frontend demo and Fairness Dashboard;
- scripts for local/testnet operations;
- internal technical notes that support implementation.

The current phase does not include regulated commercial operation, real-money wagering, mainnet deployment, token presale, token issuance, investment offering, KYC/AML implementation, or production treasury management.

---

## Initial Stack

| Area | Initial direction |
|---|---|
| Smart contracts | Solidity |
| Domain logic | TypeScript |
| Backend / mock API | Fastify + TypeScript |
| Frontend demo | React + TypeScript |
| Target network | Polygon Amoy Testnet |
| Oracle integrations | Chainlink VRF, Chainlink Automation |

The core technology direction is intentionally explicit for reviewer clarity: React + TypeScript for the frontend, Fastify + TypeScript for the backend/read layer, and Solidity for smart contracts. Lower-level tooling choices, such as Vite vs. Next.js or Hardhat vs. Foundry, will be finalized in implementation issues.

---

## Repository Structure

```text
zodiacchain-mvp/
|-- backend/          # Fastify + TypeScript mock API and read layer
|-- contracts/        # Solidity smart contracts and tests
|-- docs/
|   `-- internal/     # Internal implementation notes and runbooks
|-- frontend/         # React + TypeScript frontend demo and Fairness Dashboard
|-- scripts/          # Local and testnet helper scripts
|-- CONTRIBUTING.md
|-- LICENSE
|-- README.md
`-- .gitignore
```

---

## MVP Verification Goals

The MVP should demonstrate that a draw can be:

- opened and closed through a transparent lifecycle;
- locked before randomness is requested;
- resolved using verifiable randomness;
- mapped into deterministic Terrestrial and Celestial results;
- explained through public events, request references, and a Fairness Dashboard.

The intended public verification path is:

```text
entries locked -> randomness requested -> randomness fulfilled -> results derived -> dashboard verification
```

---

## Related Documentation

- [Public documentation hub](https://github.com/ZodiacChain/zodiacchain-docs)
- [Technical Architecture Overview](https://github.com/ZodiacChain/zodiacchain-docs/blob/main/architecture/overview.md)
- [Public Roadmap](https://github.com/ZodiacChain/zodiacchain-docs/blob/main/roadmap/roadmap.md)
- [MVP Demo Script](https://github.com/ZodiacChain/zodiacchain-docs/blob/main/grant/mvp-demo-script.md)
- [Grant Reviewer Q&A](https://github.com/ZodiacChain/zodiacchain-docs/blob/main/grant/grant-reviewer-q-and-a.md)

---

## Contribution Status

This repository is in early setup. Contributions should stay aligned with the testnet-first MVP scope and avoid implying production launch, regulated wagering, token activity, or mainnet readiness.