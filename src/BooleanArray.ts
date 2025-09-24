/**
 * @description A boolean array backed by a Uint32Array.
 * @copyright   2025 the BooleanArray authors. All rights reserved.
 * @license     MIT
 * @module      BooleanArray
 */

import { and, difference, equals, nand, nor, not, or, xnor, xor } from "./operations.ts";

/** A fast boolean array backed by a Uint32Array */
export class BooleanArray {
  /** The number of bits per chunk */
  static readonly BITS_PER_INT = 32 as const;

  /** The mask for the chunk offset */
  static readonly CHUNK_MASK = 31 as const;

  /** The shift for the chunk offset */
  static readonly CHUNK_SHIFT = 5 as const;

  /** The mask for all bits (~0 >>> 0) */
  static readonly ALL_BITS_TRUE = 4294967295 as const; // 0xFFFFFFFF

  /** The maximum safe size for bit operations */
  static readonly MAX_SAFE_SIZE = 536870911 as const; // Math.floor((2 ** 32 - 1) / 8);

  /**
   * Performs a bitwise AND operation with two BooleanArrays
   * @returns a new BooleanArray with the result
   * @throws {RangeError} if `a` and `b` have different sizes
   */
  static and(a: BooleanArray, b: BooleanArray): BooleanArray {
    return and(a, b, false);
  }

  /**
   * Performs a bitwise difference operation with two BooleanArrays
   * @returns a new BooleanArray with the result
   * @throws {RangeError} if `a` and `b` have different sizes
   */
  static difference(a: BooleanArray, b: BooleanArray): BooleanArray {
    return difference(a, b, false);
  }

  /**
   * Checks if two BooleanArrays are equal
   * @returns `true` if the arrays are equal, `false` otherwise
   */
  static equals(a: BooleanArray, b: BooleanArray): boolean {
    return equals(a, b);
  }

  /**
   * Performs a bitwise NAND operation with two BooleanArrays
   * @returns a new BooleanArray with the result
   * @throws {RangeError} if `a` and `b` have different sizes
   */
  static nand(a: BooleanArray, b: BooleanArray): BooleanArray {
    return nand(a, b, false);
  }

  /**
   * Performs a bitwise NOR operation with two BooleanArrays
   * @returns a new BooleanArray with the result
   * @throws {RangeError} if `a` and `b` have different sizes
   */
  static nor(a: BooleanArray, b: BooleanArray): BooleanArray {
    return nor(a, b, false);
  }

  /**
   * Performs a bitwise NOT operation with a BooleanArray
   * @returns a new BooleanArray with the result
   * @throws {RangeError} if `a` is not a BooleanArray
   */
  static not(a: BooleanArray): BooleanArray {
    return not(a, false);
  }

  /**
   * Performs a bitwise OR operation with two BooleanArrays
   * @returns a new BooleanArray with the result
   * @throws {RangeError} if `a` and `b` have different sizes
   */
  static or(a: BooleanArray, b: BooleanArray): BooleanArray {
    return or(a, b, false);
  }

  /**
   * Performs a bitwise XOR operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   * @throws {RangeError} if `a` and `b` have different sizes
   */
  static xor(a: BooleanArray, b: BooleanArray): BooleanArray {
    return xor(a, b, false);
  }

  /**
   * Performs a bitwise XNOR operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   * @throws {RangeError} if `a` and `b` have different sizes
   */
  static xnor(a: BooleanArray, b: BooleanArray): BooleanArray {
    return xnor(a, b, false);
  }

