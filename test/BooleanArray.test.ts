/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.10";
import { BooleanArray } from "../mod.ts";

// Helper function to assert that unused bits in the last chunk are zero
function assertUnusedBitsZero(array: BooleanArray, operationName?: string) {
  if (array.size === 0 || array.length === 0) return;
  const bitsInLastChunk = array.size % BooleanArray.BITS_PER_INT;
  if (bitsInLastChunk === 0) return; // Last chunk is full

  const lastChunkIndex = array.length - 1;
  const lastChunkValue = array[lastChunkIndex]!; // Uint32Array access
  const unusedMask = BooleanArray.ALL_BITS << bitsInLastChunk;

  assertEquals(
    lastChunkValue & unusedMask,
    0,
    `Unused bits in the last chunk of array (size ${array.size}) after ${
      operationName || "operation"
    } should be zero. Last chunk value: 0b${lastChunkValue.toString(2).padStart(32, "0")}, Mask for unused: 0b${
      unusedMask.toString(2).padStart(32, "0")
    }`,
  );
}

Deno.test("BooleanArray - Construction and Validation", async (t) => {
  await t.step("should create array with valid size", () => {
    const array = new BooleanArray(100);
    assertEquals(array.size, 100);
    assertEquals(array.length, 4); // 100 bits requires 4 32-bit integers
  });

  await t.step("should throw on invalid sizes", () => {
    assertThrows(() => new BooleanArray(-1), RangeError);
    assertThrows(() => new BooleanArray(NaN), TypeError);
    assertThrows(() => new BooleanArray(4294967296), RangeError);
  });
});

Deno.test("BooleanArray - Basic Bit Operations", async (t) => {
  await t.step("should set and get individual bits", () => {
    const array = new BooleanArray(100);

    array.setBool(0, true);
    array.setBool(31, true);
    array.setBool(32, true);
    array.setBool(99, true);

    assertEquals(array.getBool(0), true);
    assertEquals(array.getBool(1), false);
    assertEquals(array.getBool(31), true);
    assertEquals(array.getBool(32), true);
    assertEquals(array.getBool(99), true);
  });

  await t.step("should toggle bits", () => {
    const array = new BooleanArray(100);

    assertEquals(array.toggleBool(50), true);
    assertEquals(array.getBool(50), true);
    assertEquals(array.toggleBool(50), false);
    assertEquals(array.getBool(50), false);
  });
});

Deno.test("BooleanArray - Range Operations", async (t) => {
  await t.step("should set and get ranges of bits", () => {
    const array = new BooleanArray(100);

    array.setRange(10, 20, true);
    const bools = array.getBools(10, 20);
    assertEquals(bools.every((b: boolean) => b === true), true);
    assertEquals(array.getBool(9), false);
    assertEquals(array.getBool(30), false);
  });

  await t.step("should handle small ranges efficiently", () => {
    const array = new BooleanArray(100);

    array.setRange(10, 5, true);
    const bools = array.getBools(10, 5);
    assertEquals(bools, [true, true, true, true, true]);
  });
});

Deno.test("BooleanArray - Static Bitwise Operations", async (t) => {
  await t.step("should perform AND operation", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(32);

    a.setBool(0, true);
    a.setBool(1, true);
    b.setBool(1, true);
    b.setBool(2, true);

    const result = BooleanArray.and(a, b);
    assertEquals(result.getBool(0), false);
    assertEquals(result.getBool(1), true);
    assertEquals(result.getBool(2), false);
  });

  await t.step("should perform OR operation", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(32);

    a.setBool(0, true);
    b.setBool(1, true);

    const result = BooleanArray.or(a, b);
    assertEquals(result.getBool(0), true);
    assertEquals(result.getBool(1), true);
    assertEquals(result.getBool(2), false);
  });
});

Deno.test("BooleanArray - Population and Search Operations", async (t) => {
  await t.step("should count population", () => {
    const array = new BooleanArray(100);
    array.setBool(0, true);
    array.setBool(50, true);
    array.setBool(99, true);

    assertEquals(array.getPopulationCount(), 3);
  });

  await t.step("should find first and last set bits", () => {
    const array = new BooleanArray(100);
    assertEquals(array.getFirstSetIndex(), -1);
    assertEquals(array.getLastSetIndex(), -1);

    array.setBool(10, true);
    array.setBool(50, true);
    array.setBool(90, true);

    assertEquals(array.getFirstSetIndex(), 10);
    assertEquals(array.getLastSetIndex(), 90);
  });
});

Deno.test("BooleanArray - Utility Operations", async (t) => {
  await t.step("should clear all bits", () => {
    const array = new BooleanArray(100);
    array.setAll();
    array.clear();
    assertEquals(array.isEmpty(), true);
  });

  await t.step("should set all bits", () => {
    const array = new BooleanArray(100);
    array.setAll();
    assertEquals(array.getBool(0), true);
    assertEquals(array.getBool(99), true);
  });

  await t.step("should clone array", () => {
    const original = new BooleanArray(100);
    original.setBool(50, true);

    const clone = original.clone();
    assertEquals(clone.size, original.size);
    assertEquals(clone.getBool(50), true);
  });
});

Deno.test("BooleanArray - Iterator", async (t) => {
  await t.step("should iterate over all truthy indices when no range specified", () => {
    const array = new BooleanArray(100);
    const expectedIndices = [10, 20, 30, 40];

    for (const index of expectedIndices) {
      array.setBool(index, true);
    }

    const actualIndices = [...array.truthyIndices()];
    assertEquals(actualIndices, expectedIndices);
  });

  await t.step("should iterate over truthy indices within specified range", () => {
    const array = new BooleanArray(100);
    array.setBool(5, true); // Before range
    array.setBool(15, true); // In range
    array.setBool(25, true); // In range
    array.setBool(35, true); // After range

    const actualIndices = [...array.truthyIndices(10, 30)];
    assertEquals(actualIndices, [15, 25]);
  });

  await t.step("should handle start index with no end index", () => {
    const array = new BooleanArray(100);
    array.setBool(5, true);
    array.setBool(15, true);
    array.setBool(25, true);

    const actualIndices = [...array.truthyIndices(10)];
    assertEquals(actualIndices, [15, 25]);
  });

  await t.step("should handle empty ranges", () => {
    const array = new BooleanArray(100);
    array.setBool(5, true);
    array.setBool(15, true);

    const actualIndices = [...array.truthyIndices(20, 30)];
    assertEquals(actualIndices, []);
  });

  await t.step("should handle ranges at chunk boundaries", () => {
    const array = new BooleanArray(100);
    array.setBool(31, true);
    array.setBool(32, true);
    array.setBool(33, true);

    const actualIndices = [...array.truthyIndices(31, 33)];
    assertEquals(actualIndices, [31, 32]);
  });

  await t.step("should handle dense ranges efficiently", () => {
    const array = new BooleanArray(100);
    array.setRange(20, 10, true); // Set bits 20-29

    const actualIndices = [...array.truthyIndices(15, 35)];
    assertEquals(actualIndices, [20, 21, 22, 23, 24, 25, 26, 27, 28, 29]);
  });
});

Deno.test("BooleanArray - Error Conditions", async (t) => {
  await t.step("should throw on out of bounds access", () => {
    const array = new BooleanArray(100);

    assertThrows(() => array.getBool(100), RangeError);
    assertThrows(() => array.setBool(100, true), RangeError);
    assertThrows(() => array.getBools(90, 20), RangeError);
  });

  await t.step("should throw on mismatched sizes in operations", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);

    assertThrows(() => BooleanArray.and(a, b), Error);
  });
});

Deno.test("BooleanArray - Boundary Conditions", async (t) => {
  await t.step("should handle operations at chunk boundaries", () => {
    const array = new BooleanArray(64);
    array.setBool(31, true);
    array.setBool(32, true);

    const range = array.getBools(31, 2);
    assertEquals(range, [true, true]);
  });

  await t.step("should handle last chunk partial filling", () => {
    const array = new BooleanArray(33); // Just over one chunk
    array.setAll();
    assertEquals(array.getBool(31), true);
    assertEquals(array.getBool(32), true);
    assertEquals(array.getPopulationCount(), 33);
  });
});

Deno.test("BooleanArray - Large Array Operations", async (t) => {
  await t.step("should handle large arrays efficiently", () => {
    const size = 1_000_000;
    const array = new BooleanArray(size);

    // Set every 1000th bit
    for (let i = 0; i < size; i += 1000) {
      array.setBool(i, true);
    }

    assertEquals(array.getPopulationCount(), Math.floor(size / 1000));
  });

  await t.step("should handle large range operations", () => {
    const array = new BooleanArray(1_000_000);
    array.setRange(500_000, 100_000, true);

    assertEquals(array.getBool(499_999), false);
    assertEquals(array.getBool(500_000), true);
    assertEquals(array.getBool(599_999), true);
    assertEquals(array.getBool(600_000), false);
  });
});

