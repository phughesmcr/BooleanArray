/**
 * @module      BooleanArray
 * @description A boolean array backed by a Uint32Array.
 * @copyright   2025 the BooleanArray authors. All rights reserved.
 * @license     MIT
 */

import { and, difference, equals, nand, nor, not, or, xnor, xor } from "./methods.ts";
import { countChunk, invalidNumber } from "./utils.ts";

/** A fast boolean array backed by a Uint32Array */
export class BooleanArray extends Uint32Array {
  /** The number of bits per integer */
  static readonly BITS_PER_INT = 32 as const;

  /** The mask for the chunk offset */
  static readonly CHUNK_MASK = 31 as const;

  /** The shift for the chunk offset */
  static readonly CHUNK_SHIFT = 5 as const;

  /** The mask for all bits (~0 >>> 0) */
  static readonly ALL_BITS = 4294967295 as const;

  /** The maximum safe size for bit operations */
  static readonly MAX_SAFE_SIZE = 536870911 as const; // Math.floor((2 ** 32 - 1) / 8);

  /**
   * Performs a bitwise AND operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static and(a: BooleanArray, b: BooleanArray): BooleanArray {
    return and(a, b, false);
  }

  /**
   * Checks if two BooleanArrays are equal
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns `true` if the arrays are equal, `false` otherwise
   */
  static equals(a: BooleanArray, b: BooleanArray): boolean {
    return equals(a, b);
  }

  /**
   * Performs a bitwise difference operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static difference(a: BooleanArray, b: BooleanArray): BooleanArray {
    return difference(a, b, false);
  }

  /**
   * Create a BooleanArray from an array of numbers, each number representing a bit to set to true.
   * @param arr The array of numbers to create the BooleanArray from
   * @param size The size of the BooleanArray
   * @returns A new BooleanArray instance
   * @throws {TypeError} if `arr` contains non-number or NaN values
   */
  static fromArray(arr: Array<number>, size: number): BooleanArray {
    if (arr.some(invalidNumber)) {
      throw new TypeError("BooleanArray.fromArray: array contains non-number or NaN values");
    }
    const pool = new BooleanArray(size);
    for (let i = 0; i < arr.length; i++) {
      pool.setBool(arr[i]!, true);
    }
    return pool;
  }

  /**
   * Create a BooleanArray from an object, using the object's keys as the bit indices.
   * @param size The size of the BooleanArray
   * @param key The key of the object to create the BooleanArray from
   * @param objs The array of objects to create the BooleanArray from
   * @returns A new BooleanArray instance
   */
  static fromObjects<T>(size: number, key: keyof T, objs: T[]): BooleanArray {
    const result = new BooleanArray(size);
    for (const obj of objs) {
      result.setBool(obj[key] as number, true);
    }
    return result;
  }

  /**
   * Get the chunk index for a given bool index
   * @param index the bool index to get the chunk index for
   * @returns the chunk index
   */
  static getChunk(index: number): number {
    // This shifts the bits of `index` five places to the right, effectively dividing `index` by 32.
    // This finds the index in the array where the specified bool would be located.
    return index >>> BooleanArray.CHUNK_SHIFT;
  }

  /**
   * Get the number of chunks required to accommodate a given number of bools
   * @param bools the number of bools to get the chunk count for
   * @returns the number of chunks
   */
  static getChunkCount(bools: number): number {
    return (bools + BooleanArray.BITS_PER_INT - 1) >>> BooleanArray.CHUNK_SHIFT;
  }

  /**
   * Get the offset of a bool within a chunk
   * @param boolIndex the bool index to get the offset for
   * @returns the offset
   */
  static getChunkOffset(boolIndex: number): number {
    return boolIndex & BooleanArray.CHUNK_MASK;
  }

  /**
   * Performs a bitwise NAND operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static nand(a: BooleanArray, b: BooleanArray): BooleanArray {
    return nand(a, b, false);
  }

  /**
   * Performs a bitwise NOR operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static nor(a: BooleanArray, b: BooleanArray): BooleanArray {
    return nor(a, b, false);
  }

  /**
   * Performs a bitwise NOT operation with a BooleanArray
   * @param a the BooleanArray to perform the bitwise NOT operation on
   * @returns a new BooleanArray with the result
   */
  static not(a: BooleanArray): BooleanArray {
    return not(a, false);
  }