  /**
   * Validate a value
   * @param value the value to validate
   * @param maxSize the maximum size of the array [default = BooleanArray.MAX_SAFE_SIZE]
   * @returns the validated value
   * @throws {TypeError} if `value` is not a safe integer
   * @throws {RangeError} if `value` is less than 0, or is greater than maxSize or BooleanArray.MAX_SAFE_SIZE
   */
  static assertIsSafeValue(value: number, maxSize?: number): number {
    // Fast type and range check
    if (!Number.isSafeInteger(value)) {
      throw new TypeError('"value" must be a safe integer.');
    }

    // Single lower bound check
    if (value < 0) {
      throw new RangeError('"value" must be greater than or equal to 0.');
    }

    if (maxSize !== undefined) {
      // Validate maxSize directly to avoid circular dependency
      if (!Number.isSafeInteger(maxSize) || maxSize < 0 || maxSize > BooleanArray.MAX_SAFE_SIZE) {
        throw new TypeError('"maxSize" must be a safe integer between 0 and BooleanArray.MAX_SAFE_SIZE.');
      }

      // Direct upper bound check against maxSize
      if (value >= maxSize) {
        throw new RangeError(
          `Value ${value} is out of bounds for array of size ${maxSize}. BooleanArrays are 0-indexed, try ${
            maxSize - 1
          } instead.`,
        );
      }
    } else {
      // Direct upper bound check against MAX_SAFE_SIZE
      if (value > BooleanArray.MAX_SAFE_SIZE) {
        throw new RangeError(`"value" must be smaller than or equal to ${BooleanArray.MAX_SAFE_SIZE}.`);
      }
    }

    return value;
  }

