/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assertEquals } from "jsr:@std/assert@^1.0.10";
import { getChunk, getChunkCount, getChunkOffset } from "../mod.ts";

Deno.test("BooleanArray - Internal Utilities", async (t) => {
  await t.step("should validate chunk utility functions", () => {
    // Chunk calculations
    assertEquals(getChunk(0), 0);
    assertEquals(getChunk(31), 0);
    assertEquals(getChunk(32), 1);
    assertEquals(getChunk(63), 1);

    assertEquals(getChunkCount(1), 1);
    assertEquals(getChunkCount(32), 1);
    assertEquals(getChunkCount(33), 2);

    assertEquals(getChunkOffset(0), 0);
    assertEquals(getChunkOffset(31), 31);
    assertEquals(getChunkOffset(32), 0);
  });
});
