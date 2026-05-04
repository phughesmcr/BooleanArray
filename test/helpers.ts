import { assertEquals } from "jsr:@std/assert@^1.0.10";
import { ALL_BITS_TRUE, BooleanArray } from "../mod.ts";

type BooleanArrayInstance = InstanceType<typeof BooleanArray>;

// Helper function to assert that unused bits in the last chunk are zero
export function assertUnusedBitsZero(array: BooleanArrayInstance, operationName?: string): void {
  if (array.size === 0 || array.wordLength === 0) return;
  const bitsInLastChunk = array.size % BooleanArray.BITS_PER_INT;
  if (bitsInLastChunk === 0) return; // Last chunk is full

  const lastChunkIndex = array.wordLength - 1;
  const lastChunkValue = Number(array.buffer[lastChunkIndex]!); // Uint32Array access
  const unusedMask = ALL_BITS_TRUE << bitsInLastChunk;

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
