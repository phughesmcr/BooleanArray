/// <reference lib="deno.ns" />
/// <reference lib="dom" />

/**
 * @module      micro.bench
 * @description Micro-optimization benchmarks.
 * @copyright   2025 the BooleanArray authors. All rights reserved.
 * @license     MIT
 */

/**
 * Constant access is faster than static access on average but max time is consistently higher.
 *
 *     CPU | Apple M4 Pro
 * Runtime | Deno 2.3.3 (aarch64-apple-darwin)
 *
 * benchmark   time/iter (avg)        iter/s      (min … max)           p75      p99     p995
 * ----------- ----------------------------- --------------------- --------------------------
 *
 * group access
 * Constant             3.9 ns   258,100,000 (  3.2 ns …  16.1 ns)   3.9 ns   4.6 ns   5.1 ns
 * Static               3.7 ns   273,900,000 (  3.4 ns …  10.3 ns)   3.9 ns   4.2 ns   4.6 ns
 *
 * summary
 *   Static
 *      1.06x faster than Constant
 */

class XY {
  static VALUE = 5;
}

Deno.bench({
  name: "Constant",
  group: "access",
  n: 1000000000,
  warmup: 100000000,
  fn: () => {
    1 >>> 5;
  },
});

Deno.bench({
  name: "Static",
  group: "access",
  n: 1000000000,
  warmup: 100000000,
  fn: () => {
    1 >>> XY.VALUE;
  },
});

/**
 * No difference between cached and lookup.
 *
 * group loop
 * Cached              22.3 µs        44,760 ( 22.1 µs … 135.6 µs)  22.2 µs  28.4 µs  30.5 µs
 * Lookup              22.3 µs        44,800 ( 22.1 µs … 160.8 µs)  22.2 µs  27.8 µs  30.3 µs
 *
 * summary
 *   Lookup
 *      1.00x faster than Cached
 */

Deno.bench({
  name: "Cached",
  group: "loop",
  n: 1_000_000,
  warmup: 100_000,
  fn: () => {
    const value = XY.VALUE;
    for (let i = 0; i < 100_000; i++) {
      1 >>> value;
    }
  },
});

Deno.bench({
  name: "Lookup",
  group: "loop",
  n: 1_000_000,
  warmup: 100_000,
  baseline: true,
  fn: () => {
    for (let i = 0; i < 100_000; i++) {
      1 >>> XY.VALUE;
    }
  },
});