Deno.test("BooleanArray - Complex Bitwise Operations", async (t) => {
  await t.step("should chain multiple operations correctly", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(32);
    const c = new BooleanArray(32);

    a.setBool(0, true);
    b.setBool(1, true);
    c.setBool(2, true);

    const result = BooleanArray.and(
      BooleanArray.or(a, b),
      BooleanArray.not(c),
    );

    assertEquals(result.getBool(0), true);
    assertEquals(result.getBool(1), true);
    assertEquals(result.getBool(2), false);
  });

  await t.step("should perform XNOR operation correctly", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(32);

    a.setBool(0, true);
    a.setBool(1, true);
    b.setBool(1, true);
    b.setBool(2, true);

    const result = BooleanArray.xnor(a, b);
    assertEquals(result.getBool(0), false);
    assertEquals(result.getBool(1), true);
    assertEquals(result.getBool(2), false);
  });
});

Deno.test("BooleanArray - Memory Management", async (t) => {
  await t.step("should handle repeated set/clear operations", () => {
    const array = new BooleanArray(1000);

    for (let i = 0; i < 1000; i++) {
      array.setBool(i, true);
      array.setBool(i, false);
    }

    assertEquals(array.isEmpty(), true);
  });

  await t.step("should maintain correct state after multiple operations", () => {
    const array = new BooleanArray(100);

    array.setAll();
    array.setRange(20, 30, false);
    array.toggleBool(25);
    array.setBool(35, false);

    assertEquals(array.getBool(19), true);
    assertEquals(array.getBool(25), true);
    assertEquals(array.getBool(35), false);
    assertEquals(array.getBool(50), true);
  });
});

Deno.test("BooleanArray - Edge Cases and Error Handling", async (t) => {
  await t.step("should handle floating point indices", () => {
    const array = new BooleanArray(100);
    assertThrows(() => array.setBool(1.5, true), TypeError);
    assertThrows(() => array.getBool(1.5), TypeError);
  });

  await t.step("should handle invalid range parameters", () => {
    const array = new BooleanArray(100);
    assertThrows(() => array.setRange(-1, 10, true), RangeError);
    assertThrows(() => array.setRange(95, 10, true), RangeError);
    assertThrows(() => array.setRange(0, -1, true), RangeError);
  });

  await t.step("should handle array size edge cases", () => {
    assertThrows(() => new BooleanArray(2 ** 32), RangeError);
    const array = new BooleanArray(BooleanArray.MAX_SAFE_SIZE);
    assertEquals(array.size, BooleanArray.MAX_SAFE_SIZE);
  });
});

Deno.test("BooleanArray - Performance Characteristics", async (t) => {
  await t.step("should handle sparse bit patterns efficiently", () => {
    const array = new BooleanArray(1_000_000);
    const indices = [0, 999, 9999, 99999, 999999];

    for (const index of indices) {
      array.setBool(index, true);
    }

    assertEquals([...array.truthyIndices()], indices);
    assertEquals(array.getPopulationCount(), indices.length);
  });

  await t.step("should handle dense bit patterns efficiently", () => {
    const size = 100_000;
    const array = new BooleanArray(size);
    array.setAll();

    assertEquals(array.getPopulationCount(), size);
    assertEquals(array.getFirstSetIndex(), 0);
    assertEquals(array.getLastSetIndex(), size - 1);
  });
});

Deno.test("BooleanArray - Static Equals Operation", async (t) => {
  await t.step("should return true for identical arrays", () => {
    const a = new BooleanArray(100);
    const b = new BooleanArray(100);
    a.setBool(0, true);
    a.setBool(99, true);
    b.setBool(0, true);
    b.setBool(99, true);
    assertEquals(BooleanArray.equals(a, b), true);
  });

  await t.step("should return false for different arrays", () => {
    const a = new BooleanArray(100);
    const b = new BooleanArray(100);
    a.setBool(0, true);
    b.setBool(1, true);
    assertEquals(BooleanArray.equals(a, b), false);
  });

  await t.step("should return false for arrays of different sizes", () => {
    const a = new BooleanArray(100);
    const b = new BooleanArray(200);
    assertEquals(BooleanArray.equals(a, b), false);
  });

  await t.step("should handle empty arrays", () => {
    const a = new BooleanArray(100);
    const b = new BooleanArray(100);
    assertEquals(BooleanArray.equals(a, b), true);
  });

  await t.step("should handle full arrays", () => {
    const a = new BooleanArray(100);
    const b = new BooleanArray(100);
    a.setAll();
    b.setAll();
    assertEquals(BooleanArray.equals(a, b), true);
  });

  await t.step("should handle arrays with same population but different positions", () => {
    const a = new BooleanArray(100);
    const b = new BooleanArray(100);
    a.setBool(0, true);
    b.setBool(1, true);
    assertEquals(BooleanArray.equals(a, b), false);
    assertEquals(a.getPopulationCount(), b.getPopulationCount());
  });

  await t.step("should handle chunk boundary cases", () => {
    const a = new BooleanArray(100);
    const b = new BooleanArray(100);
    a.setBool(31, true);
    a.setBool(32, true);
    b.setBool(31, true);
    b.setBool(32, true);
    assertEquals(BooleanArray.equals(a, b), true);
  });
});

Deno.test("BooleanArray - Static Difference Operation", async (t) => {
  await t.step("should compute basic difference correctly", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(32);

    a.setBool(0, true);
    a.setBool(1, true);
    b.setBool(1, true);
    b.setBool(2, true);

    const result = BooleanArray.difference(a, b);
    assertEquals(result.getBool(0), true); // In a but not in b
    assertEquals(result.getBool(1), false); // In both
    assertEquals(result.getBool(2), false); // In b but not in a
  });

  await t.step("should handle empty result case", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(32);

    a.setBool(0, true);
    b.setBool(0, true);

    const result = BooleanArray.difference(a, b);
    assertEquals(result.isEmpty(), true);
  });

  await t.step("should handle full result case", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(32);

    a.setAll();
    // b remains empty

    const result = BooleanArray.difference(a, b);
    assertEquals([...result.truthyIndices()].length, 32);
  });

  await t.step("should handle chunk boundary cases", () => {
    const a = new BooleanArray(100);
    const b = new BooleanArray(100);

    a.setBool(31, true);
    a.setBool(32, true);
    b.setBool(32, true);
    b.setBool(33, true);

    const result = BooleanArray.difference(a, b);
    assertEquals(result.getBool(31), true);
    assertEquals(result.getBool(32), false);
    assertEquals(result.getBool(33), false);
  });

  await t.step("should throw on mismatched sizes", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);

    assertThrows(() => BooleanArray.difference(a, b), Error);
  });

  await t.step("should handle large arrays", () => {
    const size = 1000;
    const a = new BooleanArray(size);
    const b = new BooleanArray(size);

    // Set every even bit in a and every third bit in b
    for (let i = 0; i < size; i += 2) a.setBool(i, true);
    for (let i = 0; i < size; i += 3) b.setBool(i, true);

    const result = BooleanArray.difference(a, b);

    // Verify some known positions
    assertEquals(result.getBool(2), true); // In a (even) but not in b (not third)
    assertEquals(result.getBool(6), false); // In both (even and third)
    assertEquals(result.getBool(9), false); // In b (third) but not in result
  });
});

