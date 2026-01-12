/**
 * @description Bindings for bitwise operations on BooleanArrays.
 * @copyright   2026 the BooleanArray authors. All rights reserved.
 * @license     MIT
 * @module
 */

import type { BooleanArray } from "./boolean-array.ts";

/**
 * Bitwise AND operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function and(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  if (a.size !== b.size) {
    throw new RangeError("Arrays must have the same size");
  }
  const result = inPlace ? a : new (a.constructor as { new (size: number): BooleanArray })(a.size);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = result.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = (aBuf[i]! & bBuf[i]!) >>> 0;
  }
  if (result.bitsInLastChunk > 0) {
    rBuf[result.chunkCount - 1]! &= result.lastChunkMask;
  }
  return result;
}

/**
 * Bitwise difference operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function difference(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  if (a.size !== b.size) {
    throw new RangeError("Arrays must have the same size");
  }
  const result = inPlace ? a : new (a.constructor as { new (size: number): BooleanArray })(a.size);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = result.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = (aBuf[i]! & ~bBuf[i]!) >>> 0;
  }
  if (result.bitsInLastChunk > 0) {
    rBuf[result.chunkCount - 1]! &= result.lastChunkMask;
  }
  return result;
}

/**
 * Bitwise NAND operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function nand(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  if (a.size !== b.size) {
    throw new RangeError("Arrays must have the same size");
  }
  const result = inPlace ? a : new (a.constructor as { new (size: number): BooleanArray })(a.size);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = result.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = ~(aBuf[i]! & bBuf[i]!) >>> 0;
  }
  if (result.bitsInLastChunk > 0) {
    rBuf[result.chunkCount - 1]! &= result.lastChunkMask;
  }
  return result;
}

/**
 * Bitwise NOR operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function nor(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  if (a.size !== b.size) {
    throw new RangeError("Arrays must have the same size");
  }
  const result = inPlace ? a : new (a.constructor as { new (size: number): BooleanArray })(a.size);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = result.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = ~(aBuf[i]! | bBuf[i]!) >>> 0;
  }
  if (result.bitsInLastChunk > 0) {
    rBuf[result.chunkCount - 1]! &= result.lastChunkMask;
  }
  return result;
}

/**
 * Bitwise NOT operation
 * @param a the BooleanArray to perform NOT on
 * @param inPlace whether the operation should be performed in-place
 * @returns a BooleanArray with the result
 */
export function not(a: BooleanArray, inPlace: boolean = false): BooleanArray {
  const result = inPlace ? a : new (a.constructor as { new (size: number): BooleanArray })(a.size);
  const aBuf = a.buffer;
  const rBuf = result.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = ~aBuf[i]! >>> 0;
  }
  if (result.bitsInLastChunk > 0) {
    rBuf[result.chunkCount - 1]! &= result.lastChunkMask;
  }
  return result;
}

/**
 * Bitwise OR operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function or(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  if (a.size !== b.size) {
    throw new RangeError("Arrays must have the same size");
  }
  const result = inPlace ? a : new (a.constructor as { new (size: number): BooleanArray })(a.size);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = result.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = (aBuf[i]! | bBuf[i]!) >>> 0;
  }
  if (result.bitsInLastChunk > 0) {
    rBuf[result.chunkCount - 1]! &= result.lastChunkMask;
  }
  return result;
}

/**
 * Bitwise XOR operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function xor(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  if (a.size !== b.size) {
    throw new RangeError("Arrays must have the same size");
  }
  const result = inPlace ? a : new (a.constructor as { new (size: number): BooleanArray })(a.size);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = result.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = (aBuf[i]! ^ bBuf[i]!) >>> 0;
  }
  if (result.bitsInLastChunk > 0) {
    rBuf[result.chunkCount - 1]! &= result.lastChunkMask;
  }
  return result;
}

/**
 * Bitwise XNOR operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function xnor(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  if (a.size !== b.size) {
    throw new RangeError("Arrays must have the same size");
  }
  const result = inPlace ? a : new (a.constructor as { new (size: number): BooleanArray })(a.size);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = result.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = ~(aBuf[i]! ^ bBuf[i]!) >>> 0;
  }
  if (result.bitsInLastChunk > 0) {
    rBuf[result.chunkCount - 1]! &= result.lastChunkMask;
  }
  return result;
}

/**
 * Check if two BooleanArrays are equal
 * @returns true if the arrays are equal, false otherwise
 */
export function equals(a: BooleanArray, b: BooleanArray): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  const lastIndex = a.chunkCount - 1;
  // Compare all chunks except the last
  for (let i = 0; i < lastIndex; i++) {
    if (a.buffer[i]! !== b.buffer[i]!) {
      return false;
    }
  }
  // Compare last chunk with mask to ignore unused bits
  const aMasked = a.buffer[lastIndex]! & a.lastChunkMask;
  const bMasked = b.buffer[lastIndex]! & b.lastChunkMask;
  return aMasked === bMasked;
}
