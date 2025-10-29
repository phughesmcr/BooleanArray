/**
 * @description Bindings for bitwise operations on BooleanArrays.
 * @copyright   2025 the BooleanArray authors. All rights reserved.
 * @license     MIT
 * @module
 */

import type { BooleanArray } from "./boolean-array.ts";
import { binaryOperation, unaryOperation } from "./utils.ts";

/**
 * Bitwise AND operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export const and = binaryOperation.bind(null, (a, b) => a & b);

/**
 * Bitwise difference operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export const difference = binaryOperation.bind(null, (a, b) => a & ~b);

/**
 * Bitwise NAND operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export const nand = binaryOperation.bind(null, (a, b) => ~(a & b));

/**
 * Bitwise NOR operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export const nor = binaryOperation.bind(null, (a, b) => ~(a | b));

/**
 * Bitwise NOT operation
 * @param a the BooleanArray to perform NOT on
 * @param inPlace whether the operation should be performed in-place
 * @returns a BooleanArray with the result
 */
export const not = unaryOperation.bind(null, (a) => ~a);

/**
 * Bitwise OR operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export const or = binaryOperation.bind(null, (a, b) => a | b);

/**
 * Bitwise XOR operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export const xor = binaryOperation.bind(null, (a, b) => a ^ b);

/**
 * Bitwise XNOR operation
 * @param inPlace whether the operation should be performed in-place on `a`
 * @returns a BooleanArray with the result
 * @throws {RangeError} if `a` and `b` have different sizes
 */
export const xnor = binaryOperation.bind(null, (a, b) => ~(a ^ b));

/**
 * Check if two BooleanArrays are equal
 * @returns true if the arrays are equal, false otherwise
 */
export function equals(a: BooleanArray, b: BooleanArray): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (let i = 0; i < a.buffer.length; i++) {
    if (a.buffer[i]! !== b.buffer[i]!) {
      return false;
    }
  }
  return true;
}