Deno.test("BooleanArray - getFirstSetIndex with startIndex", async (t) => {
  await t.step("should find first set bit after startIndex", () => {
    const array = new BooleanArray(100);
    array.setBool(10, true);
    array.setBool(20, true);
    array.setBool(30, true);

    assertEquals(array.getFirstSetIndex(0), 10);
    assertEquals(array.getFirstSetIndex(10), 10);
    assertEquals(array.getFirstSetIndex(11), 20);
    assertEquals(array.getFirstSetIndex(21), 30);
  });

  await t.step("should handle chunk boundaries", () => {
    const array = new BooleanArray(100);
    array.setBool(31, true);
    array.setBool(32, true);
    array.setBool(33, true);

    assertEquals(array.getFirstSetIndex(31), 31);
    assertEquals(array.getFirstSetIndex(32), 32);
    assertEquals(array.getFirstSetIndex(33), 33);
  });

  await t.step("should return -1 when no set bits after startIndex", () => {
    const array = new BooleanArray(100);
    array.setBool(10, true);
    array.setBool(20, true);

    assertEquals(array.getFirstSetIndex(21), -1);
  });

  await t.step("should handle empty array", () => {
    const array = new BooleanArray(100);
    assertEquals(array.getFirstSetIndex(0), -1);
    assertEquals(array.getFirstSetIndex(50), -1);
  });

  await t.step("should handle full array", () => {
    const array = new BooleanArray(100);
    array.setAll();

    assertEquals(array.getFirstSetIndex(0), 0);
    assertEquals(array.getFirstSetIndex(50), 50);
    assertEquals(array.getFirstSetIndex(99), 99);
  });

  await t.step("should throw on invalid startIndex", () => {
    const array = new BooleanArray(100);

    assertThrows(() => array.getFirstSetIndex(-1), RangeError);
    assertThrows(() => array.getFirstSetIndex(100), RangeError);
    assertThrows(() => array.getFirstSetIndex(1.5), TypeError);
    assertThrows(() => array.getFirstSetIndex(NaN), TypeError);
  });

  await t.step("should handle sparse bit patterns", () => {
    const array = new BooleanArray(1000);
    const indices = [100, 500, 900];

    for (const index of indices) {
      array.setBool(index, true);
    }

    assertEquals(array.getFirstSetIndex(0), 100);
    assertEquals(array.getFirstSetIndex(100), 100);
    assertEquals(array.getFirstSetIndex(101), 500);
    assertEquals(array.getFirstSetIndex(501), 900);
  });

  await t.step("should handle dense bit patterns", () => {
    const array = new BooleanArray(100);
    array.setRange(20, 10, true); // Set bits 20-29

    assertEquals(array.getFirstSetIndex(0), 20);
    assertEquals(array.getFirstSetIndex(20), 20);
    assertEquals(array.getFirstSetIndex(25), 25);
    assertEquals(array.getFirstSetIndex(30), -1);
  });
});

Deno.test("BooleanArray - getLastSetIndex with startIndex", async (t) => {
  await t.step("should find last set bit before startIndex", () => {
    const array = new BooleanArray(100);
    array.setBool(10, true);
    array.setBool(20, true);
    array.setBool(30, true);

    assertEquals(array.getLastSetIndex(31), 30);
    assertEquals(array.getLastSetIndex(30), 20);
    assertEquals(array.getLastSetIndex(20), 10);
    assertEquals(array.getLastSetIndex(10), -1);
  });

  await t.step("should handle chunk boundaries", () => {
    const array = new BooleanArray(100);
    array.setBool(31, true);
    array.setBool(32, true);
    array.setBool(33, true);

    assertEquals(array.getLastSetIndex(34), 33);
    assertEquals(array.getLastSetIndex(33), 32);
    assertEquals(array.getLastSetIndex(32), 31);
    assertEquals(array.getLastSetIndex(31), -1);
  });

  await t.step("should return -1 when no set bits before startIndex", () => {
    const array = new BooleanArray(100);
    array.setBool(50, true);
    array.setBool(60, true);

    assertEquals(array.getLastSetIndex(40), -1);
  });

  await t.step("should handle empty array", () => {
    const array = new BooleanArray(100);
    assertEquals(array.getLastSetIndex(), -1);
    assertEquals(array.getLastSetIndex(50), -1);
  });

  await t.step("should handle full array", () => {
    const array = new BooleanArray(100);
    array.setAll();

    assertEquals(array.getLastSetIndex(), 99);
    assertEquals(array.getLastSetIndex(100), 99);
    assertEquals(array.getLastSetIndex(50), 49);
    assertEquals(array.getLastSetIndex(1), 0);
  });

  await t.step("should throw on invalid startIndex", () => {
    const array = new BooleanArray(100);

    assertThrows(() => array.getLastSetIndex(-1), RangeError);
    assertThrows(() => array.getLastSetIndex(101), RangeError);
    assertThrows(() => array.getLastSetIndex(1.5), TypeError);
    assertThrows(() => array.getLastSetIndex(NaN), TypeError);
  });

  await t.step("should handle sparse bit patterns", () => {
    const array = new BooleanArray(1000);
    const indices = [100, 500, 900];

    for (const index of indices) {
      array.setBool(index, true);
    }

    assertEquals(array.getLastSetIndex(1000), 900);
    assertEquals(array.getLastSetIndex(901), 900);
    assertEquals(array.getLastSetIndex(900), 500);
    assertEquals(array.getLastSetIndex(500), 100);
    assertEquals(array.getLastSetIndex(100), -1);
  });

  await t.step("should handle dense bit patterns", () => {
    const array = new BooleanArray(100);
    array.setRange(20, 10, true); // Set bits 20-29

    assertEquals(array.getLastSetIndex(30), 29);
    assertEquals(array.getLastSetIndex(25), 24);
    assertEquals(array.getLastSetIndex(20), -1);
  });

  await t.step("should handle startIndex at exact set bit positions", () => {
    const array = new BooleanArray(100);
    array.setBool(10, true);
    array.setBool(20, true);
    array.setBool(30, true);

    assertEquals(array.getLastSetIndex(31), 30);
    assertEquals(array.getLastSetIndex(30), 20);
    assertEquals(array.getLastSetIndex(20), 10);
  });

  await t.step("should handle large arrays with startIndex", () => {
    const size = 100_000;
    const array = new BooleanArray(size);
    array.setAll();

    assertEquals(array.getLastSetIndex(size), size - 1);
    assertEquals(array.getLastSetIndex(size - 1), size - 2);
    assertEquals(array.getLastSetIndex(32), 31);
  });
});

Deno.test("BooleanArray - Static fromArray Operation", async (t) => {
  await t.step("should create array from valid number array", () => {
    const indices = [0, 31, 32, 99];
    const array = BooleanArray.fromArray(indices, 100);

    assertEquals(array.size, 100);
    assertEquals(array.getBool(0), true);
    assertEquals(array.getBool(31), true);
    assertEquals(array.getBool(32), true);
    assertEquals(array.getBool(99), true);
    assertEquals(array.getPopulationCount(), 4);
  });

  await t.step("should handle empty input array", () => {
    const array = BooleanArray.fromArray([], 100);
    assertEquals(array.size, 100);
    assertEquals(array.isEmpty(), true);
  });

  await t.step("should handle sparse indices", () => {
    const indices = [0, 999, 9999];
    const size = 10000;
    const array = BooleanArray.fromArray(indices, size);

    assertEquals(array.size, size);
    assertEquals([...array.truthyIndices()], indices);
  });

  await t.step("should handle consecutive indices", () => {
    const indices = [10, 11, 12, 13, 14];
    const array = BooleanArray.fromArray(indices, 100);

    assertEquals(array.getBools(10, 5), [true, true, true, true, true]);
    assertEquals(array.getBool(9), false);
    assertEquals(array.getBool(15), false);
  });

  await t.step("should throw on non-number values", () => {
    assertThrows(
      // @ts-ignore - expected
      // deno-lint-ignore no-explicit-any
      () => BooleanArray.fromArray([1, "2" as any, 3], 100),
      TypeError,
      '"value" must be a safe integer.',
    );
  });

  await t.step("should throw on NaN values", () => {
    assertThrows(
      () => BooleanArray.fromArray([1, NaN, 3], 100),
      TypeError,
      '"value" must be a safe integer.',
    );
  });

  await t.step("should throw on out of bounds indices", () => {
    assertThrows(
      () => BooleanArray.fromArray([98, 99, 100], 100),
      RangeError,
    );
  });

  await t.step("should throw on negative indices", () => {
    assertThrows(
      () => BooleanArray.fromArray([-1, 0, 1], 100),
      RangeError,
    );
  });

  await t.step("should handle chunk boundary indices", () => {
    const indices = [31, 32, 33];
    const array = BooleanArray.fromArray(indices, 100);

    assertEquals(array.getBool(31), true);
    assertEquals(array.getBool(32), true);
    assertEquals(array.getBool(33), true);
    assertEquals(array.getPopulationCount(), 3);
  });

  await t.step("should handle large array size", () => {
    const size = 1_000_000; // A large but manageable size
    const indices = [0, size - 2, size - 1];
    const array = BooleanArray.fromArray(indices, size);

    assertEquals(array.size, size);
    assertEquals(array.getBool(0), true);
    assertEquals(array.getBool(size - 2), true);
    assertEquals(array.getBool(size - 1), true);
  });

  await t.step("should handle maximum valid size", () => {
    // Use a size that's large but won't cause overflow in bit operations
    const maxValidSize = Math.floor((2 ** 32 - 1) / 8); // Ensure safe bit operations
    const array = BooleanArray.fromArray([0, 1000, maxValidSize - 1], maxValidSize);

    assertEquals(array.size, maxValidSize);
    assertEquals(array.getBool(0), true);
    assertEquals(array.getBool(1000), true);
    assertEquals(array.getBool(maxValidSize - 1), true);
  });
});

