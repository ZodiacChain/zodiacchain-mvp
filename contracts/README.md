# Contracts

Solidity smart contracts for the ZodiacChain testnet MVP.

## Tooling

The contracts workspace uses Hardhat 3 with TypeScript tests and viem.

```bash
npm run test -w @zodiacchain/contracts
npm run build -w @zodiacchain/contracts
```

Initial responsibilities:

- draw lifecycle state model;
- draw opening and closing logic;
- randomness request and fulfillment integration points;
- deterministic result derivation helpers;
- lifecycle events for public verification.

## Draw Lifecycle

`ZodiacDrawLifecycle` models the MVP lifecycle as:

```text
Scheduled -> Open -> Closed -> AwaitingRandomness -> Resolved -> Archived
```

The contract intentionally keeps live Chainlink VRF and Automation wiring out of this first scaffold.
Future integration work can connect the existing randomness request and fulfillment boundaries to
testnet services without changing the public event names.

## Dashboard And Indexer Events

| Event                 | Purpose for dashboard/indexer consumers                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `DrawScheduled`       | Announces the draw ID and scheduled entry window before entries can open.                                |
| `DrawOpened`          | Marks the point where testnet entries may be accepted.                                                   |
| `BetPlaced`           | Records an accepted testnet entry with draw ID, player, entry ID, selected numbers, and sequence number. |
| `DrawClosed`          | Freezes the entry window and exposes the final entry count plus entry root.                              |
| `RandomnessRequested` | Links the draw ID to a randomness request ID before fulfillment.                                         |
| `RandomnessFulfilled` | Records the request ID and random words used for deterministic derivation.                               |
| `DrawResolved`        | Publishes derived Terrestrial and Celestial outputs plus the result digest.                              |
| `DrawArchived`        | Marks the resolved draw as historical evidence with its final result digest.                             |

This folder should remain testnet-first until future issues explicitly define production readiness requirements.
