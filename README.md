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

## Installation

### Node

```bash
npx jsr add @phughesmcr/booleanarray
```

```ts
import { BooleanArray } from "@phughesmcr/booleanarray";
```

### Deno

```bash
deno add jsr:@phughesmcr/booleanarray
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

## Usage

`deno task example` will run a complete example.

```ts
// Create a boolean array with 1000 bits
const bits = new BooleanArray(1000);

// Set individual bits
bits.set(42, true);
bits.set(142, true);

// Get bit values
console.log(bits.get(42)); // true
console.log(bits.get(43)); // false

// Set ranges
bits.set(100, 50, true); // Set 50 bits starting at index 100

// Perform bitwise operations
const other = new BooleanArray(1000);
other.set(1, true).and(bits).xor(bits); // chaining!
const result = BooleanArray.and(bits, other);
// or in-place
other.and(result);

// Get population count
console.log(bits.getTruthyCount()); // Number of set bits

// Iterate over set bits
for (const index of bits.truthyIndices()) {
  console.log(index); // Prints indices of set bits
}
```

## Benchmarks

`deno bench` will run a benchmark suite.

## Contributing

Contributions are welcome. The aim of the project is performance - both in terms of speed and GC allocation pressure.

Please run `deno test` and `deno task prep` to run the tests before committing.

## License

BooleanArray is released under the MIT license. See `LICENSE` for further details.

&copy; 2025 The BooleanArray Authors. All rights reserved.

See `AUTHORS.md` for author details.