Deno.test("BooleanArray - Static fromObjects Operation", async (t) => {
  await t.step("should create array from objects with valid number properties", () => {
    const objects = [
      { id: 0, name: "first" },
      { id: 31, name: "second" },
      { id: 32, name: "third" },
      { id: 99, name: "fourth" },
    ];
    const array = BooleanArray.fromObjects<{ id: number; name: string }>(100, "id", objects);

    assertEquals(array.size, 100);
    assertEquals(array.getBool(0), true);
    assertEquals(array.getBool(31), true);
    assertEquals(array.getBool(32), true);
    assertEquals(array.getBool(99), true);
    assertEquals(array.getPopulationCount(), 4);
  });

  await t.step("should handle empty objects array", () => {
    const objects: Array<{ id: number }> = [];
    const array = BooleanArray.fromObjects<{ id: number }>(100, "id", objects);

    assertEquals(array.size, 100);
    assertEquals(array.isEmpty(), true);
  });

  await t.step("should handle sparse indices in objects", () => {
    const objects = [
      { pos: 0 },
      { pos: 999 },
      { pos: 9999 },
    ];
    const size = 10000;
    const array = BooleanArray.fromObjects<{ pos: number }>(size, "pos", objects);

    assertEquals(array.size, size);
    assertEquals([...array.truthyIndices()], [0, 999, 9999]);
  });

  await t.step("should handle consecutive indices in objects", () => {
    const objects = [
      { index: 10 },
      { index: 11 },
      { index: 12 },
      { index: 13 },
      { index: 14 },
    ];
    const array = BooleanArray.fromObjects<{ index: number }>(100, "index", objects);

    assertEquals(array.getBools(10, 5), [true, true, true, true, true]);
    assertEquals(array.getBool(9), false);
    assertEquals(array.getBool(15), false);
  });

  await t.step("should throw on non-number property values", () => {
    const objects = [
      { id: 1 },
      { id: "2" }, // Invalid: string instead of number
      { id: 3 },
    ];

    assertThrows(
      // @ts-ignore - Testing runtime behavior with invalid types
      () => BooleanArray.fromObjects(100, "id", objects),
      TypeError,
    );
  });

  await t.step("should throw on NaN property values", () => {
    const objects = [
      { val: 1 },
      { val: NaN },
      { val: 3 },
    ];

    assertThrows(
      () => BooleanArray.fromObjects(100, "val", objects),
      TypeError,
    );
  });

  await t.step("should throw on out of bounds indices", () => {
    const objects = [
      { pos: 98 },
      { pos: 99 },
      { pos: 100 }, // Invalid: equal to size
    ];

    assertThrows(
      () => BooleanArray.fromObjects(100, "pos", objects),
      RangeError,
    );
  });

  await t.step("should throw on negative indices", () => {
    const objects = [
      { pos: -1 }, // Invalid: negative
      { pos: 0 },
      { pos: 1 },
    ];

    assertThrows(
      () => BooleanArray.fromObjects(100, "pos", objects),
      RangeError,
    );
  });

  await t.step("should handle chunk boundary indices", () => {
    const objects = [
      { idx: 31 },
      { idx: 32 },
      { idx: 33 },
    ];
    const array = BooleanArray.fromObjects<{ idx: number }>(100, "idx", objects);

    assertEquals(array.getBool(31), true);
    assertEquals(array.getBool(32), true);
    assertEquals(array.getBool(33), true);
    assertEquals(array.getPopulationCount(), 3);
  });

  await t.step("should handle large array size", () => {
    const size = 1_000_000;
    const objects = [
      { pos: 0 },
      { pos: size - 2 },
      { pos: size - 1 },
    ];
    const array = BooleanArray.fromObjects<{ pos: number }>(size, "pos", objects);

    assertEquals(array.size, size);
    assertEquals(array.getBool(0), true);
    assertEquals(array.getBool(size - 2), true);
    assertEquals(array.getBool(size - 1), true);
  });

  await t.step("should handle maximum valid size", () => {
    const maxValidSize = Math.floor((2 ** 32 - 1) / 8);
    const objects = [
      { pos: 0 },
      { pos: 1000 },
      { pos: maxValidSize - 1 },
    ];
    const array = BooleanArray.fromObjects<{ pos: number }>(maxValidSize, "pos", objects);

    assertEquals(array.size, maxValidSize);
    assertEquals(array.getBool(0), true);
    assertEquals(array.getBool(1000), true);
    assertEquals(array.getBool(maxValidSize - 1), true);
  });

  await t.step("should handle objects with missing properties", () => {
    const objects = [
      { id: 1 },
      {}, // Missing id property
      { id: 3 },
    ];

    assertThrows(
      // @ts-ignore - Testing runtime behavior with invalid types
      () => BooleanArray.fromObjects(100, "id", objects),
      TypeError,
    );
  });

  await t.step("should handle objects with undefined property values", () => {
    const objects = [
      { id: 1 },
      { id: undefined },
      { id: 3 },
    ];

    assertThrows(
      // @ts-ignore - Testing runtime behavior with invalid types
      () => BooleanArray.fromObjects(100, "id", objects),
      TypeError,
    );
  });

  await t.step("should handle duplicate indices", () => {
    const objects = [
      { val: 1 },
      { val: 2 },
      { val: 1 }, // Duplicate index
    ];
    const array = BooleanArray.fromObjects<{ val: number }>(100, "val", objects);

    assertEquals(array.getPopulationCount(), 2);
    assertEquals(array.getBool(1), true);
    assertEquals(array.getBool(2), true);
  });
});

Deno.test("BooleanArray - Static Bitwise Operations (Comprehensive)", async (t) => {
  const sizesToTest = [32, 33, 35, 64, 65]; // Aligned and non-aligned

  for (const size of sizesToTest) {
    await t.step(`NOT operation (size ${size})`, () => {
      const a = new BooleanArray(size);
      a.setAll(); // All true
      const result = BooleanArray.not(a);
      assertEquals(result.getPopulationCount(), 0, `Population count should be 0 after NOT on all true (size ${size})`);
      for (let i = 0; i < size; i++) assertEquals(result.getBool(i), false, `Bit ${i} should be false (size ${size})`);
      assertUnusedBitsZero(result, `BooleanArray.not (size ${size}, from all true)`);

      const b = new BooleanArray(size); // All false
      const result2 = BooleanArray.not(b);
      assertEquals(
        result2.getPopulationCount(),
        size,
        `Population count should be ${size} after NOT on all false (size ${size})`,
      );
      for (let i = 0; i < size; i++) assertEquals(result2.getBool(i), true, `Bit ${i} should be true (size ${size})`);
      assertUnusedBitsZero(result2, `BooleanArray.not (size ${size}, from all false)`);
    });

    await t.step(`NAND operation (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);
      a.setAll(); // a is all true
      b.setAll(); // b is all true
      const result = BooleanArray.nand(a, b); // true NAND true = false
      assertEquals(result.getPopulationCount(), 0, `NAND(all_true, all_true) pop count (size ${size})`);
      assertUnusedBitsZero(result, `BooleanArray.nand (all_true, all_true, size ${size})`);

      a.clear(); // a is all false
      const result2 = BooleanArray.nand(a, b); // false NAND true = true
      assertEquals(result2.getPopulationCount(), size, `NAND(all_false, all_true) pop count (size ${size})`);
      assertUnusedBitsZero(result2, `BooleanArray.nand (all_false, all_true, size ${size})`);
    });

    await t.step(`NOR operation (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);
      a.setBool(0, true); // a = [1,0,0...]
      b.setBool(1, true); // b = [0,1,0...]
      const result = BooleanArray.nor(a, b); // nor([1,0..],[0,1..]) -> first two false, rest true
      // Expected: ~(a[i] | b[i]). ~(1|0)=~1=0. ~(0|1)=~1=0. ~(0|0)=~0=1.
      if (size > 0) assertEquals(result.getBool(0), false, `NOR bit 0 (size ${size})`);
      if (size > 1) assertEquals(result.getBool(1), false, `NOR bit 1 (size ${size})`);
      for (let i = 2; i < size; i++) assertEquals(result.getBool(i), true, `NOR bit ${i} (size ${size})`);
      assertEquals(result.getPopulationCount(), Math.max(0, size - 2), `NOR pop count (size ${size})`);
      assertUnusedBitsZero(result, `BooleanArray.nor (size ${size})`);
    });

    await t.step(`XNOR operation (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);

      a.setAll(); // 'a' is logically all true [1,1,1,...]

      b.setAll(); // Initialize 'b' to be all true [1,1,1,...]
      if (size > 0) {
        b.setBool(0, false); // Set first bit of 'b' to false. 'b' is now logically [0,1,1,...]
      }
      // If size is 0, 'a' and 'b' are empty, xnor is well-defined (empty result).

      // Perform a.xnor(b):
      // a_initial: [1,1,1,...]
      // b_initial: [0,1,1,...]
      // XNOR means true if bits are equal.
      // a[0] (true) XNOR b[0] (false) => false. So a[0] becomes false.
      // a[i] (true) XNOR b[i] (true) for i>0 => true. So a[i] stays true.
      // Thus, 'a' should become logically [0,1,1,...]
      a.xnor(b);

      // Assertions:
      if (size > 0) {
        assertEquals(a.getBool(0), false, `Instance XNOR bit 0 (size ${size}) should be false`);
      }
      for (let i = 1; i < size; i++) {
        assertEquals(a.getBool(i), true, `Instance XNOR bit ${i} (size ${size}) should be true`);
      }
      // Population count for [0,1,1,...] is (size - 1) if size > 0, or 0 if size is 0.
      assertEquals(
        a.getPopulationCount(),
        Math.max(0, size > 0 ? size - 1 : 0),
        `Instance XNOR pop count (size ${size})`,
      );
      assertUnusedBitsZero(a, `instance a.xnor(b) (size ${size})`);
    });

    await t.step(`XOR operation (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);
      a.setBool(0, true);
      a.setBool(1, true);
      b.setBool(1, true);
      b.setBool(2, true);
      // a = [1,1,0,0...]
      // b = [0,1,1,0...]
      //xor= [1,0,1,0...]
      const result = BooleanArray.xor(a, b);
      if (size > 0) assertEquals(result.getBool(0), true);
      if (size > 1) assertEquals(result.getBool(1), false);
      if (size > 2) assertEquals(result.getBool(2), true);
      for (let i = 3; i < size; i++) assertEquals(result.getBool(i), false);
      assertUnusedBitsZero(result, `BooleanArray.xor (size ${size})`);
    });
  }
});

