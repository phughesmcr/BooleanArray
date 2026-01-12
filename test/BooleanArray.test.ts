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

    // Zero-length get/set are safe no-ops and empty
    array.set(50, 0, true);
    assertEquals(array.getTruthyCount(), 80);
    assertEquals(array.get(60, 0), []);
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
    // Deep copy semantics
    clone.toggle(50);
    assertEquals(clone.get(50), false);
    assertEquals(array.get(50), true);
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

    assertThrows(() => BooleanArray.and(a, b), RangeError, "Arrays must have the same size");
    assertThrows(() => BooleanArray.or(a, b), RangeError);
    assertThrows(() => BooleanArray.xor(a, b), RangeError);
  });
});

Deno.test("BooleanArray - Additional Bitwise Operations", async (t) => {
  await t.step("should perform NOR and XNOR (static)", () => {
    const a = BooleanArray.fromArray(4, [1, 3]); // bits [1,3] => 1010 (bit3..bit0)
    const b = BooleanArray.fromArray(4, [0, 1]); // bits [0,1] => 0011 (bit3..bit0)
    const nor = BooleanArray.nor(a, b); // ~(1010 | 0011) = ~(1011) = 0100
    const xnor = BooleanArray.xnor(a, b); // ~(1010 ^ 0011) = ~(1001) = 0110

    // Verify exact truth tables
    assertEquals([0, 1, 2, 3].map((i) => nor.get(i)), [false, false, true, false]);
    assertEquals([0, 1, 2, 3].map((i) => xnor.get(i)), [false, true, true, false]);
    assertUnusedBitsZero(nor, "NOR");
    assertUnusedBitsZero(xnor, "XNOR");
  });

  await t.step("should perform instance bitwise ops in place and return this", () => {
    const size = 8;
    const a = BooleanArray.fromArray(size, [0, 2, 4, 6]); // 10101010
    const b = BooleanArray.fromArray(size, [1, 2, 3]); // 00001110

    // or
    const retOr = a.clone().or(b);
    assertEquals(retOr, retOr.or(b)); // chaining returns this
    assertEquals([0, 1, 2, 3, 4, 5, 6, 7].map((i) => retOr.get(i)), [true, true, true, true, true, false, true, false]);

    // xor
    const tmpXor = a.clone();
    assert(tmpXor === tmpXor.xor(b)); // chaining returns this
    const retXor = a.clone().xor(b);
    assertEquals([0, 1, 2, 3, 4, 5, 6, 7].map((i) => retXor.get(i)), [
      true,
      true,
      false,
      true,
      true,
      false,
      true,
      false,
    ]);

    // nand - verify exact truth table
    const retNand = a.clone().nand(b);
    // a = [1,0,1,0,1,0,1,0], b = [0,1,1,1,0,0,0,0]
    // a & b = [0,0,1,0,0,0,0,0], ~(a & b) = [1,1,0,1,1,1,1,1]
    assertEquals([0, 1, 2, 3, 4, 5, 6, 7].map((i) => retNand.get(i)), [
      true,
      true,
      false,
      true,
      true,
      true,
      true,
      true,
    ]);
    assertEquals(retNand, retNand.nand(b)); // chaining returns this (applying nand again)
    assertUnusedBitsZero(retNand, "NAND in-place");

    // nor - verify exact truth table
    const retNor = a.clone().nor(b);
    // a = [1,0,1,0,1,0,1,0], b = [0,1,1,1,0,0,0,0]
    // a | b = [1,1,1,1,1,0,1,0], ~(a | b) = [0,0,0,0,0,1,0,1]
    assertEquals([0, 1, 2, 3, 4, 5, 6, 7].map((i) => retNor.get(i)), [
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      true,
    ]);
    assertEquals(retNor, retNor.nor(b)); // chaining returns this (applying nor again)
    assertUnusedBitsZero(retNor, "NOR in-place");

    // xnor - verify exact truth table
    const retXnor = a.clone().xnor(b);
    // a = [1,0,1,0,1,0,1,0], b = [0,1,1,1,0,0,0,0]
    // a ^ b = [1,1,0,1,1,0,1,0], ~(a ^ b) = [0,0,1,0,0,1,0,1]
    assertEquals([0, 1, 2, 3, 4, 5, 6, 7].map((i) => retXnor.get(i)), [
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
    ]);
    assertEquals(retXnor, retXnor.xnor(b)); // chaining returns this (applying xnor again)
    assertUnusedBitsZero(retXnor, "XNOR in-place");

    // difference (a & ~b)
    const retDiff = a.clone().difference(b);
    assertEquals([0, 1, 2, 3, 4, 5, 6, 7].map((i) => retDiff.get(i)), [
      true,
      false,
      false,
      false,
      true,
      false,
      true,
      false,
    ]);

    // not (unary in-place)
    const c = BooleanArray.fromArray(size, [0, 7]); // 10000001
    const retNot = c.not();
    assertEquals(retNot, c);
    assertEquals([0, 1, 2, 3, 4, 5, 6, 7].map((i) => c.get(i)), [false, true, true, true, true, true, true, false]);
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
    assertEquals(array.lastIndexOf(true, 32), 32); // search from index 32, finds at 32
  });

  await t.step("should support size-equal and negative fromIndex semantics", () => {
    const size = 10;
    const array = new BooleanArray(size);
    array.set(0, true);
    array.set(5, true);
    array.set(9, true);

    // fromIndex == size
    assertEquals(array.indexOf(true, size), -1);
    assertEquals(array.indexOf(false, size), -1);
    assertEquals(array.lastIndexOf(true, size), 9); // clamps to size - 1 = 9

    // negative fromIndex for indexOf (forward search)
    // -1 => start at size - 1 = 9
    assertEquals(array.indexOf(true, -1), 9);
    // -2 => start at 8 => next true is 9
    assertEquals(array.indexOf(true, -2), 9);
    // very negative clamps to start at 0
    assertEquals(array.indexOf(true, -9999), 0);

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
    const arr = BooleanArray.fromArray(10, [0, 5, 9]);
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

    assertEquals(result, array); // Returns this for chaining
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
    const arr = BooleanArray.fromArray(5, [1, 3]);
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

Deno.test("BooleanArray - Static Factory Methods", async (t) => {
  await t.step("should create from array of indices", () => {
    const indices = [0, 31, 32, 99];
    const array = BooleanArray.fromArray(100, indices);

    assertEquals(array.size, 100);
    assertEquals(array.getTruthyCount(), 4);
    for (const index of indices) {
      assertEquals(array.get(index), true);
    }
  });

  await t.step("should create from array of booleans", () => {
    const bools = [true, false, true, false];
    const array = BooleanArray.fromArray(100, bools);

    assertEquals(array.size, 100);
    assertEquals(array.getTruthyCount(), 2);
    for (let i = 0; i < bools.length; i++) {
      assertEquals(array.get(i), bools[i]);
    }
  });

  await t.step("should allow empty initializer array", () => {
    const array = BooleanArray.fromArray(100, []);
    assertEquals(array.size, 100);
    assertEquals(array.getTruthyCount(), 0);
  });

  await t.step("should create from Uint32Array", () => {
    const size = 100;
    const bufferLength = BooleanArray.getChunkCount(size); // Expected: 4 for size 100
    const sourceBuffer = new Uint32Array(bufferLength);

    // Intentionally set some bits to true
    // Bit 0 (Chunk 0, offset 0)
    sourceBuffer[0]! |= 1 << 0;
    // Bit 31 (Chunk 0, offset 31)
    sourceBuffer[0]! |= 1 << 31;
    // Bit 32 (Chunk 1, offset 0)
    sourceBuffer[1]! |= 1 << 0;
    // Bit 99 (Chunk 3, offset 3, as 99 = 3*32 + 3)
    sourceBuffer[3]! |= 1 << 3;

    // To make the test more robust for unused bits, let's set some high bits
    // in the last chunk of sourceBuffer that *should* be cleared by fromUint32Array.
    // For size 100, bitsInLastChunk is 100 % 32 = 4. So, bits 0, 1, 2, 3 are used in the last chunk.
    // Let's set bit 5 (offset 5) in the last chunk (index 3) of sourceBuffer.
    // This bit is outside the logical size and should be cleared.
    if (bufferLength > 0 && (size % BooleanArray.BITS_PER_INT) > 0) {
      const lastChunkIndex = bufferLength - 1;
      const bitsInLastChunk = size % BooleanArray.BITS_PER_INT;
      if (bitsInLastChunk < BooleanArray.BITS_PER_INT - 1 && bitsInLastChunk < 5) { // ensure we are not setting used bits
        sourceBuffer[lastChunkIndex]! |= 1 << 5; // Set a bit that should be unused
      }
    }

    const array = BooleanArray.fromUint32Array(size, sourceBuffer);

    assertEquals(array.size, size);
    assertEquals(array.getTruthyCount(), 4, "Truthy count should be 4 based on set bits");

    assertEquals(array.get(0), true, "Bit 0 should be true");
    assertEquals(array.get(1), false, "Bit 1 should be false");
    assertEquals(array.get(31), true, "Bit 31 should be true");
    assertEquals(array.get(32), true, "Bit 32 should be true");
    assertEquals(array.get(98), false, "Bit 98 should be false");
    assertEquals(array.get(99), true, "Bit 99 should be true");

    // Verify that the potentially set bit 5 in the last chunk of sourceBuffer (if applicable) was cleared.
    // For size 100, last chunk (index 3) uses bits 0,1,2,3. Bit 5 should be 0.
    if (size % BooleanArray.BITS_PER_INT !== 0) { // if last chunk is not full
      const lastChunkActual = array.buffer[array.chunkCount - 1];
      const fifthBitMask = 1 << 5;
      if ((size % BooleanArray.BITS_PER_INT) <= 5) { // Only check if bit 5 is indeed an unused bit
        assertEquals(lastChunkActual! & fifthBitMask, 0, "Unused bit 5 in last chunk should be cleared");
      }
    }
    assertUnusedBitsZero(array, "fromUint32Array");
  });

  await t.step("should create from Uint32Array with specific binary patterns", () => {
    const size = 96; // 3 chunks * 32 bits/chunk
    const sourceBuffer = new Uint32Array([
      0b10101010, // Chunk 0: bits 0-31.  Value 170. Popcount 4.
      0b11111111, // Chunk 1: bits 32-63. Value 255. Popcount 8.
      0b00000000, // Chunk 2: bits 64-95. Value 0.   Popcount 0.
    ]);
    const expectedBufferLength = BooleanArray.getChunkCount(size);
    assertEquals(sourceBuffer.length, expectedBufferLength, "Source buffer length should match expected for size 96");

    const array = BooleanArray.fromUint32Array(size, sourceBuffer);

    assertEquals(array.size, size, "Array size should be 96");
    assertEquals(array.getTruthyCount(), 12, "Truthy count should be 4 + 8 + 0 = 12");

    // Test bits from chunk 0 (0b10101010)
    assertEquals(array.get(0), false, "Bit 0 (Chunk 0, LSB) should be false");
    assertEquals(array.get(1), true, "Bit 1 (Chunk 0) should be true");
    assertEquals(array.get(2), false, "Bit 2 (Chunk 0) should be false");
    assertEquals(array.get(3), true, "Bit 3 (Chunk 0) should be true");
    assertEquals(array.get(4), false, "Bit 4 (Chunk 0) should be false");
    assertEquals(array.get(5), true, "Bit 5 (Chunk 0) should be true");
    assertEquals(array.get(6), false, "Bit 6 (Chunk 0) should be false");
    assertEquals(array.get(7), true, "Bit 7 (Chunk 0) should be true");
    assertEquals(array.get(8), false, "Bit 8 (Chunk 0) should be false"); // Higher bits are 0
    assertEquals(array.get(31), false, "Bit 31 (Chunk 0, MSB for this pattern) should be false");

    // Test bits from chunk 1 (0b11111111)
    assertEquals(array.get(32), true, "Bit 32 (Chunk 1, LSB) should be true");
    assertEquals(array.get(33), true, "Bit 33 (Chunk 1) should be true");
    assertEquals(array.get(34), true, "Bit 34 (Chunk 1) should be true");
    assertEquals(array.get(35), true, "Bit 35 (Chunk 1) should be true");
    assertEquals(array.get(36), true, "Bit 36 (Chunk 1) should be true");
    assertEquals(array.get(37), true, "Bit 37 (Chunk 1) should be true");
    assertEquals(array.get(38), true, "Bit 38 (Chunk 1) should be true");
    assertEquals(array.get(39), true, "Bit 39 (Chunk 1) should be true");
    assertEquals(array.get(40), false, "Bit 40 (Chunk 1) should be false"); // Higher bits are 0
    assertEquals(array.get(63), false, "Bit 63 (Chunk 1, MSB for this pattern) should be false");

    // Test bits from chunk 2 (0b00000000)
    for (let i = 0; i < 32; i++) {
      assertEquals(array.get(64 + i), false, `Bit ${64 + i} (Chunk 2) should be false`);
    }

    // Since size 96 is a multiple of 32, the last chunk is full.
    // assertUnusedBitsZero will return early as bitsInLastChunk is 0.
    assertUnusedBitsZero(array, "fromUint32Array with specific binary patterns");
  });

  await t.step("should create from Uint32Array with decimal number patterns", () => {
    const size = 128; // 4 chunks * 32 bits/chunk
    const sourceBuffer = new Uint32Array([
      12, // Chunk 0: 0b00001100. Popcount 2.
      255, // Chunk 1: 0b11111111. Popcount 8.
      170, // Chunk 2: 0b10101010. Popcount 4.
      66, // Chunk 3: 0b01000010. Popcount 2.
    ]);
    const expectedBufferLength = BooleanArray.getChunkCount(size);
    assertEquals(sourceBuffer.length, expectedBufferLength, "Source buffer length should match expected for size 128");

    const array = BooleanArray.fromUint32Array(size, sourceBuffer);

    assertEquals(array.size, size, "Array size should be 128");
    assertEquals(array.getTruthyCount(), 16, "Truthy count should be 2 + 8 + 4 + 2 = 16");

    // Test bits from chunk 0 (12 = 0b1100)
    assertEquals(array.get(0), false, "Bit 0 (Chunk 0) should be false");
    assertEquals(array.get(1), false, "Bit 1 (Chunk 0) should be false");
    assertEquals(array.get(2), true, "Bit 2 (Chunk 0) should be true");
    assertEquals(array.get(3), true, "Bit 3 (Chunk 0) should be true");
    assertEquals(array.get(4), false, "Bit 4 (Chunk 0) should be false");

    // Test bits from chunk 1 (255 = 0b11111111)
    for (let i = 0; i < 8; i++) {
      assertEquals(array.get(32 + i), true, `Bit ${32 + i} (Chunk 1) should be true`);
    }
    assertEquals(array.get(40), false, "Bit 40 (Chunk 1, after 8 set bits) should be false");

    // Test bits from chunk 2 (170 = 0b10101010)
    // Pattern: false, true, false, true, false, true, false, true for LSBs
    for (let i = 0; i < 8; i++) {
      assertEquals(array.get(64 + i), (i % 2) !== 0, `Bit ${64 + i} (Chunk 2) should be ${(i % 2) !== 0}`);
    }
    assertEquals(array.get(72), false, "Bit 72 (Chunk 2, after pattern) should be false");

    // Test bits from chunk 3 (66 = 0b01000010)
    // Pattern: 0, 1, 0, 0, 0, 0, 1, 0 for LSBs
    assertEquals(array.get(96), false, "Bit 96 (Chunk 3) should be false"); // LSB
    assertEquals(array.get(97), true, "Bit 97 (Chunk 3) should be true"); // Offset 1
    assertEquals(array.get(98), false, "Bit 98 (Chunk 3) should be false"); // Offset 2
    assertEquals(array.get(99), false, "Bit 99 (Chunk 3) should be false"); // Offset 3
    assertEquals(array.get(100), false, "Bit 100 (Chunk 3) should be false"); // Offset 4
    assertEquals(array.get(101), false, "Bit 101 (Chunk 3) should be false"); // Offset 5
    assertEquals(array.get(102), true, "Bit 102 (Chunk 3) should be true"); // Offset 6
    assertEquals(array.get(103), false, "Bit 103 (Chunk 3) should be false"); // Offset 7
    assertEquals(array.get(104), false, "Bit 104 (Chunk 3, after pattern) should be false");

    // Since size 128 is a multiple of 32, the last chunk is full.
    assertUnusedBitsZero(array, "fromUint32Array with decimal number patterns");
  });

  await t.step("should create from Uint32Array with too small buffer", () => {
    const size = 100;
    const buffer = new Uint32Array([4294967295]);
    const arr = BooleanArray.fromUint32Array(size, buffer);
    assertEquals(arr.get(0), true);
    assertEquals(arr.get(1), true);
    assertEquals(arr.get(2), true);
    assertEquals(arr.get(3), true);
    assertEquals(arr.get(4), true);
    assertEquals(arr.get(5), true);
    assertEquals(arr.get(6), true);
    assertEquals(arr.get(7), true);
    assertEquals(arr.get(31), true);
    assertEquals(arr.get(32), false);
    assertEquals(arr.get(99), false);
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
    // empty array is allowed and should return an empty-initialized instance
    const emptyFromObjects = BooleanArray.fromObjects<{ id: number }>(100, "id", []);
    assertEquals(emptyFromObjects.getTruthyCount(), 0);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.fromObjects(100, "id", [{}]), TypeError);
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

    // fromUint32Array validation
    const tooLargeBuffer = new Uint32Array([255, 255, 255, 255]);
    assertThrows(
      () => BooleanArray.fromUint32Array(2, tooLargeBuffer), // size 2 expects buffer of length 1
      RangeError,
      "Input array length (4) exceeds expected buffer length (1) for a BooleanArray of size 2. Smaller arrays are zero-padded, but larger arrays would lose data.",
    );
    // deno-lint-ignore no-explicit-any
    assertThrows(() => BooleanArray.fromUint32Array(32, null as any), TypeError, '"arr" must be an ArrayLike<number>');

    assertThrows(
      () => BooleanArray.fromUint32Array(32, {} as ArrayLike<number>),
      TypeError,
      '"arr" must be an ArrayLike<number>',
    );
    assertThrows(
      () => BooleanArray.fromUint32Array(0, new Uint32Array(0)),
      RangeError,
      '"size" must be greater than or equal to 1.',
    );
  });

  await t.step("should validate fromArray additional cases", () => {
    // booleans array longer than size
    assertThrows(() => BooleanArray.fromArray(2, [true, true, true]), RangeError);
    // numeric indices with duplicates should dedupe effectively
    const arr = BooleanArray.fromArray(10, [1, 1, 2, 2, 2, 9]);
    assertEquals(arr.getTruthyCount(), 3);
    assertEquals(arr.get(1), true);
    assertEquals(arr.get(2), true);
    assertEquals(arr.get(9), true);
  });
});

Deno.test("BooleanArray - Buffer Export and Length Semantics", async (t) => {
  await t.step("length should equal chunk count for various sizes", () => {
    const sizes = [1, 2, 31, 32, 33, 64, 65, 100, 128];
    for (const size of sizes) {
      const arr = new BooleanArray(size);
      assertEquals(arr.length, BooleanArray.getChunkCount(size));
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
    assertThrows(() => BooleanArray.difference(a, c), RangeError);
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

Deno.test("BooleanArray - Internal Utilities", async (t) => {
  await t.step("should validate assertIsSafeValue", () => {
    // Valid values (0 to 0xFFFFFFFF)
    assertEquals(BooleanArray.assertIsSafeValue(0), 0);
    assertEquals(BooleanArray.assertIsSafeValue(100), 100);
    assertEquals(BooleanArray.assertIsSafeValue(0xFFFFFFFF), 0xFFFFFFFF);

    // Invalid values - below range
    assertThrows(() => BooleanArray.assertIsSafeValue(-1), RangeError);
    assertThrows(() => BooleanArray.assertIsSafeValue(-100), RangeError);

    // Invalid values - above range
    assertThrows(() => BooleanArray.assertIsSafeValue(0xFFFFFFFF + 1), RangeError);
    assertThrows(() => BooleanArray.assertIsSafeValue(0x100000000), RangeError);

    // Invalid values - not safe integers
    assertThrows(() => BooleanArray.assertIsSafeValue(NaN), TypeError);
    assertThrows(() => BooleanArray.assertIsSafeValue(Infinity), TypeError);
    assertThrows(() => BooleanArray.assertIsSafeValue(-Infinity), TypeError);
    assertThrows(() => BooleanArray.assertIsSafeValue(3.14), TypeError);
  });

  await t.step("should validate isSafeValue", () => {
    // Valid values
    assertEquals(BooleanArray.isSafeValue(0), true);
    assertEquals(BooleanArray.isSafeValue(100), true);
    assertEquals(BooleanArray.isSafeValue(0xFFFFFFFF), true);

    // Invalid values - below range
    assertEquals(BooleanArray.isSafeValue(-1), false);
    assertEquals(BooleanArray.isSafeValue(-100), false);

    // Invalid values - above range
    assertEquals(BooleanArray.isSafeValue(0xFFFFFFFF + 1), false);
    assertEquals(BooleanArray.isSafeValue(0x100000000), false);

    // Invalid values - not safe integers
    assertEquals(BooleanArray.isSafeValue(NaN), false);
    assertEquals(BooleanArray.isSafeValue(Infinity), false);
    assertEquals(BooleanArray.isSafeValue(-Infinity), false);
    assertEquals(BooleanArray.isSafeValue(3.14), false);
  });

  await t.step("should validate assertIsSafeSize", () => {
    // Valid sizes (1 to MAX_SAFE_SIZE)
    assertEquals(BooleanArray.assertIsSafeSize(1), 1);
    assertEquals(BooleanArray.assertIsSafeSize(100), 100);
    assertEquals(BooleanArray.assertIsSafeSize(BooleanArray.MAX_SAFE_SIZE), BooleanArray.MAX_SAFE_SIZE);

    // Invalid sizes - below range
    assertThrows(() => BooleanArray.assertIsSafeSize(0), RangeError);
    assertThrows(() => BooleanArray.assertIsSafeSize(-1), RangeError);

    // Invalid sizes - above range
    assertThrows(() => BooleanArray.assertIsSafeSize(BooleanArray.MAX_SAFE_SIZE + 1), RangeError);

    // Invalid sizes - not safe integers
    assertThrows(() => BooleanArray.assertIsSafeSize(NaN), TypeError);
    assertThrows(() => BooleanArray.assertIsSafeSize(Infinity), TypeError);
    assertThrows(() => BooleanArray.assertIsSafeSize(-Infinity), TypeError);
    assertThrows(() => BooleanArray.assertIsSafeSize(3.14), TypeError);
  });

  await t.step("should validate isSafeSize", () => {
    // Valid sizes
    assertEquals(BooleanArray.isSafeSize(1), true);
    assertEquals(BooleanArray.isSafeSize(100), true);
    assertEquals(BooleanArray.isSafeSize(BooleanArray.MAX_SAFE_SIZE), true);

    // Invalid sizes - below range
    assertEquals(BooleanArray.isSafeSize(0), false);
    assertEquals(BooleanArray.isSafeSize(-1), false);

    // Invalid sizes - above range
    assertEquals(BooleanArray.isSafeSize(BooleanArray.MAX_SAFE_SIZE + 1), false);

    // Invalid sizes - not safe integers
    assertEquals(BooleanArray.isSafeSize(NaN), false);
    assertEquals(BooleanArray.isSafeSize(Infinity), false);
    assertEquals(BooleanArray.isSafeSize(-Infinity), false);
    assertEquals(BooleanArray.isSafeSize(3.14), false);
  });

  await t.step("should validate chunk utility functions", () => {
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
    for (let i = 0; i < size; i += 1000) {
      array.set(i, true);
    }
    assertEquals(array.getTruthyCount(), Math.floor(size / 1000));

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

Deno.test("BooleanArray - forEachTruthy", async (t) => {
  await t.step("should iterate over truthy bits in ascending order", () => {
    const arr = BooleanArray.fromArray(100, [5, 15, 32, 63, 95]);
    const visited: number[] = [];
    const result = arr.forEachTruthy((index) => visited.push(index));

    assertEquals(result, arr); // Returns this for chaining
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

    assertEquals(result, arr); // Returns this for chaining
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
    assertEquals(arr.getTruthyCount(), 4);

    const result = arr.clear();
    assertEquals(result, arr); // Returns this for chaining
    assertEquals(arr.getTruthyCount(), 0);
    assertEquals(arr.isEmpty(), true);
  });

  await t.step("should be identical to fill(false)", () => {
    const a = BooleanArray.fromArray(64, [0, 10, 20, 30, 40, 50, 63]);
    const b = a.clone();

    a.clear();
    b.fill(false);

    assertEquals(BooleanArray.equals(a, b), true);
  });

  await t.step("should preserve unused bits as zero", () => {
    const arr = BooleanArray.fromArray(33, [0, 15, 32]);
    arr.clear();
    assertUnusedBitsZero(arr, "clear");
  });
});

Deno.test("BooleanArray - Static Operations Non-Mutation", async (t) => {
  await t.step("static and should not mutate inputs", () => {
    const a = BooleanArray.fromArray(32, [0, 1]);
    const b = BooleanArray.fromArray(32, [1, 2]);
    const aBefore = a.clone();
    const bBefore = b.clone();

    const result = BooleanArray.and(a, b);

    assertEquals(BooleanArray.equals(a, aBefore), true);
    assertEquals(BooleanArray.equals(b, bBefore), true);
    assertEquals(result.get(1), true);
  });

  await t.step("static or should not mutate inputs", () => {
    const a = BooleanArray.fromArray(32, [0]);
    const b = BooleanArray.fromArray(32, [1]);
    const aBefore = a.clone();
    const bBefore = b.clone();

    const result = BooleanArray.or(a, b);

    assertEquals(BooleanArray.equals(a, aBefore), true);
    assertEquals(BooleanArray.equals(b, bBefore), true);
    assertEquals(result.get(0), true);
    assertEquals(result.get(1), true);
  });

  await t.step("static xor should not mutate inputs", () => {
    const a = BooleanArray.fromArray(32, [0, 1]);
    const b = BooleanArray.fromArray(32, [1, 2]);
    const aBefore = a.clone();
    const bBefore = b.clone();

    const result = BooleanArray.xor(a, b);

    assertEquals(BooleanArray.equals(a, aBefore), true);
    assertEquals(BooleanArray.equals(b, bBefore), true);
    assertEquals(result.get(0), true);
    assertEquals(result.get(1), false);
    assertEquals(result.get(2), true);
  });

  await t.step("static nand should not mutate inputs", () => {
    const a = BooleanArray.fromArray(32, [0, 1]);
    const b = BooleanArray.fromArray(32, [1, 2]);
    const aBefore = a.clone();
    const bBefore = b.clone();

    BooleanArray.nand(a, b);

    assertEquals(BooleanArray.equals(a, aBefore), true);
    assertEquals(BooleanArray.equals(b, bBefore), true);
  });

  await t.step("static nor should not mutate inputs", () => {
    const a = BooleanArray.fromArray(32, [0]);
    const b = BooleanArray.fromArray(32, [1]);
    const aBefore = a.clone();
    const bBefore = b.clone();

    BooleanArray.nor(a, b);

    assertEquals(BooleanArray.equals(a, aBefore), true);
    assertEquals(BooleanArray.equals(b, bBefore), true);
  });

  await t.step("static xnor should not mutate inputs", () => {
    const a = BooleanArray.fromArray(32, [0]);
    const b = BooleanArray.fromArray(32, [1]);
    const aBefore = a.clone();
    const bBefore = b.clone();

    BooleanArray.xnor(a, b);

    assertEquals(BooleanArray.equals(a, aBefore), true);
    assertEquals(BooleanArray.equals(b, bBefore), true);
  });

  await t.step("static not should not mutate input", () => {
    const a = BooleanArray.fromArray(32, [0, 15, 31]);
    const aBefore = a.clone();

    const result = BooleanArray.not(a);

    assertEquals(BooleanArray.equals(a, aBefore), true);
    assertEquals(result.get(0), false);
    assertEquals(result.get(1), true);
    assertEquals(result.get(15), false);
  });

  await t.step("static difference should not mutate inputs", () => {
    const a = BooleanArray.fromArray(32, [0, 1, 2]);
    const b = BooleanArray.fromArray(32, [1, 2, 3]);
    const aBefore = a.clone();
    const bBefore = b.clone();

    const result = BooleanArray.difference(a, b);

    assertEquals(BooleanArray.equals(a, aBefore), true);
    assertEquals(BooleanArray.equals(b, bBefore), true);
    assertEquals(result.get(0), true);
    assertEquals(result.get(1), false);
  });
});

Deno.test("BooleanArray - Instance Operations Size Mismatch", async (t) => {
  await t.step("instance and should throw on size mismatch", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);
    assertThrows(() => a.and(b), RangeError);
  });

  await t.step("instance or should throw on size mismatch", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);
    assertThrows(() => a.or(b), RangeError);
  });

  await t.step("instance xor should throw on size mismatch", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);
    assertThrows(() => a.xor(b), RangeError);
  });

  await t.step("instance nand should throw on size mismatch", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);
    assertThrows(() => a.nand(b), RangeError);
  });

  await t.step("instance nor should throw on size mismatch", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);
    assertThrows(() => a.nor(b), RangeError);
  });

  await t.step("instance xnor should throw on size mismatch", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);
    assertThrows(() => a.xnor(b), RangeError);
  });

  await t.step("instance difference should throw on size mismatch", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);
    assertThrows(() => a.difference(b), RangeError);
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

Deno.test("BooleanArray - Algebraic Identities", async (t) => {
  await t.step("xor(a, a) should be empty", () => {
    const a = BooleanArray.fromArray(64, [0, 10, 20, 30, 63]);
    const result = BooleanArray.xor(a, a);
    assertEquals(result.isEmpty(), true);
    assertEquals(result.getTruthyCount(), 0);
  });

  await t.step("difference(a, a) should be empty", () => {
    const a = BooleanArray.fromArray(64, [5, 15, 25, 35]);
    const result = BooleanArray.difference(a, a);
    assertEquals(result.isEmpty(), true);
    assertEquals(result.getTruthyCount(), 0);
  });

  await t.step("De Morgan: NOT(a OR b) equals (NOT a) AND (NOT b)", () => {
    const a = BooleanArray.fromArray(32, [0, 5, 10]);
    const b = BooleanArray.fromArray(32, [5, 15, 20]);

    const left = BooleanArray.not(BooleanArray.or(a, b));
    const right = BooleanArray.and(BooleanArray.not(a), BooleanArray.not(b));

    assertEquals(BooleanArray.equals(left, right), true);
  });

  await t.step("De Morgan: NOT(a AND b) equals (NOT a) OR (NOT b)", () => {
    const a = BooleanArray.fromArray(32, [0, 5, 10]);
    const b = BooleanArray.fromArray(32, [5, 15, 20]);

    const left = BooleanArray.not(BooleanArray.and(a, b));
    const right = BooleanArray.or(BooleanArray.not(a), BooleanArray.not(b));

    assertEquals(BooleanArray.equals(left, right), true);
  });

  await t.step("a AND a equals a", () => {
    const a = BooleanArray.fromArray(64, [0, 31, 32, 63]);
    const result = BooleanArray.and(a, a);
    assertEquals(BooleanArray.equals(result, a), true);
  });

  await t.step("a OR a equals a", () => {
    const a = BooleanArray.fromArray(64, [0, 31, 32, 63]);
    const result = BooleanArray.or(a, a);
    assertEquals(BooleanArray.equals(result, a), true);
  });

  await t.step("NOT(NOT(a)) equals a", () => {
    const a = BooleanArray.fromArray(33, [0, 10, 20, 32]);
    const result = BooleanArray.not(BooleanArray.not(a));
    assertEquals(BooleanArray.equals(result, a), true);
  });
});

Deno.test("BooleanArray - Equals Properties", async (t) => {
  await t.step("equals is reflexive", () => {
    const a = BooleanArray.fromArray(64, [0, 10, 20, 30]);
    assertEquals(BooleanArray.equals(a, a), true);
    assertEquals(a.equals(a), true);
  });

  await t.step("equals is symmetric", () => {
    const a = BooleanArray.fromArray(64, [0, 10]);
    const b = BooleanArray.fromArray(64, [0, 10]);

    assertEquals(BooleanArray.equals(a, b), BooleanArray.equals(b, a));
    assertEquals(a.equals(b), b.equals(a));
  });

  await t.step("equals is transitive", () => {
    const a = BooleanArray.fromArray(32, [5, 15]);
    const b = BooleanArray.fromArray(32, [5, 15]);
    const c = BooleanArray.fromArray(32, [5, 15]);

    assertEquals(BooleanArray.equals(a, b), true);
    assertEquals(BooleanArray.equals(b, c), true);
    assertEquals(BooleanArray.equals(a, c), true);
  });

  await t.step("equals returns false for size mismatch", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);

    assertEquals(BooleanArray.equals(a, b), false);
    assertEquals(a.equals(b), false);
  });

  await t.step("equals returns false for different content", () => {
    const a = BooleanArray.fromArray(32, [0, 10]);
    const b = BooleanArray.fromArray(32, [0, 11]);

    assertEquals(BooleanArray.equals(a, b), false);
    assertEquals(a.equals(b), false);
  });
});

