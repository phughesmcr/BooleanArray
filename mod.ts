/**
 * @description A boolean array backed by a Uint32Array.
 * @copyright   2026 the BooleanArray authors. All rights reserved.
 * @license     MIT
 * @module      BooleanArray
 */

import { BooleanArray } from "./src/boolean-array.ts";
import { ALL_BITS_TRUE, CHUNK_MASK, CHUNK_SHIFT, EMPTY_ARRAY } from "./src/constants.ts";
import { fromArray, fromObjects, fromUint32Array } from "./src/constructors.ts";
import { getChunk, getChunkCount, getChunkOffset, getLSBPosition, popcount } from "./src/internal.ts";
import { and, difference, equals, nand, nor, not, or, xnor, xor } from "./src/operations.ts";
import { assertIsSafeSize, assertIsSafeValue, isSafeSize, isSafeValue } from "./src/validation.ts";

const BooleanArrayUtils = {
  assertIsSafeSize,
  assertIsSafeValue,
  isSafeSize,
  isSafeValue,
  fromArray,
  fromObjects,
  fromUint32Array,
  and,
  difference,
  equals,
  nand,
  nor,
  not,
  or,
  xnor,
  xor,
  getChunk,
  getChunkCount,
  getChunkOffset,
  getLSBPosition,
  popcount,
  ALL_BITS_TRUE,
  CHUNK_MASK,
  CHUNK_SHIFT,
  EMPTY_ARRAY,
};

type BooleanArrayStatics = {
  assertIsSafeSize: typeof assertIsSafeSize;
  assertIsSafeValue: typeof assertIsSafeValue;
  isSafeSize: typeof isSafeSize;
  isSafeValue: typeof isSafeValue;
  fromArray: typeof fromArray;
  fromObjects: typeof fromObjects;
  fromUint32Array: typeof fromUint32Array;
  getChunk: typeof getChunk;
  getChunkCount: typeof getChunkCount;
  getChunkOffset: typeof getChunkOffset;
  getLSBPosition: typeof getLSBPosition;
  popcount: typeof popcount;
};

const BooleanArrayExport = Object.assign(BooleanArray, {
  assertIsSafeSize,
  assertIsSafeValue,
  isSafeSize,
  isSafeValue,
  fromArray,
  fromObjects,
  fromUint32Array,
  getChunk,
  getChunkCount,
  getChunkOffset,
  getLSBPosition,
  popcount,
}) as typeof BooleanArray & BooleanArrayStatics;

export {
  ALL_BITS_TRUE,
  and,
  assertIsSafeSize,
  assertIsSafeValue,
  BooleanArrayExport as BooleanArray,
  BooleanArrayUtils,
  CHUNK_MASK,
  CHUNK_SHIFT,
  difference,
  EMPTY_ARRAY,
  equals,
  fromArray,
  fromObjects,
  fromUint32Array,
  getChunk,
  getChunkCount,
  getChunkOffset,
  getLSBPosition,
  isSafeSize,
  isSafeValue,
  nand,
  nor,
  not,
  or,
  popcount,
  xnor,
  xor,
};
export default { BooleanArray: BooleanArrayExport, BooleanArrayUtils };
