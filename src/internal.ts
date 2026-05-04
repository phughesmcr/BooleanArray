import type { BooleanArray } from "./boolean-array.ts";
import { BITS_PER_INT, CHUNK_MASK, CHUNK_SHIFT, EMPTY_ARRAY, MAX_UINT32 } from "./constants.ts";
import { assertIsSafeValue } from "./validation.ts";

/**
 * Assert that a range is valid for iteration
 * @param ba the BooleanArray to validate against
 * @param startIndex the start index
 * @param endIndex the end index
 * @throws {RangeError} if startIndex > endIndex or endIndex > this.size
 */
export function assertValidRange(ba: BooleanArray, startIndex: number, endIndex: number): void {
  if (assertIsSafeValue(startIndex) > assertIsSafeValue(endIndex)) {
    throw new RangeError('"startIndex" must be less than or equal to "endIndex".');
  }
  if (endIndex > ba.size) {
    throw new RangeError(`"endIndex" (${endIndex}) exceeds array size (${ba.size}).`);
  }
}

/**
 * Get chunk value, optionally inverted with proper last-chunk masking
 * @param ba the BooleanArray to read from
 * @param chunkIndex the chunk index
 * @param invert whether to invert the chunk (for finding falsy bits)
 * @returns the chunk value
 */
export function getChunkValue(ba: BooleanArray, chunkIndex: number, invert: boolean): number {
  let chunk = ba.buffer[chunkIndex]!;
  if (invert) {
    chunk = ~chunk;
    // Mask off unused bits in the last chunk to avoid false positives
    if (chunkIndex === ba.wordLength - 1 && ba.bitsInLastChunk > 0) {
      chunk &= ba.lastChunkMask;
    }
  }
  return chunk;
}

/**
 * Core iteration over set bit indices with a callback
 * @param ba the BooleanArray to iterate
 * @param callback function invoked with (index, thisArg) for each matching bit
 * @param startIndex inclusive start index
 * @param endIndex exclusive end index
 * @param invert if true, iterate over unset (false) bits instead
 */
export function forEachBitIndex(
  ba: BooleanArray,
  callback: (index: number, thisArg?: BooleanArray) => void,
  startIndex: number,
  endIndex: number,
  invert: boolean,
): void {
  let chunkIndex = startIndex >>> CHUNK_SHIFT;
  const endChunk = (endIndex - 1) >>> CHUNK_SHIFT;
  const startChunk = startIndex >>> CHUNK_SHIFT;

  while (chunkIndex <= endChunk && chunkIndex < ba.wordLength) {
    let chunk = getChunkValue(ba, chunkIndex, invert);
    const chunkBaseIndex = chunkIndex << CHUNK_SHIFT;

    // Mask off bits before startIndex in the first chunk
    if (chunkIndex === startChunk) {
      chunk &= MAX_UINT32 << (startIndex & CHUNK_MASK);
    }

    // Process all set bits in this chunk
    while (chunk !== 0) {
      const absoluteIndex = chunkBaseIndex + getLSBPosition(chunk);
      if (absoluteIndex >= endIndex) return;
      callback(absoluteIndex, ba);
      chunk &= chunk - 1; // Clear the LSB
    }

    chunkIndex++;
  }
}

/**
 * Internal fast path for single bit access (no validation)
 * @param ba the BooleanArray to read from
 * @param index the bit index
 * @returns the boolean state of the bit
 */
export function getBit(ba: BooleanArray, index: number): boolean {
  return (ba.buffer[index >>> CHUNK_SHIFT]! & (1 << (index & CHUNK_MASK))) !== 0;
}

/**
 * Internal range access with validation
 * @param ba the BooleanArray to read from
 * @param startIndex the start index to get the booleans from
 * @param count the number of booleans to get
 * @returns an array of booleans
 */
