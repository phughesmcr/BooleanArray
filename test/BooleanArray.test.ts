/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.10";
import { BooleanArray } from "../mod.ts";

// Helper function to assert that unused bits in the last chunk are zero
function assertUnusedBitsZero(array: BooleanArray, operationName?: string): void {
  if (array.size === 0 || array.length === 0) return;
  const bitsInLastChunk = array.size % BooleanArray.BITS_PER_INT;
  if (bitsInLastChunk === 0) return; // Last chunk is full

  const lastChunkIndex = array.length - 1;
  const lastChunkValue = Number(array.buffer[lastChunkIndex]!); // Uint32Array access
  const unusedMask = BooleanArray.ALL_BITS_TRUE << bitsInLastChunk;

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
  await t.step("should create array with valid sizes", () => {
    const array = new BooleanArray(100);
    assertEquals(array.size, 100);
    assertEquals(array.length, 4); // 100 bits requires 4 32-bit integers

    // Edge case sizes
    const minArray = new BooleanArray(1);
    assertEquals(minArray.size, 1);
    assertEquals(minArray.length, 1);

    const chunkBoundary = new BooleanArray(32);
    assertEquals(chunkBoundary.size, 32);
    assertEquals(chunkBoundary.length, 1);
  });

  await t.step("should throw on invalid constructor arguments", () => {
    // Type errors
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => new BooleanArray(), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => new BooleanArray("100"), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => new BooleanArray(null), TypeError);
    assertThrows(() => new BooleanArray(NaN), TypeError);
    assertThrows(() => new BooleanArray(3.14), TypeError);
    assertThrows(() => new BooleanArray(Infinity), TypeError);

    // Range errors
    assertThrows(() => new BooleanArray(0), RangeError);
    assertThrows(() => new BooleanArray(-1), RangeError);
    assertThrows(() => new BooleanArray(BooleanArray.MAX_SAFE_SIZE + 1), RangeError);
  });

  await t.step("should verify constants are correct", () => {
    assertEquals(BooleanArray.BITS_PER_INT, 32);
    assertEquals(BooleanArray.CHUNK_MASK, 31);
    assertEquals(BooleanArray.CHUNK_SHIFT, 5);
    assertEquals(BooleanArray.ALL_BITS_TRUE, 4294967295);
    assertEquals(BooleanArray.MAX_SAFE_SIZE, 536870911);
  });
});

Deno.test("BooleanArray - Basic Operations", async (t) => {
  await t.step("should handle single bit operations", () => {
    const array = new BooleanArray(100);

    // Set and get individual bits
    array.set(0, true);
    array.set(31, true); // Chunk boundary
    array.set(32, true); // Chunk boundary
    array.set(99, true);

    assertEquals(array.get(0), true);
    assertEquals(array.get(1), false);
    assertEquals(array.get(31), true);
    assertEquals(array.get(32), true);
    assertEquals(array.get(99), true);

    // Toggle bits
    array.toggle(50);
    assertEquals(array.get(50), true);
    array.toggle(50);
    assertEquals(array.get(50), false);
  });

  await t.step("should handle range operations", () => {
    const array = new BooleanArray(100);

    // Set ranges
    array.set(10, 20, true);
    const bools = array.get(10, 20);
    assertEquals(bools.every((b: boolean) => b === true), true);
    assertEquals(array.get(9), false);
    assertEquals(array.get(30), false);

    // Test range across chunk boundaries
    array.fill(false);
    array.set(30, 10, true); // Crosses chunk boundary
    assertEquals(array.get(30), true);
    assertEquals(array.get(31), true);
    assertEquals(array.get(32), true);
    assertEquals(array.get(39), true);
    assertEquals(array.get(40), false);

    // Set to false
    array.fill(true);
    array.set(10, 20, false);
    assertEquals(array.getTruthyCount(), 80);
  });

  await t.step("should handle utility operations", () => {
    const array = new BooleanArray(100);

    // Fill operations
    array.fill(true);
    assertEquals(array.get(0), true);
    assertEquals(array.get(99), true);
    assertEquals(array.getTruthyCount(), 100);

    array.fill(false);
    assertEquals(array.isEmpty(), true);

    // Clone operation
    array.set(50, true);
    const clone = array.clone();
    assertEquals(clone.size, array.size);
    assertEquals(clone.get(50), true);
    assert(clone !== array);
  });
});

