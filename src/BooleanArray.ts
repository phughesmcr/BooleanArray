/**
 * @module      BooleanArray
 * @description A boolean array backed by a Uint32Array.
 * @copyright   2024 the BooleanArray authors. All rights reserved.
 * @license     MIT
 */

/**
 * Performs a bitwise AND operation with two numbers
 * @param a the first number
 * @param b the second number
 * @returns the result of the bitwise AND operation
 */
export function and(a: number, b: number): number {
  return a & b;
}

/**
 * Performs a bitwise difference operation with two numbers
 * @param a the first number
 * @param b the second number
 * @returns the result of the bitwise difference operation
 */
export function difference(a: number, b: number): number {
  return a & ~b;
}

/**
 * Performs a bitwise NAND operation with two numbers
 * @param a the first number
 * @param b the second number
 * @returns the result of the bitwise NAND operation
 */
export function nand(a: number, b: number): number {
  return ~(a & b);
}

/**
 * Performs a bitwise NOR operation with two numbers
 * @param a the first number
 * @param b the second number
 * @returns the result of the bitwise NOR operation
 */
export function nor(a: number, b: number): number {
  return ~(a | b);
}

/**
 * Performs a bitwise NOT operation with a number
 * @param a the number to perform the bitwise NOT operation on
 * @returns the result of the bitwise NOT operation
 */
export function not(a: number): number {
  return ~a;
}

/**
 * Performs a bitwise OR operation with two numbers
 * @param a the first number
 * @param b the second number
 * @returns the result of the bitwise OR operation
 */
export function or(a: number, b: number): number {
  return a | b;
}

/**
 * Performs a bitwise XOR operation with two numbers
 * @param a the first number
 * @param b the second number
 * @returns the result of the bitwise XOR operation
 */
export function xor(a: number, b: number): number {
  return a ^ b;
}

/**
 * Performs a bitwise XNOR operation with two numbers
 * @param a the first number
 * @param b the second number
 * @returns the result of the bitwise XNOR operation
 */
export function xnor(a: number, b: number): number {
  return ~(a ^ b);
}

/**
 * Count set bits in chunk
 * @param value the value to count the set bits in
 * @returns the number of set bits in the value
 */
export function countChunk(value: number): number {
  value = value - ((value >>> 1) & 0x55555555);
  value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
  value = (value + (value >>> 4)) & 0x0f0f0f0f;
  return ((value * 0x01010101) >>> 24);
}

/** A fast boolean array backed by a Uint32Array */
export class BooleanArray extends Uint32Array {
  // Config

  /** The threshold for what is considered a large array */
  static LARGE_RANGE_THRESHOLD = 1024;

  /** The threshold for what is considered a dense array */
  static DENSE_ARRAY_THRESHOLD = 0.75;

