/**
 * @description A fast boolean array backed by a Uint32Array.
 * @copyright   2026 the BooleanArray authors. All rights reserved.
 * @license     MIT
 * @module      BooleanArray
 */

import { BITS_PER_INT, CHUNK_MASK, CHUNK_SHIFT, MAX_SAFE_SIZE, MAX_UINT32 } from "./constants.ts";
import {
  assertValidRange,
  bitIndicesInto,
  forEachBitIndex,
  getBit,
  getLSBPosition,
  getRange,
  is,
  popcount,
  setBit,
  setRange,
} from "./internal.ts";
import { and, difference, equals, nand, nor, not, or, xnor, xor } from "./operations.ts";
import { assertIsSafeSize, assertIsSafeValue } from "./validation.ts";

/** A fast boolean array backed by a Uint32Array */
export class BooleanArray {
  /** The number of bits per chunk */
  static readonly BITS_PER_INT = BITS_PER_INT;

  /** The maximum safe size for bit operations */
  static readonly MAX_SAFE_SIZE = MAX_SAFE_SIZE; // Math.floor((2 ** 32 - 1) / 8);

  /**
   * The underlying Uint32Array buffer.
   * @warning Direct modification is allowed for zero-copy interop, but callers
   * MUST ensure unused bits in the last chunk remain zero (use `lastChunkMask`).
   * Violating this invariant may cause incorrect behavior in search/count operations.
   */
  readonly buffer: Uint32Array;

  /**
   * The total number of booleans in the array
   * @note for the total number of chunks @see {@link BooleanArray.wordLength}
   */
  readonly size: number;

  /**
   * The number of 32-bit chunks (words) in the underlying buffer
   * @note For the total number of booleans use {@link BooleanArray.size}
   */
  readonly wordLength: number;

  /** Backward-compatible alias for wordLength */
  get wordCount(): number {
    return this.wordLength;
  }

  /** Alias for wordLength used by tests */
  get chunkCount(): number {
    return this.wordLength;
  }

  /** Pre-calculated mask for the last chunk */
  readonly lastChunkMask: number;

  /** Pre-calculated bits in the last chunk */
  readonly bitsInLastChunk: number;

  /**
   * Creates a new BooleanArray
   * @param size the number of booleans required in the array (min = 1, max = BooleanArray.MAX_SAFE_SIZE)
   * @throws {RangeError} if `size` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
   * @throws {TypeError} if `size` is not a safe integer or NaN
   */
  constructor(size: number) {
    assertIsSafeSize(size);
    this.size = size;
    this.wordLength = (size + CHUNK_MASK) >>> CHUNK_SHIFT;
    this.bitsInLastChunk = size & CHUNK_MASK;
    this.lastChunkMask = this.bitsInLastChunk === 0 ? MAX_UINT32 : ((1 << this.bitsInLastChunk) - 1) >>> 0;
    this.buffer = new Uint32Array(this.wordLength);
  }

  /** Returns the string tag for this class. */
  get [Symbol.toStringTag](): string {
    return "BooleanArray";
  }

  /**
   * Assert that a value is a valid index for this array
   * @param index the index value to validate
   * @returns the validated index value
   * @throws {TypeError} if `index` is not a safe integer
   * @throws {RangeError} if `index` is out of bounds
   */
  assertIsSafeIndex(index: number): number {
    if (!Number.isSafeInteger(index)) {
      throw new TypeError('"index" must be a safe integer.');
    } else if (index < 0 || index >= this.size) {
      throw new RangeError(`Index ${index} is out of bounds for array size ${this.size}.`);
    }
    return index;
  }

  /**
   * Check if an index value is valid for this array
   * @param index the index value to validate
   * @returns `true` if the index is valid, `false` otherwise
   */
  isSafeIndex(index: number): boolean {
    return Number.isSafeInteger(index) && index >= 0 && index < this.size;
  }