export function getRange(ba: BooleanArray, startIndex: number, count: number): boolean[] {
  if (assertIsSafeValue(count) === 0) return EMPTY_ARRAY as boolean[];
  if (assertIsSafeValue(startIndex) + count > ba.size) {
    throw new RangeError(
      `Range [${startIndex}, ${startIndex + count}) exceeds array size ${ba.size}.`,
    );
  }

  // Pre-allocate with specific size
  const result = new Array<boolean>(count);
  const buffer = ba.buffer;
  const mask = CHUNK_MASK;
  const shift = CHUNK_SHIFT;
  let currentChunkIndex = -1;
  let currentChunkValue = 0;

  for (let i = 0; i < count; i++) {
    const index = startIndex + i;
    const chunkForThisBit = index >>> shift;
    if (chunkForThisBit !== currentChunkIndex) {
      currentChunkIndex = chunkForThisBit;
      currentChunkValue = buffer[currentChunkIndex]!;
    }
    const offset = index & mask;
    result[i] = (currentChunkValue & (1 << offset)) !== 0;
  }
  return result;
}

/**
 * Internal fast path for single bit setting (no validation)
 * @param ba the BooleanArray to modify
 * @param index the bit index
 * @param value the boolean value to set
 */
export function setBit(ba: BooleanArray, index: number, value: boolean): BooleanArray {
  const chunk = index >>> CHUNK_SHIFT;
  const mask = 1 << (index & CHUNK_MASK);
  if (value) {
    ba.buffer[chunk]! |= mask;
  } else {
    ba.buffer[chunk]! &= ~mask;
  }
  return ba;
}

export function setRange(ba: BooleanArray, startIndex: number, count: number, value: boolean): BooleanArray {
  if (count === 0) {
    return ba;
  }
  if (assertIsSafeValue(startIndex) + assertIsSafeValue(count) > ba.size) {
    throw new RangeError(
      `Range [${startIndex}, ${startIndex + count}) exceeds array size ${ba.size}.`,
    );
  }

  const startChunk = startIndex >>> CHUNK_SHIFT;
  const endChunk = (startIndex + count - 1) >>> CHUNK_SHIFT;

  if (startChunk === endChunk) {
    const startOffset = startIndex & CHUNK_MASK;
    const mask = count === BITS_PER_INT && startOffset === 0 ? MAX_UINT32 : (((1 << count) - 1) << startOffset) >>> 0;
    ba.buffer[startChunk] = value ? (ba.buffer[startChunk]! | mask) : (ba.buffer[startChunk]! & ~mask);
    return ba;
  }

  // for small cross-chunk ranges, set per-bit
  if (count <= 16) {
    const buffer = ba.buffer;
    const shift = CHUNK_SHIFT;
    const mask = CHUNK_MASK;
    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      const chunk = idx >>> shift;
      const bitMask = 1 << (idx & mask);
      if (value) {
        buffer[chunk]! |= bitMask;
      } else {
        buffer[chunk]! &= ~bitMask;
      }
    }
    return ba;
  }

  // 1. Handle the first (potentially partial) chunk
  const firstChunkStartOffset = startIndex & CHUNK_MASK;
  const firstChunkMask = (MAX_UINT32 << firstChunkStartOffset) >>> 0;
  if (value) {
    ba.buffer[startChunk]! |= firstChunkMask;
  } else {
    ba.buffer[startChunk]! &= ~firstChunkMask;
  }

  // 2. Handle full chunks in the middle
  const fillValue = value ? MAX_UINT32 : 0;
  // The 'endChunk' in fill is exclusive, so if startChunk+1 === endChunk, it fills nothing.
  if (startChunk + 1 < endChunk) {
    ba.buffer.fill(fillValue, startChunk + 1, endChunk);
  }

  // 3. Handle the last (potentially partial) chunk
  const lastBitIndex = startIndex + count - 1;
  const lastChunkEndOffset = lastBitIndex & CHUNK_MASK;
  const lastChunkMask = lastChunkEndOffset === CHUNK_MASK ? MAX_UINT32 : ((1 << (lastChunkEndOffset + 1)) - 1) >>> 0;

  if (value) {
    ba.buffer[endChunk]! |= lastChunkMask;
  } else {
    ba.buffer[endChunk]! &= ~lastChunkMask;
  }

  return ba;
}