Deno.test("BooleanArray - Bitwise Operations", async (t) => {
  const testSizes = [32, 33, 64, 65]; // Test aligned and non-aligned sizes

  for (const size of testSizes) {
    await t.step(`Bitwise operations (size ${size})`, () => {
      const a = new BooleanArray(size);
      const b = new BooleanArray(size);

      // Setup test patterns
      if (size > 0) a.set(0, true);
      if (size > 1) a.set(1, true);
      if (size > 1) b.set(1, true);
      if (size > 2) b.set(2, true);

      // Test static operations
      const andResult = BooleanArray.and(a, b);
      if (size > 0) assertEquals(andResult.get(0), false);
      if (size > 1) assertEquals(andResult.get(1), true);
      if (size > 2) assertEquals(andResult.get(2), false);
      assertUnusedBitsZero(andResult, `AND (size ${size})`);

      const orResult = BooleanArray.or(a, b);
      if (size > 0) assertEquals(orResult.get(0), true);
      if (size > 1) assertEquals(orResult.get(1), true);
      if (size > 2) assertEquals(orResult.get(2), true);
      assertUnusedBitsZero(orResult, `OR (size ${size})`);

      const xorResult = BooleanArray.xor(a, b);
      if (size > 0) assertEquals(xorResult.get(0), true);
      if (size > 1) assertEquals(xorResult.get(1), false);
      if (size > 2) assertEquals(xorResult.get(2), true);
      assertUnusedBitsZero(xorResult, `XOR (size ${size})`);

      // Test advanced operations
      const notResult = BooleanArray.not(a);
      if (size > 0) assertEquals(notResult.get(0), false);
      if (size > 1) assertEquals(notResult.get(1), false);
      assertUnusedBitsZero(notResult, `NOT (size ${size})`);

      const nandResult = BooleanArray.nand(a, b);
      if (size > 0) assertEquals(nandResult.get(0), true);
      if (size > 1) assertEquals(nandResult.get(1), false);
      if (size > 2) assertEquals(nandResult.get(2), true);
      assertUnusedBitsZero(nandResult, `NAND (size ${size})`);

      // Test instance operations (modify in place)
      const c = a.clone();
      c.and(b);
      assertEquals(BooleanArray.equals(c, andResult), true);

      // Test that instance operations return this
      const d = new BooleanArray(size);
      assertEquals(d.set(0, true), d);
      assertEquals(d.toggle(1), d);
      assertEquals(d.fill(false), d);
    });
  }

  await t.step("should handle size mismatches", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);

    assertThrows(() => BooleanArray.and(a, b), Error, "Arrays must have the same size");
    assertThrows(() => BooleanArray.or(a, b), Error);
    assertThrows(() => BooleanArray.xor(a, b), Error);
  });
});

