/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.10";
import { ALL_BITS_TRUE, and, BooleanArray, equals, fromArray, getChunkCount, not, or } from "../mod.ts";
import { assertUnusedBitsZero } from "./helpers.ts";

Deno.test("BooleanArray - Construction and Validation", async (t) => {
  await t.step("should create array with valid sizes", () => {
    const array = new BooleanArray(100);
    assertEquals(array.size, 100);
    assertEquals(array.wordLength, 4); // 100 bits requires 4 32-bit integers

    // Edge case sizes
    const minArray = new BooleanArray(1);
    assertEquals(minArray.size, 1);
    assertEquals(minArray.wordLength, 1);

    const chunkBoundary = new BooleanArray(32);
    assertEquals(chunkBoundary.size, 32);
    assertEquals(chunkBoundary.wordLength, 1);
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
    assertEquals(array.getCount(true), 80);

    // Zero-length get/set are safe no-ops and empty
    array.set(50, 0, true);
    assertEquals(array.getCount(true), 80);
    assertEquals(array.get(60, 0), []);
  });

  await t.step("should handle utility operations", () => {
    const array = new BooleanArray(100);

    // Fill operations
    array.fill(true);
    assertEquals(array.get(0), true);
    assertEquals(array.get(99), true);
    assertEquals(array.getCount(true), 100);

    array.fill(false);
    assertEquals(array.isEmpty(), true);

    // Clone operation
    array.set(50, true);
    const clone = array.clone();
    assertEquals(clone.size, array.size);
    assertEquals(clone.get(50), true);
    assert(clone !== array);
    // Deep copy semantics
    clone.toggle(50);
    assertEquals(clone.get(50), false);
    assertEquals(array.get(50), true);
  });
});

