/**
 * @module      utils
 * @description Utility functions for boolean operations
 * @copyright   2025 the BooleanArray authors. All rights reserved.
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
