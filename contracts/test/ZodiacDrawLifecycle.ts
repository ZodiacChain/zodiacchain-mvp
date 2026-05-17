import { anyValue } from "@nomicfoundation/hardhat-viem-assertions/predicates";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  encodeAbiParameters,
  getAddress,
  keccak256,
  toBytes,
  type Abi,
  type Address,
  type Hex,
  zeroHash,
} from "viem";
import hre from "hardhat";

const { viem, networkHelpers } = await hre.network.create();

const DRAW_ID = keccak256(toBytes("AMOY-DEMO-042"));
const SECOND_DRAW_ID = keccak256(toBytes("AMOY-DEMO-043"));
const BET_ID = keccak256(toBytes("entry-demo-042-reviewer-a17"));
const ENTRY_ROOT = keccak256(toBytes("entry-root-demo-042"));
const OPENS_AT = 1_779_000_000n;
const CLOSES_AT = 1_779_086_400n;
const REQUEST_ID = 42n;
const TERRESTRIAL_WORD = 104n;
const CELESTIAL_WORD = 76n;

enum DrawState {
  Unscheduled,
  Scheduled,
  Open,
  Closed,
  AwaitingRandomness,
  Resolved,
  Archived,
}

type DrawSnapshot = {
  celestialNumber: number;
  resultDigest: Hex;
  state: DrawState;
  terrestrialResult: number;
};

async function deployLifecycle() {
  const [owner, player] = await viem.getWalletClients();
  const lifecycle = await viem.deployContract("ZodiacDrawLifecycle");

  if (!owner) {
    throw new Error("Expected Hardhat to expose an owner wallet client.");
  }

  if (!player) {
    throw new Error("Expected Hardhat to expose a secondary wallet client.");
  }

  return {
    lifecycle,
    ownerAddress: getAddress(owner.account.address),
    playerAddress: getAddress(player.account.address),
  };
}

async function scheduleAndOpenDraw() {
  const context = await deployLifecycle();
  const { lifecycle } = context;

  await lifecycle.write.scheduleDraw([DRAW_ID, OPENS_AT, CLOSES_AT]);
  await lifecycle.write.openDraw([DRAW_ID]);

  return context;
}

async function closeDraw() {
  const context = await scheduleAndOpenDraw();
  const { lifecycle, playerAddress } = context;

  await lifecycle.write.placeBet([DRAW_ID, BET_ID, 4, 17], {
    account: playerAddress,
  });
  await lifecycle.write.closeDraw([DRAW_ID, ENTRY_ROOT]);

  return context;
}

async function requestRandomness() {
  const context = await closeDraw();
  const { lifecycle } = context;

  await lifecycle.write.requestRandomness([DRAW_ID, REQUEST_ID]);

  return context;
}

function expectedResultDigest(): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint8" },
        { type: "uint8" },
        { type: "uint256" },
      ],
      [DRAW_ID, ENTRY_ROOT, REQUEST_ID, TERRESTRIAL_WORD, CELESTIAL_WORD, 4, 17, 1n],
    ),
  );
}

async function expectCustomError(
  promise: Promise<unknown>,
  lifecycle: { abi: Abi; address: Address },
  errorName: string,
) {
  await viem.assertions.revertWithCustomError(promise, lifecycle, errorName);
}

