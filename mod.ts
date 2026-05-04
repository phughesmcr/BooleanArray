/**
 * @description A boolean array backed by a Uint32Array.
 * @copyright   2026 the BooleanArray authors. All rights reserved.
 * @license     MIT
 * @module      BooleanArray
 */

import { BooleanArray } from "./src/boolean-array.ts";
import {
  ALL_BITS_TRUE,
  BITS_PER_INT,
  CHUNK_MASK,
  CHUNK_SHIFT,
  EMPTY_ARRAY,
  MAX_SAFE_SIZE,
  MAX_UINT32,
} from "./src/constants.ts";
import { fromArray, fromObjects, fromUint32Array, fromUint8Array } from "./src/constructors.ts";
import { getChunk, getChunkCount, getChunkOffset, getLSBPosition, popcount } from "./src/internal.ts";
import {
  and,
  andInto,
  containsAll,
  difference,
  differenceInto,
  equals,
  intersects,
  nand,
  nandInto,
  nor,
  norInto,
  not,
  notInto,
  or,
  orInto,
  xnor,
  xnorInto,
  xor,
  xorInto,
} from "./src/operations.ts";
import { assertIsSafeSize, assertIsSafeValue, isSafeSize, isSafeValue } from "./src/validation.ts";

/** Utility namespace for BooleanArray factory functions, operations, validation helpers, and constants. */
const BooleanArrayUtils = {
  assertIsSafeSize,
  assertIsSafeValue,
  isSafeSize,
  isSafeValue,
  fromArray,
  fromObjects,
  fromUint32Array,
  fromUint8Array,
  and,
  andInto,
  containsAll,
  difference,
  differenceInto,
  equals,
  intersects,
  nand,
  nandInto,
  nor,
  norInto,
  not,
  notInto,
  or,
  orInto,
  xnor,
  xnorInto,
  xor,
  xorInto,
  getChunk,
  getChunkCount,
  getChunkOffset,
  getLSBPosition,
  popcount,
  ALL_BITS_TRUE,
  BITS_PER_INT,
  CHUNK_MASK,
  CHUNK_SHIFT,
  EMPTY_ARRAY,
  MAX_SAFE_SIZE,
  MAX_UINT32,
} as const;

/** Default export for consumers that prefer namespace-style imports. */
const defaultExport = { BooleanArray, BooleanArrayUtils } as const;

export {
  ALL_BITS_TRUE,
  and,
  andInto,
  assertIsSafeSize,
  assertIsSafeValue,
  BITS_PER_INT,
  BooleanArray,
  BooleanArrayUtils,
  CHUNK_MASK,
  CHUNK_SHIFT,
  containsAll,
  difference,
  differenceInto,
  EMPTY_ARRAY,
  equals,
  fromArray,
  fromObjects,
  fromUint32Array,
  fromUint8Array,
  getChunk,
  getChunkCount,
  getChunkOffset,
  getLSBPosition,
  intersects,
  isSafeSize,
  isSafeValue,
  MAX_SAFE_SIZE,
  MAX_UINT32,
  nand,
  nandInto,
  nor,
  norInto,
  not,
  notInto,
  or,
  orInto,
  popcount,
  xnor,
  xnorInto,
  xor,
  xorInto,
};
export default defaultExport;