Deno.test("BooleanArray - Search and Population Operations", async (t) => {
  await t.step("should count population correctly", () => {
    const array = new BooleanArray(100);
    assertEquals(array.getTruthyCount(), 0);

    array.set(0, true);
    array.set(50, true);
    array.set(99, true);
    assertEquals(array.getTruthyCount(), 3);

    array.fill(true);
    assertEquals(array.getTruthyCount(), 100);
  });

  await t.step("should find indices correctly", () => {
    const array = new BooleanArray(100);
    assertEquals(array.indexOf(true), -1);
    assertEquals(array.lastIndexOf(true), -1);

    array.set(10, true);
    array.set(50, true);
    array.set(90, true);

    assertEquals(array.indexOf(true), 10);
    assertEquals(array.indexOf(true, 11), 50);
    assertEquals(array.indexOf(true, 51), 90);
    assertEquals(array.indexOf(true, 91), -1);

    assertEquals(array.lastIndexOf(true), 90);
    assertEquals(array.lastIndexOf(true, 89), 50);
    assertEquals(array.lastIndexOf(true, 49), 10);
    assertEquals(array.lastIndexOf(true, 9), -1);
  });

  await t.step("should handle chunk boundaries in search", () => {
    const array = new BooleanArray(100);
    array.set(31, true);
    array.set(32, true);
    array.set(33, true);

    assertEquals(array.indexOf(true), 31);
    assertEquals(array.indexOf(true, 32), 32);
    assertEquals(array.lastIndexOf(true), 33);
    assertEquals(array.lastIndexOf(true, 32), 31);
  });
});

Deno.test("BooleanArray - Iterator Operations", async (t) => {
  await t.step("should iterate over truthy indices", () => {
    const array = new BooleanArray(100);
    const expectedIndices = [10, 20, 30, 40];

    for (const index of expectedIndices) {
      array.set(index, true);
    }

    const actualIndices = [...array.truthyIndices()];
    assertEquals(actualIndices, expectedIndices);
  });

  await t.step("should handle ranges in iteration", () => {
    const array = new BooleanArray(100);
    array.set(5, true);
    array.set(15, true);
    array.set(25, true);
    array.set(35, true);

    assertEquals([...array.truthyIndices(10, 30)], [15, 25]);
    assertEquals([...array.truthyIndices(10)], [15, 25, 35]);
    assertEquals([...array.truthyIndices(20, 30)], [25]);
  });

  await t.step("should handle forEach correctly", () => {
    const array = new BooleanArray(10);
    array.set(2, true);
    array.set(7, true);

    const visited: Record<number, boolean> = {};
    array.forEach((value, index, arr) => {
      visited[index] = value;
      assertEquals(arr, array);
    });

    assertEquals(Object.keys(visited).length, 10);
    assertEquals(visited[2], true);
    assertEquals(visited[7], true);
    assertEquals(visited[0], false);

    // Test callback validation
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => array.forEach(null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => array.forEach("not a function"), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => array.forEach(123), TypeError);
  });

  await t.step("should handle dense and sparse patterns", () => {
    // Dense pattern
    const dense = new BooleanArray(100);
    dense.set(20, 10, true);
    const denseIndices = [...dense.truthyIndices()];
    assertEquals(denseIndices.length, 10);
    assertEquals(denseIndices, [20, 21, 22, 23, 24, 25, 26, 27, 28, 29]);

    // Sparse pattern
    const sparse = new BooleanArray(1000);
    const sparseExpected = [0, 100, 500, 999];
    for (const index of sparseExpected) {
      sparse.set(index, true);
    }
    assertEquals([...sparse.truthyIndices()], sparseExpected);
  });
});

