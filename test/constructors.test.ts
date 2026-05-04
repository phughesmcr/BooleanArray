/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.10";
import { BooleanArray, fromArray, fromObjects, fromUint32Array, getChunkCount } from "../mod.ts";
import { assertUnusedBitsZero } from "./helpers.ts";

Deno.test("BooleanArray - Factory Functions", async (t) => {
  await t.step("should create from array of indices", () => {
    const indices = [0, 31, 32, 99];
    const array = fromArray(100, indices);

    assertEquals(array.size, 100);
    assertEquals(array.getCount(true), 4);
    for (const index of indices) {
      assertEquals(array.get(index), true);
    }
  });

  await t.step("should create from array of booleans", () => {
    const bools = [true, false, true, false];
    const array = fromArray(100, bools);

    assertEquals(array.size, 100);
    assertEquals(array.getCount(true), 2);
    for (let i = 0; i < bools.length; i++) {
      assertEquals(array.get(i), bools[i]);
    }
  });

  await t.step("should allow empty initializer array", () => {
    const array = fromArray(100, []);
    assertEquals(array.size, 100);
    assertEquals(array.getCount(true), 0);
  });

  await t.step("should create from Uint32Array", () => {
    const size = 100;
    const bufferLength = getChunkCount(size); // Expected: 4 for size 100
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

    const array = fromUint32Array(size, sourceBuffer);

    assertEquals(array.size, size);
    assertEquals(array.getCount(true), 4, "Truthy count should be 4 based on set bits");

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
    const expectedBufferLength = getChunkCount(size);
    assertEquals(sourceBuffer.length, expectedBufferLength, "Source buffer length should match expected for size 96");

    const array = fromUint32Array(size, sourceBuffer);

    assertEquals(array.size, size, "Array size should be 96");
    assertEquals(array.getCount(true), 12, "Truthy count should be 4 + 8 + 0 = 12");

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
    const expectedBufferLength = getChunkCount(size);
    assertEquals(sourceBuffer.length, expectedBufferLength, "Source buffer length should match expected for size 128");

    const array = fromUint32Array(size, sourceBuffer);

    assertEquals(array.size, size, "Array size should be 128");
    assertEquals(array.getCount(true), 16, "Truthy count should be 2 + 8 + 4 + 2 = 16");

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
    const arr = fromUint32Array(size, buffer);
    assertEquals(arr.get(0), true);
    assertEquals(arr.get(1), true);
    assertEquals(arr.get(2), true);
    assertEquals(arr.get(3), true);
    assertEquals(arr.get(4), true);
    assertEquals(arr.get(5), true);
    assertEquals(arr.get(6), true);
    assertEquals(arr.get(7), true);
    assertEquals(arr.get(8), true);
    assertEquals(arr.get(99), false);
  });

  await t.step("should handle too-large Uint32Array input", () => {
    const size = 64;
    const buffer = new Uint32Array(3);
    assertThrows(() => fromUint32Array(size, buffer), RangeError);
  });

  await t.step("should validate Uint32Array input type", () => {
    const size = 64;
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => fromUint32Array(size, null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => fromUint32Array(size, "not a buffer"), TypeError);
  });

  await t.step("should reject non-numeric ArrayLike elements", () => {
    // String of valid length (size 64 needs 2 chunks, "ab" has length 2)
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => fromUint32Array(64, "ab"), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => fromUint32Array(64, ["not", "numbers"]), TypeError);
  });

  await t.step("should create from object array", () => {
    const objs = [{ id: 0 }, { id: 2 }, { id: 4 }];
    const array = fromObjects(10, "id", objs);

    assertEquals(array.size, 10);
    assertEquals(array.get(0), true);
    assertEquals(array.get(2), true);
    assertEquals(array.get(4), true);
    assertEquals(array.get(1), false);
  });

  await t.step("should allow empty object array", () => {
    const array = fromObjects(10, "id", []);
    assertEquals(array.size, 10);
    assertEquals(array.getCount(true), 0);
  });

  await t.step("should throw on invalid object array input", () => {
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => fromObjects(10, "id", null), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => fromObjects(10, null, []), TypeError);
  });

  await t.step("should throw on invalid object index values", () => {
    assertThrows(() => fromObjects(10, "id", [{ id: -1 }]), RangeError);
    assertThrows(() => fromObjects(10, "id", [{ id: 10 }]), RangeError);
    assertThrows(() => fromObjects(10, "id", [{ id: "bad" }]), TypeError);
  });

  await t.step("should handle dense and sparse inputs", () => {
    const dense = fromArray(100, new Array(100).fill(true));
    assertEquals(dense.getCount(true), 100);
    assertEquals(dense.isFull(), true);

    const sparse = fromArray(1000, [0, 100, 500, 999]);
    assertEquals([...sparse.truthyIndices()], [0, 100, 500, 999]);
  });

  await t.step("should allow zero-length input arrays with size >= 1", () => {
    const arr = fromArray(1, []);
    assertEquals(arr.size, 1);
    assertEquals(arr.get(0), false);
  });

  await t.step("should support non-32-aligned sizes", () => {
    const arr = fromArray(33, [0, 31, 32]);
    assertEquals(arr.get(0), true);
    assertEquals(arr.get(31), true);
    assertEquals(arr.get(32), true);
    assertUnusedBitsZero(arr, "fromArray with non-32-aligned size");
  });

  await t.step("should create from objects using custom key", () => {
    const objs = [{ index: 1 }, { index: 3 }, { index: 5 }];
    const array = fromObjects(10, "index", objs);

    assertEquals(array.get(1), true);
    assertEquals(array.get(3), true);
    assertEquals(array.get(5), true);
    assertEquals(array.get(0), false);
  });

  await t.step("should throw on invalid array input", () => {
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => fromArray(10, null), TypeError);
  });

  await t.step("should throw when first element is not number or boolean", () => {
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => fromArray(10, ["bad"]), TypeError);
  });

  await t.step("should throw when index array exceeds size", () => {
    assertThrows(() => fromArray(5, [0, 1, 2, 3, 4, 5]), RangeError);
  });

  await t.step("should throw when boolean array exceeds size", () => {
    assertThrows(() => fromArray(3, [true, false, true, false]), RangeError);
  });

  await t.step("should throw on invalid array element types", () => {
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => fromArray(10, [true, "false"]), TypeError);
    // @ts-expect-error - Testing runtime behavior
    assertThrows(() => fromArray(10, [1, "2"]), TypeError);
  });

  await t.step("should handle duplicate indices", () => {
    const arr = fromArray(10, [1, 1, 2, 2, 2, 9]);
    assertEquals(arr.getCount(true), 3);
    assertEquals(arr.get(1), true);
    assertEquals(arr.get(2), true);
    assertEquals(arr.get(9), true);
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
    // @ts-ignore - Testing runtime behavior
    assertThrows(() => BooleanArray.fromArray(10, [true, false, 1, true]), TypeError);

    // @ts-ignore - Testing runtime behavior
    assertThrows(() => BooleanArray.fromArray(10, [true, "false", true]), TypeError);

    // @ts-ignore - Testing runtime behavior
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
