/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.10";
import {
  BooleanArray,
  and,
  difference,
  equals,
  fromArray,
  nand,
  nor,
  not,
  or,
  xnor,
  xor,
} from "../mod.ts";
import { assertUnusedBitsZero } from "./helpers.ts";

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
      const andResult = and(a, b);
      if (size > 0) assertEquals(andResult.get(0), false);
      if (size > 1) assertEquals(andResult.get(1), true);
      if (size > 2) assertEquals(andResult.get(2), false);
      assertUnusedBitsZero(andResult, `AND (size ${size})`);

      const orResult = or(a, b);
      if (size > 0) assertEquals(orResult.get(0), true);
      if (size > 1) assertEquals(orResult.get(1), true);
      if (size > 2) assertEquals(orResult.get(2), true);
      assertUnusedBitsZero(orResult, `OR (size ${size})`);

      const xorResult = xor(a, b);
      if (size > 0) assertEquals(xorResult.get(0), true);
      if (size > 1) assertEquals(xorResult.get(1), false);
      if (size > 2) assertEquals(xorResult.get(2), true);
      assertUnusedBitsZero(xorResult, `XOR (size ${size})`);

      // Test advanced operations
      const notResult = not(a);
      if (size > 0) assertEquals(notResult.get(0), false);
      if (size > 1) assertEquals(notResult.get(1), false);
      assertUnusedBitsZero(notResult, `NOT (size ${size})`);

      const nandResult = nand(a, b);
      if (size > 0) assertEquals(nandResult.get(0), true);
      if (size > 1) assertEquals(nandResult.get(1), false);
      if (size > 2) assertEquals(nandResult.get(2), true);
      assertUnusedBitsZero(nandResult, `NAND (size ${size})`);

      // Test instance operations (modify in place)
      const c = a.clone();
      c.and(b);
      assertEquals(equals(c, andResult), true);

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

    assertThrows(() => and(a, b), RangeError, "Arrays must have the same size");
    assertThrows(() => or(a, b), RangeError);
    assertThrows(() => xor(a, b), RangeError);
  });
});

Deno.test("BooleanArray - Additional Bitwise Operations", async (t) => {
  await t.step("should perform NOR and XNOR (functional)", () => {
    const a = fromArray(4, [1, 3]); // bits [1,3] => 1010 (bit3..bit0)
    const b = fromArray(4, [0, 1]); // bits [0,1] => 0011 (bit3..bit0)
    const norResult = nor(a, b); // ~(1010 | 0011) = ~(1011) = 0100
    const xnorResult = xnor(a, b); // ~(1010 ^ 0011) = ~(1001) = 0110

    // Verify exact truth tables
    assertEquals([0, 1, 2, 3].map((i) => norResult.get(i)), [false, false, true, false]);
    assertEquals([0, 1, 2, 3].map((i) => xnorResult.get(i)), [false, true, true, false]);
    assertUnusedBitsZero(norResult, "NOR");
    assertUnusedBitsZero(xnorResult, "XNOR");
  });

  await t.step("should perform instance bitwise ops in place and return this", () => {
    const size = 8;
    const a = fromArray(size, [0, 2, 4, 6]); // 10101010
    const b = fromArray(size, [1, 2, 3]); // 00001110

    // or
    const retOr = a.clone();
    const retOrReturn = retOr.or(b);
    assert(retOrReturn === retOr, "or should return this for chaining");
    assertEquals([0, 1, 2, 3, 4, 5, 6, 7].map((i) => retOr.get(i)), [true, true, true, true, true, false, true, false]);

    // xor
    const retXor = a.clone();
    const retXorReturn = retXor.xor(b);
    assert(retXorReturn === retXor, "xor should return this for chaining");
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
    const retNand = a.clone();
    const retNandReturn = retNand.nand(b);
    assert(retNandReturn === retNand, "nand should return this for chaining");
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
    assertUnusedBitsZero(retNand, "NAND in-place");

    // nor - verify exact truth table
    const retNor = a.clone();
    const retNorReturn = retNor.nor(b);
    assert(retNorReturn === retNor, "nor should return this for chaining");
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
    assertUnusedBitsZero(retNor, "NOR in-place");

    // xnor - verify exact truth table
    const retXnor = a.clone();
    const retXnorReturn = retXnor.xnor(b);
    assert(retXnorReturn === retXnor, "xnor should return this for chaining");
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
    const c = fromArray(size, [0, 7]); // 10000001
    const retNot = c.not();
    assertEquals(retNot, c);
    assertEquals([0, 1, 2, 3, 4, 5, 6, 7].map((i) => c.get(i)), [false, true, true, true, true, true, true, false]);
  });
});

Deno.test("BooleanArray - Comparison Operations", async (t) => {
  await t.step("should compare arrays for equality", () => {
    const a = new BooleanArray(100);
    const b = new BooleanArray(100);

    // Empty arrays
    assertEquals(equals(a, b), true);

    // Same patterns
    a.set(0, true);
    a.set(99, true);
    b.set(0, true);
    b.set(99, true);
    assertEquals(equals(a, b), true);

    // Different patterns
    b.set(50, true);
    assertEquals(equals(a, b), false);

    // Different sizes
    const c = new BooleanArray(200);
    assertEquals(equals(a, c), false);
  });

  await t.step("should compute difference between arrays", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(32);

    a.set(0, true);
    a.set(1, true);
    b.set(1, true);
    b.set(2, true);

    const result = difference(a, b);
    assertEquals(result.get(0), true); // In a but not in b
    assertEquals(result.get(1), false); // In both
    assertEquals(result.get(2), false); // In b but not in a

    // Size mismatch should throw
    const c = new BooleanArray(64);
    assertThrows(() => difference(a, c), RangeError);
  });
});

