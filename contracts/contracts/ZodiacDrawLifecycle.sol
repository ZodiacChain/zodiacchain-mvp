// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

contract ZodiacDrawLifecycle {
    enum DrawState {
        Unscheduled,
        Scheduled,
        Open,
        Closed,
        AwaitingRandomness,
        Resolved,
        Archived
    }

    struct Draw {
        DrawState state;
        uint64 opensAt;
        uint64 closesAt;
        uint64 scheduledAt;
        uint64 openedAt;
        uint64 closedAt;
        uint64 randomnessRequestedAt;
        uint64 randomnessFulfilledAt;
        uint64 resolvedAt;
        uint64 archivedAt;
        uint256 entriesCount;
        bytes32 entryRoot;
        uint256 requestId;
        uint256 terrestrialWord;
        uint256 celestialWord;
        uint8 terrestrialResult;
        uint8 celestialNumber;
        bytes32 resultDigest;
    }

    error Unauthorized(address caller);
    error InvalidDrawId();
    error DrawAlreadyScheduled(bytes32 drawId);
    error InvalidSchedule(uint64 opensAt, uint64 closesAt);
    error InvalidDrawState(bytes32 drawId, DrawState expected, DrawState actual);
    error InvalidBetSelection(uint8 terrestrialPick, uint8 celestialPick);
    error InvalidRandomnessRequest(uint256 requestId);
    error DuplicateRandomnessRequest(uint256 requestId);
    error UnknownRandomnessRequest(uint256 requestId);
    error RandomnessAlreadyFulfilled(uint256 requestId);
    error RandomnessNotFulfilled(bytes32 drawId);

    event DrawScheduled(
        bytes32 indexed drawId,
        uint64 opensAt,
        uint64 closesAt,
        uint64 scheduledAt
    );
    event DrawOpened(bytes32 indexed drawId, uint64 openedAt);
    event BetPlaced(
        bytes32 indexed drawId,
        address indexed player,
        bytes32 indexed betId,
        uint8 terrestrialPick,
        uint8 celestialPick,
        uint256 entryNumber,
        uint64 placedAt
    );
    event DrawClosed(bytes32 indexed drawId, bytes32 entryRoot, uint256 entriesCount, uint64 closedAt);
    event RandomnessRequested(bytes32 indexed drawId, uint256 indexed requestId, uint64 requestedAt);
    event RandomnessFulfilled(
        bytes32 indexed drawId,
        uint256 indexed requestId,
        uint256 terrestrialWord,
        uint256 celestialWord,
        uint64 fulfilledAt
    );
    event DrawResolved(
        bytes32 indexed drawId,
        uint8 terrestrialResult,
        uint8 celestialNumber,
        bytes32 resultDigest,
        uint64 resolvedAt
    );
    event DrawArchived(bytes32 indexed drawId, bytes32 resultDigest, uint64 archivedAt);

    address public immutable owner;

    mapping(bytes32 drawId => Draw draw) private draws;
    mapping(uint256 requestId => bytes32 drawId) public drawIdByRequestId;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Unauthorized(msg.sender);
        }

        _;
    }

    function scheduleDraw(bytes32 drawId, uint64 opensAt, uint64 closesAt) external onlyOwner {
        if (drawId == bytes32(0)) {
            revert InvalidDrawId();
        }

        Draw storage draw = draws[drawId];

        if (draw.state != DrawState.Unscheduled) {
            revert DrawAlreadyScheduled(drawId);
        }

        if (opensAt >= closesAt) {
            revert InvalidSchedule(opensAt, closesAt);
        }

        draw.state = DrawState.Scheduled;
        draw.opensAt = opensAt;
        draw.closesAt = closesAt;
        draw.scheduledAt = uint64(block.timestamp);

        emit DrawScheduled(drawId, opensAt, closesAt, draw.scheduledAt);
    }

    function openDraw(bytes32 drawId) external onlyOwner {
        Draw storage draw = _requireState(drawId, DrawState.Scheduled);

        draw.state = DrawState.Open;
        draw.openedAt = uint64(block.timestamp);

        emit DrawOpened(drawId, draw.openedAt);
    }

    function placeBet(
        bytes32 drawId,
        bytes32 betId,
        uint8 terrestrialPick,
        uint8 celestialPick
    ) external returns (uint256 entryNumber) {
        Draw storage draw = _requireState(drawId, DrawState.Open);

        if (terrestrialPick > 99 || celestialPick == 0 || celestialPick > 60) {
            revert InvalidBetSelection(terrestrialPick, celestialPick);
        }

        draw.entriesCount += 1;
        entryNumber = draw.entriesCount;

        emit BetPlaced(
            drawId,
            msg.sender,
            betId,
            terrestrialPick,
            celestialPick,
            entryNumber,
            uint64(block.timestamp)
        );
    }

    function closeDraw(bytes32 drawId, bytes32 entryRoot) external onlyOwner {
        Draw storage draw = _requireState(drawId, DrawState.Open);

        draw.state = DrawState.Closed;
        draw.entryRoot = entryRoot;
        draw.closedAt = uint64(block.timestamp);

        emit DrawClosed(drawId, entryRoot, draw.entriesCount, draw.closedAt);
    }

    function requestRandomness(bytes32 drawId, uint256 requestId) external onlyOwner {
        Draw storage draw = _requireState(drawId, DrawState.Closed);

        if (requestId == 0) {
            revert InvalidRandomnessRequest(requestId);
        }

        if (drawIdByRequestId[requestId] != bytes32(0)) {
            revert DuplicateRandomnessRequest(requestId);
        }

        draw.state = DrawState.AwaitingRandomness;
        draw.requestId = requestId;
        draw.randomnessRequestedAt = uint64(block.timestamp);
        drawIdByRequestId[requestId] = drawId;

        emit RandomnessRequested(drawId, requestId, draw.randomnessRequestedAt);
    }

    function fulfillRandomness(
        uint256 requestId,
        uint256 terrestrialWord,
        uint256 celestialWord
    ) external onlyOwner {
        bytes32 drawId = drawIdByRequestId[requestId];

        if (drawId == bytes32(0)) {
            revert UnknownRandomnessRequest(requestId);
        }

        Draw storage draw = _requireState(drawId, DrawState.AwaitingRandomness);

        if (draw.randomnessFulfilledAt != 0) {
            revert RandomnessAlreadyFulfilled(requestId);
        }

        draw.terrestrialWord = terrestrialWord;
        draw.celestialWord = celestialWord;
        draw.randomnessFulfilledAt = uint64(block.timestamp);

        emit RandomnessFulfilled(
            drawId,
            requestId,
            terrestrialWord,
            celestialWord,
            draw.randomnessFulfilledAt
        );
    }

    function resolveDraw(bytes32 drawId) external onlyOwner {
        Draw storage draw = _requireState(drawId, DrawState.AwaitingRandomness);

        if (draw.randomnessFulfilledAt == 0) {
            revert RandomnessNotFulfilled(drawId);
        }

        draw.terrestrialResult = deriveTerrestrialResult(draw.terrestrialWord);
        draw.celestialNumber = deriveCelestialNumber(draw.celestialWord);
        draw.resultDigest = keccak256(
            abi.encode(
                drawId,
                draw.entryRoot,
                draw.requestId,
                draw.terrestrialWord,
                draw.celestialWord,
                draw.terrestrialResult,
                draw.celestialNumber,
                draw.entriesCount
            )
        );
        draw.state = DrawState.Resolved;
        draw.resolvedAt = uint64(block.timestamp);

        emit DrawResolved(
            drawId,
            draw.terrestrialResult,
            draw.celestialNumber,
            draw.resultDigest,
            draw.resolvedAt
        );
    }

    function archiveDraw(bytes32 drawId) external onlyOwner {
        Draw storage draw = _requireState(drawId, DrawState.Resolved);

        draw.state = DrawState.Archived;
        draw.archivedAt = uint64(block.timestamp);

        emit DrawArchived(drawId, draw.resultDigest, draw.archivedAt);
    }

    function getDraw(bytes32 drawId) external view returns (Draw memory) {
        return draws[drawId];
    }

    function drawState(bytes32 drawId) external view returns (DrawState) {
        return draws[drawId].state;
    }

    function deriveTerrestrialResult(uint256 randomWord) public pure returns (uint8) {
        return uint8(randomWord % 100);
    }

    function deriveCelestialNumber(uint256 randomWord) public pure returns (uint8) {
        return uint8((randomWord % 60) + 1);
    }

    function _requireState(
        bytes32 drawId,
        DrawState expected
    ) private view returns (Draw storage draw) {
        draw = draws[drawId];

        if (draw.state != expected) {
            revert InvalidDrawState(drawId, expected, draw.state);
        }
    }
}