  /**
   * Performs an in-place bitwise AND operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise AND operation with
   * @returns the current BooleanArray
   * @throws {RangeError} if `this` and `other` have different sizes
   */
  and(other: BooleanArray): this {
    and(this, other, true);
    return this;
  }

  /**
   * Sets all bits to false.
   * @returns the current BooleanArray
   */
  clear(): this {
    this.fill(false);
    return this;
  }

  /**
   * Creates a copy of this BooleanArray.
   * @returns a new BooleanArray with the same contents
   * @allocates Returns a new instance.
   */
  clone(): BooleanArray {
    const copy = new BooleanArray(this.size);
    copy.buffer.set(this.buffer);
    return copy;
  }

  /**
   * Copy bits from another BooleanArray into this one (zero-allocation bulk copy).
   * Supports overlapping ranges when source === this (memmove-style safe handling).
   * @param source the source BooleanArray to copy from
   * @param sourceStart start index in source [default = 0]
   * @param destStart start index in this array [default = 0]
   * @param count number of bits to copy [default = source.size - sourceStart]
   * @returns `this` for chaining
   * @throws {RangeError} if `source.size !== this.size`
   * @throws {RangeError} if copy range exceeds source or destination bounds
   * @throws {TypeError} if indices are not safe integers
   */
  copyFrom(
    source: BooleanArray,
    sourceStart: number = 0,
    destStart: number = 0,
    count: number = source.size - sourceStart,
  ): this {
    if (source.size !== this.size) {
      throw new RangeError("Arrays must have the same size.");
    }
    if (count === 0) return this;

    assertIsSafeValue(sourceStart);
    assertIsSafeValue(destStart);
    assertIsSafeValue(count);

    if (sourceStart + count > source.size) {
      throw new RangeError(
        `Source range [${sourceStart}, ${sourceStart + count}) exceeds source size ${source.size}.`,
      );
    }
    if (destStart + count > this.size) {
      throw new RangeError(
        `Destination range [${destStart}, ${destStart + count}) exceeds destination size ${this.size}.`,
      );
    }

    const shift = CHUNK_SHIFT;
    const mask = CHUNK_MASK;
    const srcBuf = source.buffer;
    const dstBuf = this.buffer;

    // Check if both ranges are chunk-aligned for fast path
    const srcAligned = (sourceStart & mask) === 0;
    const dstAligned = (destStart & mask) === 0;
    const countAligned = (count & mask) === 0 || (destStart + count === this.size);

    if (srcAligned && dstAligned && countAligned) {
      // Fast path: chunk-aligned copy using TypedArray operations
      const srcChunkStart = sourceStart >>> shift;
      const dstChunkStart = destStart >>> shift;
      const chunkCount = (count + mask) >>> shift;

      if (source === this && srcChunkStart < dstChunkStart + chunkCount && dstChunkStart < srcChunkStart + chunkCount) {
        // Overlapping this-copy: use copyWithin for safe handling
        dstBuf.copyWithin(dstChunkStart, srcChunkStart, srcChunkStart + chunkCount);
      } else {
        // Non-overlapping: use set with subarray
        dstBuf.set(srcBuf.subarray(srcChunkStart, srcChunkStart + chunkCount), dstChunkStart);
      }

      // Ensure unused bits in the last chunk are zeroed if we touched it
      if (this.bitsInLastChunk > 0 && dstChunkStart + chunkCount >= this.wordLength) {
        dstBuf[this.wordLength - 1]! &= this.lastChunkMask;
      }
    } else {
      // Slow path: bit-by-bit copy for unaligned ranges
      // Determine copy direction to handle overlapping self-copies
      const copyForward = source !== this || sourceStart >= destStart || sourceStart + count <= destStart;

      if (copyForward) {
        for (let i = 0; i < count; i++) {
          const srcIdx = sourceStart + i;
          const dstIdx = destStart + i;
          const srcChunk = srcIdx >>> shift;
          const srcOffset = srcIdx & mask;
          const dstChunk = dstIdx >>> shift;
          const dstOffset = dstIdx & mask;
          const bit = (srcBuf[srcChunk]! >>> srcOffset) & 1;
          if (bit) {
            dstBuf[dstChunk]! |= 1 << dstOffset;
          } else {
            dstBuf[dstChunk]! &= ~(1 << dstOffset);
          }
        }
      } else {
        // Copy backwards for overlapping self-copy where dest > source
        for (let i = count - 1; i >= 0; i--) {
          const srcIdx = sourceStart + i;
          const dstIdx = destStart + i;
          const srcChunk = srcIdx >>> shift;
          const srcOffset = srcIdx & mask;
          const dstChunk = dstIdx >>> shift;
          const dstOffset = dstIdx & mask;
          const bit = (srcBuf[srcChunk]! >>> srcOffset) & 1;
          if (bit) {
            dstBuf[dstChunk]! |= 1 << dstOffset;
          } else {
            dstBuf[dstChunk]! &= ~(1 << dstOffset);
          }
        }
      }
    }

    return this;
  }