Deno.test("BooleanArray - Functional Operations Non-Mutation", async (t) => {
  await t.step("functional and should not mutate inputs", () => {
    const a = BooleanArray.fromArray(32, [0, 1]);
    const b = BooleanArray.fromArray(32, [1, 2]);

    const andResult = and(a, b);
    const orResult = or(a, b);
    const xorResult = xor(a, b);
    const nandResult = nand(a, b);
    const norResult = nor(a, b);
    const xnorResult = xnor(a, b);
    const diffResult = difference(a, b);
    const notResult = not(a);

    // Results should be new arrays
    assert(andResult !== a && andResult !== b);
    assert(orResult !== a && orResult !== b);
    assert(xorResult !== a && xorResult !== b);
    assert(nandResult !== a && nandResult !== b);
    assert(norResult !== a && norResult !== b);
    assert(xnorResult !== a && xnorResult !== b);
    assert(diffResult !== a && diffResult !== b);
    assert(notResult !== a);

    // Inputs should remain unchanged
    assertEquals(a.get(0), true);
    assertEquals(a.get(1), true);
    assertEquals(a.get(2), false);

    assertEquals(b.get(0), false);
    assertEquals(b.get(1), true);
    assertEquals(b.get(2), true);
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

Deno.test("BooleanArray - Algebraic Identities", async (t) => {
  await t.step("xor(a, a) should be empty", () => {
    const a = BooleanArray.fromArray(64, [0, 10, 20, 30, 63]);
    const result = xor(a, a);
    assertEquals(result.isEmpty(), true);
    assertEquals(result.getCount(true), 0);
  });

  await t.step("difference(a, a) should be empty", () => {
    const a = BooleanArray.fromArray(64, [5, 15, 25, 35]);
    const result = difference(a, a);
    assertEquals(result.isEmpty(), true);
    assertEquals(result.getCount(true), 0);
  });

  await t.step("De Morgan: NOT(a OR b) equals (NOT a) AND (NOT b)", () => {
    const a = BooleanArray.fromArray(32, [0, 5, 10]);
    const b = BooleanArray.fromArray(32, [5, 15, 20]);
    const notOr = not(or(a, b));
    const andNot = and(not(a), not(b));
    assertEquals(equals(notOr, andNot), true);
  });

  await t.step("De Morgan: NOT(a AND b) equals (NOT a) OR (NOT b)", () => {
    const a = BooleanArray.fromArray(32, [1, 3, 7]);
    const b = BooleanArray.fromArray(32, [3, 7, 9]);
    const notAnd = not(and(a, b));
    const orNot = or(not(a), not(b));
    assertEquals(equals(notAnd, orNot), true);
  });

  await t.step("NOT(NOT(a)) equals a", () => {
    const a = BooleanArray.fromArray(33, [0, 10, 20, 32]);
    const result = not(not(a));
    assertEquals(equals(result, a), true);
  });
});

Deno.test("BooleanArray - Equals Properties", async (t) => {
  await t.step("equals is reflexive", () => {
    const a = BooleanArray.fromArray(64, [0, 10, 20, 30]);
    assertEquals(equals(a, a), true);
    assertEquals(a.equals(a), true);
  });

  await t.step("equals is symmetric", () => {
    const a = BooleanArray.fromArray(64, [0, 10]);
    const b = BooleanArray.fromArray(64, [0, 10]);

    assertEquals(equals(a, b), equals(b, a));
    assertEquals(a.equals(b), b.equals(a));
  });

  await t.step("equals is transitive", () => {
    const a = BooleanArray.fromArray(32, [5, 15]);
    const b = BooleanArray.fromArray(32, [5, 15]);
    const c = BooleanArray.fromArray(32, [5, 15]);

    assertEquals(equals(a, b), true);
    assertEquals(equals(b, c), true);
    assertEquals(equals(a, c), true);
  });

  await t.step("equals returns false for size mismatch", () => {
    const a = new BooleanArray(32);
    const b = new BooleanArray(64);

    assertEquals(equals(a, b), false);
    assertEquals(a.equals(b), false);
  });

  await t.step("equals returns false for different content", () => {
    const a = BooleanArray.fromArray(32, [0, 10]);
    const b = BooleanArray.fromArray(32, [0, 11]);

    assertEquals(equals(a, b), false);
    assertEquals(a.equals(b), false);
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
    assertEquals(equals(a, b), true);

    // Corrupt b's unused bits (bits 1-31 of chunk 1 are unused for size=33)
    b.buffer[1] = b.buffer[1]! | 0xFFFFFFFE;

    // After corruption - should STILL be equal (unused bits don't matter)
    assertEquals(a.equals(b), true);
    assertEquals(equals(a, b), true);

    // Verify logical content is the same
    assertEquals(a.get(32), b.get(32));
    assertEquals(a.getCount(true), b.getCount(true));
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