Deno.test("BooleanArray - fromUint32Array with number[]", async (t) => {
  await t.step("should accept number[] with same semantics as Uint32Array", () => {
    const size = 64;
    const numberArray = [255, 4294967295]; // 0xFF, 0xFFFFFFFF
    const arr = BooleanArray.fromUint32Array(size, numberArray);

    assertEquals(arr.size, 64);
    // First chunk: 255 = 0b11111111
    for (let i = 0; i < 8; i++) {
      assertEquals(arr.get(i), true);
    }
    for (let i = 8; i < 32; i++) {
      assertEquals(arr.get(i), false);
    }
    // Second chunk: all bits set
    for (let i = 32; i < 64; i++) {
      assertEquals(arr.get(i), true);
    }
  });

  await t.step("should clear unused bits for non-multiple-of-32 sizes", () => {
    const size = 35;
    const numberArray = [4294967295, 4294967295]; // All bits set
    const arr = BooleanArray.fromUint32Array(size, numberArray);

    assertEquals(arr.size, 35);
    // First 32 bits all true
    for (let i = 0; i < 32; i++) {
      assertEquals(arr.get(i), true);
    }
    // Next 3 bits (32, 33, 34) should be true
    assertEquals(arr.get(32), true);
    assertEquals(arr.get(33), true);
    assertEquals(arr.get(34), true);

    // Verify unused bits are cleared
    assertUnusedBitsZero(arr, "fromUint32Array with number[]");
  });
});