  /**
   * Performs an in-place bitwise difference operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise difference operation with
   * @returns the current BooleanArray
   * @throws {RangeError} if `this` and `other` have different sizes
   */
  difference(other: BooleanArray): this {
    difference(this, other, true);
    return this;
  }

  /**
   * Check if this BooleanArray is equal to another BooleanArray
   * @param other the BooleanArray to compare with
   * @returns `true` if the arrays are equal, `false` otherwise
   */
  equals(other: BooleanArray): boolean {
    return equals(this, other);
  }

  fill(value: boolean): this {
    this.buffer.fill(value ? MAX_UINT32 : 0);
    // Mask off any excess bits in the last chunk if needed
    if (this.bitsInLastChunk > 0 && value) {
      this.buffer[this.wordLength - 1] = this.lastChunkMask;
    }
    return this;
  }

  /**
   * Iterates over each bit in the array.
   * @param callback the callback to execute for each bit.
   * @param startIndex the start index to iterate from [default = 0]
   * @param count the number of booleans to iterate over [default = this.size - startIndex]
   * @returns the current BooleanArray for chaining
   * @throws {TypeError} if callback is not a function
   * @throws {RangeError} if startIndex or count is out of bounds
   *
   * @example
   * ```ts
   * const arr = new BooleanArray(5);
   * arr.set(1, true).set(3, true);
   * arr.forEach((value, index) => {
   *   console.log(`arr[${index}] = ${value}`);
   * });
   * // Output: arr[0] = false, arr[1] = true, arr[2] = false, arr[3] = true, arr[4] = false
   * ```
   */
  forEach(
    callback: (value: boolean, index: number, thisArg?: BooleanArray) => void,
    startIndex: number = 0,
    count: number = this.size - startIndex,
  ): this {
    if (typeof callback !== "function") {
      throw new TypeError('"callback" must be a function.');
    }
    if (count === 0) return this;
    if (assertIsSafeValue(startIndex) + assertIsSafeValue(count) > this.size) {
      throw new RangeError(
        `Range [${startIndex}, ${startIndex + count}) exceeds array size ${this.size}.`,
      );
    }
    const buffer = this.buffer;
    const mask = CHUNK_MASK;
    const shift = CHUNK_SHIFT;
    let currentChunkIndex = -1;
    let currentChunkValue = 0;
    const endIndex = startIndex + count;
    for (let i = startIndex; i < endIndex; i++) {
      const chunkForThisBit = i >>> shift;
      if (chunkForThisBit !== currentChunkIndex) {
        currentChunkIndex = chunkForThisBit;
        currentChunkValue = buffer[currentChunkIndex]!;
      }
      const offset = i & mask;
      callback((currentChunkValue & (1 << offset)) !== 0, i, this);
    }
    return this;
  }

