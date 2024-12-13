# BooleanArray

A high-performance boolean array (a.k.a. BitSet, BitField, etc.) implementation backed by Uint32Array for efficient memory usage and fast bitwise operations.

<p align="left">
  <img src="https://badgen.net/badge/license/MIT/blue" alt="MIT License" />
  <img src="https://badgen.net/badge/icon/typescript?icon=typescript&label" alt="Written in Typescript">
  <img src="https://img.shields.io/badge/deno-^2.1.0-lightgrey?logo=deno" alt="Deno version" />
  <img src="https://img.shields.io/badge/bun-%5E1.1.0-lightgrey?logo=bun" alt="Bun version" />
  <img src="https://img.shields.io/badge/node-%5E22.0.0-lightgrey?logo=node.js" alt="Node version" />
</p>

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
bits.setBool(42, true);
bits.setBool(142, true);

// Get bit values
console.log(bits.getBool(42)); // true
console.log(bits.getBool(43)); // false

// Set ranges
bits.setRange(100, 50, true); // Set 50 bits starting at index 100

// Perform bitwise operations
const other = new BooleanArray(1000);
const result = BooleanArray.and(bits, other);

// Get population count
console.log(bits.getPopulationCount()); // Number of set bits

// Iterate over set bits
for (const index of bits.truthyIndices()) {
  console.log(index); // Prints indices of set bits
}
```

## Benchmarks

`deno bench` will run a benchmark suite.

* Runtime: Deno 2.1.4 (x86_64-pc-windows-msvc)
* CPU: AMD Ryzen 9 9900X

| Benchmark                                       | time/iter (avg) | iter/s       | (min … max)                   | p75       | p99      | p995     |
|-------------------------------------------------|-----------------|--------------|-------------------------------|-----------|----------|----------|
| truthyIndices iteration                         | 4.8 µs          | 207,300      | (4.6 µs … 6.3 µs)             | 4.7 µs    | 6.3 µs   | 6.3 µs   |
| BooleanArray creation - small (32 bits)          | 238.5 ns        | 4,194,000    | (129.1 ns … 404.3 ns)         | 348.5 ns  | 398.4 ns | 402.5 ns |
| BooleanArray creation - medium (1024 bits)       | 195.3 ns        | 5,121,000    | (149.6 ns … 474.5 ns)         | 201.3 ns  | 388.2 ns | 399.0 ns |
| BooleanArray creation - large (1M bits)          | 27.6 µs         | 36,270       | (1.9 µs … 2.1 ms)             | 24.9 µs   | 193.0 µs | 270.1 µs |
| getBool - small array                           | 3.2 ns          | 312,800,000  | (2.9 ns … 6.0 ns)             | 3.2 ns    | 3.4 ns   | 3.7 ns   |
| getBool - medium array                          | 3.2 ns          | 311,000,000  | (3.1 ns … 8.6 ns)             | 3.2 ns    | 3.5 ns   | 4.7 ns   |
| getBool - large array                           | 3.2 ns          | 312,200,000  | (3.1 ns … 20.2 ns)            | 3.2 ns    | 3.5 ns   | 3.8 ns   |
| setBool - small array                           | 3.4 ns          | 292,400,000  | (3.2 ns … 13.3 ns)            | 3.4 ns    | 5.6 ns   | 5.8 ns   |
| setBool - medium array                          | 3.4 ns          | 295,300,000  | (3.2 ns … 30.9 ns)            | 3.4 ns    | 4.6 ns   | 5.3 ns   |
| setBool - large array                           | 3.4 ns          | 291,800,000  | (3.3 ns … 33.9 ns)            | 3.4 ns    | 4.0 ns   | 4.7 ns   |
| toggleBool - small array                        | 3.4 ns          | 292,400,000  | (3.2 ns … 36.5 ns)            | 3.4 ns    | 3.8 ns   | 5.1 ns   |
| toggleBool - medium array                       | 3.4 ns          | 295,100,000  | (3.2 ns … 10.6 ns)            | 3.4 ns    | 3.7 ns   | 4.1 ns   |
| toggleBool - large array                        | 3.4 ns          | 290,900,000  | (3.4 ns … 10.4 ns)            | 3.4 ns    | 3.7 ns   | 4.7 ns   |
| setRange(32 bits) - small array                 | 6.3 ns          | 158,200,000  | (6.0 ns … 12.8 ns)            | 6.4 ns    | 6.8 ns   | 8.0 ns   |
| setRange(1024 bits) - medium array              | 12.6 ns         | 79,400,000   | (12.3 ns … 18.7 ns)           | 12.6 ns   | 14.9 ns  | 16.1 ns  |
| setRange(1M bits) - large array                 | 520.8 ns        | 1,920,000    | (511.0 ns … 545.5 ns)         | 525.0 ns  | 538.6 ns | 545.5 ns |
| getPopulationCount - small array (empty)         | 4.0 ns          | 250,300,000  | (3.8 ns … 10.7 ns)            | 4.0 ns    | 4.3 ns   | 4.7 ns   |
| getPopulationCount - small array (sparse)        | 4.0 ns          | 248,200,000  | (3.8 ns … 11.7 ns)            | 4.0 ns    | 5.0 ns   | 6.5 ns   |
| getPopulationCount - small array (dense)         | 4.0 ns          | 252,500,000  | (3.8 ns … 9.9 ns)             | 4.0 ns    | 4.3 ns   | 5.6 ns   |
| getPopulationCount - medium array (sparse)       | 82.5 ns         | 12,120,000   | (76.7 ns … 125.0 ns)          | 84.4 ns   | 119.2 ns | 120.1 ns |
| getPopulationCount - medium array (dense)        | 152.7 ns        | 6,550,000    | (132.9 ns … 404.7 ns)         | 142.4 ns  | 384.5 ns | 389.9 ns |
| getPopulationCount - large array (sparse)        | 22.6 µs         | 44,160       | (22.2 µs … 335.7 µs)          | 22.4 µs   | 28.6 µs  | 30.5 µs  |
| getPopulationCount - large array (dense)         | 22.5 µs         | 44,460       | (22.1 µs … 86.9 µs)           | 22.3 µs   | 25.5 µs  | 29.9 µs  |
| BooleanArray.and()                              | 173.3 ns        | 5,771,000    | (148.2 ns … 450.6 ns)         | 179.1 ns  | 376.2 ns | 409.6 ns |
| BooleanArray.or()                               | 287.5 ns        | 3,478,000    | (251.4 ns … 704.3 ns)         | 273.8 ns  | 629.5 ns | 704.3 ns |
| BooleanArray.xor()                              | 285.5 ns        | 3,503,000    | (258.2 ns … 902.6 ns)         | 284.1 ns  | 655.5 ns | 902.6 ns |
| truthyIndices iteration - small sparse           | 40.5 ns         | 24,680,000   | (38.5 ns … 64.5 ns)           | 43.0 ns   | 47.5 ns  | 48.2 ns  |
| truthyIndices iteration - large dense            | 8.8 ms          | 113.4        | (8.2 ms … 12.4 ms)            | 8.8 ms    | 12.4 ms  | 12.4 ms  |
| setBool - edge alignment                         | 3.5 ns          | 288,800,000  | (3.3 ns … 9.2 ns)             | 3.5 ns    | 3.8 ns   | 5.0 ns   |
| getBools - small range (32 bits)                 | 48.1 ns         | 20,800,000   | (45.5 ns … 61.4 ns)           | 47.5 ns   | 53.9 ns  | 54.7 ns  |
| getBools - medium range (256 bits)               | 422.6 ns        | 2,366,000    | (413.0 ns … 522.4 ns)         | 424.3 ns  | 490.6 ns | 522.4 ns |
| getBools - large range (1024 bits)               | 1.5 µs          | 649,400      | (1.5 µs … 1.6 µs)             | 1.5 µs    | 1.6 µs   | 1.6 µs   |
| getFirstSetIndex - empty array                   | 8.9 ns          | 113,000,000  | (8.6 ns … 37.4 ns)            | 8.8 ns    | 11.5 ns  | 14.0 ns  |
| getFirstSetIndex - first bit set                 | 2.8 ns          | 352,800,000  | (2.7 ns … 7.0 ns)             | 2.8 ns    | 3.1 ns   | 3.3 ns   |
| getFirstSetIndex - middle bit set                | 5.4 ns          | 186,400,000  | (5.1 ns … 11.3 ns)            | 5.4 ns    | 5.7 ns   | 6.3 ns   |
| getFirstSetIndex - last bit set                  | 8.3 ns          | 120,100,000  | (8.0 ns … 23.6 ns)            | 8.4 ns    | 10.1 ns  | 12.3 ns  |
| getLastSetIndex - empty array                    | 8.8 ns          | 113,100,000  | (8.3 ns … 23.5 ns)            | 8.9 ns    | 10.5 ns  | 14.1 ns  |
| getLastSetIndex - first bit set                  | 8.7 ns          | 114,500,000  | (8.4 ns … 17.9 ns)            | 8.8 ns    | 9.6 ns   | 10.7 ns  |
| getLastSetIndex - middle bit set                 | 5.8 ns          | 171,100,000  | (5.6 ns … 37.2 ns)            | 5.8 ns    | 8.5 ns   | 10.0 ns  |
| getLastSetIndex - last bit set                   | 3.0 ns          | 332,100,000  | (2.6 ns … 34.0 ns)            | 3.0 ns    | 5.6 ns   | 7.9 ns   |
| isEmpty - small empty array                      | 2.6 ns          | 381,000,000  | (2.5 ns … 24.7 ns)            | 2.6 ns    | 3.7 ns   | 4.6 ns   |
| isEmpty - large empty array                      | 16.6 µs         | 60,250       | (7.5 µs … 2.1 ms)             | 23.9 µs   | 64.6 µs  | 102.4 µs |
| isEmpty - sparse array                           | 3.0 ns          | 329,600,000  | (2.9 ns … 14.1 ns)            | 3.1 ns    | 3.4 ns   | 4.7 ns   |
| isEmpty - dense array                            | 3.0 ns          | 327,900,000  | (2.9 ns … 29.0 ns)            | 3.1 ns    | 3.3 ns   | 3.9 ns   |
| clear - small array                              | 11.3 ns         | 88,290,000   | (10.8 ns … 33.3 ns)           | 11.1 ns   | 31.1 ns  | 31.9 ns  |
| clear - medium array                             | 11.3 ns         | 88,580,000   | (10.7 ns … 23.9 ns)           | 11.2 ns   | 15.0 ns  | 20.7 ns  |
| clear - large array                              | 521.5 ns        | 1,918,000    | (516.7 ns … 553.9 ns)         | 521.6 ns  | 534.7 ns | 553.9 ns |
| clone - small array                              | 147.4 ns        | 6,786,000    | (127.0 ns … 338.6 ns)         | 153.4 ns  | 254.8 ns | 288.2 ns |
| clone - medium array                             | 165.6 ns        | 6,039,000    | (138.3 ns … 415.4 ns)         | 171.9 ns  | 360.0 ns | 410.4 ns |
| clone - large array                              | 26.0 µs         | 38,460       | (4.9 µs … 2.0 ms)             | 38.9 µs   | 146.2 µs | 256.1 µs |
| truthyIndices - no range specified | 177.6 µs | 5,629 | (170.3 µs … 297.4 µs) | 176.9 µs | 230.4 µs | 244.2 µs |
| truthyIndices - small range (100 bits) | 23.5 µs | 42,640 | (22.2 µs … 69.7 µs) | 23.5 µs | 26.5 µs | 29.2 µs |
| truthyIndices - medium range (10,000 bits) | 24.8 µs | 40,380 | (23.6 µs … 184.7 µs) | 25.0 µs | 29.4 µs | 50.4 µs |
| truthyIndices - large range (100,000 bits) | 37.4 µs | 26,720 | (36.6 µs … 172.8 µs) | 37.3 µs | 40.7 µs | 47.6 µs |
| truthyIndices - range at start | 22.6 µs | 44,290 | (22.3 µs … 198.0 µs) | 22.5 µs | 25.2 µs | 27.9 µs |
| truthyIndices - range in middle | 23.5 µs | 42,570 | (22.4 µs … 218.1 µs) | 23.6 µs | 26.4 µs | 27.1 µs |
| truthyIndices - range at end | 23.1 µs | 43,280 | (22.3 µs … 324.9 µs) | 23.5 µs | 26.7 µs | 29.8 µs |
| truthyIndices - sparse range (1% set) | 4.0 µs | 250,900 | (3.8 µs … 5.0 µs) | 4.0 µs | 5.0 µs | 5.0 µs |
| truthyIndices - medium range (50% set) | 52.7 µs | 18,990 | (48.8 µs … 216.6 µs) | 51.1 µs | 103.3 µs | 159.3 µs |
| truthyIndices - dense range (99% set) | 100.4 µs | 9,958 | (88.5 µs … 367.8 µs) | 93.5 µs | 278.4 µs | 297.0 µs |

## Contributing

Contributions are welcome. The aim of the project is performance - both in terms of speed and GC allocation pressure.

Please run `deno test` and `deno task prep` to run the tests before committing.

## License

BooleanArray is released under the MIT license. See `LICENSE` for further details.

&copy; 2024 The BooleanArray Authors. All rights reserved.

See `AUTHORS.md` for author details.