Deno.test("BooleanArray - fromArray Boolean Type Guard", async (t) => {
  await t.step("should reject mixed-type boolean arrays", () => {
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.fromArray(10, [true, false, 1, true]), TypeError);

    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.fromArray(10, [true, "false", true]), TypeError);

    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => BooleanArray.fromArray(10, [false, null, true]), TypeError);
  });

  await t.step("should accept pure boolean arrays", () => {
    const arr = BooleanArray.fromArray(5, [true, false, true, false, true]);
    assertEquals(arr.get(0), true);
    assertEquals(arr.get(1), false);
    assertEquals(arr.get(2), true);
  });

  await t.step("should accept pure number arrays", () => {
    const arr = BooleanArray.fromArray(10, [0, 2, 4, 6, 8]);
    assertEquals(arr.get(0), true);
    assertEquals(arr.get(1), false);
    assertEquals(arr.get(2), true);
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

    // Negative startIndex
    assertThrows(() => arr.truthyIndicesInto(out, -1), RangeError);

    // Float indices
    assertThrows(() => arr.truthyIndicesInto(out, 1.5), TypeError);
    assertThrows(() => arr.truthyIndicesInto(out, 0, 10.5), TypeError);

    // startIndex > endIndex
    assertThrows(() => arr.truthyIndicesInto(out, 50, 20), RangeError);

    // Out of bounds
    assertThrows(() => arr.truthyIndicesInto(out, 0, 101), RangeError);
  });

  await t.step("should match truthyIndices generator output", () => {
    const arr = BooleanArray.fromArray(100, [0, 10, 31, 32, 50, 63, 64, 99]);
    const generatorResult = [...arr.truthyIndices()];
    const out = new Uint32Array(generatorResult.length);
    const count = arr.truthyIndicesInto(out);

    assertEquals(count, generatorResult.length);
    for (let i = 0; i < count; i++) {
      assertEquals(out[i], generatorResult[i]);
    }
  });

  await t.step("should match truthyIndices generator output with range", () => {
    const arr = BooleanArray.fromArray(100, [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);
    const generatorResult = [...arr.truthyIndices(20, 80)];
    const out = new Uint32Array(10);
    const count = arr.truthyIndicesInto(out, 20, 80);

    assertEquals(count, generatorResult.length);
    for (let i = 0; i < count; i++) {
      assertEquals(out[i], generatorResult[i]);
    }
  });

  await t.step("should handle dense pattern", () => {
    const arr = new BooleanArray(100);
    arr.set(20, 30, true); // 30 consecutive bits
    const out = new Uint32Array(50);
    const count = arr.truthyIndicesInto(out);

    assertEquals(count, 30);
    for (let i = 0; i < 30; i++) {
      assertEquals(out[i], 20 + i);
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

Deno.test("BooleanArray - Additional Validation Edge Cases", async (t) => {
  await t.step("should use assertIsSafeValue return value correctly", () => {
    const arr = new BooleanArray(10);

    // The pattern: if (assertIsSafeValue(index) >= this.size)
    // This relies on assertIsSafeValue returning the validated value
    assertThrows(() => arr.get(10), RangeError); // 10 >= 10
    assertEquals(arr.get(9), false); // 9 < 10, should work

    // Same for factory methods
    assertThrows(() => BooleanArray.fromArray(5, [0, 5]), RangeError);
    const valid = BooleanArray.fromArray(5, [0, 4]);
    assertEquals(valid.get(4), true);
  });

  await t.step("should validate types before bounds", () => {
    const arr = new BooleanArray(100);

    // Type error should come before bounds error
    assertThrows(() => arr.get(NaN), TypeError); // Not RangeError
    assertThrows(() => arr.set(Infinity, true), TypeError); // Not RangeError

    // For fromArray with invalid type that's also out of bounds
    assertThrows(() => BooleanArray.fromArray(10, [NaN]), TypeError);
    assertThrows(() => BooleanArray.fromArray(10, [Infinity]), TypeError);
  });

  await t.step("should reject size zero in all factory methods", () => {
    assertThrows(() => BooleanArray.fromArray(0, []), RangeError);
    assertThrows(() => BooleanArray.fromObjects(0, "id", []), RangeError);
    assertThrows(() => BooleanArray.fromUint32Array(0, new Uint32Array(0)), RangeError);
  });

  await t.step("should handle maximum safe index values", () => {
    // Test with 0xFFFFFFFF - the maximum Uint32 value
    assertEquals(BooleanArray.assertIsSafeValue(0xFFFFFFFF), 0xFFFFFFFF);
    assertEquals(BooleanArray.isSafeValue(0xFFFFFFFF), true);

    // Test rejection just above
    assertThrows(() => BooleanArray.assertIsSafeValue(0x100000000), RangeError);
    assertEquals(BooleanArray.isSafeValue(0x100000000), false);

    // Test maximum safe size
    assertEquals(BooleanArray.assertIsSafeSize(BooleanArray.MAX_SAFE_SIZE), BooleanArray.MAX_SAFE_SIZE);
    assertEquals(BooleanArray.isSafeSize(BooleanArray.MAX_SAFE_SIZE), true);

    // Test rejection just above
    assertThrows(() => BooleanArray.assertIsSafeSize(BooleanArray.MAX_SAFE_SIZE + 1), RangeError);
    assertEquals(BooleanArray.isSafeSize(BooleanArray.MAX_SAFE_SIZE + 1), false);
  });

  await t.step("should return EMPTY_ARRAY for zero-length gets", () => {
    const arr = new BooleanArray(10);
    const result = arr.get(5, 0);

    assertEquals(result.length, 0);
    assertEquals(result, []); // Should be empty array
    // Verify it's the same reference (optimization check)
    assertEquals(result === BooleanArray.EMPTY_ARRAY, true);

    // Test at different positions
    const result2 = arr.get(0, 0);
    assertEquals(result2 === BooleanArray.EMPTY_ARRAY, true);

    const result3 = arr.get(9, 0);
    assertEquals(result3 === BooleanArray.EMPTY_ARRAY, true);
  });

  await t.step("should validate all parameters in range operations", () => {
    const arr = new BooleanArray(100);

    // Both startIndex and count should be validated in get
    assertThrows(() => arr.get(NaN, 5), TypeError); // startIndex invalid
    assertThrows(() => arr.get(0, NaN), TypeError); // count invalid
    assertThrows(() => arr.get(1.5, 5), TypeError); // startIndex not integer
    assertThrows(() => arr.get(0, 5.5), TypeError); // count not integer

    // Both parameters validated in set
    assertThrows(() => arr.set(NaN, 5, true), TypeError);
    assertThrows(() => arr.set(0, NaN, true), TypeError);
    assertThrows(() => arr.set(1.5, 5, true), TypeError);
    assertThrows(() => arr.set(0, 5.5, true), TypeError);

    // Same for getInto
    const out = new Array<boolean>(10);
    assertThrows(() => arr.getInto(NaN, 5, out), TypeError);
    assertThrows(() => arr.getInto(0, NaN, out), TypeError);
    assertThrows(() => arr.getInto(1.5, 5, out), TypeError);
    assertThrows(() => arr.getInto(0, 5.5, out), TypeError);
  });

  await t.step("should validate negative values are rejected consistently", () => {
    const arr = new BooleanArray(100);

    // Negative indices should be rejected
    assertThrows(() => arr.get(-1), RangeError);
    assertThrows(() => arr.set(-1, true), RangeError);
    assertThrows(() => arr.toggle(-1), RangeError);

    // Negative in ranges
    assertThrows(() => arr.get(-5, 10), RangeError);
    assertThrows(() => arr.set(-5, 10, true), RangeError);

    // Negative counts
    assertThrows(() => arr.get(0, -1), RangeError);
    assertThrows(() => arr.set(0, -1, true), RangeError);

    // In factory methods
    assertThrows(() => BooleanArray.fromArray(100, [-1]), RangeError);
    assertThrows(() => BooleanArray.fromArray(100, [-100]), RangeError);
  });

  await t.step("should handle boundary conditions for size validation", () => {
    // Size exactly at MAX_SAFE_SIZE should work
    const largeSize = BooleanArray.MAX_SAFE_SIZE;
    assertEquals(BooleanArray.assertIsSafeSize(largeSize), largeSize);
    assertEquals(BooleanArray.isSafeSize(largeSize), true);

    // Size at 1 (minimum) should work
    assertEquals(BooleanArray.assertIsSafeSize(1), 1);
    assertEquals(BooleanArray.isSafeSize(1), true);
    const tiny = new BooleanArray(1);
    assertEquals(tiny.size, 1);

    // Size at 0 should fail
    assertThrows(() => BooleanArray.assertIsSafeSize(0), RangeError);
    assertEquals(BooleanArray.isSafeSize(0), false);
    assertThrows(() => new BooleanArray(0), RangeError);
  });

  await t.step("should validate combined bounds and type errors", () => {
    // When both type and bounds are wrong, type error should come first
    const arr = new BooleanArray(10);

    // Index that's both not a number AND out of bounds
    assertThrows(() => arr.get(NaN), TypeError); // Not RangeError
    assertThrows(() => arr.get(Infinity), TypeError);

    // In fromObjects with bad types
    assertThrows(
      () => BooleanArray.fromObjects(10, "id", [{ id: NaN }]),
      TypeError,
    );
    assertThrows(
      () => BooleanArray.fromObjects(10, "id", [{ id: Infinity }]),
      TypeError,
    );
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

    // Size 31: almost full chunk
    const arr31 = new BooleanArray(31);
    arr31.fill(true);
    assertEquals(arr31.isFull(), true);
  });

  await t.step("should handle chunk boundary correctly", () => {
    const arr = new BooleanArray(32);
    arr.fill(true);
    assertEquals(arr.isFull(), true);

    arr.set(31, false);
    assertEquals(arr.isFull(), false);

    arr.set(31, true);
    arr.set(0, false);
    assertEquals(arr.isFull(), false);
  });

  await t.step("should detect false bit in middle chunk of multi-chunk array", () => {
    // Size 100 = 4 chunks (0-31, 32-63, 64-95, 96-99)
    const arr = new BooleanArray(100);
    arr.fill(true);
    assertEquals(arr.isFull(), true);

    // Clear a bit in the middle chunk (chunk 1: bits 32-63)
    arr.set(50, false);
    assertEquals(arr.isFull(), false);

    // Restore and clear in chunk 2 (bits 64-95)
    arr.set(50, true);
    arr.set(80, false);
    assertEquals(arr.isFull(), false);
  });

  await t.step("should be complementary to isEmpty for extreme states", () => {
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

Deno.test("BooleanArray - getFalsyCount", async (t) => {
  await t.step("should return size minus truthy count", () => {
    const arr = new BooleanArray(100);
    assertEquals(arr.getFalsyCount(), 100);
    assertEquals(arr.getFalsyCount(), arr.size - arr.getTruthyCount());

    arr.set(0, true);
    arr.set(50, true);
    arr.set(99, true);
    assertEquals(arr.getFalsyCount(), 97);
    assertEquals(arr.getFalsyCount(), arr.size - arr.getTruthyCount());
  });

  await t.step("should return 0 when array is full", () => {
    const arr = new BooleanArray(64);
    arr.fill(true);
    assertEquals(arr.getFalsyCount(), 0);
  });

  await t.step("should return size when array is empty", () => {
    const arr = new BooleanArray(100);
    assertEquals(arr.getFalsyCount(), 100);
  });

  await t.step("should handle non-32-aligned sizes", () => {
    const arr = new BooleanArray(33);
    assertEquals(arr.getFalsyCount(), 33);

    arr.fill(true);
    assertEquals(arr.getFalsyCount(), 0);

    arr.set(32, false);
    assertEquals(arr.getFalsyCount(), 1);
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

    assertEquals(result, arr); // Returns this for chaining
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
    assertEquals(result, dst); // Returns this for chaining
    assertEquals(BooleanArray.equals(src, dst), true);
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

  await t.step("should throw on size mismatch", () => {
    const src = new BooleanArray(64);
    const dst = new BooleanArray(100);
    assertThrows(() => dst.copyFrom(src), RangeError, "Arrays must have the same size");
  });

  await t.step("should throw on source range out of bounds", () => {
    const src = new BooleanArray(100);
    const dst = new BooleanArray(100);
    assertThrows(() => dst.copyFrom(src, 90, 0, 20), RangeError);
  });

  await t.step("should throw on destination range out of bounds", () => {
    const src = new BooleanArray(100);
    const dst = new BooleanArray(100);
    assertThrows(() => dst.copyFrom(src, 0, 90, 20), RangeError);
  });

  await t.step("should validate parameter types", () => {
    const src = new BooleanArray(100);
    const dst = new BooleanArray(100);
    assertThrows(() => dst.copyFrom(src, NaN), TypeError);
    assertThrows(() => dst.copyFrom(src, 0, NaN), TypeError);
    assertThrows(() => dst.copyFrom(src, 0, 0, NaN), TypeError);
    assertThrows(() => dst.copyFrom(src, 1.5), TypeError);
  });

  await t.step("should handle zero count as no-op", () => {
    const src = BooleanArray.fromArray(64, [0, 31, 63]);
    const dst = new BooleanArray(64);
    dst.copyFrom(src, 0, 0, 0);
    assertEquals(dst.isEmpty(), true);
  });

  await t.step("should handle cross-chunk boundaries correctly", () => {
    const src = new BooleanArray(100);
    src.set(28, 10, true); // 28-37, crosses chunk boundary at 32
    const dst = new BooleanArray(100);

    dst.copyFrom(src, 28, 60, 10);

    for (let i = 60; i < 70; i++) assertEquals(dst.get(i), true);
    assertEquals(dst.get(59), false);
    assertEquals(dst.get(70), false);
  });

  await t.step("should preserve unused bits in last chunk", () => {
    const src = new BooleanArray(33);
    src.fill(true);
    const dst = new BooleanArray(33);

    dst.copyFrom(src);

    // Verify the last chunk mask is applied correctly
    const lastChunkValue = dst.buffer[dst.chunkCount - 1]!;
    const unusedMask = BooleanArray.ALL_BITS_TRUE << (33 % 32);
    assertEquals(lastChunkValue & unusedMask, 0);
  });
});

Deno.test("BooleanArray - setFromIndices", async (t) => {
  await t.step("should set bits at specified indices to true", () => {
    const arr = new BooleanArray(10);
    const result = arr.setFromIndices([1, 3, 5, 7, 9]);

    assertEquals(result, arr); // Returns this for chaining
    assertEquals(arr.get(0), false);
    assertEquals(arr.get(1), true);
    assertEquals(arr.get(2), false);
    assertEquals(arr.get(3), true);
    assertEquals(arr.get(4), false);
    assertEquals(arr.get(5), true);
    assertEquals(arr.getTruthyCount(), 5);
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
    assertEquals(arr.getTruthyCount(), 7);
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
    assertEquals(arr.getTruthyCount(), 6);
  });

  await t.step("should handle empty indices array", () => {
    const arr = new BooleanArray(10);
    arr.setFromIndices([]);
    assertEquals(arr.isEmpty(), true);
  });

  await t.step("should handle duplicate indices (idempotent)", () => {
    const arr = new BooleanArray(10);
    arr.setFromIndices([5, 5, 5, 5, 5]);
    assertEquals(arr.getTruthyCount(), 1);
    assertEquals(arr.get(5), true);
  });

  await t.step("should accept Uint32Array as indices", () => {
    const arr = new BooleanArray(100);
    const indices = new Uint32Array([10, 20, 30, 40, 50]);
    arr.setFromIndices(indices);

    assertEquals(arr.getTruthyCount(), 5);
    assertEquals(arr.get(10), true);
    assertEquals(arr.get(50), true);
  });

  await t.step("should accept regular array as indices", () => {
    const arr = new BooleanArray(100);
    arr.setFromIndices([0, 99]);

    assertEquals(arr.get(0), true);
    assertEquals(arr.get(99), true);
    assertEquals(arr.getTruthyCount(), 2);
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
    assertEquals(arr.getTruthyCount(), 4);
  });

  await t.step("should handle large index arrays efficiently", () => {
    const arr = new BooleanArray(10000);
    const indices = new Uint32Array(1000);
    for (let i = 0; i < 1000; i++) {
      indices[i] = i * 10;
    }

    arr.setFromIndices(indices);
    assertEquals(arr.getTruthyCount(), 1000);
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
    assertEquals(arr.lastIndexOf(true, -100), -1); // 100 + (-100) = 0 → no true at 0
    assertEquals(arr.lastIndexOf(true, -101), -1); // Adjusted index < 0 → -1
    assertEquals(arr.lastIndexOf(true, -1000), -1);
  });

  await t.step("indexOf: negative fromIndex edge cases", () => {
    const arr = new BooleanArray(100);
    arr.set(10, true);
    arr.set(50, true);
    arr.set(90, true);

    assertEquals(arr.indexOf(true, -90), 10); // 100 + (-90) = 10 → finds 10
    assertEquals(arr.indexOf(true, -50), 50); // 100 + (-50) = 50 → finds 50
    assertEquals(arr.indexOf(true, -10), 90); // 100 + (-10) = 90 → finds 90
    assertEquals(arr.indexOf(true, -5), -1); // 100 + (-5) = 95 → no true at 95+

    // Extremely negative clamps to 0
    assertEquals(arr.indexOf(true, -100), 10); // Clamps to 0 → finds 10
    assertEquals(arr.indexOf(true, -101), 10); // Clamps to 0 → finds 10
    assertEquals(arr.indexOf(true, -1000), 10);
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

Deno.test("BooleanArray - equals() with corrupted unused bits", async (t) => {
  await t.step("equals ignores unused bits in last chunk", () => {
    // Size 33 = 2 chunks, with only 1 bit valid in chunk 1
    const a = new BooleanArray(33);
    const b = new BooleanArray(33);

    a.set(0, true);
    a.set(32, true);
    b.set(0, true);
    b.set(32, true);

    // Before corruption - should be equal
    assertEquals(a.equals(b), true);
    assertEquals(BooleanArray.equals(a, b), true);

    // Corrupt b's unused bits (bits 1-31 of chunk 1 are unused for size=33)
    b.buffer[1] = b.buffer[1]! | 0xFFFFFFFE;

    // After corruption - should STILL be equal (unused bits don't matter)
    assertEquals(a.equals(b), true);
    assertEquals(BooleanArray.equals(a, b), true);

    // Verify logical content is the same
    assertEquals(a.get(32), b.get(32));
    assertEquals(a.getTruthyCount(), b.getTruthyCount());
  });

  await t.step("equals detects difference in valid bits", () => {
    const a = new BooleanArray(33);
    const b = new BooleanArray(33);

    a.set(32, true);
    // b has bit 32 as false (default)

    assertEquals(a.equals(b), false);
  });

  await t.step("equals handles size=32 (full last chunk)", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(32);

    a.set(31, true);
    b.set(31, true);

    assertEquals(a.equals(b), true);

    b.set(0, true);
    assertEquals(a.equals(b), false);
  });
});
