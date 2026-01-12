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
- **Fluent API**: Most methods return `this` for chaining
- **Full iteration support**: Iterators, forEach, and generator methods

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
console.log(bits.getTruthyCount());

// Iterate over set bits
for (const index of bits.truthyIndices()) {
  console.log(index);
}
```

## API Reference

### Construction

```ts
// Create an empty array of a given size
const bits = new BooleanArray(1000);

// Create from an array of indices to set to true
const fromIndices = BooleanArray.fromArray(100, [1, 3, 5, 7, 9]);

// Create from a boolean array
const fromBools = BooleanArray.fromArray(5, [true, false, true, false, true]);

// Create from raw Uint32Array data
const fromBuffer = BooleanArray.fromUint32Array(64, new Uint32Array([0xFFFFFFFF, 0x0000FFFF]));

// Create from objects with a numeric key
const events = [
  { id: 0, name: "event0" },
  { id: 2, name: "event2" },
  { id: 5, name: "event5" },
];
const fromObjects = BooleanArray.fromObjects(10, "id", events);
// bits 0, 2, 5 are set to true
```

### Getting & Setting Bits

```ts
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
const bits = new BooleanArray(1000);
bits.set(0, 100, true);

// Copy values into a preallocated boolean array
const out = new Array<boolean>(50);
bits.getInto(0, 50, out);

// Copy truthy indices into a preallocated Uint32Array
const indices = new Uint32Array(100);
const count = bits.truthyIndicesInto(indices);
// 'count' is the total number found; indices[0..count-1] contains the results

// Iterate without allocating a generator
bits.forEachTruthy((index) => {
  console.log(`Bit ${index} is set`);
});

// Iterate all bits without allocation
bits.forEach((value, index) => {
  console.log(`Bit ${index} = ${value}`);
});
```

### Bitwise Operations

All bitwise operations are available as both **static methods** (return new instance) and **instance methods** (modify in-place):

```ts
const a = new BooleanArray(100);
const b = new BooleanArray(100);

// Static methods - return new BooleanArray
const andResult = BooleanArray.and(a, b);
const orResult = BooleanArray.or(a, b);
const xorResult = BooleanArray.xor(a, b);
const notResult = BooleanArray.not(a);
const nandResult = BooleanArray.nand(a, b);
const norResult = BooleanArray.nor(a, b);
const xnorResult = BooleanArray.xnor(a, b);
const diffResult = BooleanArray.difference(a, b);  // a AND NOT b

// Instance methods - modify in-place, return this for chaining
a.and(b).or(b).xor(b).not();
a.nand(b).nor(b).xnor(b).difference(b);
```

### Searching

```ts
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
bits.getTruthyCount();       // number of set bits (population count)
bits.size;                   // total number of bits (100)
bits.length;                 // number of Uint32 chunks in buffer

// Equality check
const other = bits.clone();
bits.equals(other);          // true
BooleanArray.equals(bits, other);  // static version
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

// Array-like iteration methods
for (const [index, value] of bits.entries()) { /* ... */ }
for (const index of bits.keys()) { /* ... */ }
for (const value of bits.values()) { /* ... */ }
```

### Cloning & Serialization

```ts
const bits = new BooleanArray(100);

// Clone
const copy = bits.clone();

// Access underlying buffer for serialization
const buffer = bits.buffer;  // Uint32Array

// Recreate from buffer
const restored = BooleanArray.fromUint32Array(bits.size, buffer);

// String representation
console.log(bits.toString());  // Uint32Array string format
```

### Constants

```ts
BooleanArray.BITS_PER_INT;   // 32 - bits per chunk
BooleanArray.MAX_SAFE_SIZE;  // 536870911 - maximum array size
BooleanArray.ALL_BITS_TRUE;  // 0xFFFFFFFF
BooleanArray.EMPTY_ARRAY;    // Frozen empty boolean array for zero-allocation returns
```

### Validation Utilities

```ts
// Check if a size value is valid
BooleanArray.isSafeSize(100);        // true
BooleanArray.assertIsSafeSize(100);  // returns 100 or throws

// Check if an index/value is valid
BooleanArray.isSafeValue(42);        // true
BooleanArray.assertIsSafeValue(42);  // returns 42 or throws

// Get chunk information for an index
BooleanArray.getChunk(42);           // chunk index for bit 42
BooleanArray.getChunkOffset(42);     // bit offset within chunk
BooleanArray.getChunkCount(100);     // number of chunks needed for 100 bits
```

## Performance Tips

1. **Use in-place operations** when you don't need to preserve the original:

   ```ts
   // Slower - allocates new array
   const result = BooleanArray.and(a, b);
   
   // Faster - modifies a in-place
   a.and(b);
   ```

2. **Use zero-allocation iteration** in hot paths:

   ```ts
   // Allocates generator object
   for (const index of bits.truthyIndices()) { /* ... */ }
   
   // Zero allocation
   bits.forEachTruthy((index) => { /* ... */ });
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

## Development

```bash
deno task prep     # Format, lint, and type-check (run before commits)
deno test          # Run all tests
deno bench         # Run benchmark suite
deno task example  # Run usage example
```

## Contributing

Contributions are welcome! The aim of the project is performance - both in terms of speed and GC allocation pressure.

Please run `deno test` and `deno task prep` before committing.

## License

BooleanArray is released under the MIT license. See `LICENSE` for further details.

&copy; 2026 The BooleanArray Authors. All rights reserved.

See `AUTHORS.md` for author details.
