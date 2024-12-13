import * as assert from "jsr:@std/assert";
import { BooleanArray } from "../mod.ts";

const { assertEquals, assertThrows } = assert;

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
    const array = new BooleanArray(2 ** 32 - 1);
    assertEquals(array.size, 2 ** 32 - 1);
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
