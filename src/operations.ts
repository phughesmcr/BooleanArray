/**
 * @description Bindings for bitwise operations on BooleanArrays.
 * @copyright   2026 the BooleanArray authors. All rights reserved.
 * @license     MIT
 * @module
 */

import type { BooleanArray } from "./boolean-array.ts";

type BooleanArrayConstructor = { new (size: number): BooleanArray };

function assertSameSize(a: BooleanArray, b: BooleanArray): void {
  if (a.size !== b.size) {
    throw new RangeError("Arrays must have the same size");
  }
}

function assertSameOutputSize(a: BooleanArray, out: BooleanArray): void {
  if (a.size !== out.size) {
    throw new RangeError("Output array must have the same size");
  }
}

function maskLastChunk(out: BooleanArray): void {
  if (out.bitsInLastChunk > 0) {
    out.buffer[out.wordLength - 1]! &= out.lastChunkMask;
  }
}

/**
 * Check whether two BooleanArrays share at least one truthy bit.
 * @allocates Does not allocate.
 */
export function intersects(a: BooleanArray, b: BooleanArray): boolean {
  assertSameSize(a, b);
  const lastIndex = a.wordLength - 1;
  for (let i = 0; i < lastIndex; i++) {
    if ((a.buffer[i]! & b.buffer[i]!) !== 0) {
      return true;
    }
  }
  return ((a.buffer[lastIndex]! & b.buffer[lastIndex]!) & a.lastChunkMask) !== 0;
}

/**
 * Check whether every truthy bit in `subset` is also truthy in `a`.
 * @allocates Does not allocate.
 */
export function containsAll(a: BooleanArray, subset: BooleanArray): boolean {
  assertSameSize(a, subset);
  const lastIndex = a.wordLength - 1;
  for (let i = 0; i < lastIndex; i++) {
    if ((subset.buffer[i]! & ~a.buffer[i]!) !== 0) {
      return false;
    }
  }
  return ((subset.buffer[lastIndex]! & ~a.buffer[lastIndex]!) & a.lastChunkMask) === 0;
}

/**
 * Bitwise AND operation
 * @param a the BooleanArray to operate on
 * @param b the BooleanArray to AND with
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function and(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  assertSameSize(a, b);
  const result = inPlace ? a : new (a.constructor as BooleanArrayConstructor)(a.size);
  return andInto(a, b, result);
}

/**
 * Write the bitwise AND of `a` and `b` into `out`.
 * @allocates Does not allocate when `out` is preallocated.
 */
export function andInto(a: BooleanArray, b: BooleanArray, out: BooleanArray): BooleanArray {
  assertSameSize(a, b);
  assertSameOutputSize(a, out);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = out.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = (aBuf[i]! & bBuf[i]!) >>> 0;
  }
  maskLastChunk(out);
  return out;
}

/**
 * Bitwise difference operation
 * @param a the BooleanArray to operate on
 * @param b the BooleanArray to subtract
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function difference(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  assertSameSize(a, b);
  const result = inPlace ? a : new (a.constructor as BooleanArrayConstructor)(a.size);
  return differenceInto(a, b, result);
}

/**
 * Write the bitwise difference (`a & ~b`) into `out`.
 * @allocates Does not allocate when `out` is preallocated.
 */
export function differenceInto(a: BooleanArray, b: BooleanArray, out: BooleanArray): BooleanArray {
  assertSameSize(a, b);
  assertSameOutputSize(a, out);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = out.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = (aBuf[i]! & ~bBuf[i]!) >>> 0;
  }
  maskLastChunk(out);
  return out;
}

/**
 * Bitwise NAND operation
 * @param a the BooleanArray to operate on
 * @param b the BooleanArray to NAND with
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function nand(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  assertSameSize(a, b);
  const result = inPlace ? a : new (a.constructor as BooleanArrayConstructor)(a.size);
  return nandInto(a, b, result);
}

/**
 * Write the bitwise NAND of `a` and `b` into `out`.
 * @allocates Does not allocate when `out` is preallocated.
 */
export function nandInto(a: BooleanArray, b: BooleanArray, out: BooleanArray): BooleanArray {
  assertSameSize(a, b);
  assertSameOutputSize(a, out);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = out.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = ~(aBuf[i]! & bBuf[i]!) >>> 0;
  }
  maskLastChunk(out);
  return out;
}