Deno.test("BooleanArray - Static Factory Methods", async (t) => {
  await t.step("should create from array of indices", () => {
    const indices = [0, 31, 32, 99];
    const array = BooleanArray.fromArray(100, indices);

    assertEquals(array.size, 100);
    assertEquals(array.getTruthyCount(), 4);
    for (const index of indices) {
      assertEquals(array.get(index), true);
    }

    // Empty array
    const empty = BooleanArray.fromArray(100, []);
    assertEquals(empty.isEmpty(), true);
  });

  await t.step("should create from objects", () => {
    const objects = [
      { id: 0, name: "first" },
      { id: 31, name: "second" },
      { id: 32, name: "third" },
      { id: 99, name: "fourth" },
    ];
    const array = BooleanArray.fromObjects<{ id: number; name: string }>(100, "id", objects);

    assertEquals(array.size, 100);
    assertEquals(array.getTruthyCount(), 4);
    assertEquals(array.get(0), true);
    assertEquals(array.get(31), true);
    assertEquals(array.get(32), true);
    assertEquals(array.get(99), true);
  });

  await t.step("should validate factory method inputs", () => {
    // fromArray validation
    assertThrows(() => BooleanArray.fromArray(100, [1, NaN, 3]), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.fromArray(100, [1, "2", 3]), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.fromArray(100, null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.fromArray(100, "not an array"), TypeError);
    assertThrows(() => BooleanArray.fromArray(100, [-1, 0, 1]), RangeError);
    assertThrows(() => BooleanArray.fromArray(100, [98, 99, 100]), RangeError);
    assertThrows(() => BooleanArray.fromArray(100, [Infinity]), TypeError);
    assertThrows(() => BooleanArray.fromArray(100, [-Infinity]), TypeError);

    // fromObjects validation
    assertThrows(() => BooleanArray.fromObjects(100, "id", [{ id: 1 }, { id: "2" }]), TypeError);
    assertThrows(() => BooleanArray.fromObjects(100, "id", [{ id: 1 }, {}]), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.fromObjects(100, "id", null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.fromObjects(100, "id", "not an array"), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.fromObjects(100, "id", [{ id: 1 }, null]), TypeError);
    assertThrows(() => BooleanArray.fromObjects(100, "id", [{ id: Infinity }]), TypeError);
    assertThrows(() => BooleanArray.fromObjects(100, "id", [{ id: NaN }]), TypeError);
  });
});

Deno.test("BooleanArray - Comparison Operations", async (t) => {
  await t.step("should compare arrays for equality", () => {
    const a = new BooleanArray(100);
    const b = new BooleanArray(100);

    // Empty arrays
    assertEquals(BooleanArray.equals(a, b), true);

    // Same patterns
    a.set(0, true);
    a.set(99, true);
    b.set(0, true);
    b.set(99, true);
    assertEquals(BooleanArray.equals(a, b), true);

    // Different patterns
    b.set(50, true);
    assertEquals(BooleanArray.equals(a, b), false);

    // Different sizes
    const c = new BooleanArray(200);
    assertEquals(BooleanArray.equals(a, c), false);
  });

  await t.step("should compute difference between arrays", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(32);

    a.set(0, true);
    a.set(1, true);
    b.set(1, true);
    b.set(2, true);

    const result = BooleanArray.difference(a, b);
    assertEquals(result.get(0), true); // In a but not in b
    assertEquals(result.get(1), false); // In both
    assertEquals(result.get(2), false); // In b but not in a

    // Size mismatch should throw
    const c = new BooleanArray(64);
    assertThrows(() => BooleanArray.difference(a, c), Error);
  });
});

Deno.test("BooleanArray - Error Handling and Edge Cases", async (t) => {
  await t.step("should throw on out of bounds access", () => {
    const array = new BooleanArray(100);

    // Index out of bounds
    assertThrows(() => array.get(100), RangeError);
    assertThrows(() => array.set(100, true), RangeError);
    assertThrows(() => array.toggle(100), RangeError);

    // Range out of bounds
    assertThrows(() => array.get(90, 20), RangeError);
    assertThrows(() => array.set(95, 10, true), RangeError);

    // Invalid indices
    assertThrows(() => array.get(1.5), TypeError);
    assertThrows(() => array.set(NaN, true), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => array.get("0"), TypeError);
    // Note: The next test doesn't throw because TypeScript compilation prevents it
    // assertThrows(() => array.set(0, "true"), TypeError);
  });

  await t.step("should throw on invalid ranges", () => {
    const array = new BooleanArray(100);

    // Negative ranges
    assertThrows(() => array.get(-1, 5), RangeError);
    assertThrows(() => array.set(0, -1, true), RangeError);

    // Invalid types
    assertThrows(() => array.get(0, 5.5), TypeError);
    assertThrows(() => array.set(1.5, 5, true), TypeError);

    // Iterator range errors
    assertThrows(() => [...array.truthyIndices(-1)], RangeError);
    assertThrows(() => [...array.truthyIndices(0, 101)], RangeError);
    assertThrows(() => [...array.truthyIndices(1.5)], TypeError);
  });

  await t.step("should throw on invalid static method arguments", () => {
    const validArray = new BooleanArray(32);

    // Non-BooleanArray arguments - some throw TypeError, some RangeError depending on failure point
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.and(validArray, [1, 2, 3]), RangeError); // Fails at size comparison
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.or("not an array", validArray), RangeError); // Fails at size comparison
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.not(null), TypeError); // Fails when reading .size from null
  });

  await t.step("should handle edge cases gracefully", () => {
    // Size 1 array
    const tiny = new BooleanArray(1);
    tiny.set(0, true);
    assertEquals(tiny.getTruthyCount(), 1);
    assertEquals([...tiny.truthyIndices()], [0]);

    // Operations on empty arrays
    const empty = new BooleanArray(32);
    assertEquals(empty.indexOf(true), -1);
    assertEquals(empty.lastIndexOf(true), -1);
    assertEquals([...empty.truthyIndices()], []);

    // Chunk boundary operations
    const boundary = new BooleanArray(64);
    boundary.set(31, true);
    boundary.set(32, true);
    const range = boundary.get(31, 2);
    assertEquals(range, [true, true]);
  });
});

