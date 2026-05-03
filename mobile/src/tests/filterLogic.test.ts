/**
 * Filter logic tests for the MapScreen gym filtering feature.
 *
 * These are plain TypeScript assertions — run them with:
 *   npx ts-node --project tsconfig.json src/tests/filterLogic.test.ts
 *
 * Or add jest + ts-jest to run them as a proper test suite.
 */

type GymLike = {
  place_id: string;
  name: string;
  rating: number | null;
};

function filterGyms(
  gyms: GymLike[],
  minRating: number,
  onlyFavorites: boolean,
  favoritePlaceIds: Set<string>,
): GymLike[] {
  return gyms.filter((gym) => {
    if (minRating > 0 && (gym.rating ?? 0) < minRating) return false;
    if (onlyFavorites && !favoritePlaceIds.has(gym.place_id)) return false;
    return true;
  });
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GYMS: GymLike[] = [
  { place_id: "A", name: "Alpha Gym", rating: 5.0 },
  { place_id: "B", name: "Beta Fitness", rating: 3.5 },
  { place_id: "C", name: "Gamma Crossfit", rating: 2.0 },
  { place_id: "D", name: "Delta Yoga", rating: null },
  { place_id: "E", name: "Epsilon Boxing", rating: 4.2 },
];

// ── Test helpers ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string): void {
  if (condition) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
}

function assertIds(result: GymLike[], expected: string[], description: string): void {
  const ids = result.map((g) => g.place_id).sort();
  const exp = [...expected].sort();
  const ok = ids.length === exp.length && ids.every((id, i) => id === exp[i]);
  if (!ok) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    Expected: [${exp.join(", ")}]`);
    console.error(`    Got:      [${ids.join(", ")}]`);
    failed++;
  } else {
    console.log(`  ✓ ${description}`);
    passed++;
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log("\nFilter Logic Tests\n");

console.log("No filter (minRating=0, onlyFavorites=false):");
assertIds(filterGyms(GYMS, 0, false, new Set()), ["A", "B", "C", "D", "E"], "returns all gyms");

console.log("\nMinimum rating filter:");
assertIds(filterGyms(GYMS, 4, false, new Set()), ["A", "E"], "minRating=4 keeps ≥4.0 gyms");
assertIds(filterGyms(GYMS, 3, false, new Set()), ["A", "B", "E"], "minRating=3 keeps ≥3.0 gyms");
assertIds(filterGyms(GYMS, 5, false, new Set()), ["A"], "minRating=5 keeps only 5-star gym");
assertIds(filterGyms(GYMS, 1, false, new Set()), ["A", "B", "C", "E"], "minRating=1 excludes null-rated gym");

console.log("\nnull rating treated as 0:");
assert(
  filterGyms(GYMS, 2, false, new Set()).every((g) => g.place_id !== "D"),
  "gym with null rating is excluded when minRating=2",
);

console.log("\nOnly favorites filter:");
const favSet = new Set(["A", "C"]);
assertIds(filterGyms(GYMS, 0, true, favSet), ["A", "C"], "onlyFavorites shows only favorited gyms");
assertIds(filterGyms(GYMS, 0, true, new Set()), [], "onlyFavorites with empty set = no results");

console.log("\nCombined filter (minRating + onlyFavorites):");
assertIds(filterGyms(GYMS, 3, true, favSet), ["A"], "minRating=3 + onlyFavs=[A,C] → only A (C=2.0 filtered out)");
assertIds(filterGyms(GYMS, 5, true, new Set(["A", "E"])), ["A"], "minRating=5 + onlyFavs=[A,E] → only A");

console.log("\nEdge cases:");
assertIds(filterGyms([], 3, false, new Set()), [], "empty gym list returns empty array");
assertIds(filterGyms(GYMS, 0, false, new Set()), GYMS.map((g) => g.place_id), "minRating=0 is treated as 'any'");

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
