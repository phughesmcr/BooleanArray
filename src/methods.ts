import { BooleanArray } from "./BooleanArray.ts";

/**
 * Bitwise AND operation
 * @param a the first BooleanArray
 * @param b the second BooleanArray
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 */
export function and(a: BooleanArray, b: BooleanArray, inPlace = false): BooleanArray {
  if (a.size !== b.size) {
    throw new Error("Arrays must have the same size");
  }
  const result = inPlace ? a : new BooleanArray(a.size);
  const len = a.length;

  // Loop unrolling for better performance on ARM
  let i = 0;
  const unrollLimit = len - (len % 4);

  // Process 4 elements at a time
  for (; i < unrollLimit; i += 4) {
    result[i] = a[i]! & b[i]!;
    result[i + 1] = a[i + 1]! & b[i + 1]!;
    result[i + 2] = a[i + 2]! & b[i + 2]!;
    result[i + 3] = a[i + 3]! & b[i + 3]!;
  }

  // Handle remaining elements
  for (; i < len; i++) {
    result[i] = a[i]! & b[i]!;
  }

  return result;
}

/**
 * Bitwise difference operation
 * @param a the first BooleanArray
 * @param b the second BooleanArray
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 */
export function difference(a: BooleanArray, b: BooleanArray, inPlace = false): BooleanArray {
  if (a.size !== b.size) {
    throw new Error("Arrays must have the same size");
  }
  const result = inPlace ? a : new BooleanArray(a.size);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i]! & ~b[i]!;
  }
  return result;
}

/**
 * Check if two BooleanArrays are equal
 * @param a the first BooleanArray
 * @param b the second BooleanArray
 * @returns true if the arrays are equal, false otherwise
 */
export function equals(a: BooleanArray, b: BooleanArray): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i]! !== b[i]!) {
      return false;
    }
  }
  return true;
}

/**
 * Bitwise NAND operation
 * @param a the first BooleanArray
 * @param b the second BooleanArray
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 */
export function nand(a: BooleanArray, b: BooleanArray, inPlace = false): BooleanArray {
  if (a.size !== b.size) {
    throw new Error("Arrays must have the same size");
  }
  const result = inPlace ? a : new BooleanArray(a.size);
  for (let i = 0; i < a.length; i++) {
    result[i] = ~(a[i]! & b[i]!);
  }

  // Mask off unused bits in the last chunk
  const lastChunkIndex = result.length - 1;
  if (lastChunkIndex >= 0) {
    const bitsInLastChunk = result.size % BooleanArray.BITS_PER_INT;
    if (bitsInLastChunk > 0) {
      const mask = (1 << bitsInLastChunk) - 1;
      result[lastChunkIndex]! &= mask;
    }
  }

  return result;
}

/**
 * Bitwise NOR operation
 * @param a the first BooleanArray
 * @param b the second BooleanArray
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 */
export function nor(a: BooleanArray, b: BooleanArray, inPlace = false): BooleanArray {
  if (a.size !== b.size) {
    throw new Error("Arrays must have the same size");
  }
  const result = inPlace ? a : new BooleanArray(a.size);
  for (let i = 0; i < a.length; i++) {
    result[i] = ~(a[i]! | b[i]!);
  }

  // Mask off unused bits in the last chunk
  const lastChunkIndex = result.length - 1;
  if (lastChunkIndex >= 0) {
    const bitsInLastChunk = result.size % BooleanArray.BITS_PER_INT;
    if (bitsInLastChunk > 0) {
      const mask = (1 << bitsInLastChunk) - 1;
      result[lastChunkIndex]! &= mask;
    }
  }

  return result;
}

/**
 * Bitwise NOT operation
 * @param a the BooleanArray to perform NOT on
 * @param inPlace whether the operation should be performed in-place
 * @returns a BooleanArray with the result
 */
export function not(a: BooleanArray, inPlace = false): BooleanArray {
  const result = inPlace ? a : new BooleanArray(a.size);

  for (let i = 0; i < a.length; i++) {
    result[i] = ~a[i]!;
  }

  // Mask off unused bits in the last chunk
  const lastChunkIndex = result.length - 1;
  if (lastChunkIndex >= 0) {
    const bitsInLastChunk = result.size % BooleanArray.BITS_PER_INT;
    if (bitsInLastChunk > 0) {
      const mask = (1 << bitsInLastChunk) - 1;
      result[lastChunkIndex]! &= mask;
    }
  }

  return result;
}

/**
 * Bitwise OR operation
 * @param a the first BooleanArray
 * @param b the second BooleanArray
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 */
export function or(a: BooleanArray, b: BooleanArray, inPlace = false): BooleanArray {
  if (a.size !== b.size) {
    throw new Error("Arrays must have the same size");
  }
  const result = inPlace ? a : new BooleanArray(a.size);
  const len = a.length;

  // Loop unrolling for better performance on ARM
  let i = 0;
  const unrollLimit = len - (len % 4);

  // Process 4 elements at a time
  for (; i < unrollLimit; i += 4) {
    result[i] = a[i]! | b[i]!;
    result[i + 1] = a[i + 1]! | b[i + 1]!;
    result[i + 2] = a[i + 2]! | b[i + 2]!;
    result[i + 3] = a[i + 3]! | b[i + 3]!;
  }

  // Handle remaining elements
  for (; i < len; i++) {
    result[i] = a[i]! | b[i]!;
  }

  return result;
}

/**
 * Bitwise XOR operation
 * @param a the first BooleanArray
 * @param b the second BooleanArray
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 */
export function xor(a: BooleanArray, b: BooleanArray, inPlace = false): BooleanArray {
  if (a.size !== b.size) {
    throw new Error("Arrays must have the same size");
  }
  const result = inPlace ? a : new BooleanArray(a.size);
  const len = a.length;

  // Loop unrolling for better performance on ARM
  let i = 0;
  const unrollLimit = len - (len % 4);

  // Process 4 elements at a time
  for (; i < unrollLimit; i += 4) {
    result[i] = a[i]! ^ b[i]!;
    result[i + 1] = a[i + 1]! ^ b[i + 1]!;
    result[i + 2] = a[i + 2]! ^ b[i + 2]!;
    result[i + 3] = a[i + 3]! ^ b[i + 3]!;
  }

  // Handle remaining elements
  for (; i < len; i++) {
    result[i] = a[i]! ^ b[i]!;
  }

  return result;
}

/**
 * Bitwise XNOR operation
 * @param a the first BooleanArray
 * @param b the second BooleanArray
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 */
export function xnor(a: BooleanArray, b: BooleanArray, inPlace = false): BooleanArray {
  if (a.size !== b.size) {
    throw new Error("Arrays must have the same size");
  }
  const result = inPlace ? a : new BooleanArray(a.size);
  for (let i = 0; i < a.length; i++) {
    result[i] = ~(a[i]! ^ b[i]!);
  }

  // Mask off unused bits in the last chunk
  const lastChunkIndex = result.length - 1;
  if (lastChunkIndex >= 0) {
    const bitsInLastChunk = result.size % BooleanArray.BITS_PER_INT;
    if (bitsInLastChunk > 0) {
      const mask = (1 << bitsInLastChunk) - 1;
      result[lastChunkIndex]! &= mask;
    }
  }

  return result;
}