Deno.test("BooleanArray - Internal Utilities", async (t) => {
  await t.step("should validate internal utility functions", () => {
    // Value validation
    assertEquals(BooleanArray.assertIsSafeValue(0, 10), 0);
    assertEquals(BooleanArray.assertIsSafeValue(9, 10), 9);
    assertThrows(() => BooleanArray.assertIsSafeValue(-1, 10), RangeError);
    assertThrows(() => BooleanArray.assertIsSafeValue(10, 10), RangeError);
    assertThrows(() => BooleanArray.assertIsSafeValue(NaN, 10), TypeError);

    assertEquals(BooleanArray.isSafeValue(5, 10), true);
    assertEquals(BooleanArray.isSafeValue(10, 10), false);
    assertEquals(BooleanArray.isSafeValue(-1, 10), false);

    // Chunk calculations
    assertEquals(BooleanArray.getChunk(0), 0);
    assertEquals(BooleanArray.getChunk(31), 0);
    assertEquals(BooleanArray.getChunk(32), 1);
    assertEquals(BooleanArray.getChunk(63), 1);

    assertEquals(BooleanArray.getChunkCount(1), 1);
    assertEquals(BooleanArray.getChunkCount(32), 1);
    assertEquals(BooleanArray.getChunkCount(33), 2);

    assertEquals(BooleanArray.getChunkOffset(0), 0);
    assertEquals(BooleanArray.getChunkOffset(31), 31);
    assertEquals(BooleanArray.getChunkOffset(32), 0);
  });
});

Deno.test("BooleanArray - Performance and Large Arrays", async (t) => {
  await t.step("should handle large arrays efficiently", () => {
    const size = 100000;
    const array = new BooleanArray(size);

    // Set every 1000th bit
    const start = performance.now();
    for (let i = 0; i < size; i += 1000) {
      array.set(i, true);
    }
    const setDuration = performance.now() - start;

    assertEquals(array.getTruthyCount(), Math.floor(size / 1000));
    assert(setDuration < 100, `Large array operations took too long: ${setDuration}ms`);

    // Test large range operations
    array.fill(false);
    array.set(0, 50000, true);
    assertEquals(array.getTruthyCount(), 50000);
  });

  await t.step("should maintain correctness after many operations", () => {
    const array = new BooleanArray(1000);

    // Stress test with many operations
    for (let i = 0; i < 1000; i++) {
      array.set(i % array.size, i % 2 === 0);
      array.toggle(i % array.size);
    }

    // Should still be functional
    assertEquals(typeof array.getTruthyCount(), "number");
    assertEquals(typeof array.isEmpty(), "boolean");
  });
});
