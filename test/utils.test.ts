/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assertEquals } from "jsr:@std/assert@^1.0.10";
import { and, countChunk, difference, invalidNumber, nand, nor, not, or, xnor, xor } from "../src/utils.ts";

Deno.test("Bitwise Operations", async (t) => {
  const testCases = [
    { a: 0b1010, b: 0b0110, name: "Positive Numbers" },
    { a: 0, b: 0, name: "Zeroes" },
    { a: 0xFFFFFFFF, b: 0xFFFFFFFF, name: "All Bits Set" }, // Max 32-bit unsigned int
    { a: 0xFFFFFFFF, b: 0, name: "All Bits Set and Zero" },
    { a: 0b1, b: 0b10, name: "Single Bits" },
    { a: 0x55555555, b: 0xAAAAAAAA, name: "Alternating Patterns" }, // 0101... and 1010...
  ];

  for (const { a, b, name } of testCases) {
    await t.step(`and - ${name}`, () => {
      assertEquals(and(a, b), a & b);
    });

    await t.step(`difference - ${name}`, () => {
      assertEquals(difference(a, b), a & ~b);
    });

    await t.step(`nand - ${name}`, () => {
      assertEquals(nand(a, b), ~(a & b));
    });

    await t.step(`nor - ${name}`, () => {
      assertEquals(nor(a, b), ~(a | b));
    });

    await t.step(`or - ${name}`, () => {
      assertEquals(or(a, b), a | b);
    });

    await t.step(`xor - ${name}`, () => {
      assertEquals(xor(a, b), a ^ b);
    });

    await t.step(`xnor - ${name}`, () => {
      assertEquals(xnor(a, b), ~(a ^ b));
    });
  }

  // Specific tests for 'not' as it's unary
  const notTestCases = [
    { a: 0b1010, name: "Positive Number" },
    { a: 0, name: "Zero" },
    { a: 0xFFFFFFFF, name: "All Bits Set" },
    { a: 0x55555555, name: "Alternating Pattern" },
  ];

  for (const { a, name } of notTestCases) {
    await t.step(`not - ${name}`, () => {
      assertEquals(not(a), ~a);
    });
  }
});

Deno.test("invalidNumber", async (t) => {
  await t.step("should return false for valid numbers", () => {
    assertEquals(invalidNumber(0), false);
    assertEquals(invalidNumber(123), false);
    assertEquals(invalidNumber(-123), false);
    assertEquals(invalidNumber(1.23), false);
    assertEquals(invalidNumber(Number.MAX_VALUE), false);
    assertEquals(invalidNumber(Number.MIN_VALUE), false);
    assertEquals(invalidNumber(Number.MAX_SAFE_INTEGER), false);
    assertEquals(invalidNumber(Number.MIN_SAFE_INTEGER), false);
  });

  await t.step("should return true for NaN", () => {
    assertEquals(invalidNumber(NaN), true);
  });

  await t.step("should return true for non-number types", () => {
    assertEquals(invalidNumber(undefined as unknown as number), true);
    assertEquals(invalidNumber(null as unknown as number), true);
    assertEquals(invalidNumber("123" as unknown as number), true);
    assertEquals(invalidNumber(true as unknown as number), true);
    assertEquals(invalidNumber({} as unknown as number), true);
    assertEquals(invalidNumber([] as unknown as number), true);
    assertEquals(invalidNumber((() => {}) as unknown as number), true);
  });

  // Test with Infinity, though bitwise operations on Infinity don't make much sense
  // and typically result in 0 or specific behavior defined by JS for bitwise ops.
  // invalidNumber should still treat them as numbers.
  await t.step("should return false for Infinity and -Infinity", () => {
    assertEquals(invalidNumber(Infinity), false);
    assertEquals(invalidNumber(-Infinity), false);
  });
});

Deno.test("countChunk", async (t) => {
  await t.step("should return 0 for 0", () => {
    assertEquals(countChunk(0), 0);
  });

  await t.step("should return 32 for 0xFFFFFFFF (all bits set)", () => {
    assertEquals(countChunk(0xFFFFFFFF), 32);
    assertEquals(countChunk(-1), 32); // In 2's complement, -1 is all 1s
  });

  await t.step("should count bits correctly for various positive numbers", () => {
    assertEquals(countChunk(0b1), 1);
    assertEquals(countChunk(0b10), 1);
    assertEquals(countChunk(0b11), 2);
    assertEquals(countChunk(0b1010101), 4);
    assertEquals(countChunk(0x55555555), 16); // 01010101... (16 ones)
    assertEquals(countChunk(0xAAAAAAAA), 16); // 10101010... (16 ones)
    assertEquals(countChunk(0x0F0F0F0F), 16);
    assertEquals(countChunk(0xF0F0F0F0), 16);
    assertEquals(countChunk(1), 1);
    assertEquals(countChunk(2), 1);
    assertEquals(countChunk(3), 2);
    assertEquals(countChunk(7), 3);
    assertEquals(countChunk(0b11111111_11111111_11111111_11111110), 31); // Max unsigned int - 1
  });

  // Bitwise operations in JS treat operands as signed 32-bit integers.
  // The countChunk function, however, appears designed for positive integers (or bit patterns).
  // Let's test some negative numbers to see how it behaves, though its primary use case
  // is likely with the direct bit patterns from Uint32Array in BooleanArray.
  await t.step("should behave predictably for negative numbers (as bit patterns)", () => {
    assertEquals(countChunk(-2), 31); // 11111111_11111111_11111111_11111110
    assertEquals(countChunk(-0x55555556), 16); // Corresponds to 0xAAAAAAAA due to two's complement inversion and +1
  });

  await t.step("should handle numbers with leading zeros correctly", () => {
    assertEquals(countChunk(0x00000001), 1);
    assertEquals(countChunk(0x0000FFFF), 16);
    assertEquals(countChunk(0x00FF00FF), 16);
  });
});
