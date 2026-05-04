/**
 * @description A boolean array backed by a Uint32Array.
 * @copyright   2026 the BooleanArray authors. All rights reserved.
 * @license     MIT
 * @module      BooleanArray
 */

import { BooleanArray } from "./src/boolean-array.ts";
import { ALL_BITS_TRUE, CHUNK_MASK, CHUNK_SHIFT, EMPTY_ARRAY } from "./src/constants.ts";
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
  fromUint8Array: typeof fromUint8Array;
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
  fromUint8Array,
  getChunk,
  getChunkCount,
  getChunkOffset,
  getLSBPosition,
  popcount,
}) as typeof BooleanArray & BooleanArrayStatics;

export {
  ALL_BITS_TRUE,
  and,
  andInto,
  assertIsSafeSize,
  assertIsSafeValue,
  BooleanArrayExport as BooleanArray,
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
export default { BooleanArray: BooleanArrayExport, BooleanArrayUtils };