/**
 * Bitwise NOR operation
 * @param a the BooleanArray to operate on
 * @param b the BooleanArray to NOR with
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function nor(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  assertSameSize(a, b);
  const result = inPlace ? a : new (a.constructor as BooleanArrayConstructor)(a.size);
  return norInto(a, b, result);
}

/**
 * Write the bitwise NOR of `a` and `b` into `out`.
 * @allocates Does not allocate when `out` is preallocated.
 */
export function norInto(a: BooleanArray, b: BooleanArray, out: BooleanArray): BooleanArray {
  assertSameSize(a, b);
  assertSameOutputSize(a, out);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = out.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = ~(aBuf[i]! | bBuf[i]!) >>> 0;
  }
  maskLastChunk(out);
  return out;
}

/**
 * Bitwise NOT operation
 * @param a the BooleanArray to perform NOT on
 * @param inPlace whether the operation should be performed in-place
 * @returns a BooleanArray with the result
 */
export function not(a: BooleanArray, inPlace: boolean = false): BooleanArray {
  const result = inPlace ? a : new (a.constructor as BooleanArrayConstructor)(a.size);
  return notInto(a, result);
}

/**
 * Write the bitwise NOT of `a` into `out`.
 * @allocates Does not allocate when `out` is preallocated.
 */
export function notInto(a: BooleanArray, out: BooleanArray): BooleanArray {
  assertSameOutputSize(a, out);
  const aBuf = a.buffer;
  const rBuf = out.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = ~aBuf[i]! >>> 0;
  }
  maskLastChunk(out);
  return out;
}

/**
 * Bitwise OR operation
 * @param a the BooleanArray to operate on
 * @param b the BooleanArray to OR with
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function or(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  assertSameSize(a, b);
  const result = inPlace ? a : new (a.constructor as BooleanArrayConstructor)(a.size);
  return orInto(a, b, result);
}

/**
 * Write the bitwise OR of `a` and `b` into `out`.
 * @allocates Does not allocate when `out` is preallocated.
 */
export function orInto(a: BooleanArray, b: BooleanArray, out: BooleanArray): BooleanArray {
  assertSameSize(a, b);
  assertSameOutputSize(a, out);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = out.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = (aBuf[i]! | bBuf[i]!) >>> 0;
  }
  maskLastChunk(out);
  return out;
}

/**
 * Bitwise XOR operation
 * @param a the BooleanArray to operate on
 * @param b the BooleanArray to XOR with
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function xor(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  assertSameSize(a, b);
  const result = inPlace ? a : new (a.constructor as BooleanArrayConstructor)(a.size);
  return xorInto(a, b, result);
}

/**
 * Write the bitwise XOR of `a` and `b` into `out`.
 * @allocates Does not allocate when `out` is preallocated.
 */
export function xorInto(a: BooleanArray, b: BooleanArray, out: BooleanArray): BooleanArray {
  assertSameSize(a, b);
  assertSameOutputSize(a, out);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = out.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = (aBuf[i]! ^ bBuf[i]!) >>> 0;
  }
  maskLastChunk(out);
  return out;
}

/**
 * Bitwise XNOR operation
 * @param a the BooleanArray to operate on
 * @param b the BooleanArray to XNOR with
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export function xnor(a: BooleanArray, b: BooleanArray, inPlace: boolean = false): BooleanArray {
  assertSameSize(a, b);
  const result = inPlace ? a : new (a.constructor as BooleanArrayConstructor)(a.size);
  return xnorInto(a, b, result);
}

/**
 * Write the bitwise XNOR of `a` and `b` into `out`.
 * @allocates Does not allocate when `out` is preallocated.
 */
export function xnorInto(a: BooleanArray, b: BooleanArray, out: BooleanArray): BooleanArray {
  assertSameSize(a, b);
  assertSameOutputSize(a, out);
  const aBuf = a.buffer;
  const bBuf = b.buffer;
  const rBuf = out.buffer;
  for (let i = 0; i < aBuf.length; i++) {
    rBuf[i] = ~(aBuf[i]! ^ bBuf[i]!) >>> 0;
  }
  maskLastChunk(out);
  return out;
}

/**
 * Check if two BooleanArrays are equal
 * @param a the first BooleanArray
 * @param b the second BooleanArray
 * @returns true if the arrays are equal, false otherwise
 */
export function equals(a: BooleanArray, b: BooleanArray): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  const lastIndex = a.wordLength - 1;
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
