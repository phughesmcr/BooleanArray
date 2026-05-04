import { BooleanArray } from "./boolean-array.ts";
import { CHUNK_MASK, CHUNK_SHIFT } from "./constants.ts";
import { getChunkCount } from "./internal.ts";
import { assertIsSafeSize, assertIsSafeValue } from "./validation.ts";

/**
 * Create a BooleanArray from an array of booleans or indices.
 * @param size The size of the BooleanArray
 * @param arr If boolean[]: values are copied by position; if number[]: each value is an index to set to true
 * @returns A new BooleanArray instance
 * @throws {RangeError} If `size` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
 * @throws {TypeError} If `size` is not a safe value
 * @throws {TypeError} If `arr` is not an array
 * @throws {RangeError} If `arr.length` is larger than `size`
 * @see {@link assertIsSafeValue}
 *
 * @example
 * Creates a BooleanArray with 10 bits, setting the odd bits to true
 * ```ts
 * const arr = [1,3,5,7,9]; // indices in the array are set to true
 * const boolArray = fromArray(10, arr);
 * console.log(boolArray.get(0)); // false
 * console.log(boolArray.get(1)); // true
 * ```
 */
export function fromArray(size: number, arr: Array<number | boolean>): BooleanArray {
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
      const chunk = i >>> CHUNK_SHIFT;
      const mask = 1 << (i & CHUNK_MASK);
      pool.buffer[chunk]! |= bit ? mask : 0;
    }
  } else if (typeof arr[0] === "number") {
    for (let i = 0; i < arr.length; i++) {
      const bit = arr[i]! as number;
      if (assertIsSafeValue(bit) >= size) {
        throw new RangeError(`Index ${bit} is out of bounds for array size ${size}.`);
      }
      const chunk = bit >>> CHUNK_SHIFT;
      const mask = 1 << (bit & CHUNK_MASK);
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
 * @throws {RangeError} If `arr.length` exceeds the expected buffer length (smaller arrays are zero-padded)
 * @throws {TypeError} If `arr` is not an ArrayLike<number>
 * @see {@link assertIsSafeValue}
 * @note Arrays smaller than the expected buffer length are automatically zero-padded
 */
export function fromUint32Array(size: number, arr: ArrayLike<number>): BooleanArray {
  assertIsSafeSize(size);
  if (arr == null || typeof arr.length !== "number") {
    throw new TypeError('"arr" must be an ArrayLike<number> (e.g., Uint32Array or number[]).');
  }
  // Reject strings explicitly (they have .length but aren't numeric arrays)
  if (typeof arr === "string") {
    throw new TypeError('"arr" must be an ArrayLike<number>, not a string.');
  }

  const expectedBufferLength = getChunkCount(size);
  if (arr.length > expectedBufferLength) {
    throw new RangeError(
      `Input array length (${arr.length}) exceeds expected buffer length (${expectedBufferLength}) for a BooleanArray of size ${size}. Smaller arrays are zero-padded, but larger arrays would lose data.`,
    );
  }

  for (let i = 0; i < arr.length; i++) {
    assertIsSafeValue(arr[i] as number);
  }

  const pool = new BooleanArray(size); // Creates a zeroed buffer of the correct length
  pool.buffer.set(arr); // Copies content from arr to pool.buffer

  // Ensure unused bits in the last chunk are zeroed out
  if (pool.bitsInLastChunk > 0) {
    pool.buffer[pool.wordLength - 1]! &= pool.lastChunkMask;
  }

  return pool;
}

/**
 * Create a BooleanArray from an object array, using the object's key values as bit indices.
 * @param size The size of the BooleanArray
 * @param key The key of the object to create the BooleanArray from
 * @param objs The array of objects to create the BooleanArray from
 * @returns A new BooleanArray instance
 * @throws {TypeError} If `objs` is not an array
 * @throws {TypeError} If `key` is null or undefined
 * @throws {RangeError} If `size` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
 * @throws {TypeError} If `size` is not a safe value
 * @throws {TypeError} If any object's key value is not a safe integer
 * @throws {RangeError} If any object's key value is out of bounds
 * @see {@link assertIsSafeValue}
 *
 * @example
 * ```ts
 * const events = [
 *   { name: "setActive", entity: 0 },
 *   { name: "setActive", entity: 2 },
 * ]
 * const boolArray = fromObjects(10, "entity", events);
 * console.log(boolArray.get(0)); // true
 * console.log(boolArray.get(1)); // false
 * console.log(boolArray.get(2)); // true
 * ```
 */
export function fromObjects<T>(size: number, key: keyof T, objs: T[]): BooleanArray {
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
    if (assertIsSafeValue(index) >= size) {
      throw new RangeError(`Index ${index} is out of bounds for array size ${size}.`);
    }
    const chunk = index >>> CHUNK_SHIFT;
    const mask = 1 << (index & CHUNK_MASK);
    result.buffer[chunk]! |= mask;
  }
  return result;
}
