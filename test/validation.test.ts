/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.10";
import { assertIsSafeSize, assertIsSafeValue, BooleanArray, EMPTY_ARRAY, isSafeSize, isSafeValue } from "../mod.ts";

Deno.test("BooleanArray - Validation Utilities", async (t) => {
  await t.step("should validate assertIsSafeValue", () => {
    // Valid values (0 to 0xFFFFFFFF)
    assertEquals(assertIsSafeValue(0), 0);
    assertEquals(assertIsSafeValue(100), 100);
    assertEquals(assertIsSafeValue(0xFFFFFFFF), 0xFFFFFFFF);

    // Invalid values - below range
    assertThrows(() => assertIsSafeValue(-1), RangeError);
    assertThrows(() => assertIsSafeValue(-100), RangeError);

    // Invalid values - above range
    assertThrows(() => assertIsSafeValue(0xFFFFFFFF + 1), RangeError);
    assertThrows(() => assertIsSafeValue(0x100000000), RangeError);

    // Invalid values - not safe integers
    assertThrows(() => assertIsSafeValue(NaN), TypeError);
    assertThrows(() => assertIsSafeValue(Infinity), TypeError);
    assertThrows(() => assertIsSafeValue(-Infinity), TypeError);
    assertThrows(() => assertIsSafeValue(3.14), TypeError);
  });

  await t.step("should validate isSafeValue", () => {
    // Valid values
    assertEquals(isSafeValue(0), true);
    assertEquals(isSafeValue(100), true);
    assertEquals(isSafeValue(0xFFFFFFFF), true);

    // Invalid values - below range
    assertEquals(isSafeValue(-1), false);
    assertEquals(isSafeValue(-100), false);

    // Invalid values - above range
    assertEquals(isSafeValue(0xFFFFFFFF + 1), false);
    assertEquals(isSafeValue(0x100000000), false);

    // Invalid values - not safe integers
    assertEquals(isSafeValue(NaN), false);
    assertEquals(isSafeValue(Infinity), false);
    assertEquals(isSafeValue(-Infinity), false);
    assertEquals(isSafeValue(3.14), false);
  });

  await t.step("should validate assertIsSafeSize", () => {
    // Valid sizes (1 to MAX_SAFE_SIZE)
    assertEquals(assertIsSafeSize(1), 1);
    assertEquals(assertIsSafeSize(100), 100);
    assertEquals(assertIsSafeSize(BooleanArray.MAX_SAFE_SIZE), BooleanArray.MAX_SAFE_SIZE);

    // Invalid sizes - below range
    assertThrows(() => assertIsSafeSize(0), RangeError);
    assertThrows(() => assertIsSafeSize(-1), RangeError);

    // Invalid sizes - above range
    assertThrows(() => assertIsSafeSize(BooleanArray.MAX_SAFE_SIZE + 1), RangeError);

    // Invalid sizes - not safe integers
    assertThrows(() => assertIsSafeSize(NaN), TypeError);
    assertThrows(() => assertIsSafeSize(Infinity), TypeError);
    assertThrows(() => assertIsSafeSize(-Infinity), TypeError);
    assertThrows(() => assertIsSafeSize(3.14), TypeError);
  });

  await t.step("should validate isSafeSize", () => {
    // Valid sizes
    assertEquals(isSafeSize(1), true);
    assertEquals(isSafeSize(100), true);
    assertEquals(isSafeSize(BooleanArray.MAX_SAFE_SIZE), true);

    // Invalid sizes - below range
    assertEquals(isSafeSize(0), false);
    assertEquals(isSafeSize(-1), false);

    // Invalid sizes - above range
    assertEquals(isSafeSize(BooleanArray.MAX_SAFE_SIZE + 1), false);

    // Invalid sizes - not safe integers
    assertEquals(isSafeSize(NaN), false);
    assertEquals(isSafeSize(Infinity), false);
    assertEquals(isSafeSize(-Infinity), false);
    assertEquals(isSafeSize(3.14), false);
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
    assertEquals(result === EMPTY_ARRAY, true);

    // Test at different positions
    const result2 = arr.get(0, 0);
    assertEquals(result2 === EMPTY_ARRAY, true);

    const result3 = arr.get(9, 0);
    assertEquals(result3 === EMPTY_ARRAY, true);
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
