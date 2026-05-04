import { BooleanArray } from "./boolean-array.ts";

/**
 * Create a BooleanArray from an array of booleans or indices.
 * @param size The size of the BooleanArray
 * @param arr If boolean[]: values are copied by position; if number[]: each value is an index to set to true
 * @returns A new BooleanArray instance
 * @throws {RangeError} If `size` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
 * @throws {TypeError} If `size` is not a safe value
 * @throws {TypeError} If `arr` is not an ArrayLike<number | boolean>
 * @throws {RangeError} If a boolean input is longer than `size`, or if any numeric index is out of bounds
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
export function fromArray(size: number, arr: ArrayLike<number | boolean>): BooleanArray {
  if (arr == null || typeof arr.length !== "number") {
    throw new TypeError('"arr" must be an ArrayLike<number | boolean>.');
  }
  if (typeof arr === "string") {
    throw new TypeError('"arr" must be an ArrayLike<number | boolean>, not a string.');
  }
  return new BooleanArray(size).copyFromArray(arr);
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
  if (arr == null || typeof arr.length !== "number") {
    throw new TypeError('"arr" must be an ArrayLike<number> (e.g., Uint32Array or number[]).');
  }
  if (typeof arr === "string") {
    throw new TypeError('"arr" must be an ArrayLike<number>, not a string.');
  }
  return new BooleanArray(size).copyFromUint32Array(arr);
}

/**
 * Create a BooleanArray from positional 0/1 bytes.
 * @param size The size of the BooleanArray
 * @param arr The ArrayLike of 0/1 byte values to create the BooleanArray from
 * @returns A new BooleanArray instance
 * @throws {RangeError} If `size` is less than 1, or is greater than BooleanArray.MAX_SAFE_SIZE
 * @throws {TypeError} If `size` is not a safe value
 * @throws {RangeError} If `arr.length` exceeds `size` (smaller arrays are zero-padded)
 * @throws {TypeError} If `arr` is not an ArrayLike<number>
 * @throws {RangeError} If any byte value is not 0 or 1
 * @note Arrays smaller than `size` are automatically zero-padded
 */
export function fromUint8Array(size: number, arr: ArrayLike<number>): BooleanArray {
  if (arr == null || typeof arr.length !== "number") {
    throw new TypeError('"arr" must be an ArrayLike<0 | 1> (e.g., Uint8Array or number[]).');
  }
  if (typeof arr === "string") {
    throw new TypeError('"arr" must be an ArrayLike<0 | 1>, not a string.');
  }
  return new BooleanArray(size).copyFromUint8Array(arr);
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
  return new BooleanArray(size).copyFromObjects(key, objs);
}
