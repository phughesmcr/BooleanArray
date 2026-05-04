# BooleanArray

A high-performance boolean array (a.k.a. BitSet, BitField, etc.) implementation backed by Uint32Array for efficient memory usage and fast bitwise operations.

<p align="left">
  <img src="https://badgen.net/badge/license/MIT/blue" alt="MIT License" />
  <img src="https://badgen.net/badge/icon/typescript?icon=typescript&label" alt="Written in Typescript">
  <img src="https://img.shields.io/badge/deno-^2.1.0-lightgrey?logo=deno" alt="Deno version" />
  <img src="https://img.shields.io/badge/bun-%5E1.1.0-lightgrey?logo=bun" alt="Bun version" />
  <img src="https://img.shields.io/badge/node-%5E22.0.0-lightgrey?logo=node.js" alt="Node version" />
</p>

See [jsr.io/@phughesmcr/booleanarray](https://jsr.io/@phughesmcr/booleanarray) for complete documentation.

## Features

- **Memory efficient**: Stores 32 booleans per 4-byte chunk (8x more compact than a boolean array)
- **Fast bitwise operations**: AND, OR, XOR, NOT, NAND, NOR, XNOR, and set difference
- **Zero-allocation methods**: Many operations offer in-place or preallocated-buffer variants
- **Bulk operations**: `copyFrom`, `copyFromArray`, `copyFromUint8Array`, `copyFromObjects`,
  `setFromIndices`, `setFromObjects`, and range-based `set`/`get` for efficient batch processing
- **Fluent API**: Most methods return `this` for chaining
- **Iteration support**: Standard value/key/entry iterators plus zero-allocation truthy/falsy callbacks,
  cursors, and index export

## Installation

### Deno

```bash
deno add jsr:@phughesmcr/booleanarray
```

```ts
import { BooleanArray } from "@phughesmcr/booleanarray";
```

### Node

```bash
npx jsr add @phughesmcr/booleanarray
```

```ts
import { BooleanArray } from "@phughesmcr/booleanarray";
```

### Bun

```bash
bunx jsr add @phughesmcr/booleanarray
```

```ts
import { BooleanArray } from "@phughesmcr/booleanarray";
```

## Quick Start

```ts
import { BooleanArray } from "@phughesmcr/booleanarray";

// Create a boolean array with 1000 bits
const bits = new BooleanArray(1000);

// Set individual bits
bits.set(42, true);
bits.set(142, true);

// Get bit values
console.log(bits.get(42));  // true
console.log(bits.get(43));  // false

// Set ranges of bits
bits.set(100, 50, true);  // Set 50 bits starting at index 100

// Get population count (number of set bits)
console.log(bits.getCount(true));

// Iterate over set bits
for (const index of bits.truthyIndices()) {
  console.log(index);
}
```

## API Reference

### Construction

```ts
import { BooleanArray, fromArray, fromObjects, fromUint32Array, fromUint8Array } from "@phughesmcr/booleanarray";

// Create an empty array of a given size
const bits = new BooleanArray(1000);

// Create from an array of indices to set to true
const fromIndices = fromArray(100, [1, 3, 5, 7, 9]);

// Create from a boolean array
const fromBools = fromArray(5, [true, false, true, false, true]);

// Create from raw Uint32Array data
const fromBuffer = fromUint32Array(64, new Uint32Array([0xFFFFFFFF, 0x0000FFFF]));

// Create from positional 0/1 bytes
const fromBytes = fromUint8Array(5, new Uint8Array([1, 0, 1, 1, 0]));

// Reuse an existing BooleanArray for raw Uint32Array data
bits.copyFromUint32Array(new Uint32Array([0xFFFFFFFF]));
bits.copyToUint32Array(new Uint32Array(bits.wordLength));
bits.copyFromUint8Array(new Uint8Array([1, 0, 1, 0]));
bits.copyToUint8Array(new Uint8Array(bits.size));

// Reuse an existing BooleanArray for higher-level frame data
bits.copyFromArray([1, 3, 5, 7, 9]);
bits.copyFromArray([true, false, true, false, true]);

// Create from objects with a numeric key
const events = [
  { id: 0, name: "event0" },
  { id: 2, name: "event2" },
  { id: 5, name: "event5" },
];
const fromObjectsResult = fromObjects(10, "id", events);
// bits 0, 2, 5 are set to true
bits.copyFromObjects("id", events);
bits.setFromObjects("id", events);
```

### Getting & Setting Bits

```ts
import { BooleanArray, equals } from "@phughesmcr/booleanarray";

const bits = new BooleanArray(100);

// Single bit operations
bits.set(42, true);           // Set bit 42 to true
const value = bits.get(42);   // Get bit 42 → true
bits.toggle(42);              // Toggle bit 42 → now false

// Range operations
bits.set(10, 20, true);       // Set 20 bits starting at index 10
const range = bits.get(10, 5); // Get 5 bits starting at index 10 → boolean[]

// Bulk operations
bits.fill(true);              // Set all bits to true
bits.clear();                 // Set all bits to false (alias for fill(false))
```

### Zero-Allocation Methods

For performance-critical code, use preallocated buffers to avoid GC pressure:

```ts
import { BooleanArray, BooleanArrayUtils } from "@phughesmcr/booleanarray";

const bits = new BooleanArray(1000);
bits.set(0, 100, true);

// Copy values into a preallocated boolean array
const out = new Array<boolean>(50);
bits.getInto(0, 50, out);

// Copy values as 0/1 bytes into a preallocated Uint8Array
const byteOut = new Uint8Array(50);
bits.getUint8Into(0, 50, byteOut);
bits.copyFromUint8Array(byteOut);

// Copy truthy indices into a preallocated Uint32Array
const indices = new Uint32Array(100);
const count = bits.truthyIndicesInto(indices);
// 'count' is the total number found; indices[0..count-1] contains the results

// Copy falsy indices into a preallocated Uint32Array
const falsyIndices = new Uint32Array(1000);
const falsyCount = bits.falsyIndicesInto(falsyIndices);

// Iterate without allocating a generator
bits.forEachTruthy((index) => {
  console.log(`Bit ${index} is set`);
});

// Iterate over unset bits without allocation
bits.forEachFalsy((index) => {
  console.log(`Bit ${index} is unset`);
});

// Cursor-style scanning avoids generator allocation and callback dispatch
for (let index = bits.nextTruthyIndex(); index !== -1; index = bits.nextTruthyIndex(index + 1)) {
  console.log(`Bit ${index} is set`);
}

for (let index = bits.nextFalsyIndex(); index !== -1; index = bits.nextFalsyIndex(index + 1)) {
  console.log(`Bit ${index} is unset`);
}

// Iterate all bits without allocation
bits.forEach((value, index) => {
  console.log(`Bit ${index} = ${value}`);
});

// Bulk set bits from an array of indices (no intermediate allocations)
bits.setFromIndices([1, 3, 5, 7, 9], true);
bits.setFromIndices([0, 2, 4], false);

// Zero-copy bulk transfer between BooleanArrays
const source = new BooleanArray(1000);
source.fill(true);
bits.copyFrom(source);  // Copy all bits
bits.copyFrom(source, 0, 100, 50);  // Copy 50 bits from source[0] to dest[100]
source.cloneInto(bits);  // Clone into a reusable destination
bits.copyFromUint32Array(source.buffer);  // Load raw words into a reusable destination
source.copyToUint32Array(new Uint32Array(source.wordLength));  // Export raw words into a reusable buffer
bits.copyFromUint8Array(new Uint8Array([1, 0, 1, 0]));  // Load positional 0/1 bytes
bits.copyToUint8Array(new Uint8Array(bits.size));  // Export positional 0/1 bytes
bits.copyFromArray([1, 3, 5, 7, 9]);  // Replace with reusable index/boolean input
bits.copyFromObjects("id", events);  // Replace from reusable event/object input
bits.setFromObjects("id", events);  // Add or clear bits from reusable event/object input

// Reuse an output BooleanArray for bitwise operations
const other = new BooleanArray(1000);
const output = new BooleanArray(1000);
BooleanArrayUtils.andInto(bits, other, output);
BooleanArrayUtils.xorInto(bits, other, output);
```

### Bitwise Operations

All bitwise operations are available as **functions** (return new instance), **instance methods** (modify
in-place), and **into functions** (write into a preallocated output array):

```ts
import { BooleanArray, and, andInto, or, xor, not, nand, nor, xnor, difference } from "@phughesmcr/booleanarray";

const a = new BooleanArray(100);
const b = new BooleanArray(100);

// Functions - return new BooleanArray
const andResult = and(a, b);
const orResult = or(a, b);
const xorResult = xor(a, b);
const notResult = not(a);
const nandResult = nand(a, b);
const norResult = nor(a, b);
const xnorResult = xnor(a, b);
const diffResult = difference(a, b);  // a AND NOT b

// Instance methods - modify in-place, return this for chaining
a.and(b).or(b).xor(b).not();
a.nand(b).nor(b).xnor(b).difference(b);

// Into functions - write into a preallocated output array
const out = new BooleanArray(100);
andInto(a, b, out);
```

### Searching

```ts
import { BooleanArray, fromUint32Array } from "@phughesmcr/booleanarray";

const bits = new BooleanArray(100);
bits.set(10, true).set(50, true).set(90, true);

// Find first/last occurrence
bits.indexOf(true);          // → 10 (first set bit)
bits.indexOf(false);         // → 0 (first unset bit)
bits.indexOf(true, 20);      // → 50 (first set bit from index 20)

bits.lastIndexOf(true);      // → 90 (last set bit)
bits.lastIndexOf(true, 80);  // → 50 (last set bit before index 80)
```

### Inspection

```ts
const bits = new BooleanArray(100);

bits.isEmpty();              // true if no bits are set
bits.isFull();               // true if all bits are set
bits.getCount(true);         // number of set bits (population count)
bits.getCount(false);        // number of unset bits
bits.size;                   // total number of bits (100)
bits.wordLength;             // number of Uint32 chunks in buffer

// Equality check
const other = bits.clone();
bits.equals(other);          // true
equals(bits, other);         // functional version

// Allocation-free relationship queries
bits.intersects(other);      // true if any truthy bit overlaps
bits.containsAll(other);     // true if every truthy bit in other is also truthy in bits

// Index validation
bits.isSafeIndex(50);        // true if index is valid for this array
bits.assertIsSafeIndex(50);  // returns 50 or throws
```

### Iteration

```ts
const bits = new BooleanArray(10);
bits.set(1, true).set(3, true).set(7, true);

// Iterate all values
for (const value of bits) {
  console.log(value);  // false, true, false, true, false, false, false, true, false, false
}

// Iterate only set bit indices
for (const index of bits.truthyIndices()) {
  console.log(index);  // 1, 3, 7
}

// With range
for (const index of bits.truthyIndices(2, 8)) {
  console.log(index);  // 3, 7
}

// For unset-bit hot paths, prefer zero-allocation falsy APIs:
bits.forEachFalsy((index) => { /* ... */ });
const falsyCount = bits.falsyIndicesInto(new Uint32Array(bits.size));

// Array-like iteration methods
for (const [index, value] of bits.entries()) { /* ... */ }
for (const index of bits.keys()) { /* ... */ }
for (const value of bits.values()) { /* ... */ }
```

### Instance Properties

```ts
const bits = new BooleanArray(100);

bits.buffer;          // Underlying Uint32Array (direct access for zero-copy interop)
bits.size;            // Total number of bits (100)
bits.wordLength;      // Number of Uint32 chunks in buffer
bits.lastChunkMask;   // Bitmask for valid bits in last chunk
bits.bitsInLastChunk; // Number of valid bits in last chunk (0 means full chunk)
```

### Cloning & Serialization

```ts
const bits = new BooleanArray(100);

// Clone
const copy = bits.clone();

// Clone into a preallocated output array
const reusableCopy = new BooleanArray(100);
bits.cloneInto(reusableCopy);

// Access underlying buffer for serialization
const buffer = bits.buffer;  // Uint32Array

// Recreate from buffer
const restored = fromUint32Array(bits.size, buffer);

// Or reuse an existing destination
reusableCopy.copyFromUint32Array(buffer);

// Export into a reusable raw-word buffer
const reusableBuffer = new Uint32Array(bits.wordLength);
bits.copyToUint32Array(reusableBuffer);

// Export into a reusable positional byte mask
const reusableBytes = new Uint8Array(bits.size);
bits.copyToUint8Array(reusableBytes);

// String representation
console.log(bits.toString());  // Uint32Array string format
```

### Constants

```ts
import {
  BITS_PER_INT,
  CHUNK_MASK,
  CHUNK_SHIFT,
  EMPTY_ARRAY,
  MAX_SAFE_SIZE,
  MAX_UINT32,
} from "@phughesmcr/booleanarray";

BITS_PER_INT;   // 32 - bits per chunk
MAX_SAFE_SIZE;  // 536870911 - maximum array size
MAX_UINT32;     // 0xFFFFFFFF - mask with all bits set
CHUNK_MASK;     // 31 - mask for bit offset within chunk
CHUNK_SHIFT;    // 5 - shift for chunk index calculation
EMPTY_ARRAY;    // Frozen empty boolean array for zero-allocation returns
```

### Validation Utilities

```ts
import {
  assertIsSafeSize,
  assertIsSafeValue,
  getChunk,
  getChunkCount,
  getChunkOffset,
  getLSBPosition,
  isSafeSize,
  isSafeValue,
  popcount,
} from "@phughesmcr/booleanarray";

// Check if a size value is valid
isSafeSize(100);        // true
assertIsSafeSize(100);  // returns 100 or throws

// Check if an index/value is valid
isSafeValue(42);        // true
assertIsSafeValue(42);  // returns 42 or throws

// Get chunk information for an index
getChunk(42);           // chunk index for bit 42
getChunkOffset(42);     // bit offset within chunk
getChunkCount(100);     // number of chunks needed for 100 bits

// Bit manipulation utilities
popcount(0xFF00FF00);   // count set bits in a 32-bit integer (16)
getLSBPosition(8);      // position of lowest set bit (3)
```

## Performance Tips

1. **Use in-place operations** when you don't need to preserve the original:

   ```ts
   import { and } from "@phughesmcr/booleanarray";

   // Slower - allocates new array
   const result = and(a, b);
   
   // Faster - modifies a in-place
   a.and(b);
   ```

2. **Use zero-allocation iteration** in hot paths:

   ```ts
   // Allocates generator object
   for (const index of bits.truthyIndices()) { /* ... */ }
   
   // Zero allocation for set bits
   bits.forEachTruthy((index) => { /* ... */ });

   // Zero allocation for unset bits
   bits.forEachFalsy((index) => { /* ... */ });
   ```

3. **Preallocate output buffers** for repeated operations:

   ```ts
   const indices = new Uint32Array(expectedMaxCount);
   
   // Reuse the same buffer
   for (const bits of manyBitArrays) {
     const count = bits.truthyIndicesInto(indices);
     // process indices[0..count-1]
   }
   ```

4. **Use range operations** instead of loops:

   ```ts
   // Slower
   for (let i = 0; i < 1000; i++) bits.set(i, true);
   
   // Faster
   bits.set(0, 1000, true);
   ```

## Allocation Benchmarking

`deno task bench:allocations` measures GC allocation pressure across repeated rounds and reports both
before-GC growth and retained-after-GC growth. `deno task bench:allocations:check` runs the same benchmark
with budgets for the hot paths that are expected to be allocation-free in steady state.

The checked budget is currently `0.5 B/iter` for preallocated and in-place BooleanArray hot paths:

- `copyFrom` aligned and unaligned transfers, including overlapping self-copy
- `cloneInto` preallocated copies
- `copyFromUint32Array` raw-buffer loads, `copyToUint32Array` raw-buffer exports, and
  `copyFromUint8Array` / `copyToUint8Array` positional byte-mask interop
- `copyFromArray`, `copyFromObjects`, and `setFromObjects` reusable higher-level input loads
- single-bit `set`, `toggle`, and range `set`, `fill`, `clear`, and `setFromIndices` mutations
- `andInto`, `orInto`, `xorInto`, `differenceInto`, `nandInto`, `norInto`, `xnorInto`, and `notInto`
- in-place bitwise method chains
- single-bit `get`, `getInto`, `getUint8Into`, `getCount`, `isEmpty`, `isFull`, `equals`, `intersects`,
  `containsAll`, `indexOf`, `lastIndexOf`, `truthyIndicesInto`, `falsyIndicesInto`, `nextTruthyIndex`,
  `nextFalsyIndex`, and callback-based `forEach`, `forEachTruthy`, and `forEachFalsy`
- a composed game-frame scratch-buffer scenario that reuses all BooleanArray, Uint32Array, and Uint8Array
  outputs across copy, mutation, mask, query, index export, and byte export steps

The benchmark also includes built-in baselines for `boolean[]`, `Set<number>`, raw `Uint32Array` loops, and
iterator-family APIs (`values`, default iteration, `keys`, `entries`, and `truthyIndices`) so
allocation-sensitive changes can be compared against common game-state representations and ergonomic API
forms. These baselines are evidence for local tradeoffs, not a claim that every external boolean-array package
has been benchmarked.

For an external package comparison, run `deno task bench:allocations:external`. The optional
`deno task bench:allocations:external:check` variant compares local preallocated AND and membership-query
hot paths against the selected npm bitset packages (`bitset`, `fast-bitset`, `fastbitset`, `bitwise`, and
`bit-array`). It fails when local allocation is materially higher than an equivalent external scenario, treating
results under the same `0.5 B/iter` zero-allocation budget as equivalent because V8 memory measurements are
noisy. These tasks may download npm packages into Deno's cache and are not part of `deno task ci`.

V8 memory measurements are noisy, so the check warms each scenario first, then budgets the highest before-GC
result from the later steady-state rounds. Treat retained-after-GC output as supporting diagnostic data rather
than a strict pass/fail signal.

## Development

```bash
deno task ci       # Run tests, static checks, and GC allocation budget checks
deno task prep     # Format, lint, and type-check (run before commits)
deno test          # Run all tests
deno bench         # Run benchmark suite
deno task bench:allocations:check  # Fail on zero-allocation GC budget regressions
deno task bench:allocations:external  # Optional external package comparison
deno task bench:allocations:external:check  # Optional external comparison gate
deno task example  # Run usage example
```

## Contributing

Contributions are welcome! The aim of the project is performance - both in terms of speed and GC allocation pressure.

Please run `deno task ci` before committing performance-sensitive changes.

## License

BooleanArray is released under the MIT license. See `LICENSE` for further details.

&copy; 2026 The BooleanArray Authors. All rights reserved.

See `AUTHORS.md` for author details.