/**
 * Core collection of set bit indices into a preallocated array
 * @param ba the BooleanArray to read from
 * @param out the destination Uint32Array
 * @param startIndex inclusive start index
 * @param endIndex exclusive end index
 * @param invert if true, collect unset (false) bit indices instead
 * @returns the total number of indices found (may exceed out.length)
 */
export function bitIndicesInto(
  ba: BooleanArray,
  out: Uint32Array,
  startIndex: number = 0,
  endIndex: number = ba.size,
  invert: boolean = false,
): number {
  let chunkIndex = startIndex >>> CHUNK_SHIFT;
  const endChunk = (endIndex - 1) >>> CHUNK_SHIFT;
  const startChunk = startIndex >>> CHUNK_SHIFT;
  const outLength = out.length;
  let writeIndex = 0;

  while (chunkIndex <= endChunk && chunkIndex < ba.wordLength) {
    let chunk = getChunkValue(ba, chunkIndex, invert);
    const chunkBaseIndex = chunkIndex << CHUNK_SHIFT;

    // Mask off bits before startIndex in the first chunk
    if (chunkIndex === startChunk) {
      chunk &= MAX_UINT32 << (startIndex & CHUNK_MASK);
    }

    // Process all set bits in this chunk
    while (chunk !== 0) {
      const absoluteIndex = chunkBaseIndex + getLSBPosition(chunk);
      if (absoluteIndex >= endIndex) return writeIndex;
      if (writeIndex < outLength) {
        out[writeIndex] = absoluteIndex;
      }
      writeIndex++;
      chunk &= chunk - 1; // Clear the LSB
    }

    chunkIndex++;
  }

  return writeIndex;
}

export function is(self: BooleanArray, value: boolean): boolean {
  const buffer = self.buffer;
  const len = self.wordLength;
  const lastIndex = len - 1;
  const expected = value ? MAX_UINT32 : 0;

  for (let i = 0; i < lastIndex; i++) {
    if (buffer[i] !== expected) return false;
  }

  const expectedLast = value ? self.lastChunkMask : 0;
  return buffer[lastIndex] === expectedLast;
}

/**
 * Get the chunk index for a given bool index.
 * @param index the bool index to get the chunk index for
 * @returns the chunk index
 */
export function getChunk(index: number): number {
  return index >>> CHUNK_SHIFT;
}

/**
 * Get the number of chunks required to accommodate a given number of bools.
 * @param bools the number of bools to get the chunk count for
 * @returns the number of chunks
 */
export function getChunkCount(bools: number): number {
  return (bools + CHUNK_MASK) >>> CHUNK_SHIFT;
}

/**
 * Get the offset of a bool within a chunk.
 * @param boolIndex the bool index to get the offset for
 * @returns the offset
 */
export function getChunkOffset(boolIndex: number): number {
  return boolIndex & CHUNK_MASK;
}

/**
 * Count the number of set bits in a 32-bit integer (population count).
 * @param value the 32-bit integer to count bits in
 * @returns the number of set bits
 */
export function popcount(value: number): number {
  value = value - ((value >>> 1) & 0x55555555);
  value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
  value = (value + (value >>> 4)) & 0x0f0f0f0f;
  return (value * 0x01010101) >>> 24;
}

/**
 * Get the bit position of the lowest set bit in a 32-bit integer.
 * @param value the 32-bit integer (must be non-zero)
 * @returns the bit position (0-31) of the lowest set bit
 */
export function getLSBPosition(value: number): number {
  return Math.clz32(value & -value) ^ CHUNK_MASK;
}