  // Static values

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
    return BooleanArray.operate(a, b, and);
  }

  /**
   * Checks if two BooleanArrays are equal
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns `true` if the arrays are equal, `false` otherwise
   */
  static equals(a: BooleanArray, b: BooleanArray): boolean {
    if (a.size !== b.size) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Performs a bitwise difference operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static difference(a: BooleanArray, b: BooleanArray): BooleanArray {
    return BooleanArray.operate(a, b, difference);
  }

  /**
   * Create a BooleanArray from an array of numbers, each number representing a bit to set to true.
   * @param arr The array of numbers to create the BooleanArray from
   * @param size The size of the BooleanArray
   * @returns A new BooleanArray instance
   */
  static fromArray(arr: Array<number>, size: number): BooleanArray {
    const pool = new BooleanArray(size);
    if (arr.some((n) => typeof n !== "number" || isNaN(n))) {
      throw new TypeError("BitPool.fromArray: array contains non-number or NaN values");
    }
    for (let i = 0; i < arr.length; i++) {
      pool.setBool(arr[i]!, true);
    }
    return pool;
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
    return BooleanArray.operate(a, b, nand);
  }

  /**
   * Performs a bitwise NOR operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static nor(a: BooleanArray, b: BooleanArray): BooleanArray {
    return BooleanArray.operate(a, b, nor);
  }

  /**
   * Performs a bitwise NOT operation with a BooleanArray
   * @param a the BooleanArray to perform the bitwise NOT operation on
   * @returns a new BooleanArray with the result
   */
  static not(a: BooleanArray): BooleanArray {
    return BooleanArray.operate(a, a, not);
  }

  /**
   * Performs a bitwise operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @param operation the bitwise operation to perform
   * @returns a new BooleanArray with the result
   */
  static operate(a: BooleanArray, b: BooleanArray, operation: (a: number, b: number) => number): BooleanArray {
    if (a.size !== b.size) {
      throw new Error("Arrays must have the same size");
    }
    const result = new BooleanArray(a.size);
    for (let i = 0; i < a.length; i++) {
      result[i] = operation(a[i]!, b[i]!);
    }
    return result;
  }

  /**
   * Performs a bitwise OR operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static or(a: BooleanArray, b: BooleanArray): BooleanArray {
    return BooleanArray.operate(a, b, or);
  }

  /**
   * Validate a value
   * @param value the value to validate
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
   * Performs a bitwise XOR operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static xor(a: BooleanArray, b: BooleanArray): BooleanArray {
    return BooleanArray.operate(a, b, xor);
  }

  /**
   * Performs a bitwise XNOR operation with two BooleanArrays
   * @param a the first BooleanArray
   * @param b the second BooleanArray
   * @returns a new BooleanArray with the result
   */
  static xnor(a: BooleanArray, b: BooleanArray): BooleanArray {
    return BooleanArray.operate(a, b, xnor);
  }

  /** The total number of bits in the array */
  #size: number;

  /**
   * Creates a new BooleanArray
   * @param size the number of bits required in the array (min = 1, max = 4294967295)
   * @returns a new BooleanArray
   * @throws {RangeError} if `size` is less than 1, or is greater than 0xffffffff (2 ** 32 - 1) === (4294967295)
   * @throws {TypeError} if `size` is NaN
   */
  constructor(size: number) {
    super(BooleanArray.getChunkCount(BooleanArray.validateValue(size)));
    this.#size = size;
  }

  /** @returns the total number of bits in the bitfield */
  get size(): number {
    return this.#size;
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
   * Get the boolean state of a bit
   * @param index the bit index to get the state of
   * @returns the boolean state of the bit
   */
  getBool(index: number): boolean {
    BooleanArray.validateValue(index, this.#size);
    const chunk = BooleanArray.getChunk(index);
    const offset = BooleanArray.getChunkOffset(index);
    return (this[chunk]! & (1 << offset)) !== 0;
  }

  /**
   * Add bulk operations for better performance
   * @param startIndex the start index to get the booleans from
   * @param count the number of booleans to get
   * @returns an array of booleans
   * @throws {RangeError} if `startIndex` is out of bounds
   * @throws {RangeError} if `count` is out of bounds
   */
  getBools(startIndex: number, count: number): boolean[] {
    BooleanArray.validateValue(startIndex, this.#size);
    BooleanArray.validateValue(count);
    if (startIndex + count > this.#size) {
      throw new RangeError("Range exceeds array bounds");
    }

    const result: boolean[] = new Array(count);
    for (let i = 0; i < count; i++) {
      result[i] = this.getBool(startIndex + i);
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

    const startChunk = BooleanArray.getChunk(startIndex);
    const startOffset = BooleanArray.getChunkOffset(startIndex);

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
   * @param startIndex the index to start searching from [default = this.size]
   * @returns the index of the last set bit, or -1 if no bits are set
   */
  getLastSetIndex(startIndex: number = this.#size): number {
    BooleanArray.validateValue(startIndex, this.#size + 1);

    // Adjust startIndex to be within bounds
    const effectiveStart = Math.min(startIndex, this.#size);

    // Get the chunk containing startIndex
    const startChunk = BooleanArray.getChunk(effectiveStart - 1);

    // Handle first chunk
    const firstOffset = effectiveStart & BooleanArray.CHUNK_MASK;
    const chunk = this[startChunk]!;
    if (chunk !== 0) {
      const mask = firstOffset === 0 ? BooleanArray.ALL_BITS : ((1 << firstOffset) - 1) >>> 0;
      const maskedChunk = chunk & mask;
      if (maskedChunk !== 0) {
        const bitPos = 31 - Math.clz32(maskedChunk);
        return (startChunk << BooleanArray.CHUNK_SHIFT) + bitPos;
      }
    }

    // Search remaining chunks backwards
    for (let i = startChunk - 1; i >= 0; i--) {
      const chunk = this[i]!;
      if (chunk !== 0) {
        const bitPos = 31 - Math.clz32(chunk);
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
    const remainingBits = this.#size % BooleanArray.BITS_PER_INT;
    const lastChunkMask = remainingBits === 0 ? BooleanArray.ALL_BITS : ((1 << remainingBits) - 1) >>> 0;
    count += countChunk(this[lastIndex]! & lastChunkMask);

    return count;
  }

  /**
   * Check if the array is empty
   * @returns `true` if the array is empty, `false` otherwise
   */
  isEmpty(): boolean {
    // Process 8 chunks at a time for large arrays
    const len = this.length;
    let i = 0;

    if (len >= 8) {
      for (; i + 7 < len; i += 8) {
        if (
          (this[i]! | this[i + 1]! | this[i + 2]! | this[i + 3]! |
            this[i + 4]! | this[i + 5]! | this[i + 6]! | this[i + 7]!) !== 0
        ) {
          return false;
        }
      }
    }

    // Handle remaining chunks
    for (; i < len; i++) {
      if (this[i] !== 0) return false;
    }
    return true;
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
    const chunk = BooleanArray.getChunk(index);
    const offset = BooleanArray.getChunkOffset(index);
    const mask = 1 << offset;
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
    BooleanArray.validateValue(startIndex, this.#size);
    BooleanArray.validateValue(count);
    if (startIndex + count > this.#size) {
      throw new RangeError("Range exceeds array bounds");
    }

    // Fast path for large ranges
    if (count > BooleanArray.LARGE_RANGE_THRESHOLD) {
      const fillValue = value ? BooleanArray.ALL_BITS : 0;
      this.fill(fillValue, startIndex >>> 5, (startIndex + count + 31) >>> 5);
      return this;
    }

    // Fast path for small ranges that fit in a single chunk
    if (count <= 32 && BooleanArray.getChunk(startIndex) === BooleanArray.getChunk(startIndex + count - 1)) {
      const chunk = BooleanArray.getChunk(startIndex);
      const startOffset = BooleanArray.getChunkOffset(startIndex);
      const mask = ((1 << count) - 1) << startOffset;
      this[chunk] = value ? (this[chunk]! | mask) : (this[chunk]! & ~mask);
      return this;
    }

    const startChunk = BooleanArray.getChunk(startIndex);
    const endChunk = BooleanArray.getChunk(startIndex + count - 1);

    // Handle first chunk
    const startOffset = BooleanArray.getChunkOffset(startIndex);
    const firstChunkMask = (BooleanArray.ALL_BITS << startOffset) >>> 0;
    this[startChunk] = value ? (this[startChunk]! | firstChunkMask) : (this[startChunk]! & ~firstChunkMask);

    // Fill complete chunks
    for (let i = startChunk + 1; i < endChunk; i++) {
      this[i] = value ? BooleanArray.ALL_BITS : 0;
    }

    // Handle last chunk if different from first chunk
    if (startChunk !== endChunk) {
      const remainingBits = (startIndex + count) & BooleanArray.CHUNK_MASK;
      const lastChunkMask = remainingBits === 0 ? BooleanArray.ALL_BITS : ((1 << remainingBits) - 1) >>> 0;
      this[endChunk] = value ? (this[endChunk]! | lastChunkMask) : (this[endChunk]! & ~lastChunkMask);
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
    const chunk = BooleanArray.getChunk(index);
    const offset = BooleanArray.getChunkOffset(index);
    const mask = 1 << offset;
    this[chunk]! ^= mask;
    return (this[chunk]! & mask) !== 0;
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

    const len = this.length;
    let i = BooleanArray.getChunk(startIndex);

    // Fast path for dense arrays (>75% bits set)
    if (this.getPopulationCount() > (this.#size * BooleanArray.DENSE_ARRAY_THRESHOLD)) {
      for (let index = startIndex; index < endIndex; index++) {
        if (this.getBool(index)) yield index;
      }
      return;
    }

    // Process chunks of 8 for better vectorization
    for (; i + 7 < len; i += 8) {
      for (let j = 0; j < 8; j++) {
        const chunk = this[i + j]!;
        if (chunk === 0) continue;

        const baseIndex = (i + j) << BooleanArray.CHUNK_SHIFT;
        if (chunk === BooleanArray.ALL_BITS) {
          for (let k = 0; k < BooleanArray.BITS_PER_INT; k++) {
            const index = baseIndex + k;
            if (index >= endIndex) return;
            if (index >= startIndex) yield index;
          }
          continue;
        }

        let remaining = chunk;
        while (remaining !== 0) {
          const trailingZeros = Math.clz32((remaining & -remaining) >>> 0) ^ BooleanArray.CHUNK_MASK;
          const index = baseIndex + trailingZeros;
          if (index >= endIndex) return;
          if (index >= startIndex) yield index;
          remaining &= remaining - 1;
        }
      }
    }

    // Handle remaining chunks
    for (; i < len; i++) {
      const chunk = this[i]!;
      if (chunk === 0) continue;

      const baseIndex = i << BooleanArray.CHUNK_SHIFT;
      let remaining = chunk;
      while (remaining !== 0) {
        const trailingZeros = Math.clz32((remaining & -remaining) >>> 0) ^ BooleanArray.CHUNK_MASK;
        const index = baseIndex + trailingZeros;
        if (index >= endIndex) return;
        if (index >= startIndex) yield index;
        remaining &= remaining - 1;
      }
    }
  }
}