  /**
   * Validate a value
   * @param value the value to validate
   * @param maxSize the maximum size of the array [default = BooleanArray.MAX_SAFE_SIZE]
   * @returns `true` if the value is valid, `false` otherwise
   */
  static isSafeValue(value: number, maxSize?: number): boolean {
    try {
      BooleanArray.assertIsSafeValue(value, maxSize);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a BooleanArray from an array of numbers, each number representing a bit to set to true.
   * @param size The size of the BooleanArray
   * @param arr The array of numbers to create the BooleanArray from
   * @returns A new BooleanArray instance
   * @throws {RangeError} If `size` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
   * @throws {TypeError} If `size` is not a safe value
   * @throws {TypeError} If `arr` is not an array
   * @throws {RangeError} If `arr.length` is larger than `size`
   * @see {@link BooleanArray.assertIsSafeValue}
   *
   * @example
   * Creates a BooleanArray with 10 bits, setting the odd bits to true
   * ```ts
   * const arr = [1,3,5,7,9]; // indices in the array are set to true
   * const boolArray = BooleanArray.fromArray(10, arr);
   * console.log(boolArray.get(0)); // false
   * console.log(boolArray.get(1)); // true
   * ```
   */
  static fromArray(size: number, arr: number[]): BooleanArray;
  static fromArray(size: number, arr: boolean[]): BooleanArray;
  static fromArray(size: number, arr: Array<number | boolean>): BooleanArray {
    if (!Array.isArray(arr)) {
      throw new TypeError('"arr" must be an array.');
    }
    if (arr.length > size) {
      throw new RangeError(`"arr" must be smaller than or equal to ${size}.`);
    }

    const pool = new BooleanArray(size);

    if (arr.length === 0) {
      return pool;
    } else if (typeof arr[0] === "boolean") {
      for (let i = 0; i < arr.length; i++) {
        const bit = arr[i]!;
        if (typeof bit !== "boolean") {
          throw new TypeError('"arr" must be an array of booleans.');
        }
        const chunk = i >>> BooleanArray.CHUNK_SHIFT;
        const mask = 1 << (i & BooleanArray.CHUNK_MASK);
        pool.buffer[chunk]! |= bit ? mask : 0;
      }
    } else if (typeof arr[0] === "number") {
      for (let i = 0; i < arr.length; i++) {
        const bit = arr[i]! as number;
        BooleanArray.assertIsSafeValue(bit, size);
        const chunk = bit >>> BooleanArray.CHUNK_SHIFT;
        const mask = 1 << (bit & BooleanArray.CHUNK_MASK);
        pool.buffer[chunk]! |= mask;
      }
    } else {
      throw new TypeError('"arr" must be an array of numbers or booleans.');
    }

    return pool;
  }

  /**
   * Create a BooleanArray from a Uint32Array
   * @param size The size of the BooleanArray
   * @param arr The Uint32Array to create the BooleanArray from
   * @returns A new BooleanArray instance
   * @throws {RangeError} If `size` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
   * @throws {TypeError} If `size` is not a safe value
   * @throws {RangeError} If `arr.length` does not match the expected buffer length `size`
   * @throws {TypeError} If `arr` is not an ArrayLike<number>
   * @see {@link BooleanArray.assertIsSafeValue}
   */
  static fromUint32Array(size: number, arr: ArrayLike<number>): BooleanArray {
    BooleanArray.assertIsSafeValue(size);
    if (size === 0) {
      throw new RangeError('"size" must be greater than or equal to 1.');
    }
    if (!arr || typeof arr.length !== "number") {
      throw new TypeError('"arr" must be an ArrayLike<number> (e.g., Uint32Array or number[]).');
    }

    const expectedBufferLength = BooleanArray.getChunkCount(size);
    if (arr.length > expectedBufferLength) {
      throw new RangeError(
        `Input array length (${arr.length}) does not match expected buffer length (${expectedBufferLength}) for a BooleanArray of size ${size}.`,
      );
    }

    const pool = new BooleanArray(size); // Creates a zeroed buffer of the correct length
    pool.buffer.set(arr); // Copies content from arr to pool.buffer

    // Ensure unused bits in the last chunk are zeroed out
    if (pool.bitsInLastChunk > 0) {
      pool.buffer[pool.chunkCount - 1]! &= pool.lastChunkMask;
    }

    return pool;
  }

  /**
   * Create a BooleanArray from an object, using the object's keys as the bit indices.
   * @param size The size of the BooleanArray
   * @param key The key of the object to create the BooleanArray from
   * @param objs The array of objects to create the BooleanArray from
   * @returns A new BooleanArray instance
   * @throws {TypeError} If `objs` is not an array
   * @throws {TypeError} If `key` is null or undefined
   * @throws {RangeError} If `size` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
   * @throws {TypeError} If `size` is not a safe value
   * @throws {Error} If any object's key value is not a safe value
   * @see {@link BooleanArray.assertIsSafeValue}
   *
   * @example
   * ```ts
   * const events = [
   *   { name: "setActive", entity: 0 },
   *   { name: "setActive", entity: 2 },
   * ]
   * const boolArray = BooleanArray.fromObjects(10, "entity", events);
   * console.log(boolArray.get(0)); // true
   * console.log(boolArray.get(1)); // false
   * console.log(boolArray.get(2)); // true
   * ```
   */
  static fromObjects<T>(size: number, key: keyof T, objs: T[]): BooleanArray {
    if (!Array.isArray(objs)) {
      throw new TypeError('"objs" must be an array.');
    }
    if (key == null) {
      throw new TypeError('"key" must not be null or undefined.');
    }
    const result = new BooleanArray(size);
    if (objs.length === 0) {
      return result;
    }
    for (let i = 0; i < objs.length; i++) {
      const obj = objs[i];
      const index = obj?.[key] as number; // assertIsSafeValue will throw if not a number
      BooleanArray.assertIsSafeValue(index, size);
      const chunk = index >>> BooleanArray.CHUNK_SHIFT;
      const mask = 1 << (index & BooleanArray.CHUNK_MASK);
      result.buffer[chunk]! |= mask;
    }
    return result;
  }

  /**
   * Get the chunk index for a given bool index
   * @param index the bool index to get the chunk index for
   * @returns the chunk index
   */
  static getChunk(index: number): number {
    return index >>> BooleanArray.CHUNK_SHIFT;
  }

  /**
   * Get the number of chunks required to accommodate a given number of bools
   * @param bools the number of bools to get the chunk count for
   * @returns the number of chunks
   */
  static getChunkCount(bools: number): number {
    return (bools + BooleanArray.CHUNK_MASK) >>> BooleanArray.CHUNK_SHIFT;
  }

  /**
   * Get the offset of a bool within a chunk
   * @param boolIndex the bool index to get the offset for
   * @returns the offset
   */
  static getChunkOffset(boolIndex: number): number {
    return boolIndex & BooleanArray.CHUNK_MASK;
  }

  /** The underlying Uint32Array */
  readonly buffer: Uint32Array;

  /**
   * The total number of booleans in the array
   * @note for the total number of indices @see {@link BooleanArray.length}
   */
  readonly size: number;

  /** Pre-calculated number of chunks */
  readonly chunkCount: number;

  /** Pre-calculated mask for the last chunk */
  readonly lastChunkMask: number;

  /** Pre-calculated bits in the last chunk */
  readonly bitsInLastChunk: number;

  /**
   * Creates a new BooleanArray
   * @param size the number of booleans required in the array (min = 1, max = BooleanArray.MAX_SAFE_SIZE)
   * @returns a new BooleanArray
   * @throws {RangeError} if `size` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
   * @throws {TypeError} if `size` is not a safe integer or NaN
   */
  constructor(size: number) {
    BooleanArray.assertIsSafeValue(size);
    if (size === 0) {
      throw new RangeError('"size" must be greater than or equal to 1.');
    }

    // Pre-calculate values
    this.size = size;
    this.chunkCount = (size + BooleanArray.CHUNK_MASK) >>> BooleanArray.CHUNK_SHIFT;
    this.bitsInLastChunk = size % BooleanArray.BITS_PER_INT;
    this.lastChunkMask = this.bitsInLastChunk === 0
      ? BooleanArray.ALL_BITS_TRUE
      : ((1 << this.bitsInLastChunk) - 1) >>> 0;

    this.buffer = new Uint32Array(this.chunkCount);
  }

  /**
   * @returns the total number of indices in the array
   * @note for the total number of booleans @see {@link BooleanArray.size}
   */
  get length(): number {
    return this.chunkCount;
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
   * Creates a copy of this BooleanArray
   * @returns a new BooleanArray with the same contents
   */
  clone(): BooleanArray {
    const copy = new BooleanArray(this.size);
    copy.buffer.set(this.buffer);
    return copy;
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

  /**
   * Fill the array with a boolean value
   * @param value the boolean value to fill the array with
   * @returns the current BooleanArray
   */
  fill(value: boolean): this {
    this.buffer.fill(value ? BooleanArray.ALL_BITS_TRUE : 0);
    // Mask off any excess bits in the last chunk if needed
    if (this.bitsInLastChunk > 0 && value) {
      this.buffer[this.chunkCount - 1] = this.lastChunkMask;
    }
    return this;
  }

  /**
   * Iterates over each bit in the array
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
    BooleanArray.assertIsSafeValue(startIndex, this.size);
    BooleanArray.assertIsSafeValue(count, this.size + 1);
    if (startIndex + count > this.size) {
      throw new RangeError(
        `Range [${startIndex}, ${startIndex + count}) exceeds array size ${this.size}.`,
      );
    }

    let currentChunkIndex = -1;
    let currentChunkValue = 0;

    const endIndex = startIndex + count;
    for (let i = startIndex; i < endIndex; i++) {
      const chunkForThisBit = i >>> BooleanArray.CHUNK_SHIFT;
      if (chunkForThisBit !== currentChunkIndex) {
        currentChunkIndex = chunkForThisBit;
        currentChunkValue = this.buffer[currentChunkIndex]!;
      }
      const offset = i & BooleanArray.CHUNK_MASK;
      callback((currentChunkValue & (1 << offset)) !== 0, i, this);
    }
    return this;
  }

  /**
   * Internal fast path for single bit access (no validation)
   * @param index the bit index
   * @returns the boolean state of the bit
   */
  #getBit(index: number): boolean {
    return (this.buffer[index >>> BooleanArray.CHUNK_SHIFT]! & (1 << (index & BooleanArray.CHUNK_MASK))) !== 0;
  }

  /**
   * Internal fast path for range access (no validation)
   * @param startIndex the start index to get the booleans from
   * @param count the number of booleans to get
   * @returns an array of booleans
   */
  #getRange(startIndex: number, count: number): boolean[] {
    BooleanArray.assertIsSafeValue(count, this.size + 1);
    if (count === 0) return [];
    BooleanArray.assertIsSafeValue(startIndex, this.size);
    if (startIndex + count > this.size) {
      throw new RangeError(
        `Range [${startIndex}, ${startIndex + count}) exceeds array size ${this.size}.`,
      );
    }

    // Pre-allocate with specific size
    const result = new Array<boolean>(count);
    let currentChunkIndex = -1;
    let currentChunkValue = 0;

    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const chunkForThisBit = index >>> BooleanArray.CHUNK_SHIFT;
      if (chunkForThisBit !== currentChunkIndex) {
        currentChunkIndex = chunkForThisBit;
        currentChunkValue = this.buffer[currentChunkIndex]!;
      }
      const offset = index & BooleanArray.CHUNK_MASK;
      result[i] = (currentChunkValue & (1 << offset)) !== 0;
    }
    return result;
  }

  /**
   * Get multiple boolean values from the array
   * @param startIndex the start index to get the booleans from
   * @param count the number of booleans to get
   * @returns an array of booleans
   */
  get(index: number): boolean;
  get(startIndex: number, count: number): boolean[];
  get(indexOrStartIndex: number, count?: number): boolean | boolean[] {
    if (count === undefined) {
      // Single bit access - add bounds checking
      BooleanArray.assertIsSafeValue(indexOrStartIndex, this.size);
      return this.#getBit(indexOrStartIndex);
    } else {
      // Range access - bounds checking is done in #getRange
      return this.#getRange(indexOrStartIndex, count);
    }
  }

  /**
   * Get the number of set bits in the array
   * @returns the number of set bits in the array
   */
  getTruthyCount(): number {
    let count = 0;
    const lastIndex = this.chunkCount - 1;

    // Count all full chunks
    for (let i = 0; i < lastIndex; i++) {
      let value = this.buffer[i]!;
      value = value - ((value >>> 1) & 0x55555555);
      value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
      value = (value + (value >>> 4)) & 0x0f0f0f0f;
      count += (value * 0x01010101) >>> 24;
    }

    // Handle last chunk with pre-calculated mask
    let value = this.buffer[lastIndex]! & this.lastChunkMask;
    value = value - ((value >>> 1) & 0x55555555);
    value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
    value = (value + (value >>> 4)) & 0x0f0f0f0f;
    count += (value * 0x01010101) >>> 24;

    return count;
  }

  /**
   * Get the index of the first occurrence of a value
   * @param value The value to locate in the array.
   * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
   * @returns the index of the first occurrence of the value, or -1 if the value is not present.
   */
  indexOf(value: boolean, fromIndex: number = 0): number {
    if (!Number.isSafeInteger(fromIndex)) {
      throw new TypeError('"fromIndex" must be a safe integer.');
    }

    let start = Math.trunc(fromIndex);
    if (start < 0) {
      start = this.size + start;
      if (start < 0) start = 0;
    }
    if (start >= this.size) {
      return -1;
    }

    const startChunk = start >>> BooleanArray.CHUNK_SHIFT;
    const startOffset = start & BooleanArray.CHUNK_MASK;

    // Handle first chunk with mask for bits after startOffset
    const firstChunkMask = (BooleanArray.ALL_BITS_TRUE << startOffset) >>> 0;
    let firstChunk = this.buffer[startChunk]!;

    // If looking for false, invert the chunk before applying mask
    if (!value) {
      firstChunk = ~firstChunk;
    }

    firstChunk &= firstChunkMask;

    if (firstChunk !== 0) {
      const bitPos = Math.clz32(firstChunk & -firstChunk) ^ BooleanArray.CHUNK_MASK;
      const index = (startChunk << BooleanArray.CHUNK_SHIFT) + bitPos;
      return index < this.size ? index : -1;
    }

    // Search remaining chunks
    for (let i = startChunk + 1; i < this.chunkCount; i++) {
      let chunk = this.buffer[i]!;

      // If looking for false, invert the chunk
      if (!value) {
        chunk = ~chunk;
        // Mask out bits beyond the logical size in the last chunk
        if (i === this.chunkCount - 1 && this.bitsInLastChunk > 0) {
          chunk &= this.lastChunkMask;
        }
      }

      if (chunk !== 0) {
        const bitPos = Math.clz32(chunk & -chunk) ^ BooleanArray.CHUNK_MASK;
        const index = (i << BooleanArray.CHUNK_SHIFT) + bitPos;
        return index < this.size ? index : -1;
      }
    }

    return -1;
  }

  /**
   * Get the index of the last occurrence of a value
   * @param value The value to locate in the array.
   * @param fromIndex The array index at which to begin searching backward. If fromIndex is omitted, the search starts at the last index in the array.
   * @returns the index of the last occurrence of the value, or -1 if the value is not present.
   */
  lastIndexOf(value: boolean, fromIndex: number = this.size): number {
    let exclusiveBound = Math.trunc(fromIndex);
    if (exclusiveBound < 0) {
      exclusiveBound = this.size + exclusiveBound;
    } else if (exclusiveBound > this.size) {
      exclusiveBound = this.size;
    }

    if (exclusiveBound <= 0) {
      // Follow previous behavior which checks index 0 when fromIndex === 0
      return this.#getBit(0) === value ? 0 : -1;
    }

    // We search in the range [0, searchUpToBitIndex_inclusive]
    const searchUpToBitIndex_inclusive = exclusiveBound - 1;

    const startChunk = searchUpToBitIndex_inclusive >>> BooleanArray.CHUNK_SHIFT;
    const bitOffsetInStartChunk = searchUpToBitIndex_inclusive & BooleanArray.CHUNK_MASK;

    // Handle the first chunk (the one containing searchUpToBitIndex_inclusive)
    let firstChunkValue = this.buffer[startChunk]!;

    // If looking for false, invert the chunk
    if (!value) {
      firstChunkValue = ~firstChunkValue;
      // Mask out bits beyond the logical size if this is the last chunk
      if (startChunk === this.chunkCount - 1 && this.bitsInLastChunk > 0) {
        firstChunkValue &= this.lastChunkMask;
      }
    }

    if (firstChunkValue !== 0) {
      // Create a mask for bits from 0 up to bitOffsetInStartChunk (inclusive)
      let mask;
      if (bitOffsetInStartChunk === BooleanArray.CHUNK_MASK) {
        mask = BooleanArray.ALL_BITS_TRUE;
      } else {
        mask = ((1 << (bitOffsetInStartChunk + 1)) - 1) >>> 0;
      }
      const maskedChunk = firstChunkValue & mask;
      if (maskedChunk !== 0) {
        const bitPos = BooleanArray.CHUNK_MASK - Math.clz32(maskedChunk); // Find MSB in the masked part
        return (startChunk << BooleanArray.CHUNK_SHIFT) + bitPos;
      }
    }

    // Search remaining chunks backwards (from startChunk - 1 down to 0)
    for (let i = startChunk - 1; i >= 0; i--) {
      let chunkValue = this.buffer[i]!;

      // If looking for false, invert the chunk
      if (!value) {
        chunkValue = ~chunkValue;
      }

      if (chunkValue !== 0) {
        const bitPos = BooleanArray.CHUNK_MASK - Math.clz32(chunkValue); // Find MSB in the full chunk
        return (i << BooleanArray.CHUNK_SHIFT) + bitPos;
      }
    }

    return -1;
  }

  /**
   * Check if the array is empty
   * @returns `true` if the array is empty, `false` otherwise
   */
  isEmpty(): boolean {
    for (let i = 0; i < this.chunkCount; i++) {
      if (this.buffer[i] !== 0) return false;
    }
    return true;
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
   * Internal fast path for single bit setting (no validation)
   * @param index the bit index
   * @param value the boolean value to set
   */
  #setBit(index: number, value: boolean): this {
    const chunk = index >>> BooleanArray.CHUNK_SHIFT;
    const mask = 1 << (index & BooleanArray.CHUNK_MASK);
    if (value) {
      this.buffer[chunk]! |= mask;
    } else {
      this.buffer[chunk]! &= ~mask;
    }
    return this;
  }

  #setRange(startIndex: number, count: number, value: boolean): this {
    if (count === 0) {
      return this;
    }
    BooleanArray.assertIsSafeValue(startIndex, this.size);
    BooleanArray.assertIsSafeValue(count, this.size + 1);
    if (startIndex + count > this.size) {
      throw new RangeError(
        `Range [${startIndex}, ${startIndex + count}) exceeds array size ${this.size}.`,
      );
    }

    const startChunk = startIndex >>> BooleanArray.CHUNK_SHIFT;
    const endChunk = (startIndex + count - 1) >>> BooleanArray.CHUNK_SHIFT;

    if (startChunk === endChunk) {
      const startOffset = startIndex & BooleanArray.CHUNK_MASK;
      const mask = count === BooleanArray.BITS_PER_INT && startOffset === 0
        ? BooleanArray.ALL_BITS_TRUE
        : (((1 << count) - 1) << startOffset) >>> 0;
      this.buffer[startChunk] = value ? (this.buffer[startChunk]! | mask) : (this.buffer[startChunk]! & ~mask);
      return this;
    }

    // 1. Handle the first (potentially partial) chunk
    const firstChunkStartOffset = startIndex & BooleanArray.CHUNK_MASK;
    const firstChunkMask = (BooleanArray.ALL_BITS_TRUE << firstChunkStartOffset) >>> 0;
    if (value) {
      this.buffer[startChunk]! |= firstChunkMask;
    } else {
      this.buffer[startChunk]! &= ~firstChunkMask;
    }

    // 2. Handle full chunks in the middle
    const fillValue = value ? BooleanArray.ALL_BITS_TRUE : 0;
    // The 'endChunk' in fill is exclusive, so if startChunk+1 === endChunk, it fills nothing.
    if (startChunk + 1 < endChunk) {
      this.buffer.fill(fillValue, startChunk + 1, endChunk);
    }

    // 3. Handle the last (potentially partial) chunk
    const lastBitIndex = startIndex + count - 1;
    const lastChunkEndOffset = lastBitIndex & BooleanArray.CHUNK_MASK;
    const lastChunkMask = lastChunkEndOffset === BooleanArray.CHUNK_MASK
      ? BooleanArray.ALL_BITS_TRUE
      : ((1 << (lastChunkEndOffset + 1)) - 1) >>> 0;

    if (value) {
      this.buffer[endChunk]! |= lastChunkMask;
    } else {
      this.buffer[endChunk]! &= ~lastChunkMask;
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
  set(index: number, value: boolean): this;
  set(startIndex: number, count: number, value: boolean): this;
  set(indexOrStartIndex: number, valueOrCount: boolean | number, value?: boolean): this {
    if (value === undefined) {
      // Single bit setting - add bounds checking
      BooleanArray.assertIsSafeValue(indexOrStartIndex, this.size);
      return this.#setBit(indexOrStartIndex, valueOrCount as boolean);
    } else {
      // Range setting - bounds checking is done in #setRange
      return this.#setRange(indexOrStartIndex, valueOrCount as number, value);
    }
  }

  /**
   * Toggle the boolean state of a bit
   * @param index the bit index to toggle the state of
   * @returns the current BooleanArray for chaining
   */
  toggle(index: number): this {
    BooleanArray.assertIsSafeValue(index, this.size);
    const chunk = index >>> BooleanArray.CHUNK_SHIFT;
    const mask = 1 << (index & BooleanArray.CHUNK_MASK);
    this.buffer[chunk]! ^= mask;
    return this;
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

  /** Iterator */
  *[Symbol.iterator](): IterableIterator<boolean> {
    let currentChunkIndex = -1;
    let currentChunkValue = 0;

    for (let i = 0; i < this.size; i++) {
      const chunkForThisBit = i >>> BooleanArray.CHUNK_SHIFT;
      if (chunkForThisBit !== currentChunkIndex) {
        currentChunkIndex = chunkForThisBit;
        currentChunkValue = this.buffer[currentChunkIndex]!;
      }
      const offset = i & BooleanArray.CHUNK_MASK;
      yield (currentChunkValue & (1 << offset)) !== 0;
    }
  }

  /** Returns an iterable of key, value pairs for every entry in the array */
  *entries(): IterableIterator<[number, boolean]> {
    let currentChunkIndex = -1;
    let currentChunkValue = 0;

    for (let i = 0; i < this.size; i++) {
      const chunkForThisBit = i >>> BooleanArray.CHUNK_SHIFT;
      if (chunkForThisBit !== currentChunkIndex) {
        currentChunkIndex = chunkForThisBit;
        currentChunkValue = this.buffer[currentChunkIndex]!;
      }
      const offset = i & BooleanArray.CHUNK_MASK;
      yield [i, (currentChunkValue & (1 << offset)) !== 0];
    }
  }

  /** Returns an iterable of keys in the array */
  *keys(): IterableIterator<number> {
    for (let i = 0; i < this.size; i++) {
      yield i;
    }
  }

  /** Returns an iterable of values in the array */
  *values(): IterableIterator<boolean> {
    let currentChunkIndex = -1;
    let currentChunkValue = 0;

    for (let i = 0; i < this.size; i++) {
      const chunkForThisBit = i >>> BooleanArray.CHUNK_SHIFT;
      if (chunkForThisBit !== currentChunkIndex) {
        currentChunkIndex = chunkForThisBit;
        currentChunkValue = this.buffer[currentChunkIndex]!;
      }
      const offset = i & BooleanArray.CHUNK_MASK;
      yield (currentChunkValue & (1 << offset)) !== 0;
    }
  }

  /**
   * Get the indices of the set bits in the array
   * @param startIndex the start index to get the indices from [default = 0]
   * @param endIndex the end index to get the indices from [default = this.size]
   * @returns Iterator of indices where bits are set
   */
  *truthyIndices(startIndex: number = 0, endIndex: number = this.size): IterableIterator<number> {
    BooleanArray.assertIsSafeValue(startIndex, this.size);
    BooleanArray.assertIsSafeValue(endIndex, this.size + 1);
    if (startIndex >= endIndex) return;

    const actualEndIndex = Math.min(endIndex, this.size);

    let chunkIndex = startIndex >>> BooleanArray.CHUNK_SHIFT;
    const endChunk = (actualEndIndex - 1) >>> BooleanArray.CHUNK_SHIFT;

    while (chunkIndex <= endChunk && chunkIndex < this.chunkCount) {
      let chunk = this.buffer[chunkIndex]!;
      const chunkBaseIndex = chunkIndex << BooleanArray.CHUNK_SHIFT;

      // Mask off bits before startIndex in the first chunk
      if (chunkIndex === (startIndex >>> BooleanArray.CHUNK_SHIFT)) {
        const startBitOffset = startIndex & BooleanArray.CHUNK_MASK;
        chunk &= BooleanArray.ALL_BITS_TRUE << startBitOffset;
      }

      // Process all set bits in this chunk
      while (chunk !== 0) {
        const lsb = chunk & -chunk;
        const bitPosition = Math.clz32(lsb) ^ BooleanArray.CHUNK_MASK;
        const absoluteIndex = chunkBaseIndex + bitPosition;

        if (absoluteIndex >= actualEndIndex) return;

        yield absoluteIndex;
        chunk &= chunk - 1; // Clear the LSB
      }

      chunkIndex++;
    }
  }
}
