# Chainlink VRF And Automation Testnet Plan

This plan defines how the ZodiacChain MVP should connect the existing draw lifecycle contract to
Chainlink VRF v2.5 and Chainlink Automation on Polygon Amoy. It is an implementation plan only:
this issue does not deploy contracts, register live Chainlink consumers, or commit secrets.

## Scope

- Target network: Polygon Amoy Testnet.
- VRF model: Chainlink VRF v2.5 subscription funding.
- Automation model: Chainlink Automation custom logic upkeep.
- Contract boundary: extend the existing `ZodiacDrawLifecycle` request and fulfillment lifecycle.
- Out of scope: mainnet deployment, production wagering, live treasury handling, and token activity.

## Polygon Amoy Configuration

Use the official Chainlink Polygon Amoy values at implementation time and re-check the supported
networks pages before deployment.

| Setting                    | Value                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| LINK token                 | `0x0fd9e8d3af1aaee056eb9e802c3a762a667b1904`                         |
| VRF coordinator            | `0x343300b5d84D444B2ADc9116FEF1bED02BE49Cf2`                         |
| VRF key hash               | `0x816bedba8a50b294e5cbd47842baf240c2385f2eaf719edbd4f250a137a8c899` |
| Request confirmations      | `3`                                                                  |
| Number of random words     | `2`                                                                  |
| VRF payment mode           | LINK subscription balance, `nativePayment: false`                    |
| VRF max callback gas       | `2_500_000`                                                          |
| Initial callback gas limit | `200_000`, then adjust from Amoy gas measurements                    |
| Automation registry        | `0x93C0e201f7B158F503a1265B6942088975f92ce7`                         |
| Automation registrar       | `0x99083A4bb154B0a3EC7a0D1eb40370C892Db4225`                         |
| Automation trigger type    | Custom logic                                                         |
| Initial upkeep gas limit   | Start at `500_000`, then adjust from Amoy `performUpkeep` gas usage  |

The VRF callback should only store two random words and emit lifecycle evidence, so `200_000` is the
starting callback gas limit. If future fulfillment logic does more than storage and events, measure
again and keep the configured limit below the coordinator maximum.

## VRF Request And Fulfillment Flow

The production VRF implementation should replace the current owner-supplied mock `requestId` with
the `requestId` returned by the VRF coordinator.

1. `scheduleDraw(drawId, opensAt, closesAt)` sets the planned window.
2. `openDraw(drawId)` starts the entry window.
3. `placeBet(...)` remains accepted only while the draw is `Open`.
4. `closeDraw(drawId, entryRoot)` freezes entries and emits `DrawClosed`.
5. `requestRandomness(drawId)` requires `Closed`, calls VRF v2.5, stores the returned `requestId`,
   sets `drawIdByRequestId[requestId] = drawId`, moves the draw to `AwaitingRandomness`, and emits
   `RandomnessRequested`.
6. `fulfillRandomWords(requestId, randomWords)` looks up the draw through `drawIdByRequestId`,
   stores `randomWords[0]` as the Terrestrial word and `randomWords[1]` as the Celestial word, sets
   `randomnessFulfilledAt`, and emits `RandomnessFulfilled`.
7. `resolveDraw(drawId)` derives the final Terrestrial and Celestial results, computes the
   `resultDigest`, moves the draw to `Resolved`, and emits `DrawResolved`.
8. `archiveDraw(drawId)` remains a separate evidence-retention step.

Mapping rules:

- `requestId` is the canonical join key between Chainlink VRF evidence and a ZodiacChain draw.
- Every in-flight request must have exactly one `drawIdByRequestId[requestId]` entry.
- A draw cannot request randomness more than once.
- A request cannot be cancelled or replaced after it is emitted.
- Entries cannot be accepted after `closeDraw` and before or after VRF request submission.

Fulfillment expectations:

- Use `VRFConsumerBaseV2Plus` and do not override its raw fulfillment path.
- Keep `fulfillRandomWords` minimal and non-reverting. If an impossible guard fails, emit an ignored
  fulfillment diagnostic event and return rather than reverting.
- Do not call `resolveDraw` from inside the VRF callback. Resolution is a separate transaction so a
  derivation or gas issue cannot cause the VRF callback itself to fail.
- Keep the existing public evidence events aligned with dashboard/indexer consumers:
  `RandomnessRequested`, `RandomnessFulfilled`, and `DrawResolved`.

## Automation Trigger Scope

Use one custom logic upkeep for the post-close lifecycle of the active draw being tested. The upkeep
`checkData` should encode the `drawId`; `performData` should encode the `drawId` and selected action.

Automation-compatible conditions:

| Action             | `checkUpkeep` condition                                             | `performUpkeep` transaction                                                     |
| ------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Request randomness | Draw state is `Closed` and `requestId == 0`                         | Call the internal request path that submits VRF and emits `RandomnessRequested` |
| Resolve draw       | Draw state is `AwaitingRandomness` and `randomnessFulfilledAt != 0` | Call the internal resolve path and emit `DrawResolved`                          |

