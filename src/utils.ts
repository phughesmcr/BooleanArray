/**
 * @description Helper functions for bitwise operations on BooleanArrays.
 * @copyright   2025 the BooleanArray authors. All rights reserved.
 * @license     MIT
 * @module
 */

import { BooleanArray } from "./boolean-array.ts";

/**
 * Helper function for binary bitwise operations
 * @param operation the bitwise operation to perform on each chunk
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function binaryOperation(
  operation: (a: number, b: number) => number,
  a: BooleanArray,
  b: BooleanArray,
  inPlace = false,
): BooleanArray {
  if (a.size !== b.size) {
    throw new RangeError("Arrays must have the same size");
  }
  const result = inPlace ? a : new BooleanArray(a.size);
  const len = a.buffer.length;
  for (let i = 0; i < len; i++) {
    result.buffer[i] = operation(a.buffer[i]!, b.buffer[i]!) >>> 0;
  }
  // Mask off unused bits in the last chunk
  if (result.bitsInLastChunk > 0) {
    result.buffer[result.chunkCount - 1]! &= result.lastChunkMask;
  }
  return result;
}

/**
 * Helper function for unary bitwise operations
 * @param operation the bitwise operation to perform on each chunk
 * @param inPlace whether the operation should be performed in-place
 * @returns a BooleanArray with the result
 */
export function unaryOperation(
  operation: (a: number) => number,
  a: BooleanArray,
  inPlace = false,
): BooleanArray {
  const result = inPlace ? a : new BooleanArray(a.size);
  const len = a.buffer.length;
  for (let i = 0; i < len; i++) {
    result.buffer[i] = operation(a.buffer[i]!) >>> 0;
  }
  // Mask off unused bits in the last chunk
  if (result.bitsInLastChunk > 0) {
    result.buffer[result.chunkCount - 1]! &= result.lastChunkMask;
  }
  return result;
}