  /**
   * Get a single boolean value or a contiguous range of values.
   * @param indexOrStartIndex the index for single access, or the start index for range access
   * @param count optional number of booleans to retrieve when reading a range
   * @returns a boolean when count is undefined; otherwise an array of booleans
   * @allocates Range access returns a new array. Use {@link getInto} for zero-allocation.
   */
  get(index: number): boolean;
  get(startIndex: number, count: number): boolean[];
  get(indexOrStartIndex: number, count?: number): boolean | boolean[] {
    if (count === undefined) {
      // Single bit access
      this.assertIsSafeIndex(indexOrStartIndex);
      return getBit(this, indexOrStartIndex);
    } else {
      // Range access - bounds checking is done in getRange
      return getRange(this, indexOrStartIndex, count);
    }
  }

  /**
   * Copy boolean values into a preallocated array to avoid allocations.
   * @param startIndex the start index to read from
   * @param count the number of booleans to read
   * @param out the destination boolean array with length >= count
   * @returns `this` for chaining
   * @throws {TypeError} if `out` is not an array
   * @throws {RangeError} if `out.length` is smaller than `count`
   * @throws {RangeError} if the requested range exceeds the array size
   */
  getInto(startIndex: number, count: number, out: boolean[]): this {
    if (!Array.isArray(out)) {
      throw new TypeError('"out" must be an array.');
    }
    if (count === 0) return this;
    if (assertIsSafeValue(startIndex) + assertIsSafeValue(count) > this.size) {
      throw new RangeError(
        `Range [${startIndex}, ${startIndex + count}) exceeds array size ${this.size}.`,
      );
    }
    if (out.length < count) {
      throw new RangeError('"out" length must be greater than or equal to "count".');
    }

    const buffer = this.buffer;
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
      out[i] = (currentChunkValue & (1 << offset)) !== 0;
    }
    return this;
  }

  /**
   * Get the number of bits matching the provided value.
   * @param value the bit value to count
   * @returns the number of matching bits in the array
   */
  getCount(value: boolean): number {
    const buffer = this.buffer;
    const lastIndex = this.wordLength - 1;
    let count = 0;

    // Count all full chunks
    for (let i = 0; i < lastIndex; i++) {
      count += popcount(buffer[i]!);
    }

    // Handle last chunk with pre-calculated mask
    count += popcount(buffer[lastIndex]! & this.lastChunkMask);

    return value ? count : this.size - count;
  }

  /**
   * Get the index of the first occurrence of a value.
   * @param value The value to locate in the array.
   * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
   * @returns the index of the first occurrence of the value, or -1 if the value is not present.
   */
  indexOf(value: boolean, fromIndex: number = 0): number {
    if (!Number.isSafeInteger(fromIndex)) {
      throw new TypeError('"fromIndex" must be a safe integer.');
    }

    let start = fromIndex;
    if (start < 0) {
      start = this.size + start;
      if (start < 0) start = 0;
    }
    if (start >= this.size) {
      return -1;
    }

    const buffer = this.buffer;
    const shift = CHUNK_SHIFT;
    const mask = CHUNK_MASK;
    const chunkCount = this.wordLength;
    const lastChunkMask = this.lastChunkMask;
    const startChunk = start >>> shift;
    const startOffset = start & mask;

    // Handle first chunk with mask for bits after startOffset
    const firstChunkMask = (MAX_UINT32 << startOffset) >>> 0;
    let firstChunk = buffer[startChunk]!;

    // If looking for false, invert the chunk before applying mask
    if (!value) {
      firstChunk = ~firstChunk;
      // If this first-chunk is also the last logical chunk, mask off unused bits
      if (startChunk === chunkCount - 1 && this.bitsInLastChunk > 0) {
        firstChunk &= lastChunkMask;
      }
    }

    firstChunk &= firstChunkMask;

    if (firstChunk !== 0) {
      const bitPos = Math.clz32(firstChunk & -firstChunk) ^ CHUNK_MASK;
      const index = (startChunk << CHUNK_SHIFT) + bitPos;
      return index < this.size ? index : -1;
    }

    // Search remaining chunks
    for (let i = startChunk + 1; i < chunkCount; i++) {
      let chunk = buffer[i]!;

      // If looking for false, invert the chunk
      if (!value) {
        chunk = ~chunk;
        // Mask out bits beyond the logical size in the last chunk
        if (i === chunkCount - 1 && this.bitsInLastChunk > 0) {
          chunk &= lastChunkMask;
        }
      }

      if (chunk !== 0) {
        const bitPos = Math.clz32(chunk & -chunk) ^ CHUNK_MASK;
        const index = (i << CHUNK_SHIFT) + bitPos;
        return index < this.size ? index : -1;
      }
    }

    return -1;
  }

  /**
   * Get the index of the last occurrence of a value.
   * @param value The value to locate in the array.
   * @param fromIndex The array index at which to begin searching backward. If fromIndex is omitted, the search starts at the last index in the array.
   * @returns the index of the last occurrence of the value, or -1 if the value is not present.
   */
  lastIndexOf(value: boolean, fromIndex: number = this.size - 1): number {
    let startIndex = fromIndex;

    // Handle negative fromIndex
    if (startIndex < 0) {
      startIndex = this.size + startIndex;
    } else if (startIndex >= this.size) {
      startIndex = this.size - 1;
    }

    // If adjusted index is still negative, no search
    if (startIndex < 0) {
      return -1;
    }

    // We search in the range [0, startIndex] inclusive
    const searchUpToBitIndex_inclusive = startIndex;

    const buffer = this.buffer;
    const shift = CHUNK_SHIFT;
    const mask = CHUNK_MASK;
    const chunkCount = this.wordLength;
    const lastChunkMask = this.lastChunkMask;
    const startChunk = searchUpToBitIndex_inclusive >>> shift;
    const bitOffsetInStartChunk = searchUpToBitIndex_inclusive & mask;

    // Handle the first chunk (the one containing searchUpToBitIndex_inclusive)
    let firstChunkValue = buffer[startChunk]!;

    // If looking for false, invert the chunk
    if (!value) {
      firstChunkValue = ~firstChunkValue;
      // Mask out bits beyond the logical size if this is the last chunk
      if (startChunk === chunkCount - 1 && this.bitsInLastChunk > 0) {
        firstChunkValue &= lastChunkMask;
      }
    }

    if (firstChunkValue !== 0) {
      // Create a mask for bits from 0 up to bitOffsetInStartChunk (inclusive)
      let chunkMask;
      if (bitOffsetInStartChunk === CHUNK_MASK) {
        chunkMask = MAX_UINT32;
      } else {
        chunkMask = ((1 << (bitOffsetInStartChunk + 1)) - 1) >>> 0;
      }
      const maskedChunk = firstChunkValue & chunkMask;
      if (maskedChunk !== 0) {
        const bitPos = CHUNK_MASK - Math.clz32(maskedChunk); // Find MSB in the masked part
        return (startChunk << CHUNK_SHIFT) + bitPos;
      }
    }

    // Search remaining chunks backwards (from startChunk - 1 down to 0)
    for (let i = startChunk - 1; i >= 0; i--) {
      let chunkValue = buffer[i]!;

      // If looking for false, invert the chunk
      if (!value) {
        chunkValue = ~chunkValue;
      }

      if (chunkValue !== 0) {
        const bitPos = CHUNK_MASK - Math.clz32(chunkValue); // Find MSB in the full chunk
        return (i << CHUNK_SHIFT) + bitPos;
      }
    }

    return -1;
  }

  isEmpty(): boolean {
    return is(this, false);
  }

  isFull(): boolean {
    return is(this, true);
  }

  /**
   * Performs an in-place bitwise NAND operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise NAND operation with
   * @returns the current BooleanArray
   * @throws {RangeError} if `this` and `other` have different sizes
   */
  nand(other: BooleanArray): this {
    nand(this, other, true);
    return this;
  }

  /**
   * Iterate set bits with a callback, avoiding generator allocations.
   * @param callback function invoked with (index, thisArg) for each set bit
   * @param startIndex inclusive start index [default = 0]
   * @param endIndex exclusive end index [default = this.size]
   * @returns `this` for chaining
   * @throws {TypeError} if `callback` is not a function
   * @throws {RangeError} if indices are out of bounds or invalid
   */
  forEachTruthy(
    callback: (index: number, thisArg?: BooleanArray) => void,
    startIndex: number = 0,
    endIndex: number = this.size,
  ): this {
    if (typeof callback !== "function") {
      throw new TypeError('"callback" must be a function.');
    }
    assertValidRange(this, startIndex, endIndex);
    if (startIndex >= endIndex) return this;
    forEachBitIndex(this, callback, startIndex, endIndex, false);
    return this;
  }

  /**
   * Copy truthy indices into a preallocated Uint32Array to avoid allocations.
   * @param out the destination Uint32Array with length >= expected count
   * @param startIndex inclusive start index [default = 0]
   * @param endIndex exclusive end index [default = this.size]
   * @returns the total number of truthy indices found (may exceed out.length)
   * @throws {TypeError} if `out` is not a Uint32Array
   * @throws {RangeError} if indices are out of bounds or invalid
   * @note If the return value exceeds `out.length`, only the first `out.length`
   *       indices were written. The return value can be used to allocate a
   *       correctly-sized buffer and retry.
   */
  truthyIndicesInto(
    out: Uint32Array,
    startIndex: number = 0,
    endIndex: number = this.size,
  ): number {
    if (!(out instanceof Uint32Array)) {
      throw new TypeError('"out" must be a Uint32Array.');
    }
    assertValidRange(this, startIndex, endIndex);
    if (startIndex >= endIndex) return 0;
    return bitIndicesInto(this, out, startIndex, endIndex, false);
  }

  /**
   * Iterate unset (false) bits with a callback, avoiding generator allocations.
   * @param callback function invoked with (index, thisArg) for each unset bit
   * @param startIndex inclusive start index [default = 0]
   * @param endIndex exclusive end index [default = this.size]
   * @returns `this` for chaining
   * @throws {TypeError} if `callback` is not a function
   * @throws {RangeError} if indices are out of bounds or invalid
   */
  forEachFalsy(
    callback: (index: number, thisArg?: BooleanArray) => void,
    startIndex: number = 0,
    endIndex: number = this.size,
  ): this {
    if (typeof callback !== "function") {
      throw new TypeError('"callback" must be a function.');
    }
    assertValidRange(this, startIndex, endIndex);
    if (startIndex >= endIndex) return this;
    forEachBitIndex(this, callback, startIndex, endIndex, true);
    return this;
  }

  /**
   * Copy falsy (unset) indices into a preallocated Uint32Array to avoid allocations.
   * @param out the destination Uint32Array with length >= expected count
   * @param startIndex inclusive start index [default = 0]
   * @param endIndex exclusive end index [default = this.size]
   * @returns the total number of falsy indices found (may exceed out.length)
   * @throws {TypeError} if `out` is not a Uint32Array
   * @throws {RangeError} if indices are out of bounds or invalid
   * @note If the return value exceeds `out.length`, only the first `out.length`
   *       indices were written. The return value can be used to allocate a
   *       correctly-sized buffer and retry.
   */
  falsyIndicesInto(
    out: Uint32Array,
    startIndex: number = 0,
    endIndex: number = this.size,
  ): number {
    if (!(out instanceof Uint32Array)) {
      throw new TypeError('"out" must be a Uint32Array.');
    }
    assertValidRange(this, startIndex, endIndex);
    if (startIndex >= endIndex) return 0;
    return bitIndicesInto(this, out, startIndex, endIndex, true);
  }

  /**
   * Performs an in-place bitwise NOR operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise NOR operation with
   * @returns the current BooleanArray
   * @throws {RangeError} if `this` and `other` have different sizes
   */
  nor(other: BooleanArray): this {
    nor(this, other, true);
    return this;
  }

  /**
   * Performs an in-place bitwise NOT operation on this BooleanArray.
   * Flips all the bits within the logical size of the array.
   * @returns the current BooleanArray
   */
  not(): this {
    not(this, true);
    return this;
  }

  /**
   * Performs an in-place bitwise OR operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise OR operation with
   * @returns the current BooleanArray
   * @throws {RangeError} if `this` and `other` have different sizes
   */
  or(other: BooleanArray): this {
    or(this, other, true);
    return this;
  }

  /**
   * Set a single bit or a range of bits to a given value.
   * @param indexOrStartIndex the index to set, or the start index of the range
   * @param valueOrCount the boolean value (single-bit) or the number of booleans to set (range)
   * @param value optional boolean value to set when using the range form
   * @returns `this` for chaining
   * @throws {TypeError} if indices are not safe integers
   * @throws {RangeError} if indices are out of bounds
   */
  set(index: number, value: boolean): this;
  set(startIndex: number, count: number, value: boolean): this;
  set(indexOrStartIndex: number, valueOrCount: boolean | number, value?: boolean): this {
    if (value === undefined) {
      // Single bit setting
      this.assertIsSafeIndex(indexOrStartIndex);
      setBit(this, indexOrStartIndex, valueOrCount as boolean);
      return this;
    } else {
      // Range setting - bounds checking is done in setRange
      setRange(this, indexOrStartIndex, valueOrCount as number, value);
      return this;
    }
  }

  /**
   * Set bits at specified indices to a given value (additive, zero-allocation bulk set).
   * Only modifies the specified indices; all other bits remain unchanged.
   * @param indices an ArrayLike of indices to set
   * @param value the boolean value to set [default = true]
   * @returns `this` for chaining
   * @throws {TypeError} if `indices` is not an ArrayLike<number>
   * @throws {TypeError} if any index is not a safe integer
   * @throws {RangeError} if any index is out of bounds
   *
   * @example
   * ```ts
   * const arr = new BooleanArray(10);
   * arr.setFromIndices([1, 3, 5, 7, 9]); // Set odd indices to true
   * arr.setFromIndices([0, 2], false);   // Clear even indices 0 and 2
   * ```
   */
  setFromIndices(indices: ArrayLike<number>, value: boolean = true): this {
    if (!indices || typeof indices.length !== "number") {
      throw new TypeError('"indices" must be an ArrayLike<number>.');
    }

    const shift = CHUNK_SHIFT;
    const mask = CHUNK_MASK;
    const buffer = this.buffer;
    const size = this.size;

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i]!;
      if (!Number.isSafeInteger(index)) {
        throw new TypeError(`Index at position ${i} must be a safe integer.`);
      }
      if (index < 0 || index >= size) {
        throw new RangeError(`Index ${index} is out of bounds for array size ${size}.`);
      }

      const chunk = index >>> shift;
      const bitMask = 1 << (index & mask);
      if (value) {
        buffer[chunk]! |= bitMask;
      } else {
        buffer[chunk]! &= ~bitMask;
      }
    }

    return this;
  }

  /**
   * Toggle the boolean state of a bit.
   * @param index the bit index to toggle the state of
   * @returns the current BooleanArray for chaining
   */
  toggle(index: number): this {
    this.assertIsSafeIndex(index);
    const chunk = index >>> CHUNK_SHIFT;
    const mask = 1 << (index & CHUNK_MASK);
    this.buffer[chunk]! ^= mask;
    return this;
  }

  /**
   * @returns a string representation of the array
   * @allocates Returns a new string.
   */
  toString(): string {
    return this.buffer.toString();
  }

  /**
   * Performs an in-place bitwise XOR operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise XOR operation with
   * @returns the current BooleanArray
   * @throws {RangeError} if `this` and `other` have different sizes
   */
  xor(other: BooleanArray): this {
    xor(this, other, true);
    return this;
  }

  /**
   * Performs an in-place bitwise XNOR operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise XNOR operation with
   * @returns the current BooleanArray
   * @throws {RangeError} if `this` and `other` have different sizes
   */
  xnor(other: BooleanArray): this {
    xnor(this, other, true);
    return this;
  }

  /**
   * Iterator.
   * @allocates Creates a generator object. Use {@link forEach} for zero-allocation iteration.
   */
  *[Symbol.iterator](): IterableIterator<boolean> {
    const buffer = this.buffer;
    const mask = CHUNK_MASK;
    const shift = CHUNK_SHIFT;
    let currentChunkIndex = -1;
    let currentChunkValue = 0;

    for (let i = 0; i < this.size; i++) {
      const chunkForThisBit = i >>> shift;
      if (chunkForThisBit !== currentChunkIndex) {
        currentChunkIndex = chunkForThisBit;
        currentChunkValue = buffer[currentChunkIndex]!;
      }
      const offset = i & mask;
      yield (currentChunkValue & (1 << offset)) !== 0;
    }
  }

  /**
   * Returns an iterable of key, value pairs for every entry in the array.
   * @allocates Creates a generator object and tuple per iteration. Use {@link forEach} for zero-allocation.
   */
  *entries(): IterableIterator<[number, boolean]> {
    const buffer = this.buffer;
    const mask = CHUNK_MASK;
    const shift = CHUNK_SHIFT;
    let currentChunkIndex = -1;
    let currentChunkValue = 0;

    for (let i = 0; i < this.size; i++) {
      const chunkForThisBit = i >>> shift;
      if (chunkForThisBit !== currentChunkIndex) {
        currentChunkIndex = chunkForThisBit;
        currentChunkValue = buffer[currentChunkIndex]!;
      }
      const offset = i & mask;
      yield [i, (currentChunkValue & (1 << offset)) !== 0];
    }
  }

  /**
   * Returns an iterable of keys in the array.
   * @allocates Creates a generator object. Use `for (let i = 0; i < arr.size; i++)` for zero-allocation.
   */
  *keys(): IterableIterator<number> {
    for (let i = 0; i < this.size; i++) {
      yield i;
    }
  }

  /**
   * Returns an iterable of values in the array.
   * @allocates Creates a generator object. Use {@link forEach} for zero-allocation iteration.
   */
  *values(): IterableIterator<boolean> {
    yield* this;
  }

  /**
   * Get the indices of the set bits in the array
   * @param startIndex the start index to get the indices from [default = 0]
   * @param endIndex the end index to get the indices from [default = this.size]
   * @returns Iterator of indices where bits are set
   * @throws {TypeError} if `startIndex` or `endIndex` is not a safe integer
   * @throws {RangeError} if `startIndex > endIndex` or `endIndex > this.size`
   * @allocates Creates a generator object. Use {@link forEachTruthy} or {@link truthyIndicesInto} for zero-allocation.
   */
  *truthyIndices(startIndex: number = 0, endIndex: number = this.size): IterableIterator<number> {
    assertValidRange(this, startIndex, endIndex);
    if (startIndex >= endIndex) return;

    const buffer = this.buffer;
    const shift = CHUNK_SHIFT;
    const mask = CHUNK_MASK;
    let chunkIndex = startIndex >>> shift;
    const endChunk = (endIndex - 1) >>> shift;

    while (chunkIndex <= endChunk && chunkIndex < this.wordLength) {
      let chunk = buffer[chunkIndex]!;
      const chunkBaseIndex = chunkIndex << shift;

      // Mask off bits before startIndex in the first chunk
      if (chunkIndex === (startIndex >>> shift)) {
        const startBitOffset = startIndex & mask;
        chunk &= MAX_UINT32 << startBitOffset;
      }

      // Process all set bits in this chunk
      while (chunk !== 0) {
        const absoluteIndex = chunkBaseIndex + getLSBPosition(chunk);

        if (absoluteIndex >= endIndex) return;

        yield absoluteIndex;
        chunk &= chunk - 1; // Clear the LSB
      }

      chunkIndex++;
    }
  }
}