Deno.test("BooleanArray - Instance Bitwise Operations (Comprehensive)", async (t) => {
  const sizesToTest = [32, 33, 35, 64, 65];

  for (const size of sizesToTest) {
    await t.step(`instance not() (size ${size})`, () => {
      const a = new BooleanArray(size);
      a.setAll();
      a.not();
      assertEquals(a.getPopulationCount(), 0);
      assertUnusedBitsZero(a, `instance a.not() (size ${size}, from all true)`);

      const b = new BooleanArray(size);
      b.not();
      assertEquals(b.getPopulationCount(), size);
      assertUnusedBitsZero(b, `instance b.not() (size ${size}, from all false)`);
    });

    await t.step(`instance nand(other) (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);
      a.setAll();
      b.setAll();
      a.nand(b); // a becomes NAND(a,b)
      assertEquals(a.getPopulationCount(), 0);
      assertUnusedBitsZero(a, `instance a.nand(b) (all_true, all_true, size ${size})`);
    });

    await t.step(`instance nor(other) (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);
      if (size > 0) a.setBool(0, true);
      if (size > 1) b.setBool(1, true);
      a.nor(b);
      assertEquals(a.getPopulationCount(), Math.max(0, size - 2));
      assertUnusedBitsZero(a, `instance a.nor(b) (size ${size})`);
    });

    await t.step(`instance xnor(other) (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);

      a.setAll(); // 'a' is logically all true [1,1,1,...]

      b.setAll(); // Initialize 'b' to be all true [1,1,1,...]
      if (size > 0) {
        b.setBool(0, false); // Set first bit of 'b' to false. 'b' is now logically [0,1,1,...]
      }
      // If size is 0, 'a' and 'b' are empty, xnor is well-defined (empty result).

      // Perform a.xnor(b):
      // a_initial: [1,1,1,...]
      // b_initial: [0,1,1,...]
      // XNOR means true if bits are equal.
      // a[0] (true) XNOR b[0] (false) => false. So a[0] becomes false.
      // a[i] (true) XNOR b[i] (true) for i>0 => true. So a[i] stays true.
      // Thus, 'a' should become logically [0,1,1,...]
      a.xnor(b);

      // Assertions:
      if (size > 0) {
        assertEquals(a.getBool(0), false, `Instance XNOR bit 0 (size ${size}) should be false`);
      }
      for (let i = 1; i < size; i++) {
        assertEquals(a.getBool(i), true, `Instance XNOR bit ${i} (size ${size}) should be true`);
      }
      // Population count for [0,1,1,...] is (size - 1) if size > 0, or 0 if size is 0.
      assertEquals(
        a.getPopulationCount(),
        Math.max(0, size > 0 ? size - 1 : 0),
        `Instance XNOR pop count (size ${size})`,
      );
      assertUnusedBitsZero(a, `instance a.xnor(b) (size ${size})`);
    });

    await t.step(`instance and(other) (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);
      if (size > 0) a.setBool(0, true);
      if (size > 0) a.setBool(1, true); // a = [1,1,0...]
      if (size > 1) b.setBool(1, true);
      if (size > 2) b.setBool(2, true); // b = [0,1,1,0...]
      a.and(b); // a should be [0,1,0,0...]
      if (size > 0) assertEquals(a.getBool(0), false);
      if (size > 1) assertEquals(a.getBool(1), true);
      if (size > 2) assertEquals(a.getBool(2), false);
      assertUnusedBitsZero(a, `instance a.and(b) (size ${size})`);
    });

    await t.step(`instance or(other) (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);
      if (size > 0) a.setBool(0, true); // a = [1,0,0...]
      if (size > 1) b.setBool(1, true); // b = [0,1,0...]
      a.or(b); // a should be [1,1,0,0...]
      if (size > 0) assertEquals(a.getBool(0), true);
      if (size > 1) assertEquals(a.getBool(1), true);
      if (size > 2) assertEquals(a.getBool(2), false);
      assertUnusedBitsZero(a, `instance a.or(b) (size ${size})`);
    });

    await t.step(`instance xor(other) (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);
      if (size > 0) a.setBool(0, true);
      if (size > 1) a.setBool(1, true); // a = [1,1,0...]
      if (size > 1) b.setBool(1, true);
      if (size > 2) b.setBool(2, true); // b = [0,1,1,0...]
      a.xor(b); // a should be [1,0,1,0...]
      if (size > 0) assertEquals(a.getBool(0), true);
      if (size > 1) assertEquals(a.getBool(1), false);
      if (size > 2) assertEquals(a.getBool(2), true);
      assertUnusedBitsZero(a, `instance a.xor(b) (size ${size})`);
    });

    await t.step(`instance difference(other) (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);
      if (size > 0) a.setBool(0, true);
      if (size > 1) a.setBool(1, true); // a = [1,1,0...]
      if (size > 1) b.setBool(1, true);
      if (size > 2) b.setBool(2, true); // b = [0,1,1,0...]
      a.difference(b); // a should be [1,0,0,0...]
      if (size > 0) assertEquals(a.getBool(0), true);
      if (size > 1) assertEquals(a.getBool(1), false);
      if (size > 2) assertEquals(a.getBool(2), false);
      assertUnusedBitsZero(a, `instance a.difference(b) (size ${size})`);
    });
  }
});

Deno.test("BooleanArray - Internal Utilities and Validation", async (t) => {
  await t.step("BooleanArray.validateValue", () => {
    assertEquals(BooleanArray.validateValue(0, 10), 0);
    assertEquals(BooleanArray.validateValue(9, 10), 9);
    assertThrows(() => BooleanArray.validateValue(-1, 10), RangeError, '"value" must be greater than or equal to 0.');
    assertThrows(
      () => BooleanArray.validateValue(10, 10),
      RangeError,
      "Index 10 is out of bounds for array of size 10.",
    );
    assertThrows(() => BooleanArray.validateValue(NaN, 10), TypeError, '"value" must be a safe integer.');
    assertThrows(() => BooleanArray.validateValue(1.5, 10), TypeError, '"value" must be a safe integer.');
    assertThrows(() => BooleanArray.validateValue(BooleanArray.MAX_SAFE_SIZE + 1), RangeError);
    assertEquals(BooleanArray.validateValue(0), 0); // maxSize is optional
    assertEquals(BooleanArray.validateValue(BooleanArray.MAX_SAFE_SIZE), BooleanArray.MAX_SAFE_SIZE);
  });

  await t.step("BooleanArray.isValidValue", () => {
    assertEquals(BooleanArray.isValidValue(5, 10), true);
    assertEquals(BooleanArray.isValidValue(10, 10), false);
    assertEquals(BooleanArray.isValidValue(-1, 10), false);
    assertEquals(BooleanArray.isValidValue(NaN, 10), false);
    assertEquals(BooleanArray.isValidValue(BooleanArray.MAX_SAFE_SIZE + 1), false);
    assertEquals(BooleanArray.isValidValue(0), true);
  });

  await t.step("BooleanArray.getChunk", () => {
    assertEquals(BooleanArray.getChunk(0), 0);
    assertEquals(BooleanArray.getChunk(31), 0);
    assertEquals(BooleanArray.getChunk(32), 1);
    assertEquals(BooleanArray.getChunk(63), 1);
    assertEquals(BooleanArray.getChunk(64), 2);
  });

  await t.step("BooleanArray.getChunkCount", () => {
    assertEquals(BooleanArray.getChunkCount(0), 0); // Note: constructor validates size >=0, but getChunkCount can take 0
    assertEquals(BooleanArray.getChunkCount(1), 1);
    assertEquals(BooleanArray.getChunkCount(32), 1);
    assertEquals(BooleanArray.getChunkCount(33), 2);
    assertEquals(BooleanArray.getChunkCount(64), 2);
    assertEquals(BooleanArray.getChunkCount(65), 3);
  });

  await t.step("BooleanArray.getChunkOffset", () => {
    assertEquals(BooleanArray.getChunkOffset(0), 0);
    assertEquals(BooleanArray.getChunkOffset(31), 31);
    assertEquals(BooleanArray.getChunkOffset(32), 0);
    assertEquals(BooleanArray.getChunkOffset(63), 31);
    assertEquals(BooleanArray.getChunkOffset(64), 0);
  });
});

Deno.test("BooleanArray - forEachBool Operation", async (t) => {
  await t.step("should iterate over all set bits correctly", () => {
    const size = 65;
    const array = new BooleanArray(size);
    array.setBool(0, true);
    array.setBool(32, true);
    array.setBool(64, true);

    const visited: Record<number, boolean> = {};
    array.forEachBool((index, value) => {
      visited[index] = value;
    });

    assertEquals(Object.keys(visited).length, size);
    assertEquals(visited[0], true);
    assertEquals(visited[1], false);
    assertEquals(visited[32], true);
    assertEquals(visited[64], true);
  });

  await t.step("should respect startIndex and count", () => {
    const array = new BooleanArray(100);
    array.setRange(10, 5, true); // 10, 11, 12, 13, 14 are true

    const visited: Record<number, boolean> = {};
    array.forEachBool(
      (index, value) => {
        visited[index] = value;
      },
      12,
      5,
    ); // Start at 12, count 5 elements (12, 13, 14, 15, 16)

    assertEquals(Object.keys(visited).length, 5);
    assertEquals(visited[12], true);
    assertEquals(visited[13], true);
    assertEquals(visited[14], true);
    assertEquals(visited[15], false);
    assertEquals(visited[16], false);
    assert(visited[11] === undefined, "Should not visit index 11");
    assert(visited[17] === undefined, "Should not visit index 17");
  });

  await t.step("should pass the array itself as the third argument", () => {
    const array = new BooleanArray(5);
    let called = false;
    array.forEachBool((_index, _value, arr) => {
      called = true;
      assertEquals(arr, array);
    });
    assert(called, "Callback should have been called");
  });
});

Deno.test("BooleanArray - SetRange Edge Cases", async (t) => {
  await t.step("setRange to false", () => {
    const array = new BooleanArray(100);
    array.setAll();
    array.setRange(10, 20, false);
    for (let i = 0; i < 100; i++) {
      if (i >= 10 && i < 30) {
        assertEquals(array.getBool(i), false, `Bit ${i} should be false`);
      } else {
        assertEquals(array.getBool(i), true, `Bit ${i} should be true`);
      }
    }
    assertEquals(array.getPopulationCount(), 80);
  });

  await t.step("setRange covering entire array", () => {
    const array = new BooleanArray(65);
    array.setRange(0, 65, true);
    assertEquals(array.getPopulationCount(), 65);
    assertUnusedBitsZero(array, "setRange full true");
    array.setRange(0, 65, false);
    assertEquals(array.getPopulationCount(), 0);
    assertUnusedBitsZero(array, "setRange full false");
  });

  await t.step("setRange across multiple chunks (aligned and misaligned start/end)", () => {
    const array = new BooleanArray(100); // 3 full chunks + 4 bits
    // Set bits 30-70 to true (misaligned start, misaligned end, crosses chunk 1 and 2)
    array.setRange(30, 41, true); // 30 to 70 inclusive

    for (let i = 0; i < 100; i++) {
      if (i >= 30 && i <= 70) {
        assertEquals(array.getBool(i), true, `Bit ${i} (30-70) should be true`);
      } else {
        assertEquals(array.getBool(i), false, `Bit ${i} (outside 30-70) should be false`);
      }
    }
    assertEquals(array.getPopulationCount(), 41);
    assertUnusedBitsZero(array, "setRange 30-70 true");

    array.setRange(30, 41, false);
    assertEquals(array.getPopulationCount(), 0);
    assertUnusedBitsZero(array, "setRange 30-70 false");
  });

  await t.step("setRange with count 0", () => {
    const array = new BooleanArray(100);
    array.setAll();
    array.setRange(10, 0, false); // Should do nothing
    assertEquals(array.getPopulationCount(), 100);
  });
});

Deno.test("BooleanArray - isEmpty extended tests", async (t) => {
  await t.step("isEmpty after not() on non-aligned array", () => {
    const size = 33;
    const array = new BooleanArray(size);
    array.setAll(); // All true
    assertEquals(array.isEmpty(), false);
    array.not(); // All false (logically)
    assertEquals(array.isEmpty(), true, "Should be empty after not() on all true");
    assertUnusedBitsZero(array, "isEmpty after not()");
    array.not(); // All true again
    assertEquals(array.isEmpty(), false);
    assertUnusedBitsZero(array, "isEmpty after not() not()");
  });

  await t.step("isEmpty after nand() resulting in empty on non-aligned array", () => {
    const size = 33;
    const a = new BooleanArray(size);
    const b = new BooleanArray(size);
    a.setAll();
    b.setAll();
    const result = BooleanArray.nand(a, b);
    assertEquals(result.isEmpty(), true, "NAND(all_true, all_true) should be empty");
    assertUnusedBitsZero(result, "isEmpty after NAND");
  });
});

/// <reference lib="deno.ns" />
/// <reference lib="dom" />

Deno.test("BooleanArray - Constants Verification", async (t) => {
  await t.step("should have correct constant values", () => {
    assertEquals(BooleanArray.BITS_PER_INT, 32);
    assertEquals(BooleanArray.CHUNK_MASK, 31);
    assertEquals(BooleanArray.CHUNK_SHIFT, 5);
    assertEquals(BooleanArray.ALL_BITS, 4294967295); // 2^32 - 1
    assertEquals(BooleanArray.MAX_SAFE_SIZE, 536870911); // Math.floor((2^32 - 1) / 8)
  });

  await t.step("should verify constants are mathematically consistent", () => {
    assertEquals(BooleanArray.CHUNK_MASK, BooleanArray.BITS_PER_INT - 1);
    assertEquals(BooleanArray.CHUNK_SHIFT, Math.log2(BooleanArray.BITS_PER_INT));
    assertEquals(BooleanArray.ALL_BITS, 0xFFFFFFFF); // Direct hex representation is clearer
  });
});

Deno.test("BooleanArray - Size 1 Array Edge Cases", async (t) => {
  await t.step("should handle size 1 array operations correctly", () => {
    const array = new BooleanArray(1);
    assertEquals(array.size, 1);
    assertEquals(array.length, 1); // Should need 1 chunk

    // Test basic operations
    assertEquals(array.getBool(0), false);
    array.setBool(0, true);
    assertEquals(array.getBool(0), true);
    assertEquals(array.getPopulationCount(), 1);

    // Test toggle
    assertEquals(array.toggleBool(0), false);
    assertEquals(array.getBool(0), false);

    // Test range operations
    array.setRange(0, 1, true);
    assertEquals(array.getBool(0), true);

    // Test iteration
    const indices = [...array.truthyIndices()];
    assertEquals(indices, [0]);
  });

  await t.step("should handle size 1 array bitwise operations", () => {
    const a = new BooleanArray(1);
    const b = new BooleanArray(1);

    a.setBool(0, true);
    b.setBool(0, false);

    // Test all bitwise operations
    assertEquals(BooleanArray.and(a, b).getBool(0), false);
    assertEquals(BooleanArray.or(a, b).getBool(0), true);
    assertEquals(BooleanArray.xor(a, b).getBool(0), true);
    assertEquals(BooleanArray.nand(a, b).getBool(0), true);
    assertEquals(BooleanArray.nor(a, b).getBool(0), false);
    assertEquals(BooleanArray.xnor(a, b).getBool(0), false);
    assertEquals(BooleanArray.not(a).getBool(0), false);
    assertEquals(BooleanArray.difference(a, b).getBool(0), true);
  });
});

Deno.test("BooleanArray - Error Message Accuracy", async (t) => {
  await t.step("should throw correct error messages for fromArray", () => {
    // Test non-number values
    assertThrows(
      // @ts-ignore - Testing runtime behavior
      () => BooleanArray.fromArray([1, "2", 3], 100),
      TypeError,
      '"value" must be a safe integer.',
    );

    // Test NaN values
    assertThrows(
      () => BooleanArray.fromArray([1, NaN, 3], 100),
      TypeError,
      '"value" must be a safe integer.',
    );

    // Test negative values
    assertThrows(
      () => BooleanArray.fromArray([-1, 0, 1], 100),
      RangeError,
      '"value" must be greater than or equal to 0.',
    );
  });

  await t.step("should throw correct error messages for fromObjects", () => {
    // Test non-number property values
    assertThrows(
      // @ts-ignore - Testing runtime behavior
      () => BooleanArray.fromObjects(100, "id", [{ id: 1 }, { id: "2" }, { id: 3 }]),
      TypeError,
      '"value" must be a safe integer.',
    );

    // Test undefined property values
    assertThrows(
      // @ts-ignore - Testing runtime behavior
      () => BooleanArray.fromObjects(100, "id", [{ id: 1 }, { id: undefined }, { id: 3 }]),
      TypeError,
      '"value" must be a safe integer.',
    );
  });
});

Deno.test("BooleanArray - In-Place Operations Verification", async (t) => {
  await t.step("should verify in-place operations modify original array", () => {
    const original = new BooleanArray(32);
    const other = new BooleanArray(32);

    original.setBool(0, true);
    other.setBool(1, true);

    const originalRef = original;

    // Test that in-place operations return the same reference
    assertEquals(original.and(other), originalRef);
    assertEquals(original.or(other), originalRef);
    assertEquals(original.xor(other), originalRef);
    assertEquals(original.nand(other), originalRef);
    assertEquals(original.nor(other), originalRef);
    assertEquals(original.xnor(other), originalRef);
    assertEquals(original.not(), originalRef);
    assertEquals(original.difference(other), originalRef);
  });
});

Deno.test("BooleanArray - Loop Unrolling Coverage", async (t) => {
  await t.step("should test both unrolled and non-unrolled paths", () => {
    // Test arrays that are divisible by 4 (unrolled path)
    const unrolledSize = 128; // 4 chunks, divisible by 4
    const a1 = new BooleanArray(unrolledSize);
    const b1 = new BooleanArray(unrolledSize);
    a1.setAll();
    b1.setRange(0, 64, true);

    const result1 = BooleanArray.and(a1, b1);
    assertEquals(result1.getPopulationCount(), 64);

    // Test arrays that are NOT divisible by 4 (non-unrolled remainder)
    const nonUnrolledSize = 127; // Not divisible by 4
    const a2 = new BooleanArray(nonUnrolledSize);
    const b2 = new BooleanArray(nonUnrolledSize);
    a2.setAll();
    b2.setRange(0, 63, true);

    const result2 = BooleanArray.and(a2, b2);
    assertEquals(result2.getPopulationCount(), 63);
  });
});

Deno.test("BooleanArray - Null and Undefined Input Handling", async (t) => {
  await t.step("should handle null and undefined inputs appropriately", () => {
    const array = new BooleanArray(100);

    // These should throw TypeError for non-number inputs
    assertThrows(
      // @ts-ignore - Testing runtime behavior
      () => array.getBool(null),
      TypeError,
    );

    assertThrows(
      // @ts-ignore - Testing runtime behavior
      () => array.setBool(undefined, true),
      TypeError,
    );

    assertThrows(
      // @ts-ignore - Testing runtime behavior
      () => array.toggleBool(null),
      TypeError,
    );
  });
});

Deno.test("BooleanArray - Comprehensive Chunk Boundary Testing", async (t) => {
  await t.step("should handle operations exactly at 32-bit boundaries", () => {
    const sizes = [31, 32, 33, 63, 64, 65];

    for (const size of sizes) {
      const array = new BooleanArray(size);

      // Test setting the last bit
      array.setBool(size - 1, true);
      assertEquals(array.getBool(size - 1), true);
      assertEquals(array.getPopulationCount(), 1);

      // Test operations around chunk boundaries
      if (size > 32) {
        array.setBool(31, true); // Last bit of first chunk
        array.setBool(32, true); // First bit of second chunk
        // Calculate expected count: if size-1 is 31 or 32, we only have unique bits, otherwise we have 3
        const expectedCount = (size - 1 === 31 || size - 1 === 32) ? 2 : 3;
        assertEquals(array.getPopulationCount(), expectedCount);
      }

      // Test range operations across boundaries
      if (size >= 34) {
        array.clear();
        array.setRange(30, 4, true); // Crosses chunk boundary
        assertEquals(array.getBool(30), true);
        assertEquals(array.getBool(31), true);
        assertEquals(array.getBool(32), true);
        assertEquals(array.getBool(33), true);
      }
    }
  });
});

Deno.test("BooleanArray - Advanced Iterator Edge Cases", async (t) => {
  await t.step("should handle iterator edge cases correctly", () => {
    const array = new BooleanArray(100);

    // Test iterator with no set bits
    assertEquals([...array.truthyIndices()], []);

    // Test iterator with only last bit set
    array.setBool(99, true);
    assertEquals([...array.truthyIndices()], [99]);

    // Test iterator with bits at chunk boundaries
    array.clear();
    array.setBool(31, true);
    array.setBool(32, true);
    assertEquals([...array.truthyIndices()], [31, 32]);

    // Test iterator with range that includes no set bits
    array.clear();
    array.setBool(10, true);
    array.setBool(90, true);
    assertEquals([...array.truthyIndices(20, 80)], []);
  });
});

Deno.test("BooleanArray - Masking Verification", async (t) => {
  await t.step("should properly mask unused bits in all operations", () => {
    const sizes = [33, 35, 63, 65]; // Non-aligned sizes

    for (const size of sizes) {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);

      // Fill arrays completely (this tests masking in setAll)
      a.setAll();
      b.setAll();

      // Verify no unused bits are set
      const lastChunkIndex = a.length - 1;
      const bitsInLastChunk = size % 32;
      if (bitsInLastChunk > 0) {
        const unusedMask = 0xFFFFFFFF << bitsInLastChunk;
        assertEquals(a[lastChunkIndex]! & unusedMask, 0, `setAll should mask unused bits (size ${size})`);
      }

      // Test that operations maintain proper masking
      const operations = [
        () => BooleanArray.not(a),
        () => BooleanArray.and(a, b),
        () => BooleanArray.or(a, b),
        () => BooleanArray.xor(a, b),
        () => BooleanArray.nand(a, b),
        () => BooleanArray.nor(a, b),
        () => BooleanArray.xnor(a, b),
      ];

      for (const op of operations) {
        const result = op();
        if (bitsInLastChunk > 0) {
          const unusedMask = 0xFFFFFFFF << bitsInLastChunk;
          assertEquals(
            result[lastChunkIndex]! & unusedMask,
            0,
            `Operation should mask unused bits (size ${size})`,
          );
        }
      }
    }
  });
});

Deno.test("BooleanArray - Constructor Edge Cases", async (t) => {
  await t.step("should handle constructor with minimum valid size", () => {
    const array = new BooleanArray(1);
    assertEquals(array.size, 1);
    assertEquals(array.length, 1);
  });

  await t.step("should handle constructor with maximum valid size", () => {
    // Use a smaller size that's still large but manageable for testing
    const maxTestSize = 1000000;
    const array = new BooleanArray(maxTestSize);
    assertEquals(array.size, maxTestSize);
    assertEquals(array.isEmpty(), true);
  });

  await t.step("should throw on zero size", () => {
    assertThrows(
      () => new BooleanArray(0),
      RangeError,
      '"size" must be greater than or equal to 1.',
    );
  });
});

Deno.test("BooleanArray - Performance Regression Tests", async (t) => {
  await t.step("should handle large operations efficiently", () => {
    const size = 100000;
    const a = new BooleanArray(size);
    const b = new BooleanArray(size);

    // These operations should complete quickly
    const start = performance.now();

    a.setAll();
    b.setRange(0, size / 2, true);
    const result = BooleanArray.and(a, b);
    assertEquals(result.getPopulationCount(), size / 2);

    const end = performance.now();
    const duration = end - start;

    // Should complete in reasonable time (adjust threshold as needed)
    assert(duration < 100, `Large operation took too long: ${duration}ms`);
  });
});

Deno.test("BooleanArray - Static Method Parameter Validation", async (t) => {
  await t.step("should validate static method parameters correctly", () => {
    const validArray = new BooleanArray(32);

    // Test static operations with mismatched array sizes (this will actually throw)
    const smallArray = new BooleanArray(16);
    assertThrows(
      () => BooleanArray.and(validArray, smallArray),
      Error,
      "Arrays must have the same size",
    );

    assertThrows(
      () => BooleanArray.or(validArray, smallArray),
      Error,
      "Arrays must have the same size",
    );
  });
});

Deno.test("BooleanArray - TruthyIndices Comprehensive Tests", async (t) => {
  await t.step("should handle empty array correctly", () => {
    const array = new BooleanArray(32);
    const indices = [...array.truthyIndices()];
    assertEquals(indices, []);
  });

  await t.step("should handle single bit set", () => {
    const array = new BooleanArray(32);
    array.setBool(5, true);
    const indices = [...array.truthyIndices()];
    assertEquals(indices, [5]);
  });

  await t.step("should handle multiple bits set", () => {
    const array = new BooleanArray(32);
    array.setBool(0, true);
    array.setBool(15, true);
    array.setBool(31, true);
    const indices = [...array.truthyIndices()];
    assertEquals(indices, [0, 15, 31]);
  });

  await t.step("should handle bits across chunk boundaries", () => {
    const array = new BooleanArray(64);
    array.setBool(31, true); // Last bit of first chunk
    array.setBool(32, true); // First bit of second chunk
    array.setBool(33, true); // Second bit of second chunk
    const indices = [...array.truthyIndices()];
    assertEquals(indices, [31, 32, 33]);
  });

  await t.step("should handle range parameters correctly", () => {
    const array = new BooleanArray(100);
    array.setBool(10, true);
    array.setBool(20, true);
    array.setBool(30, true);
    array.setBool(40, true);
    array.setBool(50, true);

    // Test different ranges
    assertEquals([...array.truthyIndices(0, 15)], [10]);
    assertEquals([...array.truthyIndices(15, 35)], [20, 30]);
    assertEquals([...array.truthyIndices(35, 100)], [40, 50]);
    assertEquals([...array.truthyIndices(0, 100)], [10, 20, 30, 40, 50]);
    assertEquals([...array.truthyIndices(11, 49)], [20, 30, 40]);
  });

  await t.step("should handle edge cases in ranges", () => {
    const array = new BooleanArray(100);
    array.setBool(0, true);
    array.setBool(99, true);

    // Test ranges at boundaries
    assertEquals([...array.truthyIndices(0, 1)], [0]);
    assertEquals([...array.truthyIndices(99, 100)], [99]);
    assertEquals([...array.truthyIndices(1, 99)], []);
  });

  await t.step("should handle dense bit patterns", () => {
    const array = new BooleanArray(100);
    // Set bits 20-29 (10 consecutive bits)
    array.setRange(20, 10, true);

    const indices = [...array.truthyIndices()];
    assertEquals(indices, [20, 21, 22, 23, 24, 25, 26, 27, 28, 29]);

    // Test with range parameters
    assertEquals([...array.truthyIndices(22, 27)], [22, 23, 24, 25, 26]);
  });

  await t.step("should handle sparse bit patterns", () => {
    const array = new BooleanArray(1000);
    const expectedIndices = [0, 100, 500, 999];

    for (const index of expectedIndices) {
      array.setBool(index, true);
    }

    assertEquals([...array.truthyIndices()], expectedIndices);
    assertEquals([...array.truthyIndices(100, 600)], [100, 500]);
  });

  await t.step("should handle all bits set", () => {
    const array = new BooleanArray(64);
    array.setAll();

    const indices = [...array.truthyIndices()];
    assertEquals(indices.length, 64);
    for (let i = 0; i < 64; i++) {
      assertEquals(indices[i], i);
    }
  });

  await t.step("should handle bits at chunk boundaries with ranges", () => {
    const array = new BooleanArray(100);
    array.setBool(31, true);
    array.setBool(32, true);
    array.setBool(33, true);

    assertEquals([...array.truthyIndices(31, 33)], [31, 32]);
    assertEquals([...array.truthyIndices(32, 34)], [32, 33]);
    assertEquals([...array.truthyIndices(31, 34)], [31, 32, 33]);
  });

  await t.step("should handle non-aligned array sizes", () => {
    const sizes = [31, 33, 63, 65];
    for (const size of sizes) {
      const array = new BooleanArray(size);
      array.setAll();
      const indices = [...array.truthyIndices()];
      assertEquals(indices.length, size, `Size ${size} should have ${size} truthy indices`);
      for (let i = 0; i < size; i++) {
        assertEquals(indices[i], i, `Size ${size} should have index ${i}`);
      }
    }
  });

  await t.step("should handle empty ranges correctly", () => {
    const array = new BooleanArray(100);
    array.setBool(50, true);

    assertEquals([...array.truthyIndices(0, 0)], []);
    assertEquals([...array.truthyIndices(51, 51)], []);
    assertEquals([...array.truthyIndices(60, 50)], []); // Invalid range
  });

  await t.step("should handle ranges that start with set bits", () => {
    const array = new BooleanArray(100);
    array.setBool(20, true);
    array.setBool(21, true);
    array.setBool(22, true);

    assertEquals([...array.truthyIndices(20, 23)], [20, 21, 22]);
    assertEquals([...array.truthyIndices(21, 23)], [21, 22]);
  });

  await t.step("should handle ranges that end with set bits", () => {
    const array = new BooleanArray(100);
    array.setBool(20, true);
    array.setBool(21, true);
    array.setBool(22, true);

    assertEquals([...array.truthyIndices(19, 22)], [20, 21]);
    assertEquals([...array.truthyIndices(19, 21)], [20]);
  });

  await t.step("should handle alternating bit patterns", () => {
    const array = new BooleanArray(32);
    // Set every other bit
    for (let i = 0; i < 32; i += 2) {
      array.setBool(i, true);
    }

    const indices = [...array.truthyIndices()];
    assertEquals(indices.length, 16);
    for (let i = 0; i < 16; i++) {
      assertEquals(indices[i], i * 2);
    }
  });

  await t.step("should handle maximum valid range", () => {
    const size = 1000;
    const array = new BooleanArray(size);
    array.setAll();

    const indices = [...array.truthyIndices(0, size)];
    assertEquals(indices.length, size);
    for (let i = 0; i < size; i++) {
      assertEquals(indices[i], i);
    }
  });

  await t.step("should throw on invalid ranges", () => {
    const array = new BooleanArray(100);

    assertThrows(() => [...array.truthyIndices(-1)], RangeError);
    assertThrows(() => [...array.truthyIndices(0, 101)], RangeError);
    assertThrows(() => [...array.truthyIndices(NaN)], TypeError);
    assertThrows(() => [...array.truthyIndices(0, NaN)], TypeError);
    assertThrows(() => [...array.truthyIndices(1.5)], TypeError);
    assertThrows(() => [...array.truthyIndices(0, 1.5)], TypeError);
  });

  await t.step("should handle performance with large sparse arrays", () => {
    const size = 1_000_000;
    const array = new BooleanArray(size);

    // Set every 10000th bit
    for (let i = 0; i < size; i += 10000) {
      array.setBool(i, true);
    }

    const start = performance.now();
    const indices = [...array.truthyIndices()];
    const duration = performance.now() - start;

    // Calculate expected count: (last_index - first_index) / step + 1
    // Last index is the largest multiple of 10000 less than size
    const lastIndex = Math.floor((size - 1) / 10000) * 10000;
    const expectedCount = (lastIndex - 0) / 10000 + 1;
    assertEquals(indices.length, expectedCount);
    assert(duration < 100, `Large sparse array iteration took too long: ${duration}ms`);

    // Verify the actual indices
    for (let i = 0; i < indices.length; i++) {
      assertEquals(indices[i], i * 10000, `Index at position ${i} should be ${i * 10000}`);
    }
  });

  await t.step("should handle performance with large dense arrays", () => {
    const size = 1_000_000;
    const array = new BooleanArray(size);

    // Set 1000 consecutive bits
    array.setRange(500000, 1000, true);

    const start = performance.now();
    const indices = [...array.truthyIndices()];
    const duration = performance.now() - start;

    assertEquals(indices.length, 1000);
    assert(duration < 100, `Large dense array iteration took too long: ${duration}ms`);
  });
});
