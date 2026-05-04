import { MAX_SAFE_SIZE, MAX_UINT32, MIN_SIZE, MIN_UINT32 } from "./constants.ts";

/**
 * Assert that a value is a safe Uint32Array size.
 * @param size the size value to validate
 * @returns the validated size value
 * @throws {TypeError} if `size` is not a safe integer
 * @throws {RangeError} if `size` is less than 1, or greater than BooleanArray.MAX_SAFE_SIZE
 */
export function assertIsSafeSize(size: number): number {
  if (size === MAX_SAFE_SIZE) return size;
  if (!Number.isSafeInteger(size)) {
    throw new TypeError('"size" must be a safe integer.');
  } else if (size < MIN_SIZE) {
    throw new RangeError('"size" must be greater than or equal to 1.');
  } else if (size > MAX_SAFE_SIZE) {
    throw new RangeError('"size" must be less than or equal to BooleanArray.MAX_SAFE_SIZE.');
  }
  return size;
}

/**
 * Check if a size value is safe.
 * @param size the size value to validate
 * @returns `true` if the size value is safe, `false` otherwise
 */
export function isSafeSize(size: number): boolean {
  if (size === MAX_SAFE_SIZE) return true;
  if (!Number.isSafeInteger(size)) return false;
  return size >= MIN_SIZE && size <= MAX_SAFE_SIZE;
}

/**
 * Assert that a value is a safe Uint32Array value.
 * @param value the value to validate
 * @returns the validated value
 * @throws {TypeError} if `value` is not a safe integer
 * @throws {RangeError} if `value` is less than 0, or greater than 0xFFFFFFFF
 */
export function assertIsSafeValue(value: number): number {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError('"value" must be a safe integer.');
  } else if (value < MIN_UINT32) {
    throw new RangeError('"value" must be greater than or equal to 0.');
  } else if (value > MAX_UINT32) {
    throw new RangeError('"value" must be less than or equal to 0xFFFFFFFF.');
  }
  return value;
}

/**
 * Check if a value is a safe Uint32Array value.
 * @param value the value to validate
 * @returns `true` if the value is valid, `false` otherwise
 */
export function isSafeValue(value: number): boolean {
  if (!Number.isSafeInteger(value) || value < MIN_UINT32 || value > MAX_UINT32) return false;
  return true;
}
