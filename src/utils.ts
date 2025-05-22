/**
 * @module      utils
 * @description Utility functions for boolean operations
 * @copyright   2025 the BooleanArray authors. All rights reserved.
 * @license     MIT
 */

/**
 * Utility function to check if a value is invalid
 * @param n the value to check
 * @returns true if the value is invalid, false otherwise
 */
export function invalidNumber(n: number): boolean {
  return typeof n !== "number" || isNaN(n);
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
