# Result Derivation

ZodiacChain derives MVP draw results from public random words with fixed, deterministic formulas.
These TypeScript rules are the source behavior to mirror in future Solidity helpers.

## Inputs

The backend domain helpers accept non-negative random words as `bigint`, decimal strings, or hex
strings. Decimal and hex strings preserve future Chainlink VRF `uint256` values without relying on
unsafe JavaScript `number` precision.

## Terrestrial Result

The Terrestrial Result is a two-digit value in the inclusive range `00-99`.

```text
terrestrialResult = randomWordTerrestrial % 100
terrestrialAnimalId = floor(terrestrialResult / 4) + 1
```

This creates 100 possible values and 25 animal IDs, with 4 values per animal ID.

## Celestial Result

The Celestial Number is a two-digit value in the inclusive range `01-60`.

```text
celestialNumber = (randomWordCelestial % 60) + 1
celestialAnimalId = ((celestialNumber - 1) % 12) + 1
celestialElementId = floor((celestialNumber - 1) / 12) + 1
```

Celestial animal order is fixed as Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey,
Rooster, Dog, Pig.

Celestial element order is fixed as Wood, Fire, Earth, Metal, Water.

Example:

```text
17 = Dragon / Fire
```