Deno.test("BooleanArray - Search and Population Operations", async (t) => {
  await t.step("should count population correctly", () => {
    const array = new BooleanArray(100);
    assertEquals(array.getCount(true), 0);

    array.set(0, true);
    array.set(50, true);
    array.set(99, true);
    assertEquals(array.getCount(true), 3);

    array.fill(true);
    assertEquals(array.getCount(true), 100);
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
    assertEquals(array.lastIndexOf(true, 32), 32); // search from index 32, finds at 32
  });

  await t.step("should handle negative fromIndex for indexOf", () => {
    const array = new BooleanArray(10);
    array.set(0, true);
    array.set(5, true);
    array.set(9, true);

    // negative fromIndex for indexOf (standard Array behavior)
    // -1 => size + (-1) = 9, start at index 9
    assertEquals(array.indexOf(true, -1), 9);
    // -2 => size + (-2) = 8, search from index 8, find at 9
    assertEquals(array.indexOf(true, -2), 9);
    // -5 => size + (-5) = 5, search from index 5, find at 5
    assertEquals(array.indexOf(true, -5), 5);
    // -10 => size + (-10) = 0, search from index 0, find at 0
    assertEquals(array.indexOf(true, -10), 0);
    // very negative => size + (-9999) < 0, clamp to 0
    assertEquals(array.indexOf(true, -9999), 0);
  });

  await t.step("should handle negative fromIndex for lastIndexOf", () => {
    const array = new BooleanArray(10);
    array.set(0, true);
    array.set(5, true);
    array.set(9, true);

    // negative fromIndex for lastIndexOf (backward search, standard Array behavior)
    // -1 => size + (-1) = 9, search from index 9 backwards
    assertEquals(array.lastIndexOf(true, -1), 9);
    // -2 => size + (-2) = 8, search from index 8 backwards, find at 5
    assertEquals(array.lastIndexOf(true, -2), 5);
    // -10 => size + (-10) = 0, search from index 0 backwards, find at 0
    assertEquals(array.lastIndexOf(true, -10), 0);
    // very negative => size + (-9999) < 0, return -1
    assertEquals(array.lastIndexOf(true, -9999), -1);
  });

  await t.step("should respect lastIndexOf starting at index 0", () => {
    const arr = fromArray(10, [0, 5, 9]);
    // fromIndex = 0 => search from index 0 backwards (only checks index 0)
    assertEquals(arr.lastIndexOf(true, 0), 0); // index 0 is true
    assertEquals(arr.lastIndexOf(false, 0), -1); // index 0 is true, not false
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
    // start >= end yields empty
    assertEquals([...array.truthyIndices(30, 30)], []);
    // end equal to size yields empty for this setup
    assertEquals([...array.truthyIndices(90, 100)], []);
  });

  await t.step("should handle forEach correctly", () => {
    const array = new BooleanArray(10);
    array.set(2, true);
    array.set(7, true);

    const visited: Record<number, boolean> = {};
    const result = array.forEach((value, index, arr) => {
      visited[index] = value;
      assertEquals(arr, array);
    });

    assert(result === array, "forEach should return this for chaining");
    assertEquals(Object.keys(visited).length, 10);
    assertEquals(visited[2], true);
    assertEquals(visited[7], true);
    assertEquals(visited[0], false);

    // Zero-length iteration is a no-op
    const count = { value: 0 };
    array.forEach(() => count.value++, 5, 0);
    assertEquals(count.value, 0);

    // Test callback validation
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => array.forEach(null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => array.forEach("not a function"), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => array.forEach(123), TypeError);
  });

  await t.step("should handle forEach with startIndex and count", () => {
    const array = new BooleanArray(10);
    array.set(2, true);
    array.set(3, true);
    array.set(7, true);
    const visited: number[] = [];
    array.forEach(
      (value, index) => {
        if (value) visited.push(index);
      },
      2,
      4,
    );
    assertEquals(visited, [2, 3]);
  });

  await t.step("should support iterator families", () => {
    const arr = fromArray(5, [1, 3]);
    assertEquals(Array.from(arr), [false, true, false, true, false]);
    assertEquals(Array.from(arr.values()), [false, true, false, true, false]);
    assertEquals(Array.from(arr.keys()), [0, 1, 2, 3, 4]);
    assertEquals(Array.from(arr.entries()), [
      [0, false],
      [1, true],
      [2, false],
      [3, true],
      [4, false],
    ]);
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

Deno.test("BooleanArray - Buffer Export and Length Semantics", async (t) => {
  await t.step("length should equal chunk count for various sizes", () => {
    const sizes = [1, 2, 31, 32, 33, 64, 65, 100, 128];
    for (const size of sizes) {
      const arr = new BooleanArray(size);
      assertEquals(arr.wordLength, getChunkCount(size));
    }
  });
});

Deno.test("BooleanArray - Search: last-chunk indexOf(false) masking", async (t) => {
  await t.step("size 33, bits 0 and 32 set, indexOf(false, 32) should be -1", () => {
    const arr = new BooleanArray(33);
    arr.set(0, true);
    arr.set(32, true);
    assertEquals(arr.indexOf(false, 32), -1);
  });

  await t.step("size 33 filled with true, indexOf(false, 32) should be -1", () => {
    const arr = new BooleanArray(33);
    arr.fill(true);
    assertEquals(arr.indexOf(false, 32), -1);
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

  await t.step("should throw on invalid functional arguments", () => {
    const validArray = new BooleanArray(32);

    // Non-BooleanArray arguments - some throw TypeError, some RangeError depending on failure point
    // @ts-ignore - Testing runtime behavior
    assertThrows(() => and(validArray, [1, 2, 3] as unknown as BooleanArray), RangeError); // Fails at size comparison
    // @ts-ignore - Testing runtime behavior
    assertThrows(() => or("not an array" as unknown as BooleanArray, validArray), RangeError); // Fails at size comparison
    // @ts-ignore - Testing runtime behavior
    assertThrows(() => not(null as unknown as BooleanArray), TypeError); // Fails when reading .size from null
  });

  await t.step("should handle edge cases gracefully", () => {
    // Size 1 array
    const tiny = new BooleanArray(1);
    tiny.set(0, true);
    assertEquals(tiny.getCount(true), 1);
    assertEquals([...tiny.truthyIndices()], [0]);

    // Operations on all-zero arrays
    const allZero = new BooleanArray(32);
    assertEquals(allZero.indexOf(true), -1);
    assertEquals(allZero.lastIndexOf(true), -1);
    assertEquals([...allZero.truthyIndices()], []);

    // Chunk boundary operations
    const boundary = new BooleanArray(64);
    boundary.set(31, true);
    boundary.set(32, true);
    const range = boundary.get(31, 2);
    assertEquals(range, [true, true]);
  });
});

Deno.test("BooleanArray - Stress Test", async (t) => {
  await t.step("should maintain correctness after many operations", () => {
    const array = new BooleanArray(1000);

    // Stress test with many operations
    // Each index i is set to (i % 2 === 0), then toggled
    for (let i = 0; i < 1000; i++) {
      array.set(i % array.size, i % 2 === 0);
      array.toggle(i % array.size);
    }

    // After the loop, verify the expected pattern:
    // Index 0: set true, toggle → false
    // Index 1: set false, toggle → true
    // Pattern: even indices are false, odd indices are true
    for (let i = 0; i < array.size; i++) {
      assertEquals(array.get(i), i % 2 !== 0, `Bit ${i} should be ${i % 2 !== 0}`);
    }
    assertEquals(array.getCount(true), 500); // 500 odd indices
  });
});

Deno.test("BooleanArray - forEachTruthy", async (t) => {
  await t.step("should iterate over truthy bits in ascending order", () => {
    const arr = fromArray(100, [5, 15, 32, 63, 95]);
    const visited: number[] = [];
    const result = arr.forEachTruthy((index) => visited.push(index));

    assert(result === arr, "forEachTruthy should return this for chaining");
    assertEquals(visited, [5, 15, 32, 63, 95]);
  });

  await t.step("should respect startIndex and endIndex", () => {
    const arr = BooleanArray.fromArray(100, [5, 15, 25, 35, 45]);
    const visited: number[] = [];

    arr.forEachTruthy((index) => visited.push(index), 10, 40);
    assertEquals(visited, [15, 25, 35]);
  });

  await t.step("should handle endIndex clipping", () => {
    const arr = BooleanArray.fromArray(50, [10, 20, 30, 40]);
    const visited: number[] = [];

    arr.forEachTruthy((index) => visited.push(index), 0, 35);
    assertEquals(visited, [10, 20, 30]);
  });

  await t.step("should handle empty ranges", () => {
    const arr = BooleanArray.fromArray(50, [10, 20, 30]);
    const visited: number[] = [];

    arr.forEachTruthy((index) => visited.push(index), 25, 25);
    assertEquals(visited, []);
  });

  await t.step("should validate callback", () => {
    const arr = new BooleanArray(10);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.forEachTruthy(null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.forEachTruthy("not a function"), TypeError);
  });

  await t.step("should validate indices", () => {
    const arr = new BooleanArray(100);

    // Negative startIndex
    assertThrows(() => arr.forEachTruthy(() => {}, -1), RangeError);

    // Float indices
    assertThrows(() => arr.forEachTruthy(() => {}, 1.5), TypeError);
    assertThrows(() => arr.forEachTruthy(() => {}, 0, 10.5), TypeError);

    // startIndex > endIndex
    assertThrows(() => arr.forEachTruthy(() => {}, 50, 20), RangeError);

    // Out of bounds
    assertThrows(() => arr.forEachTruthy(() => {}, 0, 101), RangeError);
  });

  await t.step("should handle last-chunk partial sizes", () => {
    const arr = BooleanArray.fromArray(33, [0, 31, 32]);
    const visited: number[] = [];
    arr.forEachTruthy((index) => visited.push(index));
    assertEquals(visited, [0, 31, 32]);
  });
});

Deno.test("BooleanArray - getInto", async (t) => {
  await t.step("should copy range into preallocated array", () => {
    const arr = BooleanArray.fromArray(10, [1, 3, 5, 7, 9]);
    const out = new Array<boolean>(5);
    const result = arr.getInto(0, 5, out);

    assert(result === arr, "getInto should return this for chaining");
    assertEquals(out, [false, true, false, true, false]);
  });

  await t.step("should copy across chunk boundaries", () => {
    const arr = BooleanArray.fromArray(100, [30, 31, 32, 33, 34]);
    const out = new Array<boolean>(10);
    arr.getInto(28, 10, out);
    assertEquals(out, [false, false, true, true, true, true, true, false, false, false]);
  });

  await t.step("should handle zero-length as no-op", () => {
    const arr = new BooleanArray(10);
    const out = [true, true];
    arr.getInto(5, 0, out);
    assertEquals(out, [true, true]); // Unchanged
  });

  await t.step("should validate out parameter", () => {
    const arr = new BooleanArray(10);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.getInto(0, 5, null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.getInto(0, 5, "not an array"), TypeError);
  });

  await t.step("should validate out array length", () => {
    const arr = new BooleanArray(10);
    const tooSmall = new Array<boolean>(3);
    assertThrows(() => arr.getInto(0, 5, tooSmall), RangeError);
  });

  await t.step("should validate range bounds", () => {
    const arr = new BooleanArray(10);
    const out = new Array<boolean>(10);

    assertThrows(() => arr.getInto(8, 5, out), RangeError); // Exceeds size
    assertThrows(() => arr.getInto(-1, 5, out), RangeError);
    assertThrows(() => arr.getInto(1.5, 5, out), TypeError);
  });
});

Deno.test("BooleanArray - clear", async (t) => {
  await t.step("should clear all bits to false", () => {
    const arr = BooleanArray.fromArray(100, [0, 31, 32, 99]);
    assertEquals(arr.getCount(true), 4);

    const result = arr.clear();
    assert(result === arr, "clear should return this for chaining");
    assertEquals(arr.getCount(true), 0);
    assertEquals(arr.isEmpty(), true);
  });

  await t.step("should be identical to fill(false)", () => {
    const a = BooleanArray.fromArray(64, [0, 10, 20, 30, 40, 50, 63]);
    const b = a.clone();

    a.clear();
    b.fill(false);

    assertEquals(equals(a, b), true);
  });

  await t.step("should preserve unused bits as zero", () => {
    const arr = BooleanArray.fromArray(33, [0, 15, 32]);
    arr.clear();
    assertUnusedBitsZero(arr, "clear");
  });
});

Deno.test("BooleanArray - Search for False", async (t) => {
  await t.step("indexOf(false) on all-zero array", () => {
    const arr = new BooleanArray(64);
    assertEquals(arr.indexOf(false), 0);
    assertEquals(arr.indexOf(false, 0), 0);
    assertEquals(arr.indexOf(false, 10), 10);
    assertEquals(arr.indexOf(false, 63), 63);
    assertEquals(arr.indexOf(false, 64), -1);
  });

  await t.step("indexOf(false) with negative fromIndex", () => {
    const arr = new BooleanArray(10);
    arr.fill(true);
    arr.set(8, false);

    assertEquals(arr.indexOf(false, -2), 8); // Start at 10 - 2 = 8
    assertEquals(arr.indexOf(false, -1), -1); // Start at 9, only index 8 is false
  });

  await t.step("indexOf(false) at last-chunk boundaries", () => {
    const arr = BooleanArray.fromArray(33, [0, 32]);
    assertEquals(arr.indexOf(false, 0), 1);
    assertEquals(arr.indexOf(false, 1), 1);
    assertEquals(arr.indexOf(false, 32), -1); // Only bit 32 remains, it's true
  });

  await t.step("indexOf(false) with last-chunk masking", () => {
    const arr = new BooleanArray(33);
    arr.fill(true);
    // All logical bits are true; unused bits in last chunk should not appear as false
    assertEquals(arr.indexOf(false, 0), -1);
    assertEquals(arr.indexOf(false, 32), -1);
  });

  await t.step("lastIndexOf(false) on all-zero array", () => {
    const arr = new BooleanArray(64);
    assertEquals(arr.lastIndexOf(false), 63); // default fromIndex = 63
    assertEquals(arr.lastIndexOf(false, 64), 63); // clamps to 63
    assertEquals(arr.lastIndexOf(false, 50), 50); // search from index 50, finds at 50
    assertEquals(arr.lastIndexOf(false, 0), 0); // search from index 0, finds at 0
  });

  await t.step("lastIndexOf(false) with negative fromIndex", () => {
    const arr = new BooleanArray(10);
    arr.fill(true);
    arr.set(2, false);

    assertEquals(arr.lastIndexOf(false, -1), 2); // 10 + (-1) = 9, search from 9, finds at 2
    assertEquals(arr.lastIndexOf(false, -7), 2); // 10 + (-7) = 3, search from 3, finds at 2
    assertEquals(arr.lastIndexOf(false, -8), 2); // 10 + (-8) = 2, search from 2, finds at 2
  });

  await t.step("lastIndexOf(false) at last-chunk boundaries", () => {
    const arr = BooleanArray.fromArray(33, [1, 31]);
    assertEquals(arr.lastIndexOf(false), 32); // search from 32, finds at 32
    assertEquals(arr.lastIndexOf(false, 33), 32); // clamps to 32, finds at 32
    assertEquals(arr.lastIndexOf(false, 32), 32); // search from 32, finds at 32
  });

  await t.step("lastIndexOf(false) with last-chunk masking", () => {
    const arr = new BooleanArray(33);
    arr.fill(true);
    // All logical bits are true; unused bits should not appear as false
    assertEquals(arr.lastIndexOf(false), -1);
    assertEquals(arr.lastIndexOf(false, 33), -1);
  });
});

Deno.test("BooleanArray - Boundary-Crossing Range Operations", async (t) => {
  await t.step("set range starting at 0", () => {
    const arr = new BooleanArray(64);
    arr.set(0, 10, true);
    assertEquals(arr.get(0, 10), new Array(10).fill(true));
    assertEquals(arr.get(10), false);
  });

  await t.step("set range starting at 31", () => {
    const arr = new BooleanArray(64);
    arr.set(31, 1, true);
    assertEquals(arr.get(31), true);
    assertEquals(arr.get(30), false);
    assertEquals(arr.get(32), false);
  });

  await t.step("set range starting at 32", () => {
    const arr = new BooleanArray(100);
    arr.set(32, 10, true);
    assertEquals(arr.get(31), false);
    assertEquals(arr.get(32, 10), new Array(10).fill(true));
    assertEquals(arr.get(42), false);
  });

  await t.step("set range crossing chunk boundary (31 bits)", () => {
    const arr = new BooleanArray(100);
    arr.set(20, 31, true);
    assertEquals(arr.get(19), false);
    assertEquals(arr.get(20, 31), new Array(31).fill(true));
    assertEquals(arr.get(51), false);
  });

  await t.step("set range of exactly 32 bits", () => {
    const arr = new BooleanArray(100);
    arr.set(10, 32, true);
    assertEquals(arr.get(9), false);
    assertEquals(arr.get(10, 32), new Array(32).fill(true));
    assertEquals(arr.get(42), false);
  });

  await t.step("set range of 33 bits crossing boundaries", () => {
    const arr = new BooleanArray(100);
    arr.set(30, 33, true);
    assertEquals(arr.get(29), false);
    assertEquals(arr.get(30, 33), new Array(33).fill(true));
    assertEquals(arr.get(63), false);
  });

  await t.step("set range at chunk boundary 63", () => {
    const arr = new BooleanArray(100);
    arr.set(63, 5, true);
    assertEquals(arr.get(62), false);
    assertEquals(arr.get(63, 5), new Array(5).fill(true));
    assertEquals(arr.get(68), false);
  });

  await t.step("get range mirrors set range", () => {
    const arr = new BooleanArray(100);
    const pattern = [true, false, true, true, false, false, true];

    for (let i = 0; i < pattern.length; i++) {
      arr.set(30 + i, pattern[i]!);
    }

    assertEquals(arr.get(30, 7), pattern);
  });
});

Deno.test("BooleanArray - truthyIndicesInto", async (t) => {
  await t.step("should copy truthy indices into preallocated Uint32Array", () => {
    const arr = BooleanArray.fromArray(100, [5, 15, 32, 63, 95]);
    const out = new Uint32Array(10);
    const count = arr.truthyIndicesInto(out);

    assertEquals(count, 5);
    assertEquals(out[0], 5);
    assertEquals(out[1], 15);
    assertEquals(out[2], 32);
    assertEquals(out[3], 63);
    assertEquals(out[4], 95);
  });

  await t.step("should respect startIndex and endIndex", () => {
    const arr = BooleanArray.fromArray(100, [5, 15, 25, 35, 45]);
    const out = new Uint32Array(10);
    const count = arr.truthyIndicesInto(out, 10, 40);

    assertEquals(count, 3);
    assertEquals(out[0], 15);
    assertEquals(out[1], 25);
    assertEquals(out[2], 35);
  });

  await t.step("should return 0 for empty ranges", () => {
    const arr = BooleanArray.fromArray(50, [10, 20, 30]);
    const out = new Uint32Array(10);
    const count = arr.truthyIndicesInto(out, 25, 25);

    assertEquals(count, 0);
  });

  await t.step("should return 0 for array with no truthy bits in range", () => {
    const arr = BooleanArray.fromArray(100, [5, 95]);
    const out = new Uint32Array(10);
    const count = arr.truthyIndicesInto(out, 10, 90);

    assertEquals(count, 0);
  });

  await t.step("should handle chunk boundary crossings", () => {
    const arr = BooleanArray.fromArray(100, [30, 31, 32, 33, 64, 65]);
    const out = new Uint32Array(10);
    const count = arr.truthyIndicesInto(out, 30, 66);

    assertEquals(count, 6);
    assertEquals(out[0], 30);
    assertEquals(out[1], 31);
    assertEquals(out[2], 32);
    assertEquals(out[3], 33);
    assertEquals(out[4], 64);
    assertEquals(out[5], 65);
  });

  await t.step("should handle last-chunk partial sizes", () => {
    const arr = BooleanArray.fromArray(33, [0, 31, 32]);
    const out = new Uint32Array(5);
    const count = arr.truthyIndicesInto(out);

    assertEquals(count, 3);
    assertEquals(out[0], 0);
    assertEquals(out[1], 31);
    assertEquals(out[2], 32);
  });

  await t.step("should write beyond buffer capacity and return total count", () => {
    const arr = BooleanArray.fromArray(100, [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);
    const out = new Uint32Array(3); // Smaller than needed
    const count = arr.truthyIndicesInto(out);

    assertEquals(count, 10); // Returns total count found
    assertEquals(out[0], 5); // First 3 written
    assertEquals(out[1], 15);
    assertEquals(out[2], 25);
  });

  await t.step("should validate out parameter type", () => {
    const arr = new BooleanArray(10);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.truthyIndicesInto(null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.truthyIndicesInto([]), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.truthyIndicesInto(new Array(10)), TypeError);
  });

  await t.step("should validate indices", () => {
    const arr = new BooleanArray(100);
    const out = new Uint32Array(10);

    assertThrows(() => arr.truthyIndicesInto(out, -1), RangeError);
    assertThrows(() => arr.truthyIndicesInto(out, 1.5), TypeError);
    assertThrows(() => arr.truthyIndicesInto(out, 0, 10.5), TypeError);
    assertThrows(() => arr.truthyIndicesInto(out, 50, 20), RangeError);
    assertThrows(() => arr.truthyIndicesInto(out, 0, 101), RangeError);
  });

  await t.step("should handle large arrays", () => {
    const arr = new BooleanArray(100000);
    arr.fill(true);
    const out = new Uint32Array(64);
    const count = arr.truthyIndicesInto(out);

    assertEquals(count, 100000);
    for (let i = 0; i < 64; i++) {
      assertEquals(out[i], i);
    }
  });

  await t.step("should handle all-true array", () => {
    const arr = new BooleanArray(64);
    arr.fill(true);
    const out = new Uint32Array(64);
    const count = arr.truthyIndicesInto(out);

    assertEquals(count, 64);
    for (let i = 0; i < 64; i++) {
      assertEquals(out[i], i);
    }
  });

  await t.step("should handle all-false array", () => {
    const arr = new BooleanArray(64);
    const out = new Uint32Array(10);
    const count = arr.truthyIndicesInto(out);

    assertEquals(count, 0);
  });
});

Deno.test("BooleanArray - nextIndexOf cursor APIs", async (t) => {
  await t.step("should scan truthy indices without iterator allocation", () => {
    const arr = BooleanArray.fromArray(100, [0, 5, 31, 32, 99]);
    const visited: number[] = [];

    for (let index = arr.nextTruthyIndex(); index !== -1; index = arr.nextTruthyIndex(index + 1)) {
      visited.push(index);
    }

    assertEquals(visited, [0, 5, 31, 32, 99]);
  });

  await t.step("should respect half-open ranges", () => {
    const arr = BooleanArray.fromArray(100, [5, 15, 25, 35, 45]);

    assertEquals(arr.nextTruthyIndex(10, 40), 15);
    assertEquals(arr.nextTruthyIndex(16, 40), 25);
    assertEquals(arr.nextTruthyIndex(36, 40), -1);
    assertEquals(arr.nextTruthyIndex(40, 40), -1);
  });

  await t.step("should scan falsy indices and ignore unused bits", () => {
    const arr = new BooleanArray(33);
    arr.fill(true);
    arr.set(10, false);

    assertEquals(arr.nextFalsyIndex(), 10);
    assertEquals(arr.nextFalsyIndex(11), -1);
    assertEquals(arr.nextIndexOf(false, 32, 33), -1);
  });

  await t.step("should validate ranges", () => {
    const arr = new BooleanArray(10);

    assertThrows(() => arr.nextTruthyIndex(-1), RangeError);
    assertThrows(() => arr.nextTruthyIndex(1.5), TypeError);
    assertThrows(() => arr.nextTruthyIndex(8, 7), RangeError);
    assertThrows(() => arr.nextTruthyIndex(0, 11), RangeError);
  });
});

Deno.test("BooleanArray - isFull", async (t) => {
  await t.step("should return false for empty array", () => {
    const arr = new BooleanArray(64);
    assertEquals(arr.isFull(), false);
  });

  await t.step("should return true for filled array", () => {
    const arr = new BooleanArray(64);
    arr.fill(true);
    assertEquals(arr.isFull(), true);
  });

  await t.step("should return false for partially filled array", () => {
    const arr = new BooleanArray(64);
    arr.fill(true);
    arr.set(0, false);
    assertEquals(arr.isFull(), false);
  });

  await t.step("should handle non-32-aligned sizes correctly", () => {
    // Size 33: last chunk has only 1 bit used
    const arr33 = new BooleanArray(33);
    arr33.fill(true);
    assertEquals(arr33.isFull(), true);

    arr33.set(32, false);
    assertEquals(arr33.isFull(), false);

    // Size 1: single bit
    const arr1 = new BooleanArray(1);
    assertEquals(arr1.isFull(), false);
    arr1.set(0, true);
    assertEquals(arr1.isFull(), true);
  });

  await t.step("should be consistent with isEmpty", () => {
    const arr = new BooleanArray(100);

    // Empty array
    assertEquals(arr.isEmpty(), true);
    assertEquals(arr.isFull(), false);

    // Full array
    arr.fill(true);
    assertEquals(arr.isEmpty(), false);
    assertEquals(arr.isFull(), true);

    // Partial array
    arr.set(50, false);
    assertEquals(arr.isEmpty(), false);
    assertEquals(arr.isFull(), false);
  });
});

Deno.test("BooleanArray - truthyIndices startIndex > endIndex validation", async (t) => {
  await t.step("should throw RangeError when startIndex > endIndex", () => {
    const arr = new BooleanArray(100);
    arr.set(50, true);

    assertThrows(
      () => [...arr.truthyIndices(50, 20)],
      RangeError,
      '"startIndex" must be less than or equal to "endIndex".',
    );

    assertThrows(
      () => [...arr.truthyIndices(100, 0)],
      RangeError,
      '"startIndex" must be less than or equal to "endIndex".',
    );
  });

  await t.step("should still allow startIndex === endIndex (empty range)", () => {
    const arr = new BooleanArray(100);
    arr.set(50, true);

    // startIndex === endIndex should return empty, not throw
    assertEquals([...arr.truthyIndices(30, 30)], []);
    assertEquals([...arr.truthyIndices(0, 0)], []);
    assertEquals([...arr.truthyIndices(100, 100)], []);
  });

  await t.step("should validate types before checking range", () => {
    const arr = new BooleanArray(100);

    // Type errors should take precedence
    assertThrows(() => [...arr.truthyIndices(NaN, 50)], TypeError);
    assertThrows(() => [...arr.truthyIndices(0, NaN)], TypeError);
    assertThrows(() => [...arr.truthyIndices(1.5, 50)], TypeError);
  });
});

Deno.test("BooleanArray - getCount(false)", async (t) => {
  await t.step("should return size minus truthy count", () => {
    const arr = new BooleanArray(100);
    assertEquals(arr.getCount(false), 100);
    assertEquals(arr.getCount(false), arr.size - arr.getCount(true));

    arr.set(0, true);
    arr.set(50, true);
    arr.set(99, true);
    assertEquals(arr.getCount(false), 97);
    assertEquals(arr.getCount(false), arr.size - arr.getCount(true));
  });

  await t.step("should return 0 when array is full", () => {
    const arr = new BooleanArray(64);
    arr.fill(true);
    assertEquals(arr.getCount(false), 0);
  });

  await t.step("should return size when array is empty", () => {
    const arr = new BooleanArray(100);
    assertEquals(arr.getCount(false), 100);
  });

  await t.step("should handle non-32-aligned sizes", () => {
    const arr = new BooleanArray(33);
    assertEquals(arr.getCount(false), 33);

    arr.fill(true);
    assertEquals(arr.getCount(false), 0);

    arr.set(32, false);
    assertEquals(arr.getCount(false), 1);
  });
});

Deno.test("BooleanArray - forEachFalsy", async (t) => {
  await t.step("should iterate over falsy bits in ascending order", () => {
    const arr = new BooleanArray(10);
    arr.fill(true);
    arr.set(2, false);
    arr.set(5, false);
    arr.set(8, false);

    const visited: number[] = [];
    const result = arr.forEachFalsy((index) => visited.push(index));

    assert(result === arr, "forEachFalsy should return this for chaining");
    assertEquals(visited, [2, 5, 8]);
  });

  await t.step("should iterate all indices when array is empty", () => {
    const arr = new BooleanArray(10);
    const visited: number[] = [];
    arr.forEachFalsy((index) => visited.push(index));
    assertEquals(visited, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  await t.step("should not iterate when array is full", () => {
    const arr = new BooleanArray(10);
    arr.fill(true);
    const visited: number[] = [];
    arr.forEachFalsy((index) => visited.push(index));
    assertEquals(visited, []);
  });

  await t.step("should respect startIndex and endIndex", () => {
    const arr = new BooleanArray(100);
    arr.fill(true);
    arr.set(5, false);
    arr.set(15, false);
    arr.set(25, false);
    arr.set(35, false);
    arr.set(45, false);

    const visited: number[] = [];
    arr.forEachFalsy((index) => visited.push(index), 10, 40);
    assertEquals(visited, [15, 25, 35]);
  });

  await t.step("should handle empty ranges", () => {
    const arr = new BooleanArray(50);
    const visited: number[] = [];
    arr.forEachFalsy((index) => visited.push(index), 25, 25);
    assertEquals(visited, []);
  });

  await t.step("should validate callback", () => {
    const arr = new BooleanArray(10);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.forEachFalsy(null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.forEachFalsy("not a function"), TypeError);
  });

  await t.step("should validate indices", () => {
    const arr = new BooleanArray(100);

    assertThrows(() => arr.forEachFalsy(() => {}, -1), RangeError);
    assertThrows(() => arr.forEachFalsy(() => {}, 1.5), TypeError);
    assertThrows(() => arr.forEachFalsy(() => {}, 0, 10.5), TypeError);
    assertThrows(() => arr.forEachFalsy(() => {}, 50, 20), RangeError);
    assertThrows(() => arr.forEachFalsy(() => {}, 0, 101), RangeError);
  });

  await t.step("should handle last-chunk partial sizes correctly", () => {
    // Size 33: last chunk has only 1 bit used
    const arr = new BooleanArray(33);
    arr.fill(true);
    arr.set(32, false);

    const visited: number[] = [];
    arr.forEachFalsy((index) => visited.push(index));
    assertEquals(visited, [32]);

    // Verify unused bits in last chunk don't appear as false
    arr.set(32, true);
    const visited2: number[] = [];
    arr.forEachFalsy((index) => visited2.push(index));
    assertEquals(visited2, []);
  });

  await t.step("should handle chunk boundaries", () => {
    const arr = new BooleanArray(100);
    arr.fill(true);
    arr.set(31, false);
    arr.set(32, false);
    arr.set(63, false);
    arr.set(64, false);

    const visited: number[] = [];
    arr.forEachFalsy((index) => visited.push(index));
    assertEquals(visited, [31, 32, 63, 64]);
  });
});

Deno.test("BooleanArray - falsyIndicesInto", async (t) => {
  await t.step("should copy falsy indices into preallocated Uint32Array", () => {
    const arr = new BooleanArray(10);
    arr.fill(true);
    arr.set(2, false);
    arr.set(5, false);
    arr.set(8, false);

    const out = new Uint32Array(10);
    const count = arr.falsyIndicesInto(out);

    assertEquals(count, 3);
    assertEquals(out[0], 2);
    assertEquals(out[1], 5);
    assertEquals(out[2], 8);
  });

  await t.step("should respect startIndex and endIndex", () => {
    const arr = new BooleanArray(100);
    arr.fill(true);
    arr.set(5, false);
    arr.set(15, false);
    arr.set(25, false);
    arr.set(35, false);
    arr.set(45, false);

    const out = new Uint32Array(10);
    const count = arr.falsyIndicesInto(out, 10, 40);

    assertEquals(count, 3);
    assertEquals(out[0], 15);
    assertEquals(out[1], 25);
    assertEquals(out[2], 35);
  });

  await t.step("should return 0 for empty ranges", () => {
    const arr = new BooleanArray(50);
    const out = new Uint32Array(10);
    const count = arr.falsyIndicesInto(out, 25, 25);
    assertEquals(count, 0);
  });

  await t.step("should handle buffer overflow and return total count", () => {
    const arr = new BooleanArray(20);
    // All false = 20 falsy indices
    const out = new Uint32Array(5); // Smaller than needed
    const count = arr.falsyIndicesInto(out);

    assertEquals(count, 20); // Returns total count found
    assertEquals(out[0], 0);
    assertEquals(out[1], 1);
    assertEquals(out[2], 2);
    assertEquals(out[3], 3);
    assertEquals(out[4], 4);
  });

  await t.step("should validate out parameter type", () => {
    const arr = new BooleanArray(10);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.falsyIndicesInto(null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.falsyIndicesInto([]), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.falsyIndicesInto(new Array(10)), TypeError);
  });

  await t.step("should validate indices", () => {
    const arr = new BooleanArray(100);
    const out = new Uint32Array(10);

    assertThrows(() => arr.falsyIndicesInto(out, -1), RangeError);
    assertThrows(() => arr.falsyIndicesInto(out, 1.5), TypeError);
    assertThrows(() => arr.falsyIndicesInto(out, 0, 10.5), TypeError);
    assertThrows(() => arr.falsyIndicesInto(out, 50, 20), RangeError);
    assertThrows(() => arr.falsyIndicesInto(out, 0, 101), RangeError);
  });

  await t.step("should handle last-chunk partial sizes correctly", () => {
    const arr = new BooleanArray(33);
    arr.fill(true);
    arr.set(32, false);

    const out = new Uint32Array(10);
    const count = arr.falsyIndicesInto(out);

    assertEquals(count, 1);
    assertEquals(out[0], 32);

    // Verify unused bits don't appear as falsy
    arr.set(32, true);
    const count2 = arr.falsyIndicesInto(out);
    assertEquals(count2, 0);
  });

  await t.step("should match forEachFalsy output", () => {
    const arr = new BooleanArray(100);
    arr.fill(true);
    arr.set(10, false);
    arr.set(31, false);
    arr.set(32, false);
    arr.set(50, false);
    arr.set(99, false);

    const forEachResult: number[] = [];
    arr.forEachFalsy((index) => forEachResult.push(index));

    const out = new Uint32Array(forEachResult.length);
    const count = arr.falsyIndicesInto(out);

    assertEquals(count, forEachResult.length);
    for (let i = 0; i < count; i++) {
      assertEquals(out[i], forEachResult[i]);
    }
  });
});

Deno.test("BooleanArray - copyFrom", async (t) => {
  await t.step("should copy all bits from source", () => {
    const src = BooleanArray.fromArray(64, [0, 10, 31, 32, 63]);
    const dst = new BooleanArray(64);

    const result = dst.copyFrom(src);
    assert(result === dst, "copyFrom should return this for chaining");
    assertEquals(equals(src, dst), true);
  });

  await t.step("should copy partial range", () => {
    const src = BooleanArray.fromArray(100, [10, 20, 30, 40, 50]);
    const dst = new BooleanArray(100);

    dst.copyFrom(src, 15, 15, 20);

    assertEquals(dst.get(20), true); // 20 from src
    assertEquals(dst.get(30), true); // 30 from src
    assertEquals(dst.get(10), false); // Outside copied range
    assertEquals(dst.get(40), false); // Outside copied range
  });

  await t.step("should handle chunk-aligned fast path", () => {
    const src = new BooleanArray(128);
    src.fill(true);
    const dst = new BooleanArray(128);

    // Copy 64 bits starting at chunk boundary
    dst.copyFrom(src, 32, 64, 64);

    for (let i = 0; i < 64; i++) assertEquals(dst.get(i), false);
    for (let i = 64; i < 128; i++) assertEquals(dst.get(i), true);
  });

  await t.step("should handle unaligned copies", () => {
    const src = new BooleanArray(100);
    src.set(5, 20, true);
    const dst = new BooleanArray(100);

    dst.copyFrom(src, 5, 50, 20);

    for (let i = 50; i < 70; i++) assertEquals(dst.get(i), true);
    assertEquals(dst.get(49), false);
    assertEquals(dst.get(70), false);
  });

  await t.step("should handle overlapping self-copy (forward)", () => {
    const arr = BooleanArray.fromArray(100, [10, 11, 12, 13, 14]);
    arr.copyFrom(arr, 10, 20, 5);

    // Original bits should still be there
    assertEquals(arr.get(10), true);
    assertEquals(arr.get(11), true);
    assertEquals(arr.get(12), true);
    assertEquals(arr.get(13), true);
    assertEquals(arr.get(14), true);
    // Copied bits
    assertEquals(arr.get(20), true);
    assertEquals(arr.get(21), true);
    assertEquals(arr.get(22), true);
    assertEquals(arr.get(23), true);
    assertEquals(arr.get(24), true);
  });

  await t.step("should handle overlapping self-copy (backward)", () => {
    const arr = BooleanArray.fromArray(100, [20, 21, 22, 23, 24]);
    arr.copyFrom(arr, 20, 18, 5);

    // Copied bits (memmove-style should preserve data)
    assertEquals(arr.get(18), true);
    assertEquals(arr.get(19), true);
    assertEquals(arr.get(20), true);
    assertEquals(arr.get(21), true);
    assertEquals(arr.get(22), true);
  });

  await t.step("should handle multiple chunks with partial overlap", () => {
    const src = BooleanArray.fromArray(128, [10, 20, 30, 40, 50, 60, 70]);
    const dst = new BooleanArray(128);

    dst.copyFrom(src, 28, 60, 10);

    assertEquals(dst.get(60), false);
    assertEquals(dst.get(61), false);
    assertEquals(dst.get(62), true);
    assertEquals(dst.get(63), false);
    assertEquals(dst.get(64), false);
    assertEquals(dst.get(65), false);
    assertEquals(dst.get(66), false);
    assertEquals(dst.get(67), false);
    assertEquals(dst.get(68), false);
    assertEquals(dst.get(69), false);
    assertEquals(dst.get(59), false);
    assertEquals(dst.get(70), false);
  });

  await t.step("should preserve unused bits in last chunk", () => {
    const src = new BooleanArray(33);
    src.fill(true);
    const dst = new BooleanArray(33);

    dst.copyFrom(src);

    // Verify the last chunk mask is applied correctly
    const lastChunkValue = dst.buffer[dst.wordCount - 1]!;
    const unusedMask = ALL_BITS_TRUE << (33 % 32);
    assertEquals(lastChunkValue & unusedMask, 0);
  });
});

Deno.test("BooleanArray - setFromIndices", async (t) => {
  await t.step("should set bits at specified indices to true", () => {
    const arr = new BooleanArray(10);
    const result = arr.setFromIndices([1, 3, 5, 7, 9]);

    assert(result === arr, "setFromIndices should return this for chaining");
    assertEquals(arr.get(0), false);
    assertEquals(arr.get(1), true);
    assertEquals(arr.get(2), false);
    assertEquals(arr.get(3), true);
    assertEquals(arr.get(4), false);
    assertEquals(arr.get(5), true);
    assertEquals(arr.getCount(true), 5);
  });

  await t.step("should set bits to false when value is false", () => {
    const arr = new BooleanArray(10);
    arr.fill(true);
    arr.setFromIndices([0, 2, 4], false);

    assertEquals(arr.get(0), false);
    assertEquals(arr.get(1), true);
    assertEquals(arr.get(2), false);
    assertEquals(arr.get(3), true);
    assertEquals(arr.get(4), false);
    assertEquals(arr.getCount(true), 7);
  });

  await t.step("should be additive (not clear other bits)", () => {
    const arr = BooleanArray.fromArray(10, [0, 1, 2]);
    arr.setFromIndices([7, 8, 9]);

    assertEquals(arr.get(0), true);
    assertEquals(arr.get(1), true);
    assertEquals(arr.get(2), true);
    assertEquals(arr.get(7), true);
    assertEquals(arr.get(8), true);
    assertEquals(arr.get(9), true);
    assertEquals(arr.getCount(true), 6);
  });

  await t.step("should handle empty indices array", () => {
    const arr = new BooleanArray(10);
    arr.setFromIndices([]);
    assertEquals(arr.isEmpty(), true);
  });

  await t.step("should handle duplicate indices (idempotent)", () => {
    const arr = new BooleanArray(10);
    arr.setFromIndices([5, 5, 5, 5, 5]);
    assertEquals(arr.getCount(true), 1);
    assertEquals(arr.get(5), true);
  });

  await t.step("should accept Uint32Array as indices", () => {
    const arr = new BooleanArray(100);
    const indices = new Uint32Array([10, 20, 30, 40, 50]);
    arr.setFromIndices(indices);

    assertEquals(arr.getCount(true), 5);
    assertEquals(arr.get(10), true);
    assertEquals(arr.get(50), true);
  });

  await t.step("should accept regular array as indices", () => {
    const arr = new BooleanArray(100);
    arr.setFromIndices([0, 99]);

    assertEquals(arr.get(0), true);
    assertEquals(arr.get(99), true);
    assertEquals(arr.getCount(true), 2);
  });

  await t.step("should validate indices parameter", () => {
    const arr = new BooleanArray(10);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.setFromIndices(null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => arr.setFromIndices("not an array"), TypeError);
  });

  await t.step("should validate individual index types", () => {
    const arr = new BooleanArray(10);
    assertThrows(() => arr.setFromIndices([1, NaN, 3]), TypeError);
    assertThrows(() => arr.setFromIndices([1, Infinity]), TypeError);
    assertThrows(() => arr.setFromIndices([1, 2.5]), TypeError);
  });

  await t.step("should validate index bounds", () => {
    const arr = new BooleanArray(10);
    assertThrows(() => arr.setFromIndices([0, 10]), RangeError); // 10 is out of bounds
    assertThrows(() => arr.setFromIndices([-1, 5]), RangeError);
    assertThrows(() => arr.setFromIndices([100]), RangeError);
  });

  await t.step("should handle chunk boundaries", () => {
    const arr = new BooleanArray(100);
    arr.setFromIndices([31, 32, 63, 64]);

    assertEquals(arr.get(31), true);
    assertEquals(arr.get(32), true);
    assertEquals(arr.get(63), true);
    assertEquals(arr.get(64), true);
    assertEquals(arr.getCount(true), 4);
  });

  await t.step("should handle large index arrays efficiently", () => {
    const arr = new BooleanArray(10000);
    const indices = new Uint32Array(1000);
    for (let i = 0; i < 1000; i++) {
      indices[i] = i * 10;
    }

    arr.setFromIndices(indices);
    assertEquals(arr.getCount(true), 1000);
    assertEquals(arr.get(0), true);
    assertEquals(arr.get(9990), true);
  });
});

Deno.test("BooleanArray - indexOf/lastIndexOf edge cases (32-bit truncation regression)", async (t) => {
  // These tests ensure we don't use `| 0` truncation which wraps large values incorrectly

  await t.step("indexOf: large fromIndex values that would wrap with | 0", () => {
    const arr = new BooleanArray(100);
    arr.set(0, true);
    arr.set(50, true);

    // 2^32 would become 0 with | 0, incorrectly finding bit at index 0
    assertEquals(arr.indexOf(true, 4294967296), -1); // 2^32 > size → -1

    // 2^31 would become -2147483648 with | 0
    assertEquals(arr.indexOf(true, 2147483648), -1); // 2^31 > size → -1

    // 2^31 - 1 (max positive 32-bit signed) still exceeds size
    assertEquals(arr.indexOf(true, 2147483647), -1);

    // Values in range [2^31, 2^32) would become negative with | 0
    assertEquals(arr.indexOf(true, 3000000000), -1); // ~2.8 billion

    // Searching for false with huge fromIndex
    assertEquals(arr.indexOf(false, 4294967296), -1);
  });

  await t.step("indexOf: fromIndex exactly at and around size boundary", () => {
    const arr = new BooleanArray(100);
    arr.set(99, true);

    assertEquals(arr.indexOf(true, 99), 99); // Exact last index
    assertEquals(arr.indexOf(true, 100), -1); // fromIndex === size
    assertEquals(arr.indexOf(true, 101), -1); // fromIndex > size
  });

  await t.step("lastIndexOf: large fromIndex clamps to size-1", () => {
    const arr = new BooleanArray(100);
    arr.set(50, true);
    arr.set(99, true);

    // Large values should clamp to size-1, finding the last true bit
    assertEquals(arr.lastIndexOf(true, 4294967296), 99); // 2^32 → clamp to 99
    assertEquals(arr.lastIndexOf(true, 2147483648), 99); // 2^31 → clamp to 99
    assertEquals(arr.lastIndexOf(true, 3000000000), 99); // ~2.8B → clamp to 99

    // Should still respect the clamped fromIndex for searching
    assertEquals(arr.lastIndexOf(false, 4294967296), 98); // Last false before 99
  });

  await t.step("lastIndexOf: negative fromIndex edge cases", () => {
    const arr = new BooleanArray(100);
    arr.set(10, true);
    arr.set(90, true);

    // Negative fromIndex: size + fromIndex
    assertEquals(arr.lastIndexOf(true, -1), 90); // 100 + (-1) = 99 → finds 90
    assertEquals(arr.lastIndexOf(true, -10), 90); // 100 + (-10) = 90 → finds 90
    assertEquals(arr.lastIndexOf(true, -11), 10); // 100 + (-11) = 89 → finds 10
    assertEquals(arr.lastIndexOf(true, -91), -1); // 100 + (-91) = 9 → no true before 9

    // Extremely negative (would overflow with size addition in naive impl)
    assertEquals(arr.lastIndexOf(true, -1000000000), -1);
  });

  await t.step("indexOf/lastIndexOf: chunk boundary behavior", () => {
    // Test around the 32-bit chunk boundaries
    const arr = new BooleanArray(128); // 4 chunks
    arr.set(31, true); // Last bit of chunk 0
    arr.set(32, true); // First bit of chunk 1
    arr.set(63, true); // Last bit of chunk 1
    arr.set(64, true); // First bit of chunk 2

    // indexOf across boundaries
    assertEquals(arr.indexOf(true, 31), 31);
    assertEquals(arr.indexOf(true, 32), 32);
    assertEquals(arr.indexOf(true, 33), 63);

    // lastIndexOf across boundaries
    assertEquals(arr.lastIndexOf(true, 64), 64);
    assertEquals(arr.lastIndexOf(true, 63), 63);
    assertEquals(arr.lastIndexOf(true, 62), 32);
    assertEquals(arr.lastIndexOf(true, 31), 31);
  });

  await t.step("indexOf: safe integer validation still works", () => {
    const arr = new BooleanArray(100);

    // Non-safe integers should throw
    assertThrows(() => arr.indexOf(true, 1.5), TypeError);
    assertThrows(() => arr.indexOf(true, NaN), TypeError);
    assertThrows(() => arr.indexOf(true, Infinity), TypeError);
    assertThrows(() => arr.indexOf(true, -Infinity), TypeError);

    // MAX_SAFE_INTEGER is valid (though way beyond any realistic size)
    assertEquals(arr.indexOf(true, Number.MAX_SAFE_INTEGER), -1);
  });
});

Deno.test("BooleanArray - indexOf/lastIndexOf user-facing scenarios", async (t) => {
  // Tests focused on common user expectations and edge cases

  await t.step("size=1 array: smallest possible array", () => {
    const arr = new BooleanArray(1);

    // Empty array
    assertEquals(arr.indexOf(true), -1);
    assertEquals(arr.indexOf(false), 0);
    assertEquals(arr.lastIndexOf(true), -1);
    assertEquals(arr.lastIndexOf(false), 0);

    // Set the only bit
    arr.set(0, true);
    assertEquals(arr.indexOf(true), 0);
    assertEquals(arr.indexOf(false), -1);
    assertEquals(arr.lastIndexOf(true), 0);
    assertEquals(arr.lastIndexOf(false), -1);

    // With fromIndex
    assertEquals(arr.indexOf(true, 0), 0);
    assertEquals(arr.indexOf(true, 1), -1); // fromIndex beyond size
    assertEquals(arr.lastIndexOf(true, 0), 0);
    assertEquals(arr.lastIndexOf(true, -1), 0); // -1 → 0
  });

  await t.step("default arguments: indexOf starts at 0, lastIndexOf at end", () => {
    const arr = new BooleanArray(100);
    arr.set(25, true);
    arr.set(75, true);

    // indexOf with no fromIndex should find first match (25)
    assertEquals(arr.indexOf(true), 25);

    // lastIndexOf with no fromIndex should find last match (75)
    assertEquals(arr.lastIndexOf(true), 75);

    // Verify defaults match explicit values
    assertEquals(arr.indexOf(true), arr.indexOf(true, 0));
    assertEquals(arr.lastIndexOf(true), arr.lastIndexOf(true, arr.size - 1));
  });

  await t.step("finding element at first index (0)", () => {
    const arr = new BooleanArray(100);
    arr.set(0, true);

    assertEquals(arr.indexOf(true), 0);
    assertEquals(arr.indexOf(true, 0), 0);
    assertEquals(arr.lastIndexOf(true), 0);
    assertEquals(arr.lastIndexOf(true, 0), 0);

    // Negative fromIndex that resolves to 0
    assertEquals(arr.indexOf(true, -100), 0); // -100 + 100 = 0, finds at 0
    assertEquals(arr.lastIndexOf(true, -100), 0); // -100 + 100 = 0, searches from 0, finds at 0
    assertEquals(arr.lastIndexOf(true, -101), -1); // -101 + 100 = -1, adjusted < 0, returns -1
  });

  await t.step("finding element at last index (size-1)", () => {
    const arr = new BooleanArray(100);
    arr.set(99, true);

    assertEquals(arr.indexOf(true), 99);
    assertEquals(arr.indexOf(true, 99), 99);
    assertEquals(arr.indexOf(true, -1), 99); // -1 → 99

    assertEquals(arr.lastIndexOf(true), 99);
    assertEquals(arr.lastIndexOf(true, 99), 99);
    assertEquals(arr.lastIndexOf(true, -1), 99); // -1 → 99
  });

  await t.step("single match: indexOf and lastIndexOf return same value", () => {
    const arr = new BooleanArray(100);
    arr.set(42, true);

    const first = arr.indexOf(true);
    const last = arr.lastIndexOf(true);
    assertEquals(first, last);
    assertEquals(first, 42);
  });

  await t.step("not found: returns -1", () => {
    // All false, looking for true
    const allFalse = new BooleanArray(100);
    assertEquals(allFalse.indexOf(true), -1);
    assertEquals(allFalse.lastIndexOf(true), -1);

    // All true, looking for false
    const allTrue = new BooleanArray(100);
    allTrue.fill(true);
    assertEquals(allTrue.indexOf(false), -1);
    assertEquals(allTrue.lastIndexOf(false), -1);
  });

  await t.step("Array.prototype parity: behavior matches standard JS arrays", () => {
    // Create equivalent boolean array and JS array
    const boolArr = new BooleanArray(10);
    boolArr.set(2, true);
    boolArr.set(5, true);
    boolArr.set(8, true);

    const jsArr = [false, false, true, false, false, true, false, false, true, false];

    // Basic indexOf parity
    assertEquals(boolArr.indexOf(true), jsArr.indexOf(true));
    assertEquals(boolArr.indexOf(false), jsArr.indexOf(false));
    assertEquals(boolArr.indexOf(true, 3), jsArr.indexOf(true, 3));
    assertEquals(boolArr.indexOf(true, 6), jsArr.indexOf(true, 6));
    assertEquals(boolArr.indexOf(true, 9), jsArr.indexOf(true, 9));

    // Basic lastIndexOf parity
    assertEquals(boolArr.lastIndexOf(true), jsArr.lastIndexOf(true));
    assertEquals(boolArr.lastIndexOf(false), jsArr.lastIndexOf(false));
    assertEquals(boolArr.lastIndexOf(true, 7), jsArr.lastIndexOf(true, 7));
    assertEquals(boolArr.lastIndexOf(true, 4), jsArr.lastIndexOf(true, 4));
    assertEquals(boolArr.lastIndexOf(true, 1), jsArr.lastIndexOf(true, 1));

    // Negative fromIndex parity
    assertEquals(boolArr.indexOf(true, -5), jsArr.indexOf(true, -5));
    assertEquals(boolArr.indexOf(true, -8), jsArr.indexOf(true, -8));
    assertEquals(boolArr.lastIndexOf(true, -2), jsArr.lastIndexOf(true, -2));
    assertEquals(boolArr.lastIndexOf(true, -5), jsArr.lastIndexOf(true, -5));

    // Edge cases
    assertEquals(boolArr.indexOf(true, -100), jsArr.indexOf(true, -100)); // Clamps to 0
    assertEquals(boolArr.lastIndexOf(true, -100), jsArr.lastIndexOf(true, -100)); // Returns -1
  });

  await t.step("fromIndex at exact boundaries", () => {
    const arr = new BooleanArray(32); // Exactly one chunk
    arr.set(0, true);
    arr.set(31, true);

    // indexOf at boundaries
    assertEquals(arr.indexOf(true, 0), 0);
    assertEquals(arr.indexOf(true, 1), 31);
    assertEquals(arr.indexOf(true, 31), 31);
    assertEquals(arr.indexOf(true, 32), -1); // === size

    // lastIndexOf at boundaries
    assertEquals(arr.lastIndexOf(true, 31), 31);
    assertEquals(arr.lastIndexOf(true, 30), 0);
    assertEquals(arr.lastIndexOf(true, 0), 0);
  });
});

Deno.test("BooleanArray - Symbol.toStringTag", async (t) => {
  await t.step("should return correct string tag", () => {
    const arr = new BooleanArray(32);
    assertEquals(Object.prototype.toString.call(arr), "[object BooleanArray]");
    assertEquals(arr[Symbol.toStringTag], "BooleanArray");
  });
});

Deno.test("BooleanArray - isSafeIndex", async (t) => {
  await t.step("should return true for valid indices", () => {
    const arr = new BooleanArray(100);
    assertEquals(arr.isSafeIndex(0), true);
    assertEquals(arr.isSafeIndex(50), true);
    assertEquals(arr.isSafeIndex(99), true);
  });

  await t.step("should return false for invalid indices", () => {
    const arr = new BooleanArray(100);
    assertEquals(arr.isSafeIndex(-1), false);
    assertEquals(arr.isSafeIndex(100), false);
    assertEquals(arr.isSafeIndex(NaN), false);
    assertEquals(arr.isSafeIndex(Infinity), false);
    assertEquals(arr.isSafeIndex(1.5), false);
  });
});

Deno.test("BooleanArray - toString", async (t) => {
  await t.step("should return buffer string representation", () => {
    // Single chunk: bit 0 set = buffer value 1
    const arr = new BooleanArray(32);
    arr.set(0, true);
    assertEquals(arr.toString(), "1");

    // Multi-chunk: bit 0 and bit 32 set = buffer values [1, 1]
    const arr2 = new BooleanArray(64);
    arr2.set(0, true);
    arr2.set(32, true);
    assertEquals(arr2.toString(), "1,1");

    // Empty array: all zeros
    const arr3 = new BooleanArray(64);
    assertEquals(arr3.toString(), "0,0");
  });
});

Deno.test("BooleanArray - copyFrom edge cases", async (t) => {
  await t.step("should be no-op when count is zero", () => {
    const arr = BooleanArray.fromArray(64, [1, 3, 5]);
    const result = arr.copyFrom(arr, 0, 0, 0);
    assertEquals(result, arr);
    assertEquals(arr.getCount(true), 3);
  });

  await t.step("should throw on size mismatch", () => {
    const a = new BooleanArray(64);
    const b = new BooleanArray(32);
    assertThrows(() => a.copyFrom(b), RangeError);
  });

  await t.step("should throw on source range exceeds size", () => {
    const arr = new BooleanArray(64);
    assertThrows(() => arr.copyFrom(arr, 60, 0, 10), RangeError);
  });

  await t.step("should throw on dest range exceeds size", () => {
    const arr = new BooleanArray(64);
    assertThrows(() => arr.copyFrom(arr, 0, 60, 10), RangeError);
  });

  await t.step("should handle aligned overlapping self-copy", () => {
    const arr = new BooleanArray(128);
    arr.set(0, 32, true);
    arr.copyFrom(arr, 0, 32, 32);
    for (let i = 32; i < 64; i++) assertEquals(arr.get(i), true);
  });

  await t.step("should use copyWithin for overlapping aligned ranges", () => {
    const arr = new BooleanArray(128);
    arr.set(0, 64, true);
    arr.copyFrom(arr, 0, 32, 64); // overlap: chunk 0-1 to 1-2
    for (let i = 32; i < 96; i++) assertEquals(arr.get(i), true);
  });

  await t.step("should handle backward unaligned overlapping self-copy", () => {
    const arr = BooleanArray.fromArray(100, [5, 6, 7, 8, 9]);
    arr.copyFrom(arr, 5, 7, 5);
    assertEquals(arr.get(7), true);
    assertEquals(arr.get(8), true);
    assertEquals(arr.get(9), true);
    assertEquals(arr.get(10), true);
    assertEquals(arr.get(11), true);
  });

  await t.step("should clear bits when backward copy hits false values", () => {
    const arr = new BooleanArray(64);
    arr.fill(true);
    arr.set(1, false);
    arr.set(3, false);
    arr.copyFrom(arr, 0, 1, 5); // dest > source, overlapping backward copy
    assertEquals(arr.get(1), true);
    assertEquals(arr.get(2), false);
    assertEquals(arr.get(3), true);
    assertEquals(arr.get(4), false);
    assertEquals(arr.get(5), true);
  });
});

Deno.test("BooleanArray - forEach error paths", async (t) => {
  await t.step("should throw when range exceeds size", () => {
    const arr = new BooleanArray(100);
    assertThrows(() => arr.forEach(() => {}, 90, 20), RangeError);
  });
});

Deno.test("BooleanArray - indexOf early exit on corrupted unused bits", async (t) => {
  await t.step("should return -1 when only unused bits are set", () => {
    const arr = new BooleanArray(33);
    arr.buffer[1] = 0x80000000;
    assertEquals(arr.indexOf(true), -1);
  });

  await t.step("should return -1 when first chunk yields index >= size", () => {
    const arr = new BooleanArray(33);
    arr.buffer[1] = 0x80000000;
    assertEquals(arr.indexOf(true, 32), -1);
  });
});

Deno.test("BooleanArray - truthyIndices early exit", async (t) => {
  await t.step("should stop when absoluteIndex exceeds endIndex", () => {
    const arr = new BooleanArray(33);
    arr.buffer[1] = 0x80000000;
    assertEquals([...arr.truthyIndices(0, 33)], []);
  });
});

Deno.test("BooleanArray - setRange edge cases", async (t) => {
  await t.step("should set exactly 32 bits at offset 0", () => {
    const arr = new BooleanArray(64);
    arr.set(0, 32, true);
    assertEquals(arr.getCount(true), 32);
    assertEquals(arr.buffer[0], 0xFFFFFFFF);
  });

  await t.step("should clear small cross-chunk range", () => {
    const arr = new BooleanArray(100);
    arr.fill(true);
    arr.set(30, 5, false);
    for (let i = 30; i < 35; i++) assertEquals(arr.get(i), false);
    assertEquals(arr.get(29), true);
    assertEquals(arr.get(35), true);
  });

  await t.step("should clear large cross-chunk range", () => {
    const arr = new BooleanArray(200);
    arr.fill(true);
    arr.set(10, 100, false);
    for (let i = 10; i < 110; i++) assertEquals(arr.get(i), false);
    assertEquals(arr.get(9), true);
    assertEquals(arr.get(110), true);
  });

  await t.step("should clear range ending on chunk boundary", () => {
    const arr = new BooleanArray(96);
    arr.fill(true);
    arr.set(1, 63, false); // ends at bit 63 (offset 31)
    for (let i = 1; i < 64; i++) assertEquals(arr.get(i), false);
    assertEquals(arr.get(0), true);
    assertEquals(arr.get(64), true);
  });
});

Deno.test("BooleanArray - Property: count consistency", async (t) => {
  await t.step("getCount(true) + getCount(false) === size for random arrays", () => {
    for (let trial = 0; trial < 20; trial++) {
      const size = Math.floor(Math.random() * 200) + 1;
      const arr = new BooleanArray(size);
      for (let i = 0; i < size; i++) {
        if (Math.random() > 0.5) arr.set(i, true);
      }
      assertEquals(arr.getCount(true) + arr.getCount(false), size);
    }
  });
});

Deno.test("BooleanArray - Property: fill consistency", async (t) => {
  await t.step("fill(true) makes isFull() true", () => {
    const sizes = [1, 31, 32, 33, 64, 65, 100];
    for (const size of sizes) {
      const arr = new BooleanArray(size);
      arr.fill(true);
      assertEquals(arr.isFull(), true);
      assertEquals(arr.isEmpty(), false);
    }
  });

  await t.step("fill(false) makes isEmpty() true", () => {
    const sizes = [1, 31, 32, 33, 64, 65, 100];
    for (const size of sizes) {
      const arr = new BooleanArray(size);
      arr.fill(true);
      arr.fill(false);
      assertEquals(arr.isEmpty(), true);
      assertEquals(arr.isFull(), false);
    }
  });
});

Deno.test("BooleanArray - Property: unused bits invariant", async (t) => {
  await t.step("unused bits remain zero after operations", () => {
    const sizes = [1, 17, 33, 65, 97];
    for (const size of sizes) {
      const arr = new BooleanArray(size);
      arr.fill(true);
      const count = Math.min(10, size);
      arr.set(0, count, false);
      arr.toggle(size - 1);
      assertUnusedBitsZero(arr, `size ${size} after operations`);
    }
  });
});
