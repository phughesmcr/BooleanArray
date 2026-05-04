/** The number of bits per chunk */
export const BITS_PER_INT = 32 as const;

/** The mask for the chunk offset */
export const CHUNK_MASK = 31 as const;

/** The shift for the chunk offset */
export const CHUNK_SHIFT = 5 as const;

/** The minimum value for a Uint32 */
export const MIN_UINT32 = 0 as const;

/** The mask for all bits (~0 >>> 0) (also Uint32Array MAX_VALUE) */
export const MAX_UINT32 = 4294967295 as const; // 0xFFFFFFFF

/** Alias for MAX_UINT32 for boolean bit masks */
export const ALL_BITS_TRUE = MAX_UINT32;

/** An empty array of booleans */
export const EMPTY_ARRAY: readonly boolean[] = Object.freeze([]);

/** The minimum size for a boolean array */
export const MIN_SIZE = 1 as const;

/** The maximum safe size for bit operations */
export const MAX_SAFE_SIZE = 536870911 as const; // Math.floor((2 ** 32 - 1) / 8);