  /**
   * Performs a bitwise OR operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static or(a: BooleanArray, b: BooleanArray): BooleanArray {
    return or(a, b, false);
  }

  /**
   * Validate a value
   * @param value the value to validate
   * @param maxSize the maximum size of the array
   * @returns the validated value
   * @throws {TypeError} if `value` is not a safe integer
   * @throws {RangeError} if `value` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
   */
  static validateValue(value: number, maxSize?: number): number {
    if (typeof value !== "number" || Number.isNaN(value) || !Number.isSafeInteger(value)) {
      throw new TypeError('"value" must be a safe integer.');
    }
    if (value < 0) {
      throw new RangeError('"value" must be greater than or equal to 0.');
    }
    if (value > BooleanArray.MAX_SAFE_SIZE) {
      throw new RangeError(`"value" must be smaller than or equal to ${BooleanArray.MAX_SAFE_SIZE}.`);
    }
    if (maxSize !== undefined && value >= maxSize) {
      throw new RangeError(
        `Index ${value} is out of bounds for array of size ${maxSize}. BooleanArrays are 0-indexed, try ${
          maxSize - 1
        } instead.`,
      );
    }
    return value;
  }

  /**
   * Validate a value
   * @param value the value to validate
   * @param maxSize the maximum size of the array
   * @returns `true` if the value is valid, `false` otherwise
   */
  static isValidValue(value: number, maxSize?: number): boolean {
    try {
      BooleanArray.validateValue(value, maxSize);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Performs a bitwise XOR operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static xor(a: BooleanArray, b: BooleanArray): BooleanArray {
    return xor(a, b, false);
  }

  /**
   * Performs a bitwise XNOR operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static xnor(a: BooleanArray, b: BooleanArray): BooleanArray {
    return xnor(a, b, false);
  }

  /** The total number of bits in the array */
  #size: number;

  /**
   * Creates a new BooleanArray
   * @param size the number of bits required in the array (min = 1, max = BooleanArray.MAX_SAFE_SIZE)
   * @returns a new BooleanArray
   * @throws {RangeError} if `size` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
   * @throws {TypeError} if `size` is not a safe integer or NaN
   */
  constructor(size: number) {
    BooleanArray.validateValue(size);
    if (size < 1) {
      throw new RangeError('"size" must be greater than or equal to 1.');
    }
    super(BooleanArray.getChunkCount(size));
    this.#size = size;
  }

  /** @returns the total number of bits in the bitfield */
  get size(): number {
    return this.#size;
  }

  /**
   * Performs an in-place bitwise AND operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise AND operation with
   * @returns the current BooleanArray
   */
  and(other: BooleanArray): this {
    and(this, other, true);
    return this;
  }

  /**
   * Clear the array
   * @returns `this` for chaining
   */
  clear(): this {
    this.fill(0);
    return this;
  }

  /**
   * Creates a copy of this BooleanArray
   * @returns a new BooleanArray with the same contents
   */
  clone(): BooleanArray {
    const copy = new BooleanArray(this.#size);
    copy.set(this);
    return copy;
  }

  /**
   * Performs an in-place bitwise difference operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise difference operation with
   * @returns the current BooleanArray
   */
  difference(other: BooleanArray): this {
    difference(this, other, true);
    return this;
  }

  /**
   * Iterates over each bit in the array
   * @param callback the callback to execute for each bit
   * @param startIndex the start index to iterate from [default = 0]
   * @param count the number of booleans to iterate over [default = this.size - startIndex]
   * @returns the current BooleanArray
   */
  forEachBool(
    callback: (index: number, value: boolean, array: this) => void,
    startIndex: number = 0,
    count: number = this.#size - startIndex,
  ): this {
    if (count === 0) return this;
    BooleanArray.validateValue(startIndex, this.#size);
    BooleanArray.validateValue(startIndex + count, this.#size + 1);

    let currentChunkIndex = -1;
    let currentChunkValue = 0;

    const endIndex = startIndex + count;
    for (let i = startIndex; i < endIndex; i++) {
      const chunkForThisBit = i >>> BooleanArray.CHUNK_SHIFT;
      if (chunkForThisBit !== currentChunkIndex) {
        currentChunkIndex = chunkForThisBit;
        currentChunkValue = this[currentChunkIndex]!;
      }
      const offset = i & BooleanArray.CHUNK_MASK;
      callback(i, (currentChunkValue & (1 << offset)) !== 0, this);
    }
    return this;
  }

  /**
   * Get the boolean state of a bit
   * @param index the bit index to get the state of
   * @returns the boolean state of the bit
   */
  getBool(index: number): boolean {
    BooleanArray.validateValue(index, this.#size);
    return (this[index >>> BooleanArray.CHUNK_SHIFT]! & (1 << (index & BooleanArray.CHUNK_MASK))) !== 0;
  }

  /**
   * Add bulk operations for better performance
   * @param startIndex the start index to get the booleans from
   * @param count the number of booleans to get
   * @returns an array of booleans
   */
  getBools(startIndex: number, count: number): boolean[] {
    BooleanArray.validateValue(startIndex, this.#size);
    BooleanArray.validateValue(startIndex + count, this.#size + 1);
    const result: boolean[] = new Array(count);
    if (count === 0) return result;

    let currentChunkIndex = -1;
    let currentChunkValue = 0;

    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const chunkForThisBit = index >>> BooleanArray.CHUNK_SHIFT;
      if (chunkForThisBit !== currentChunkIndex) {
        currentChunkIndex = chunkForThisBit;
        currentChunkValue = this[currentChunkIndex]!;
      }
      const offset = index & BooleanArray.CHUNK_MASK;
      result[i] = (currentChunkValue & (1 << offset)) !== 0;
    }
    return result;
  }

  /**
   * Get the index of the first set bit starting from a given index
   * @param startIndex the index to start searching from [default = 0]
   * @returns the index of the first set bit, or -1 if no bits are set
   */
  getFirstSetIndex(startIndex: number = 0): number {
    BooleanArray.validateValue(startIndex, this.#size);

    const startChunk = startIndex >>> BooleanArray.CHUNK_SHIFT;
    const startOffset = startIndex & BooleanArray.CHUNK_MASK;

    // Handle first chunk with mask for bits after startOffset
    const firstChunkMask = (BooleanArray.ALL_BITS << startOffset) >>> 0;
    const firstChunk = this[startChunk]! & firstChunkMask;
    if (firstChunk !== 0) {
      const bitPos = Math.clz32(firstChunk & -firstChunk) ^ 31;
      const index = (startChunk << BooleanArray.CHUNK_SHIFT) + bitPos;
      return index < this.#size ? index : -1;
    }

    // Search remaining chunks
    for (let i = startChunk + 1; i < this.length; i++) {
      const chunk = this[i]!;
      if (chunk !== 0) {
        const bitPos = Math.clz32(chunk & -chunk) ^ 31;
        const index = (i << BooleanArray.CHUNK_SHIFT) + bitPos;
        return index < this.#size ? index : -1;
      }
    }

    return -1;
  }

  /**
   * Get the index of the last set bit
   * @param startIndex the index to start searching from (exclusive upper bound). Bits from 0 to startIndex-1 are considered. [default = this.size]
   * @returns the index of the last set bit, or -1 if no bits are set in the specified range
   */
  getLastSetIndex(startIndex: number = this.#size): number {
    BooleanArray.validateValue(startIndex, this.#size + 1); // Validates startIndex is between 0 and this.#size (inclusive)

    if (startIndex === 0) { // If startIndex is 0, the range [0, -1] is empty.
      return -1;
    }

    // We search in the range [0, searchUpToBitIndex_inclusive]
    const searchUpToBitIndex_inclusive = startIndex - 1;

    const startChunk = searchUpToBitIndex_inclusive >>> BooleanArray.CHUNK_SHIFT;
    const bitOffsetInStartChunk = searchUpToBitIndex_inclusive & BooleanArray.CHUNK_MASK;

    // 1. Handle the first chunk (the one containing searchUpToBitIndex_inclusive)
    const firstChunkValue = this[startChunk]!;
    if (firstChunkValue !== 0) {
      // Create a mask for bits from 0 up to bitOffsetInStartChunk (inclusive)
      let mask;
      if (bitOffsetInStartChunk === 31) {
        mask = BooleanArray.ALL_BITS;
      } else {
        mask = ((1 << (bitOffsetInStartChunk + 1)) - 1) >>> 0;
      }
      const maskedChunk = firstChunkValue & mask;
      if (maskedChunk !== 0) {
        const bitPos = 31 - Math.clz32(maskedChunk); // Find MSB in the masked part
        return (startChunk << BooleanArray.CHUNK_SHIFT) + bitPos;
      }
    }

    // 2. Search remaining chunks backwards (from startChunk - 1 down to 0)
    for (let i = startChunk - 1; i >= 0; i--) {
      const chunkValue = this[i]!;
      if (chunkValue !== 0) {
        const bitPos = 31 - Math.clz32(chunkValue); // Find MSB in the full chunk
        return (i << BooleanArray.CHUNK_SHIFT) + bitPos;
      }
    }

    return -1;
  }

  /**
   * Get the number of set bits in the array
   * @returns the number of set bits in the array
   */
  getPopulationCount(): number {
    let count = 0;
    const lastIndex = this.length - 1;

    // Count all full chunks
    for (let i = 0; i < lastIndex; i++) {
      count += countChunk(this[i]!);
    }

    // Handle last chunk
    if (this.length > 0) { // Ensure there is at least one chunk to process
      const remainingBits = this.#size % BooleanArray.BITS_PER_INT;
      const lastChunkMask = remainingBits === 0 ? BooleanArray.ALL_BITS : ((1 << remainingBits) - 1) >>> 0;
      count += countChunk(this[lastIndex]! & lastChunkMask);
    }

    return count;
  }

  /**
   * Check if the array is empty
   * @returns `true` if the array is empty, `false` otherwise
   */
  isEmpty(): boolean {
    const len = this.length;

    // Loop unrolling for better performance
    let i = 0;
    const unrollLimit = len - (len % 4);

    // Process 4 elements at a time with early exit
    for (; i < unrollLimit; i += 4) {
      if ((this[i]! | this[i + 1]! | this[i + 2]! | this[i + 3]!) !== 0) {
        return false;
      }
    }

    // Handle remaining elements
    for (; i < len; i++) {
      if (this[i] !== 0) return false;
    }

    return true;
  }

  /**
   * Performs an in-place bitwise NAND operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise NAND operation with
   * @returns the current BooleanArray
   */
  nand(other: BooleanArray): this {
    nand(this, other, true);
    return this;
  }

  /**
   * Performs an in-place bitwise NOR operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise NOR operation with
   * @returns the current BooleanArray
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
   */
  or(other: BooleanArray): this {
    or(this, other, true);
    return this;
  }

  /**
   * Set all bits to `true`
   * @returns `this` for chaining
   */
  setAll(): this {
    // Fill all chunks with ALL_BITS
    this.fill(BooleanArray.ALL_BITS);

    // Mask off any excess bits in the last chunk if needed
    const remainingBits = this.#size % BooleanArray.BITS_PER_INT;
    if (remainingBits > 0) {
      const lastIndex = this.length - 1;
      const mask = ((1 << remainingBits) - 1) >>> 0;
      this[lastIndex] = mask;
    }

    return this;
  }

  /**
   * Set the boolean state of a bit
   * @param index the bit index to set the state of
   * @param value the boolean state to set the bit to
   * @returns `this` for chaining
   */
  setBool(index: number, value: boolean): this {
    BooleanArray.validateValue(index, this.#size);
    const chunk = index >>> BooleanArray.CHUNK_SHIFT;
    const mask = 1 << (index & BooleanArray.CHUNK_MASK);
    if (value) {
      this[chunk]! |= mask;
    } else {
      this[chunk]! &= ~mask;
    }
    return this;
  }

  /**
   * Set a range of bits to a given value
   * @param startIndex the start index to set the range from
   * @param count the number of booleans to set
   * @param value the boolean value to set
   * @returns `this` for chaining
   * @throws {RangeError} if `startIndex` is out of bounds
   * @throws {RangeError} if `count` is out of bounds
   */
  setRange(startIndex: number, count: number, value: boolean): this {
    if (count === 0) {
      return this;
    }
    BooleanArray.validateValue(startIndex, this.#size);
    BooleanArray.validateValue(startIndex + count, this.#size + 1);

    const startChunk = startIndex >>> BooleanArray.CHUNK_SHIFT;
    const endChunk = (startIndex + count - 1) >>> BooleanArray.CHUNK_SHIFT;

    if (startChunk === endChunk) {
      const startOffset = startIndex & BooleanArray.CHUNK_MASK;
      const mask = count === BooleanArray.BITS_PER_INT
        ? BooleanArray.ALL_BITS
        : (((1 << count) - 1) << startOffset) >>> 0;
      this[startChunk] = value ? (this[startChunk]! | mask) : (this[startChunk]! & ~mask);
      return this;
    }

    // 1. Handle the first (potentially partial) chunk
    const firstChunkStartOffset = startIndex & BooleanArray.CHUNK_MASK;
    const firstChunkMask = (BooleanArray.ALL_BITS << firstChunkStartOffset) >>> 0;
    if (value) {
      this[startChunk]! |= firstChunkMask;
    } else {
      this[startChunk]! &= ~firstChunkMask;
    }

    // 2. Handle full chunks in the middle
    const fillValue = value ? BooleanArray.ALL_BITS : 0;
    // The 'endChunk' in fill is exclusive, so if startChunk+1 === endChunk, it fills nothing.
    if (startChunk + 1 < endChunk) {
      this.fill(fillValue, startChunk + 1, endChunk);
    }

    // 3. Handle the last (potentially partial) chunk
    const lastBitIndex = startIndex + count - 1;
    const lastChunkEndOffset = lastBitIndex & BooleanArray.CHUNK_MASK;
    const lastChunkMask = lastChunkEndOffset === BooleanArray.CHUNK_MASK
      ? BooleanArray.ALL_BITS
      : ((1 << (lastChunkEndOffset + 1)) - 1) >>> 0;

    if (value) {
      this[endChunk]! |= lastChunkMask;
    } else {
      this[endChunk]! &= ~lastChunkMask;
    }

    return this;
  }

  /**
   * Toggle the boolean state of a bit
   * @param index the bit index to toggle the state of
   * @returns the new boolean state of the bit
   */
  toggleBool(index: number): boolean {
    BooleanArray.validateValue(index, this.#size);
    const chunk = index >>> BooleanArray.CHUNK_SHIFT;
    const mask = 1 << (index & BooleanArray.CHUNK_MASK);
    this[chunk]! ^= mask;
    return (this[chunk]! & mask) !== 0;
  }

  /**
   * Performs an in-place bitwise XOR operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise XOR operation with
   * @returns the current BooleanArray
   */
  xor(other: BooleanArray): this {
    xor(this, other, true);
    return this;
  }

  /**
   * Performs an in-place bitwise XNOR operation with another BooleanArray
   * @param other the BooleanArray to perform the bitwise XNOR operation with
   * @returns the current BooleanArray
   */
  xnor(other: BooleanArray): this {
    xnor(this, other, true);
    return this;
  }

  /**
   * Get the indices of the set bits in the array
   * @param startIndex the start index to get the indices from [default = 0]
   * @param endIndex the end index to get the indices from [default = this.size]
   * @returns Iterator of indices where bits are set
   */
  *truthyIndices(startIndex: number = 0, endIndex: number = this.#size): IterableIterator<number> {
    BooleanArray.validateValue(startIndex, this.#size);
    BooleanArray.validateValue(endIndex, this.#size + 1);
    if (startIndex >= endIndex) return;

    const actualEndIndex = Math.min(endIndex, this.#size); // Ensure we don't iterate past the logical size

    let currentBitIndex = startIndex;

    // Navigate to the first relevant chunk and bit offset
    let currentChunkLoopIndex = currentBitIndex >>> BooleanArray.CHUNK_SHIFT;
    let bitOffsetInChunk = currentBitIndex & BooleanArray.CHUNK_MASK;

    while (currentBitIndex < actualEndIndex) {
      // If we've moved to a new chunk or starting, load the chunk
      if (bitOffsetInChunk === 0 || currentBitIndex === startIndex) {
        // Ensure we don't go past the array buffer's length
        if (currentChunkLoopIndex >= this.length) break;
      }

      let chunk = this[currentChunkLoopIndex]!;

      // Mask off bits before the currentBitIndex in the first considered chunk
      if (currentBitIndex === startIndex && bitOffsetInChunk > 0) {
        chunk &= BooleanArray.ALL_BITS << bitOffsetInChunk;
      }

      while (chunk !== 0 && currentBitIndex < actualEndIndex) {
        // Find the LSB (Least Significant Bit)
        const lsb = chunk & -chunk;
        // Calculate its position (0-31) within the chunk
        // (Math.clz32(lsb) ^ 31) is equivalent to finding trailing zeros for a power of 2
        const lsbPositionInChunk = Math.clz32(lsb) ^ 31;

        const yieldedIndex = (currentChunkLoopIndex << BooleanArray.CHUNK_SHIFT) + lsbPositionInChunk;

        if (yieldedIndex >= actualEndIndex) break; // Past the requested end

        if (yieldedIndex >= currentBitIndex) { // Ensure we are at or past currentBitIndex
          yield yieldedIndex;
        }

        // Clear the LSB to find the next set bit in this chunk
        chunk &= chunk - 1;

        // Update currentBitIndex to be one after the yielded index to ensure progress,
        // or at least to the start of the next bit to check.
        // This also helps if the loop didn't yield (e.g. lsb was before currentBitIndex due to initial masking)
        currentBitIndex = yieldedIndex + 1;
      }

      // Move to the next chunk
      currentChunkLoopIndex++;
      bitOffsetInChunk = 0; // Reset offset for the new chunk

      // If we didn't find any bits in the previous chunk (or finished it),
      // set currentBitIndex to the start of the new chunk.
      if (currentBitIndex < (currentChunkLoopIndex << BooleanArray.CHUNK_SHIFT)) {
        currentBitIndex = currentChunkLoopIndex << BooleanArray.CHUNK_SHIFT;
      }

      // Optimization: if currentBitIndex already meets or exceeds startIndex for the next iteration,
      // no need to do special masking for the start of that chunk again.
    }
  }
}