describe("ZodiacDrawLifecycle", () => {
  it("emits dashboard-ready events through the complete lifecycle", async () => {
    const { lifecycle, ownerAddress, playerAddress } =
      await networkHelpers.loadFixture(deployLifecycle);
    const resultDigest = expectedResultDigest();

    assert.equal(await lifecycle.read.owner(), ownerAddress);
    assert.equal(await lifecycle.read.drawState([DRAW_ID]), DrawState.Unscheduled);
    assert.equal(await lifecycle.read.deriveTerrestrialResult([TERRESTRIAL_WORD]), 4);
    assert.equal(await lifecycle.read.deriveCelestialNumber([CELESTIAL_WORD]), 17);

    await viem.assertions.emitWithArgs(
      lifecycle.write.scheduleDraw([DRAW_ID, OPENS_AT, CLOSES_AT]),
      lifecycle,
      "DrawScheduled",
      [DRAW_ID, OPENS_AT, CLOSES_AT, anyValue],
    );
    assert.equal(await lifecycle.read.drawState([DRAW_ID]), DrawState.Scheduled);

    await viem.assertions.emitWithArgs(
      lifecycle.write.openDraw([DRAW_ID]),
      lifecycle,
      "DrawOpened",
      [DRAW_ID, anyValue],
    );
    assert.equal(await lifecycle.read.drawState([DRAW_ID]), DrawState.Open);

    await viem.assertions.emitWithArgs(
      lifecycle.write.placeBet([DRAW_ID, BET_ID, 4, 17], {
        account: playerAddress,
      }),
      lifecycle,
      "BetPlaced",
      [DRAW_ID, playerAddress, BET_ID, 4, 17, 1n, anyValue],
    );

    await viem.assertions.emitWithArgs(
      lifecycle.write.closeDraw([DRAW_ID, ENTRY_ROOT]),
      lifecycle,
      "DrawClosed",
      [DRAW_ID, ENTRY_ROOT, 1n, anyValue],
    );
    assert.equal(await lifecycle.read.drawState([DRAW_ID]), DrawState.Closed);

    await viem.assertions.emitWithArgs(
      lifecycle.write.requestRandomness([DRAW_ID, REQUEST_ID]),
      lifecycle,
      "RandomnessRequested",
      [DRAW_ID, REQUEST_ID, anyValue],
    );
    assert.equal(await lifecycle.read.drawState([DRAW_ID]), DrawState.AwaitingRandomness);
    assert.equal(await lifecycle.read.drawIdByRequestId([REQUEST_ID]), DRAW_ID);

    await viem.assertions.emitWithArgs(
      lifecycle.write.fulfillRandomness([REQUEST_ID, TERRESTRIAL_WORD, CELESTIAL_WORD]),
      lifecycle,
      "RandomnessFulfilled",
      [DRAW_ID, REQUEST_ID, TERRESTRIAL_WORD, CELESTIAL_WORD, anyValue],
    );

    await viem.assertions.emitWithArgs(
      lifecycle.write.resolveDraw([DRAW_ID]),
      lifecycle,
      "DrawResolved",
      [DRAW_ID, 4, 17, resultDigest, anyValue],
    );
    assert.equal(await lifecycle.read.drawState([DRAW_ID]), DrawState.Resolved);

    const resolvedDraw = (await lifecycle.read.getDraw([DRAW_ID])) as DrawSnapshot;
    assert.equal(resolvedDraw.terrestrialResult, 4);
    assert.equal(resolvedDraw.celestialNumber, 17);
    assert.equal(resolvedDraw.resultDigest, resultDigest);

    await viem.assertions.emitWithArgs(
      lifecycle.write.archiveDraw([DRAW_ID]),
      lifecycle,
      "DrawArchived",
      [DRAW_ID, resultDigest, anyValue],
    );
    assert.equal(await lifecycle.read.drawState([DRAW_ID]), DrawState.Archived);
  });

  it("rejects invalid lifecycle transitions and duplicate evidence anchors", async () => {
    const { lifecycle } = await networkHelpers.loadFixture(deployLifecycle);

    await expectCustomError(lifecycle.write.openDraw([DRAW_ID]), lifecycle, "InvalidDrawState");
    await lifecycle.write.scheduleDraw([DRAW_ID, OPENS_AT, CLOSES_AT]);
    await expectCustomError(
      lifecycle.write.closeDraw([DRAW_ID, ENTRY_ROOT]),
      lifecycle,
      "InvalidDrawState",
    );
    await expectCustomError(
      lifecycle.write.openDraw([SECOND_DRAW_ID]),
      lifecycle,
      "InvalidDrawState",
    );
    await lifecycle.write.openDraw([DRAW_ID]);
    await expectCustomError(lifecycle.write.openDraw([DRAW_ID]), lifecycle, "InvalidDrawState");
    await expectCustomError(
      lifecycle.write.requestRandomness([DRAW_ID, REQUEST_ID]),
      lifecycle,
      "InvalidDrawState",
    );

    await lifecycle.write.closeDraw([DRAW_ID, ENTRY_ROOT]);
    await expectCustomError(
      lifecycle.write.placeBet([DRAW_ID, BET_ID, 4, 17]),
      lifecycle,
      "InvalidDrawState",
    );

    await lifecycle.write.requestRandomness([DRAW_ID, REQUEST_ID]);
    await expectCustomError(
      lifecycle.write.requestRandomness([DRAW_ID, REQUEST_ID]),
      lifecycle,
      "InvalidDrawState",
    );

    await lifecycle.write.scheduleDraw([SECOND_DRAW_ID, OPENS_AT, CLOSES_AT]);
    await lifecycle.write.openDraw([SECOND_DRAW_ID]);
    await lifecycle.write.closeDraw([SECOND_DRAW_ID, ENTRY_ROOT]);
    await expectCustomError(
      lifecycle.write.requestRandomness([SECOND_DRAW_ID, REQUEST_ID]),
      lifecycle,
      "DuplicateRandomnessRequest",
    );

    await expectCustomError(
      lifecycle.write.fulfillRandomness([999n, TERRESTRIAL_WORD, CELESTIAL_WORD]),
      lifecycle,
      "UnknownRandomnessRequest",
    );
    await expectCustomError(
      lifecycle.write.resolveDraw([DRAW_ID]),
      lifecycle,
      "RandomnessNotFulfilled",
    );
    await expectCustomError(lifecycle.write.archiveDraw([DRAW_ID]), lifecycle, "InvalidDrawState");
  });

  it("blocks non-owner lifecycle calls while keeping test entries public during open state", async () => {
    const { lifecycle, playerAddress } = await networkHelpers.loadFixture(scheduleAndOpenDraw);

    await expectCustomError(
      lifecycle.write.closeDraw([DRAW_ID, ENTRY_ROOT], { account: playerAddress }),
      lifecycle,
      "Unauthorized",
    );

    await lifecycle.write.placeBet([DRAW_ID, BET_ID, 99, 60], {
      account: playerAddress,
    });

    await expectCustomError(
      lifecycle.write.placeBet([DRAW_ID, BET_ID, 100, 60], {
        account: playerAddress,
      }),
      lifecycle,
      "InvalidBetSelection",
    );
  });

  it("rejects resolve and archive before the required preceding lifecycle evidence", async () => {
    const { lifecycle } = await networkHelpers.loadFixture(requestRandomness);

    await expectCustomError(
      lifecycle.write.resolveDraw([DRAW_ID]),
      lifecycle,
      "RandomnessNotFulfilled",
    );
    await expectCustomError(lifecycle.write.archiveDraw([DRAW_ID]), lifecycle, "InvalidDrawState");

    await lifecycle.write.fulfillRandomness([REQUEST_ID, TERRESTRIAL_WORD, CELESTIAL_WORD]);
    await lifecycle.write.resolveDraw([DRAW_ID]);
    await lifecycle.write.archiveDraw([DRAW_ID]);

    const archivedDraw = (await lifecycle.read.getDraw([DRAW_ID])) as DrawSnapshot;
    assert.equal(archivedDraw.state, DrawState.Archived);
    assert.notEqual(archivedDraw.resultDigest, zeroHash);
  });
});
