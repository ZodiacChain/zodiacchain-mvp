import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveCelestialResult,
  deriveDrawResult,
  deriveTerrestrialResult,
} from "./result-derivation.js";

test("deriveTerrestrialResult keeps values in the 00-99 range", () => {
  const cases = [
    { expectedAnimalId: 1, expectedDisplayValue: "00", expectedValue: 0, input: 0n },
    { expectedAnimalId: 1, expectedDisplayValue: "03", expectedValue: 3, input: 3n },
    { expectedAnimalId: 2, expectedDisplayValue: "04", expectedValue: 4, input: 4n },
    { expectedAnimalId: 25, expectedDisplayValue: "99", expectedValue: 99, input: 99n },
    { expectedAnimalId: 1, expectedDisplayValue: "00", expectedValue: 0, input: 100n },
    { expectedAnimalId: 25, expectedDisplayValue: "99", expectedValue: 99, input: 199n },
  ];

  for (const testCase of cases) {
    assert.deepEqual(deriveTerrestrialResult(testCase.input), {
      animalId: testCase.expectedAnimalId,
      displayValue: testCase.expectedDisplayValue,
      value: testCase.expectedValue,
    });
  }
});

test("deriveCelestialResult maps numbers to animals and elements", () => {
  const cases = [
    {
      expectedAnimalId: 1,
      expectedAnimalName: "Rat",
      expectedDisplayValue: "01",
      expectedElementId: 1,
      expectedElementName: "Wood",
      expectedLabel: "Rat / Wood",
      expectedValue: 1,
      input: 0n,
    },
    {
      expectedAnimalId: 12,
      expectedAnimalName: "Pig",
      expectedDisplayValue: "12",
      expectedElementId: 1,
      expectedElementName: "Wood",
      expectedLabel: "Pig / Wood",
      expectedValue: 12,
      input: 11n,
    },
    {
      expectedAnimalId: 1,
      expectedAnimalName: "Rat",
      expectedDisplayValue: "13",
      expectedElementId: 2,
      expectedElementName: "Fire",
      expectedLabel: "Rat / Fire",
      expectedValue: 13,
      input: 12n,
    },
    {
      expectedAnimalId: 5,
      expectedAnimalName: "Dragon",
      expectedDisplayValue: "17",
      expectedElementId: 2,
      expectedElementName: "Fire",
      expectedLabel: "Dragon / Fire",
      expectedValue: 17,
      input: 16n,
    },
    {
      expectedAnimalId: 12,
      expectedAnimalName: "Pig",
      expectedDisplayValue: "60",
      expectedElementId: 5,
      expectedElementName: "Water",
      expectedLabel: "Pig / Water",
      expectedValue: 60,
      input: 59n,
    },
    {
      expectedAnimalId: 1,
      expectedAnimalName: "Rat",
      expectedDisplayValue: "01",
      expectedElementId: 1,
      expectedElementName: "Wood",
      expectedLabel: "Rat / Wood",
      expectedValue: 1,
      input: 60n,
    },
  ];

  for (const testCase of cases) {
    assert.deepEqual(deriveCelestialResult(testCase.input), {
      animalId: testCase.expectedAnimalId,
      animalName: testCase.expectedAnimalName,
      displayValue: testCase.expectedDisplayValue,
      elementId: testCase.expectedElementId,
      elementName: testCase.expectedElementName,
      label: testCase.expectedLabel,
      value: testCase.expectedValue,
    });
  }
});

test("deriveDrawResult is deterministic for repeated inputs", () => {
  const randomWords = {
    celestial: "123456789012345678901234567890",
    terrestrial: "987654321098765432109876543210",
  };

  assert.deepEqual(deriveDrawResult(randomWords), deriveDrawResult(randomWords));
});

test("result derivation accepts decimal and hex string inputs", () => {
  assert.deepEqual(deriveTerrestrialResult("199"), deriveTerrestrialResult(199n));
  assert.deepEqual(deriveCelestialResult("0x10"), deriveCelestialResult(16n));
});

test("result derivation rejects invalid random inputs", () => {
  assert.throws(() => deriveTerrestrialResult(-1n), RangeError);
  assert.throws(() => deriveCelestialResult("-1"), RangeError);
  assert.throws(() => deriveCelestialResult("not-a-random-word"), RangeError);
});
