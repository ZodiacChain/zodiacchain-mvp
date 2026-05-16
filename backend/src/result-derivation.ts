import type {
  CelestialAnimalName,
  CelestialElementName,
  CelestialResult,
  TerrestrialResult,
} from "./domain.js";

export type RandomWordInput = bigint | string;

export type DrawResultRandomWords = {
  celestial: RandomWordInput;
  terrestrial: RandomWordInput;
};

export type DerivedDrawResult = {
  celestialResult: CelestialResult;
  terrestrialResult: TerrestrialResult;
};

export const CELESTIAL_ANIMALS = [
  "Rat",
  "Ox",
  "Tiger",
  "Rabbit",
  "Dragon",
  "Snake",
  "Horse",
  "Goat",
  "Monkey",
  "Rooster",
  "Dog",
  "Pig",
] as const satisfies readonly CelestialAnimalName[];

export const CELESTIAL_ELEMENTS = [
  "Wood",
  "Fire",
  "Earth",
  "Metal",
  "Water",
] as const satisfies readonly CelestialElementName[];

const TERRESTRIAL_RANGE = 100n;
const CELESTIAL_RANGE = 60n;
const TERRESTRIAL_NUMBERS_PER_ANIMAL = 4;
const CELESTIAL_ANIMAL_COUNT = 12;

function parseRandomWord(input: RandomWordInput): bigint {
  if (typeof input === "bigint") {
    if (input < 0n) {
      throw new RangeError("Random word must be non-negative.");
    }

    return input;
  }

  const normalizedInput = input.trim();

  if (/^0x[0-9a-f]+$/i.test(normalizedInput) || /^[0-9]+$/.test(normalizedInput)) {
    return BigInt(normalizedInput);
  }

  throw new RangeError("Random word must be a non-negative bigint, decimal string, or hex string.");
}

function formatTwoDigitValue(value: number): string {
  return String(value).padStart(2, "0");
}

export function deriveTerrestrialResult(randomWord: RandomWordInput): TerrestrialResult {
  const value = Number(parseRandomWord(randomWord) % TERRESTRIAL_RANGE);
  const animalId = Math.floor(value / TERRESTRIAL_NUMBERS_PER_ANIMAL) + 1;

  return {
    animalId,
    displayValue: formatTwoDigitValue(value),
    value,
  };
}

export function deriveCelestialResult(randomWord: RandomWordInput): CelestialResult {
  const value = Number((parseRandomWord(randomWord) % CELESTIAL_RANGE) + 1n);
  const zeroBasedValue = value - 1;
  const animalId = (zeroBasedValue % CELESTIAL_ANIMAL_COUNT) + 1;
  const elementId = Math.floor(zeroBasedValue / CELESTIAL_ANIMAL_COUNT) + 1;
  const animalName = CELESTIAL_ANIMALS[animalId - 1];
  const elementName = CELESTIAL_ELEMENTS[elementId - 1];

  if (!animalName || !elementName) {
    throw new RangeError("Derived celestial mapping is outside the configured mapping range.");
  }

  return {
    animalId,
    animalName,
    displayValue: formatTwoDigitValue(value),
    elementId,
    elementName,
    label: `${animalName} / ${elementName}`,
    value,
  };
}

export function deriveDrawResult(randomWords: DrawResultRandomWords): DerivedDrawResult {
  return {
    celestialResult: deriveCelestialResult(randomWords.celestial),
    terrestrialResult: deriveTerrestrialResult(randomWords.terrestrial),
  };
}