Operational rules:

- Opening and closing draws stay operator-controlled for the MVP.
- Automation should not place bets, mutate entry roots, archive draws, or bypass lifecycle state
  checks.
- `performUpkeep` must re-check the condition onchain before mutating state because `checkUpkeep` is
  simulated offchain.
- After upkeep registration, store the Chainlink Automation forwarder address and allow only the
  owner or the configured forwarder to execute the automated paths.
- If the demo uses only manual resolution, register Automation for the randomness request action
  first; the same interface can later enable the resolve action without changing dashboard evidence.

## Environment Variables And Secret Handling

Do not commit real `.env` files, private keys, API keys, RPC credentials, subscription ownership
wallets, or funded account material. Commit only safe examples when a later implementation issue
adds deployment scripts.

Suggested environment names:

| Name                                  | Secret | Purpose                                                  |
| ------------------------------------- | ------ | -------------------------------------------------------- |
| `POLYGON_AMOY_RPC_URL`                | Yes    | RPC endpoint used by deployment and verification scripts |
| `AMOY_DEPLOYER_PRIVATE_KEY`           | Yes    | Testnet deployer and operator account                    |
| `POLYGONSCAN_API_KEY`                 | Yes    | Contract verification on Amoy Polygonscan                |
| `CHAINLINK_VRF_SUBSCRIPTION_ID`       | No     | VRF v2.5 subscription used by the consumer               |
| `CHAINLINK_VRF_COORDINATOR`           | No     | Network-specific VRF coordinator address                 |
| `CHAINLINK_VRF_KEY_HASH`              | No     | Polygon Amoy gas lane key hash                           |
| `CHAINLINK_VRF_CALLBACK_GAS_LIMIT`    | No     | Callback gas limit selected after gas measurement        |
| `CHAINLINK_VRF_REQUEST_CONFIRMATIONS` | No     | Confirmation count, initially `3`                        |
| `CHAINLINK_VRF_NUM_WORDS`             | No     | Random word count, fixed at `2` for MVP results          |
| `CHAINLINK_VRF_NATIVE_PAYMENT`        | No     | `false` for LINK-funded subscription requests            |
| `CHAINLINK_AUTOMATION_REGISTRY`       | No     | Polygon Amoy Automation registry address                 |
| `CHAINLINK_AUTOMATION_REGISTRAR`      | No     | Polygon Amoy Automation registrar address                |
| `CHAINLINK_AUTOMATION_UPKEEP_ID`      | No     | Registered upkeep ID after Automation setup              |
| `CHAINLINK_AUTOMATION_FORWARDER`      | No     | Forwarder allowed to call automated paths                |
| `ZODIAC_DRAW_LIFECYCLE_ADDRESS`       | No     | Deployed lifecycle contract address                      |

## Testnet Verification Evidence

Capture these artifacts before closing the future live-integration issue:

- Contract deployment transaction on Amoy Polygonscan.
- Verified source link for the deployed lifecycle/VRF consumer contract.
- VRF subscription ID and consumer registration screenshot or transaction.
- LINK funding transaction for the VRF subscription.
- Draw lifecycle events: `DrawScheduled`, `DrawOpened`, `BetPlaced`, and `DrawClosed`.
- VRF request transaction and `RandomnessRequested` event with `drawId` and `requestId`.
- VRF fulfillment transaction and `RandomnessFulfilled` event with both random words.
- `DrawResolved` event with derived Terrestrial result, Celestial number, and `resultDigest`.
- Automation upkeep ID, registry page, and funding transaction.
- `performUpkeep` transaction hash for the automated request or resolution path.
- Dashboard or indexer evidence showing the same `drawId`, `requestId`, random words, derived
  results, and digest.

## Implementation Readiness Checklist

- Add Chainlink contracts dependency only in the live-integration issue.
- Add local mock VRF tests before Amoy deployment.
- Add tests for duplicate request prevention, unknown fulfillment handling, non-reverting callback
  behavior, and Automation condition re-checking.
- Keep all secrets in local environment files or CI secret storage.
- Re-check Chainlink supported network pages immediately before deploying to Amoy.

## References

- [Chainlink VRF v2.5 supported networks](https://docs.chain.link/vrf/v2-5/supported-networks)
- [Chainlink VRF v2.5 getting started](https://docs.chain.link/vrf/v2-5/getting-started)
- [Chainlink VRF security considerations](https://docs.chain.link/vrf/v2-5/security)
- [Chainlink Automation supported networks](https://docs.chain.link/chainlink-automation/overview/supported-networks)
- [Chainlink Automation-compatible contracts](https://docs.chain.link/chainlink-automation/guides/compatible-contracts)
