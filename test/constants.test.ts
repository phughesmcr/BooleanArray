/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assertEquals } from "jsr:@std/assert@^1.0.10";
import { ALL_BITS_TRUE, BooleanArray, CHUNK_MASK, CHUNK_SHIFT } from "../mod.ts";

Deno.test("BooleanArray - Constants", () => {
  assertEquals(BooleanArray.BITS_PER_INT, 32);
  assertEquals(CHUNK_MASK, 31);
  assertEquals(CHUNK_SHIFT, 5);
  assertEquals(ALL_BITS_TRUE, 4294967295);
  assertEquals(BooleanArray.MAX_SAFE_SIZE, 536870911);
});
