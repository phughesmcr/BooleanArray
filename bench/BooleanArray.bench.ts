/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { BooleanArray } from "../mod.ts";

// Add before benchmarks
const warmupArray = new BooleanArray(1024);
for (let i = 0; i < 1000; i++) {
  warmupArray.set(i, true);
  warmupArray.get(i);
  warmupArray.toggle(i);
}

// Creation benchmarks
Deno.bench({
  name: "BooleanArray creation - small (32 bits)",
  group: "creation",
  baseline: true,
  fn: () => {
    new BooleanArray(32);
  },
});

Deno.bench({
  name: "BooleanArray creation - medium (1024 bits)",
  group: "creation",
  fn: () => {
    new BooleanArray(1024);
  },
});

Deno.bench({
  name: "BooleanArray creation - large (1M bits)",
  group: "creation",
  fn: () => {
    new BooleanArray(1_000_000);
  },
});

// Single bit operations
const smallArray = new BooleanArray(32);
const mediumArray = new BooleanArray(1024);
const largeArray = new BooleanArray(1_000_000);

// get benchmarks
Deno.bench({
  name: "get - small array",
  group: "get",
  baseline: true,
  fn: () => {
    smallArray.get(16);
  },
});

Deno.bench({
  name: "get - medium array",
  group: "get",
  fn: () => {
    mediumArray.get(512);
  },
});

Deno.bench({
  name: "get - large array",
  group: "get",
  fn: () => {
    largeArray.get(500_000);
  },
});

// set benchmarks
Deno.bench({
  name: "set - small array",
  group: "set",
  baseline: true,
  fn: () => {
    smallArray.set(16, true);
  },
});

Deno.bench({
  name: "set - medium array",
  group: "set",
  fn: () => {
    mediumArray.set(512, true);
  },
});

Deno.bench({
  name: "set - large array",
  group: "set",
  fn: () => {
    largeArray.set(500_000, true);
  },
});

// toggle benchmarks
Deno.bench({
  name: "toggle - small array",
  group: "toggle",
  baseline: true,
  fn: () => {
    smallArray.toggle(16);
  },
});

Deno.bench({
  name: "toggle - medium array",
  group: "toggle",
  fn: () => {
    mediumArray.toggle(512);
  },
});

Deno.bench({
  name: "toggle - large array",
  group: "toggle",
  fn: () => {
    largeArray.toggle(500_000);
  },
});

// Bulk operations
Deno.bench({
  name: "set(32 bits) - small array",
  group: "set",
  baseline: true,
  fn: () => {
    smallArray.set(0, 32, true);
  },
});

Deno.bench({
  name: "set(1024 bits) - medium array",
  group: "set",
  fn: () => {
    mediumArray.set(0, 1024, true);
  },
});

Deno.bench({
  name: "set(1M bits) - large array",
  group: "set",
  fn: () => {
    largeArray.set(0, 1_000_000, true);
  },
});

// Population count setup
const emptySmallArray = new BooleanArray(32);

const sparseSmallArray = new BooleanArray(32);
sparseSmallArray.set(0, true);
sparseSmallArray.set(31, true);

const denseSmallArray = new BooleanArray(32);
denseSmallArray.fill(true);

const sparseMediumArray = new BooleanArray(1024);
for (let i = 0; i < 32; i++) {
  sparseMediumArray.set(i * 32, true);
}

const denseMediumArray = new BooleanArray(1024);
denseMediumArray.fill(true);

const sparseLargeArray = new BooleanArray(1_000_000);
for (let i = 0; i < 1000; i++) {
  sparseLargeArray.set(i * 1000, true);
}

const denseLargeArray = new BooleanArray(1_000_000);
denseLargeArray.fill(true);

// Population count benchmarks
Deno.bench({
  name: "getPopulationCount - small array (empty)",
  group: "population",
  baseline: true,
  fn: () => {
    emptySmallArray.getTruthyCount();
  },
});

Deno.bench({
  name: "getPopulationCount - small array (sparse)",
  group: "population",
  fn: () => {
    sparseSmallArray.getTruthyCount();
  },
});

Deno.bench({
  name: "getPopulationCount - small array (dense)",
  group: "population",
  fn: () => {
    denseSmallArray.getTruthyCount();
  },
});

Deno.bench({
  name: "getPopulationCount - medium array (sparse)",
  group: "population",
  fn: () => {
    sparseMediumArray.getTruthyCount();
  },
});

Deno.bench({
  name: "getPopulationCount - medium array (dense)",
  group: "population",
  fn: () => {
    denseMediumArray.getTruthyCount();
  },
});

Deno.bench({
  name: "getPopulationCount - large array (sparse)",
  group: "population",
  fn: () => {
    sparseLargeArray.getTruthyCount();
  },
});

Deno.bench({
  name: "getPopulationCount - large array (dense)",
  group: "population",
  fn: () => {
    denseLargeArray.getTruthyCount();
  },
});

// Bitwise operations
const a = new BooleanArray(1024);
const b = new BooleanArray(1024);

// Setup some patterns
a.set(0, 512, true);
b.set(256, 512, true);

Deno.bench({
  name: "BooleanArray.and()",
  group: "bitwise",
  baseline: true,
  fn: () => {
    BooleanArray.and(a, b);
  },
});

Deno.bench({
  name: "BooleanArray.or()",
  group: "bitwise",
  fn: () => {
    BooleanArray.or(a, b);
  },
});

Deno.bench({
  name: "BooleanArray.xor()",
  group: "bitwise",
  fn: () => {
    BooleanArray.xor(a, b);
  },
});

Deno.bench({
  name: "BooleanArray.nand()",
  group: "bitwise",
  fn: () => {
    BooleanArray.nand(a, b);
  },
});

Deno.bench({
  name: "BooleanArray.nor()",
  group: "bitwise",
  fn: () => {
    BooleanArray.nor(a, b);
  },
});

Deno.bench({
  name: "BooleanArray.not()",
  group: "bitwise",
  fn: () => {
    BooleanArray.not(a);
  },
});

Deno.bench({
  name: "BooleanArray.xnor()",
  group: "bitwise",
  fn: () => {
    BooleanArray.xnor(a, b);
  },
});

// Iteration
const iterArray = new BooleanArray(1024);
for (let i = 0; i < 1024; i += 2) {
  iterArray.set(i, true);
}

Deno.bench({
  name: "truthyIndices iteration",
  fn: () => {
    for (const _index of iterArray.truthyIndices()) {
      // Just iterate
    }
  },
});

// Add different sizes and densities for iteration
Deno.bench({
  name: "truthyIndices iteration - small sparse",
  group: "iteration",
  baseline: true,
  fn: () => {
    for (const _index of sparseSmallArray.truthyIndices()) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "truthyIndices iteration - large dense",
  group: "iteration",
  fn: () => {
    for (const _index of denseLargeArray.truthyIndices()) {
      // Just iterate
    }
  },
});

// Test edge cases
const edgeArray = new BooleanArray(33); // Non-aligned size
Deno.bench({
  name: "set - edge alignment",
  group: "edge-cases",
  fn: () => {
    edgeArray.set(32, true);
  },
});

// Setup arrays with different patterns for get/set index tests
const emptyIndexArray = new BooleanArray(1024);

const firstSetArray = new BooleanArray(1024);
firstSetArray.set(0, true);

const lastSetArray = new BooleanArray(1024);
lastSetArray.set(1023, true);

const middleSetArray = new BooleanArray(1024);
middleSetArray.set(512, true);

// get benchmarks
Deno.bench({
  name: "get - small range (32 bits)",
  group: "get",
  baseline: true,
  fn: () => {
    mediumArray.get(0, 32);
  },
});

Deno.bench({
  name: "get - medium range (256 bits)",
  group: "get",
  fn: () => {
    mediumArray.get(256, 256);
  },
});

Deno.bench({
  name: "get - large range (1024 bits)",
  group: "get",
  fn: () => {
    largeArray.get(0, 1024);
  },
});

// getFirstSetIndex benchmarks
Deno.bench({
  name: "getFirstSetIndex - empty array",
  group: "getFirstSetIndex",
  baseline: true,
  fn: () => {
    emptyIndexArray.indexOf(true);
  },
});

Deno.bench({
  name: "getFirstSetIndex - first bit set",
  group: "getFirstSetIndex",
  fn: () => {
    firstSetArray.indexOf(true);
  },
});

Deno.bench({
  name: "getFirstSetIndex - middle bit set",
  group: "getFirstSetIndex",
  fn: () => {
    middleSetArray.indexOf(true);
  },
});

Deno.bench({
  name: "getFirstSetIndex - last bit set",
  group: "getFirstSetIndex",
  fn: () => {
    lastSetArray.indexOf(true);
  },
});

// getLastSetIndex benchmarks
Deno.bench({
  name: "getLastSetIndex - empty array",
  group: "getLastSetIndex",
  baseline: true,
  fn: () => {
    emptyIndexArray.lastIndexOf(true);
  },
});

Deno.bench({
  name: "getLastSetIndex - first bit set",
  group: "getLastSetIndex",
  fn: () => {
    firstSetArray.lastIndexOf(true);
  },
});

Deno.bench({
  name: "getLastSetIndex - middle bit set",
  group: "getLastSetIndex",
  fn: () => {
    middleSetArray.lastIndexOf(true);
  },
});

Deno.bench({
  name: "getLastSetIndex - last bit set",
  group: "getLastSetIndex",
  fn: () => {
    lastSetArray.lastIndexOf(true);
  },
});

// isEmpty benchmarks
Deno.bench({
  name: "isEmpty - small empty array",
  group: "isEmpty",
  baseline: true,
  fn: () => {
    emptySmallArray.isEmpty();
  },
});

Deno.bench({
  name: "isEmpty - large empty array",
  group: "isEmpty",
  fn: () => {
    new BooleanArray(1_000_000).isEmpty();
  },
});

Deno.bench({
  name: "isEmpty - sparse array",
  group: "isEmpty",
  fn: () => {
    sparseMediumArray.isEmpty();
  },
});

Deno.bench({
  name: "isEmpty - dense array",
  group: "isEmpty",
  fn: () => {
    denseMediumArray.isEmpty();
  },
});

// clear benchmarks
const clearSmallArray = new BooleanArray(32);
const clearMediumArray = new BooleanArray(1024);
const clearLargeArray = new BooleanArray(1_000_000);

clearSmallArray.fill(true);
clearMediumArray.fill(true);
clearLargeArray.fill(true);

Deno.bench({
  name: "clear - small array",
  group: "clear",
  baseline: true,
  fn: () => {
    clearSmallArray.fill(false);
  },
});

Deno.bench({
  name: "clear - medium array",
  group: "clear",
  fn: () => {
    clearMediumArray.fill(false);
  },
});

Deno.bench({
  name: "clear - large array",
  group: "clear",
  fn: () => {
    clearLargeArray.fill(false);
  },
});

// clone benchmarks
Deno.bench({
  name: "clone - small array",
  group: "clone",
  baseline: true,
  fn: () => {
    smallArray.clone();
  },
});

Deno.bench({
  name: "clone - medium array",
  group: "clone",
  fn: () => {
    mediumArray.clone();
  },
});

Deno.bench({
  name: "clone - large array",
  group: "clone",
  fn: () => {
    largeArray.clone();
  },
});

// Setup arrays for range iteration benchmarks
const rangeArray = new BooleanArray(1_000_000);
for (let i = 0; i < 1_000_000; i += 100) {
  rangeArray.set(i, true);
}

// truthyIndices range benchmarks
Deno.bench({
  name: "truthyIndices - no range specified",
  group: "truthyIndices-range",
  baseline: true,
  fn: () => {
    for (const _index of rangeArray.truthyIndices()) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "truthyIndices - small range (100 bits)",
  group: "truthyIndices-range",
  fn: () => {
    for (const _index of rangeArray.truthyIndices(0, 100)) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "truthyIndices - medium range (10,000 bits)",
  group: "truthyIndices-range",
  fn: () => {
    for (const _index of rangeArray.truthyIndices(0, 10_000)) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "truthyIndices - large range (100,000 bits)",
  group: "truthyIndices-range",
  fn: () => {
    for (const _index of rangeArray.truthyIndices(0, 100_000)) {
      // Just iterate
    }
  },
});

// Test different range positions
Deno.bench({
  name: "truthyIndices - range at start",
  group: "truthyIndices-position",
  baseline: true,
  fn: () => {
    for (const _index of rangeArray.truthyIndices(0, 1000)) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "truthyIndices - range in middle",
  group: "truthyIndices-position",
  fn: () => {
    for (const _index of rangeArray.truthyIndices(500_000, 501_000)) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "truthyIndices - range at end",
  group: "truthyIndices-position",
  fn: () => {
    for (const _index of rangeArray.truthyIndices(999_000, 1_000_000)) {
      // Just iterate
    }
  },
});

// Test different densities within ranges
const sparseRangeArray = new BooleanArray(100_000);
const mediumRangeArray = new BooleanArray(100_000);
const denseRangeArray = new BooleanArray(100_000);

// Set up different densities (1%, 50%, 99% of bits set)
for (let i = 0; i < 100_000; i++) {
  if (i % 100 === 0) sparseRangeArray.set(i, true);
  if (i % 2 === 0) mediumRangeArray.set(i, true);
  if (i % 100 !== 0) denseRangeArray.set(i, true);
}

Deno.bench({
  name: "truthyIndices - sparse range (1% set)",
  group: "truthyIndices-density",
  baseline: true,
  fn: () => {
    for (const _index of sparseRangeArray.truthyIndices(0, 10_000)) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "truthyIndices - medium range (50% set)",
  group: "truthyIndices-density",
  fn: () => {
    for (const _index of mediumRangeArray.truthyIndices(0, 10_000)) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "truthyIndices - dense range (99% set)",
  group: "truthyIndices-density",
  fn: () => {
    for (const _index of denseRangeArray.truthyIndices(0, 10_000)) {
      // Just iterate
    }
  },
});

// Setup arrays for equals and difference benchmarks
const emptyA = new BooleanArray(1024);
const emptyB = new BooleanArray(1024);

const sparseA = new BooleanArray(1024);
const sparseB = new BooleanArray(1024);
for (let i = 0; i < 1024; i += 32) {
  sparseA.set(i, true);
  sparseB.set(i, true);
}

const denseA = new BooleanArray(1024);
const denseB = new BooleanArray(1024);
denseA.fill(true);
denseB.fill(true);

const diffA = new BooleanArray(1024);
const diffB = new BooleanArray(1024);
diffA.set(0, 512, true);
diffB.set(256, 768, true);

// Large arrays for scaling tests
const largeA = new BooleanArray(1_000_000);
const largeB = new BooleanArray(1_000_000);
for (let i = 0; i < 1_000_000; i += 1000) {
  largeA.set(i, true);
  largeB.set(i, true);
}

// equals benchmarks
Deno.bench({
  name: "equals - empty arrays",
  group: "equals",
  baseline: true,
  fn: () => {
    BooleanArray.equals(emptyA, emptyB);
  },
});

Deno.bench({
  name: "equals - sparse arrays (identical)",
  group: "equals",
  fn: () => {
    BooleanArray.equals(sparseA, sparseB);
  },
});

Deno.bench({
  name: "equals - dense arrays (identical)",
  group: "equals",
  fn: () => {
    BooleanArray.equals(denseA, denseB);
  },
});

Deno.bench({
  name: "equals - arrays with differences",
  group: "equals",
  fn: () => {
    BooleanArray.equals(diffA, diffB);
  },
});

Deno.bench({
  name: "equals - large arrays (1M bits)",
  group: "equals",
  fn: () => {
    BooleanArray.equals(largeA, largeB);
  },
});

// difference benchmarks
Deno.bench({
  name: "difference - empty arrays",
  group: "difference",
  baseline: true,
  fn: () => {
    BooleanArray.difference(emptyA, emptyB);
  },
});

Deno.bench({
  name: "difference - sparse arrays (identical)",
  group: "difference",
  fn: () => {
    BooleanArray.difference(sparseA, sparseB);
  },
});

Deno.bench({
  name: "difference - dense arrays (identical)",
  group: "difference",
  fn: () => {
    BooleanArray.difference(denseA, denseB);
  },
});

Deno.bench({
  name: "difference - arrays with partial overlap",
  group: "difference",
  fn: () => {
    BooleanArray.difference(diffA, diffB);
  },
});

Deno.bench({
  name: "difference - large arrays (1M bits)",
  group: "difference",
  fn: () => {
    BooleanArray.difference(largeA, largeB);
  },
});

// Edge cases
const edgeCaseA = new BooleanArray(33); // Non-aligned size
const edgeCaseB = new BooleanArray(33);
edgeCaseA.set(32, true);
edgeCaseB.set(32, true);

Deno.bench({
  name: "equals - non-aligned size",
  group: "equals-edge",
  fn: () => {
    BooleanArray.equals(edgeCaseA, edgeCaseB);
  },
});

Deno.bench({
  name: "difference - non-aligned size",
  group: "difference-edge",
  fn: () => {
    BooleanArray.difference(edgeCaseA, edgeCaseB);
  },
});

// Setup arrays for getFirstSetIndex with startIndex benchmarks
const startIndexArray = new BooleanArray(1_000_000);
for (let i = 0; i < 1_000_000; i += 1000) {
  startIndexArray.set(i, true);
}

const denseStartIndexArray = new BooleanArray(1_000_000);
denseStartIndexArray.fill(true);

const chunkBoundaryArray = new BooleanArray(1024);
chunkBoundaryArray.set(31, true);
chunkBoundaryArray.set(32, true);
chunkBoundaryArray.set(63, true);
chunkBoundaryArray.set(64, true);

// getFirstSetIndex with startIndex benchmarks
Deno.bench({
  name: "indexOf(true, startIndex) - start of array",
  group: "getFirstSetIndex-start",
  baseline: true,
  fn: () => {
    startIndexArray.indexOf(true, 0);
  },
});

Deno.bench({
  name: "indexOf(true, startIndex) - middle of array",
  group: "getFirstSetIndex-start",
  fn: () => {
    startIndexArray.indexOf(true, 500_000);
  },
});

Deno.bench({
  name: "indexOf(true, startIndex) - end of array",
  group: "getFirstSetIndex-start",
  fn: () => {
    startIndexArray.indexOf(true, 999_000);
  },
});

// Test with different densities
Deno.bench({
  name: "indexOf(true, startIndex) - sparse array",
  group: "getFirstSetIndex-density",
  baseline: true,
  fn: () => {
    startIndexArray.indexOf(true, 500_000);
  },
});

Deno.bench({
  name: "indexOf(true, startIndex) - dense array",
  group: "getFirstSetIndex-density",
  fn: () => {
    denseStartIndexArray.indexOf(true, 500_000);
  },
});

// Test chunk boundary cases
Deno.bench({
  name: "indexOf(true, startIndex) - at chunk boundary",
  group: "getFirstSetIndex-boundary",
  baseline: true,
  fn: () => {
    chunkBoundaryArray.indexOf(true, 31);
  },
});

Deno.bench({
  name: "indexOf(true, startIndex) - across chunk boundary",
  group: "getFirstSetIndex-boundary",
  fn: () => {
    chunkBoundaryArray.indexOf(true, 32);
  },
});

// Test with different array sizes
Deno.bench({
  name: "indexOf(true, startIndex) - small array (32 bits)",
  group: "getFirstSetIndex-size",
  baseline: true,
  fn: () => {
    sparseSmallArray.indexOf(true, 16);
  },
});

Deno.bench({
  name: "indexOf(true, startIndex) - medium array (1024 bits)",
  group: "getFirstSetIndex-size",
  fn: () => {
    sparseMediumArray.indexOf(true, 512);
  },
});

Deno.bench({
  name: "indexOf(true, startIndex) - large array (1M bits)",
  group: "getFirstSetIndex-size",
  fn: () => {
    startIndexArray.indexOf(true, 500_000);
  },
});

// Setup arrays for getLastSetIndex with startIndex benchmarks
const lastIndexArray = new BooleanArray(1_000_000);
for (let i = 0; i < 1_000_000; i += 1000) {
  lastIndexArray.set(i, true);
}

const denseLastIndexArray = new BooleanArray(1_000_000);
denseLastIndexArray.fill(true);

const lastIndexBoundaryArray = new BooleanArray(1024);
lastIndexBoundaryArray.set(31, true);
lastIndexBoundaryArray.set(32, true);
lastIndexBoundaryArray.set(63, true);
lastIndexBoundaryArray.set(64, true);

// getLastSetIndex with startIndex benchmarks
Deno.bench({
  name: "lastIndexOf(true, startIndex) - end of array",
  group: "getLastSetIndex-start",
  baseline: true,
  fn: () => {
    lastIndexArray.lastIndexOf(true, 1_000_000);
  },
});

Deno.bench({
  name: "lastIndexOf(true, startIndex) - middle of array",
  group: "getLastSetIndex-start",
  fn: () => {
    lastIndexArray.lastIndexOf(true, 500_000);
  },
});

Deno.bench({
  name: "lastIndexOf(true, startIndex) - start of array",
  group: "getLastSetIndex-start",
  fn: () => {
    lastIndexArray.lastIndexOf(true, 1000);
  },
});

// Test with different densities
Deno.bench({
  name: "lastIndexOf(true, startIndex) - sparse array",
  group: "getLastSetIndex-density",
  baseline: true,
  fn: () => {
    lastIndexArray.lastIndexOf(true, 500_000);
  },
});

Deno.bench({
  name: "lastIndexOf(true, startIndex) - dense array",
  group: "getLastSetIndex-density",
  fn: () => {
    denseLastIndexArray.lastIndexOf(true, 500_000);
  },
});

// Test chunk boundary cases
Deno.bench({
  name: "lastIndexOf(true, startIndex) - at chunk boundary",
  group: "getLastSetIndex-boundary",
  baseline: true,
  fn: () => {
    lastIndexBoundaryArray.lastIndexOf(true, 32);
  },
});

Deno.bench({
  name: "lastIndexOf(true, startIndex) - across chunk boundary",
  group: "getLastSetIndex-boundary",
  fn: () => {
    lastIndexBoundaryArray.lastIndexOf(true, 33);
  },
});

// Test with different array sizes
Deno.bench({
  name: "lastIndexOf(true, startIndex) - small array (32 bits)",
  group: "getLastSetIndex-size",
  baseline: true,
  fn: () => {
    sparseSmallArray.lastIndexOf(true, 16);
  },
});

Deno.bench({
  name: "lastIndexOf(true, startIndex) - medium array (1024 bits)",
  group: "getLastSetIndex-size",
  fn: () => {
    sparseMediumArray.lastIndexOf(true, 512);
  },
});

Deno.bench({
  name: "lastIndexOf(true, startIndex) - large array (1M bits)",
  group: "getLastSetIndex-size",
  fn: () => {
    lastIndexArray.lastIndexOf(true, 500_000);
  },
});

// fromArray benchmarks setup
const smallIndices = [0, 15, 31];
const mediumIndices = Array.from({ length: 32 }, (_, i) => i * 32);
const largeIndices = Array.from({ length: 1000 }, (_, i) => i * 1000);
const denseIndices = Array.from({ length: 1000 }, (_, i) => i);

// fromArray benchmarks
Deno.bench({
  name: "fromArray - small sparse array (3 bits)",
  group: "fromArray",
  baseline: true,
  fn: () => {
    BooleanArray.fromArray(32, smallIndices);
  },
});

Deno.bench({
  name: "fromArray - medium sparse array (32 bits)",
  group: "fromArray",
  fn: () => {
    BooleanArray.fromArray(1024, mediumIndices);
  },
});

Deno.bench({
  name: "fromArray - large sparse array (1000 bits)",
  group: "fromArray",
  fn: () => {
    BooleanArray.fromArray(1_000_000, largeIndices);
  },
});

Deno.bench({
  name: "fromArray - dense consecutive indices (1000 bits)",
  group: "fromArray",
  fn: () => {
    BooleanArray.fromArray(1_000_000, denseIndices);
  },
});

// Test different patterns
const randomIndices = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1_000_000));
const clusterIndices = Array.from({ length: 1000 }, (_, i) => Math.floor(i / 10) * 100 + (i % 10));

Deno.bench({
  name: "fromArray - random indices (1000 bits)",
  group: "fromArray-patterns",
  baseline: true,
  fn: () => {
    BooleanArray.fromArray(1_000_000, randomIndices);
  },
});

Deno.bench({
  name: "fromArray - clustered indices (1000 bits)",
  group: "fromArray-patterns",
  fn: () => {
    BooleanArray.fromArray(1_000_000, clusterIndices);
  },
});

// Test different array sizes with same density
const size1k = Array.from({ length: 100 }, (_, i) => i * 10);
const size10k = Array.from({ length: 1000 }, (_, i) => i * 10);
const size100k = Array.from({ length: 10000 }, (_, i) => i * 10);
const size1m = Array.from({ length: 100000 }, (_, i) => i * 10);

Deno.bench({
  name: "fromArray - 1K size (10% density)",
  group: "fromArray-scaling",
  baseline: true,
  fn: () => {
    BooleanArray.fromArray(1000, size1k);
  },
});

Deno.bench({
  name: "fromArray - 10K size (10% density)",
  group: "fromArray-scaling",
  fn: () => {
    BooleanArray.fromArray(10_000, size10k);
  },
});

Deno.bench({
  name: "fromArray - 100K size (10% density)",
  group: "fromArray-scaling",
  fn: () => {
    BooleanArray.fromArray(100_000, size100k);
  },
});

Deno.bench({
  name: "fromArray - 1M size (10% density)",
  group: "fromArray-scaling",
  fn: () => {
    BooleanArray.fromArray(1_000_000, size1m);
  },
});

// Test edge cases
const edgeCaseIndices = [31, 32, 63, 64]; // Chunk boundaries
const maxSizeIndices = [0, BooleanArray.MAX_SAFE_SIZE - 2, BooleanArray.MAX_SAFE_SIZE - 1];

Deno.bench({
  name: "fromArray - chunk boundary indices",
  group: "fromArray-edge",
  baseline: true,
  fn: () => {
    BooleanArray.fromArray(100, edgeCaseIndices);
  },
});

Deno.bench({
  name: "fromArray - maximum safe size",
  group: "fromArray-edge",
  fn: () => {
    BooleanArray.fromArray(BooleanArray.MAX_SAFE_SIZE, maxSizeIndices);
  },
});

// Compare with alternative methods
const comparisonIndices = Array.from({ length: 1000 }, (_, i) => i * 100);

Deno.bench({
  name: "fromArray - direct creation",
  group: "fromArray-comparison",
  baseline: true,
  fn: () => {
    BooleanArray.fromArray(100_000, comparisonIndices);
  },
});

Deno.bench({
  name: "manual set - equivalent operation",
  group: "fromArray-comparison",
  fn: () => {
    const array = new BooleanArray(100_000);
    for (const index of comparisonIndices) {
      array.set(index, true);
    }
  },
});

// Test sorted vs unsorted input
const sortedIndices = Array.from({ length: 1000 }, (_, i) => i * 10);
const unsortedIndices = [...sortedIndices].sort(() => Math.random() - 0.5);

Deno.bench({
  name: "fromArray - sorted indices",
  group: "fromArray-sorting",
  baseline: true,
  fn: () => {
    BooleanArray.fromArray(10_000, sortedIndices);
  },
});

Deno.bench({
  name: "fromArray - unsorted indices",
  group: "fromArray-sorting",
  fn: () => {
    BooleanArray.fromArray(10_000, unsortedIndices);
  },
});

// fromObjects benchmarks setup
const smallObjects = [
  { id: 0 },
  { id: 15 },
  { id: 31 },
];

const mediumObjects = Array.from({ length: 32 }, (_, i) => ({ pos: i * 32 }));
const largeObjects = Array.from({ length: 1000 }, (_, i) => ({ idx: i * 1000 }));
const denseObjects = Array.from({ length: 1000 }, (_, i) => ({ val: i }));

// Basic fromObjects benchmarks
Deno.bench({
  name: "fromObjects - small sparse array (3 objects)",
  group: "fromObjects",
  baseline: true,
  fn: () => {
    BooleanArray.fromObjects<{ id: number }>(32, "id", smallObjects);
  },
});

Deno.bench({
  name: "fromObjects - medium sparse array (32 objects)",
  group: "fromObjects",
  fn: () => {
    BooleanArray.fromObjects<{ pos: number }>(1024, "pos", mediumObjects);
  },
});

Deno.bench({
  name: "fromObjects - large sparse array (1000 objects)",
  group: "fromObjects",
  fn: () => {
    BooleanArray.fromObjects<{ idx: number }>(1_000_000, "idx", largeObjects);
  },
});

Deno.bench({
  name: "fromObjects - dense consecutive indices (1000 objects)",
  group: "fromObjects",
  fn: () => {
    BooleanArray.fromObjects<{ val: number }>(1_000_000, "val", denseObjects);
  },
});

// Test different object patterns
const randomObjects = Array.from(
  { length: 1000 },
  () => ({ value: Math.floor(Math.random() * 1_000_000) }),
);

const clusterObjects = Array.from(
  { length: 1000 },
  (_, i) => ({ value: Math.floor(i / 10) * 100 + (i % 10) }),
);

Deno.bench({
  name: "fromObjects - random indices (1000 objects)",
  group: "fromObjects-patterns",
  baseline: true,
  fn: () => {
    BooleanArray.fromObjects<{ value: number }>(1_000_000, "value", randomObjects);
  },
});

Deno.bench({
  name: "fromObjects - clustered indices (1000 objects)",
  group: "fromObjects-patterns",
  fn: () => {
    BooleanArray.fromObjects<{ value: number }>(1_000_000, "value", clusterObjects);
  },
});

// Test different array sizes with same density (10%)
const objects1k = Array.from({ length: 100 }, (_, i) => ({ n: i * 10 }));
const objects10k = Array.from({ length: 1000 }, (_, i) => ({ n: i * 10 }));
const objects100k = Array.from({ length: 10000 }, (_, i) => ({ n: i * 10 }));
const objects1m = Array.from({ length: 100000 }, (_, i) => ({ n: i * 10 }));

Deno.bench({
  name: "fromObjects - 1K size (10% density)",
  group: "fromObjects-scaling",
  baseline: true,
  fn: () => {
    BooleanArray.fromObjects<{ n: number }>(1000, "n", objects1k);
  },
});

Deno.bench({
  name: "fromObjects - 10K size (10% density)",
  group: "fromObjects-scaling",
  fn: () => {
    BooleanArray.fromObjects<{ n: number }>(10_000, "n", objects10k);
  },
});

Deno.bench({
  name: "fromObjects - 100K size (10% density)",
  group: "fromObjects-scaling",
  fn: () => {
    BooleanArray.fromObjects<{ n: number }>(100_000, "n", objects100k);
  },
});

Deno.bench({
  name: "fromObjects - 1M size (10% density)",
  group: "fromObjects-scaling",
  fn: () => {
    BooleanArray.fromObjects<{ n: number }>(1_000_000, "n", objects1m);
  },
});

// Test edge cases
const edgeCaseObjects = [
  { pos: 31 },
  { pos: 32 },
  { pos: 63 },
  { pos: 64 },
]; // Chunk boundaries

const maxSizeObjects = [
  { pos: 0 },
  { pos: BooleanArray.MAX_SAFE_SIZE - 2 },
  { pos: BooleanArray.MAX_SAFE_SIZE - 1 },
];

Deno.bench({
  name: "fromObjects - chunk boundary indices",
  group: "fromObjects-edge",
  baseline: true,
  fn: () => {
    BooleanArray.fromObjects<{ pos: number }>(100, "pos", edgeCaseObjects);
  },
});

Deno.bench({
  name: "fromObjects - maximum safe size",
  group: "fromObjects-edge",
  fn: () => {
    BooleanArray.fromObjects<{ pos: number }>(
      BooleanArray.MAX_SAFE_SIZE,
      "pos",
      maxSizeObjects,
    );
  },
});

// Compare with alternative methods
const comparisonObjects = Array.from(
  { length: 1000 },
  (_, i) => ({ index: i * 100 }),
);

Deno.bench({
  name: "fromObjects - direct creation",
  group: "fromObjects-comparison",
  baseline: true,
  fn: () => {
    BooleanArray.fromObjects<{ index: number }>(100_000, "index", comparisonObjects);
  },
});

Deno.bench({
  name: "manual set - equivalent operation",
  group: "fromObjects-comparison",
  fn: () => {
    const array = new BooleanArray(100_000);
    for (const obj of comparisonObjects) {
      array.set(obj.index, true);
    }
  },
});

// Test sorted vs unsorted input
const sortedObjects = Array.from({ length: 1000 }, (_, i) => ({ val: i * 10 }));
const unsortedObjects = [...sortedObjects].sort(() => Math.random() - 0.5);

Deno.bench({
  name: "fromObjects - sorted indices",
  group: "fromObjects-sorting",
  baseline: true,
  fn: () => {
    BooleanArray.fromObjects<{ val: number }>(10_000, "val", sortedObjects);
  },
});

Deno.bench({
  name: "fromObjects - unsorted indices",
  group: "fromObjects-sorting",
  fn: () => {
    BooleanArray.fromObjects<{ val: number }>(10_000, "val", unsortedObjects);
  },
});

// Test objects with multiple properties
interface ComplexObject {
  id: number;
  name: string;
  value: number;
}

const simpleObjects = Array.from(
  { length: 1000 },
  (_, i) => ({ id: i }),
);

const complexObjects = Array.from(
  { length: 1000 },
  (_, i) => ({
    id: i,
    name: `item-${i}`,
    value: i * 2,
  }),
);

Deno.bench({
  name: "fromObjects - simple objects (single property)",
  group: "fromObjects-complexity",
  baseline: true,
  fn: () => {
    BooleanArray.fromObjects<{ id: number }>(1000, "id", simpleObjects);
  },
});

Deno.bench({
  name: "fromObjects - complex objects (multiple properties)",
  group: "fromObjects-complexity",
  fn: () => {
    BooleanArray.fromObjects<ComplexObject>(1000, "id", complexObjects);
  },
});

// Test with duplicate indices
const uniqueObjects = Array.from(
  { length: 1000 },
  (_, i) => ({ id: i }),
);

const duplicateObjects = Array.from(
  { length: 1000 },
  (_, i) => ({ id: Math.floor(i / 2) }), // Each index appears twice
);

Deno.bench({
  name: "fromObjects - unique indices",
  group: "fromObjects-duplicates",
  baseline: true,
  fn: () => {
    BooleanArray.fromObjects<{ id: number }>(1000, "id", uniqueObjects);
  },
});

Deno.bench({
  name: "fromObjects - duplicate indices",
  group: "fromObjects-duplicates",
  fn: () => {
    BooleanArray.fromObjects<{ id: number }>(1000, "id", duplicateObjects);
  },
});

// Instance vs Static method comparison for bitwise operations
const instanceA = new BooleanArray(1024);
const instanceB = new BooleanArray(1024);

// Setup some patterns for instance methods
instanceA.set(0, 512, true);
instanceB.set(256, 512, true);

Deno.bench({
  name: "instance.and() - in-place",
  group: "instance-bitwise",
  baseline: true,
  fn: () => {
    const a = instanceA.clone();
    a.and(instanceB);
  },
});

Deno.bench({
  name: "instance.or() - in-place",
  group: "instance-bitwise",
  fn: () => {
    const a = instanceA.clone();
    a.or(instanceB);
  },
});

Deno.bench({
  name: "instance.xor() - in-place",
  group: "instance-bitwise",
  fn: () => {
    const a = instanceA.clone();
    a.xor(instanceB);
  },
});

Deno.bench({
  name: "instance.nand() - in-place",
  group: "instance-bitwise",
  fn: () => {
    const a = instanceA.clone();
    a.nand(instanceB);
  },
});

Deno.bench({
  name: "instance.nor() - in-place",
  group: "instance-bitwise",
  fn: () => {
    const a = instanceA.clone();
    a.nor(instanceB);
  },
});

Deno.bench({
  name: "instance.not() - in-place",
  group: "instance-bitwise",
  fn: () => {
    const a = instanceA.clone();
    a.not();
  },
});

Deno.bench({
  name: "instance.xnor() - in-place",
  group: "instance-bitwise",
  fn: () => {
    const a = instanceA.clone();
    a.xnor(instanceB);
  },
});

Deno.bench({
  name: "instance.difference() - in-place",
  group: "instance-bitwise",
  fn: () => {
    const a = instanceA.clone();
    a.difference(instanceB);
  },
});

// forEachBool benchmarks
const forEachTestArray = new BooleanArray(10_000);
for (let i = 0; i < 10_000; i += 10) {
  forEachTestArray.set(i, true);
}

const forEachEmptyArray = new BooleanArray(10_000);
const forEachDenseArray = new BooleanArray(10_000);
forEachDenseArray.fill(true);

Deno.bench({
  name: "forEach - sparse array (10% set)",
  group: "forEach",
  baseline: true,
  fn: () => {
    forEachTestArray.forEach((_value, _index) => {
      // Just iterate
    });
  },
});

Deno.bench({
  name: "forEach - empty array",
  group: "forEach",
  fn: () => {
    forEachEmptyArray.forEach((_value, _index) => {
      // Just iterate
    });
  },
});

Deno.bench({
  name: "forEach - dense array (100% set)",
  group: "forEach",
  fn: () => {
    forEachDenseArray.forEach((_value, _index) => {
      // Just iterate
    });
  },
});

Deno.bench({
  name: "forEach - partial range (1000 elements)",
  group: "forEach",
  fn: () => {
    forEachTestArray.forEach(
      (_value, _index) => {
        // Just iterate
      },
      1000,
      1000,
    );
  },
});

// setAll benchmarks
const fillSmallArray = new BooleanArray(32);
const fillMediumArray = new BooleanArray(1024);
const fillLargeArray = new BooleanArray(1_000_000);

Deno.bench({
  name: "fill - small array",
  group: "fill",
  baseline: true,
  fn: () => {
    fillSmallArray.fill(true);
  },
});

Deno.bench({
  name: "fill - medium array",
  group: "fill",
  fn: () => {
    fillMediumArray.fill(true);
  },
});

Deno.bench({
  name: "fill - large array",
  group: "fill",
  fn: () => {
    fillLargeArray.fill(true);
  },
});

// In-place vs Copy operation benchmarks
const copyTestA = new BooleanArray(1024);
const copyTestB = new BooleanArray(1024);
copyTestA.set(0, 512, true);
copyTestB.set(256, 768, true);

Deno.bench({
  name: "BooleanArray.and() - copy operation",
  group: "inPlace-comparison",
  baseline: true,
  fn: () => {
    BooleanArray.and(copyTestA, copyTestB);
  },
});

Deno.bench({
  name: "BooleanArray.and() - in-place operation",
  group: "inPlace-comparison",
  fn: () => {
    const a = copyTestA.clone();
    a.and(copyTestB);
  },
});

Deno.bench({
  name: "BooleanArray.or() - copy operation",
  group: "inPlace-comparison",
  fn: () => {
    BooleanArray.or(copyTestA, copyTestB);
  },
});

Deno.bench({
  name: "BooleanArray.or() - in-place operation",
  group: "inPlace-comparison",
  fn: () => {
    const a = copyTestA.clone();
    a.or(copyTestB);
  },
});

Deno.bench({
  name: "BooleanArray.not() - copy operation",
  group: "inPlace-comparison",
  fn: () => {
    BooleanArray.not(copyTestA);
  },
});

Deno.bench({
  name: "BooleanArray.not() - in-place operation",
  group: "inPlace-comparison",
  fn: () => {
    const a = copyTestA.clone();
    a.not();
  },
});

// Utility method benchmarks
Deno.bench({
  name: "BooleanArray.getChunk() - various indices",
  group: "utility-methods",
  baseline: true,
  fn: () => {
    BooleanArray.getChunk(0);
    BooleanArray.getChunk(31);
    BooleanArray.getChunk(32);
    BooleanArray.getChunk(1023);
    BooleanArray.getChunk(1024);
  },
});

Deno.bench({
  name: "BooleanArray.getChunkOffset() - various indices",
  group: "utility-methods",
  fn: () => {
    BooleanArray.getChunkOffset(0);
    BooleanArray.getChunkOffset(15);
    BooleanArray.getChunkOffset(31);
    BooleanArray.getChunkOffset(32);
    BooleanArray.getChunkOffset(1023);
  },
});

Deno.bench({
  name: "BooleanArray.getChunkCount() - various sizes",
  group: "utility-methods",
  fn: () => {
    BooleanArray.getChunkCount(1);
    BooleanArray.getChunkCount(32);
    BooleanArray.getChunkCount(33);
    BooleanArray.getChunkCount(1024);
    BooleanArray.getChunkCount(1_000_000);
  },
});

Deno.bench({
  name: "BooleanArray.assertIsSafeValue() - valid values",
  group: "utility-methods",
  fn: () => {
    BooleanArray.assertIsSafeValue(0);
    BooleanArray.assertIsSafeValue(100);
    BooleanArray.assertIsSafeValue(1024);
    BooleanArray.assertIsSafeValue(BooleanArray.MAX_SAFE_SIZE - 1);
  },
});

Deno.bench({
  name: "BooleanArray.isSafeValue() - valid values",
  group: "utility-methods",
  fn: () => {
    BooleanArray.isSafeValue(0);
    BooleanArray.isSafeValue(100);
    BooleanArray.isSafeValue(1024);
    BooleanArray.isSafeValue(BooleanArray.MAX_SAFE_SIZE - 1);
  },
});

// Edge case size benchmarks
const maxSizeArray = new BooleanArray(BooleanArray.MAX_SAFE_SIZE);

Deno.bench({
  name: "MAX_SAFE_SIZE array creation",
  group: "edge-cases-size",
  baseline: true,
  fn: () => {
    new BooleanArray(BooleanArray.MAX_SAFE_SIZE);
  },
});

Deno.bench({
  name: "MAX_SAFE_SIZE array - set",
  group: "edge-cases-size",
  fn: () => {
    maxSizeArray.set(BooleanArray.MAX_SAFE_SIZE - 1, true);
  },
});

Deno.bench({
  name: "MAX_SAFE_SIZE array - get",
  group: "edge-cases-size",
  fn: () => {
    maxSizeArray.get(BooleanArray.MAX_SAFE_SIZE - 1);
  },
});

Deno.bench({
  name: "MAX_SAFE_SIZE array - isEmpty",
  group: "edge-cases-size",
  fn: () => {
    maxSizeArray.isEmpty();
  },
});

// Iterator benchmarks
const iteratorTestArray = new BooleanArray(10_000);
for (let i = 0; i < 10_000; i += 10) {
  iteratorTestArray.set(i, true);
}

const iteratorEmptyArray = new BooleanArray(10_000);
const iteratorDenseArray = new BooleanArray(10_000);
iteratorDenseArray.fill(true);

// Symbol.iterator benchmarks
Deno.bench({
  name: "Symbol.iterator - sparse array (10% set)",
  group: "Symbol.iterator",
  baseline: true,
  fn: () => {
    for (const _value of iteratorTestArray) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "Symbol.iterator - empty array",
  group: "Symbol.iterator",
  fn: () => {
    for (const _value of iteratorEmptyArray) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "Symbol.iterator - dense array (100% set)",
  group: "Symbol.iterator",
  fn: () => {
    for (const _value of iteratorDenseArray) {
      // Just iterate
    }
  },
});

// entries() iterator benchmarks
Deno.bench({
  name: "entries() - sparse array (10% set)",
  group: "entries",
  baseline: true,
  fn: () => {
    for (const [_index, _value] of iteratorTestArray.entries()) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "entries() - empty array",
  group: "entries",
  fn: () => {
    for (const [_index, _value] of iteratorEmptyArray.entries()) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "entries() - dense array (100% set)",
  group: "entries",
  fn: () => {
    for (const [_index, _value] of iteratorDenseArray.entries()) {
      // Just iterate
    }
  },
});

// keys() iterator benchmarks
Deno.bench({
  name: "keys() - sparse array (10% set)",
  group: "keys",
  baseline: true,
  fn: () => {
    for (const _index of iteratorTestArray.keys()) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "keys() - empty array",
  group: "keys",
  fn: () => {
    for (const _index of iteratorEmptyArray.keys()) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "keys() - dense array (100% set)",
  group: "keys",
  fn: () => {
    for (const _index of iteratorDenseArray.keys()) {
      // Just iterate
    }
  },
});

// values() iterator benchmarks
Deno.bench({
  name: "values() - sparse array (10% set)",
  group: "values",
  baseline: true,
  fn: () => {
    for (const _value of iteratorTestArray.values()) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "values() - empty array",
  group: "values",
  fn: () => {
    for (const _value of iteratorEmptyArray.values()) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "values() - dense array (100% set)",
  group: "values",
  fn: () => {
    for (const _value of iteratorDenseArray.values()) {
      // Just iterate
    }
  },
});

// Compare iterator performance vs forEach
Deno.bench({
  name: "forEach vs Symbol.iterator - sparse (forEach)",
  group: "iterator-comparison",
  baseline: true,
  fn: () => {
    iteratorTestArray.forEach((_value, _index) => {
      // Just iterate
    });
  },
});

Deno.bench({
  name: "forEach vs Symbol.iterator - sparse (Symbol.iterator)",
  group: "iterator-comparison",
  fn: () => {
    for (const _value of iteratorTestArray) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "forEach vs entries - sparse (forEach)",
  group: "iterator-comparison",
  fn: () => {
    iteratorTestArray.forEach((_value, _index) => {
      // Just iterate with both value and index
    });
  },
});

Deno.bench({
  name: "forEach vs entries - sparse (entries)",
  group: "iterator-comparison",
  fn: () => {
    for (const [_index, _value] of iteratorTestArray.entries()) {
      // Just iterate with both value and index
    }
  },
});

// indexOf/lastIndexOf with false values benchmarks
const falseIndexArray = new BooleanArray(1_000_000);
falseIndexArray.fill(true);
falseIndexArray.set(500_000, false); // Single false bit in the middle

const sparseFalseArray = new BooleanArray(1_000_000);
sparseFalseArray.fill(true);
for (let i = 0; i < 1000; i++) {
  sparseFalseArray.set(i * 1000, false);
}

// indexOf with false values
Deno.bench({
  name: "indexOf(false) - single false bit in middle",
  group: "indexOf-false",
  baseline: true,
  fn: () => {
    falseIndexArray.indexOf(false);
  },
});

Deno.bench({
  name: "indexOf(false) - sparse false bits",
  group: "indexOf-false",
  fn: () => {
    sparseFalseArray.indexOf(false);
  },
});

Deno.bench({
  name: "indexOf(false) - no false bits (all true)",
  group: "indexOf-false",
  fn: () => {
    denseLargeArray.indexOf(false);
  },
});

Deno.bench({
  name: "indexOf(false) - all false bits (empty array)",
  group: "indexOf-false",
  fn: () => {
    new BooleanArray(1_000_000).indexOf(false);
  },
});

// lastIndexOf with false values
Deno.bench({
  name: "lastIndexOf(false) - single false bit in middle",
  group: "lastIndexOf-false",
  baseline: true,
  fn: () => {
    falseIndexArray.lastIndexOf(false);
  },
});

Deno.bench({
  name: "lastIndexOf(false) - sparse false bits",
  group: "lastIndexOf-false",
  fn: () => {
    sparseFalseArray.lastIndexOf(false);
  },
});

Deno.bench({
  name: "lastIndexOf(false) - no false bits (all true)",
  group: "lastIndexOf-false",
  fn: () => {
    denseLargeArray.lastIndexOf(false);
  },
});

Deno.bench({
  name: "lastIndexOf(false) - all false bits (empty array)",
  group: "lastIndexOf-false",
  fn: () => {
    new BooleanArray(1_000_000).lastIndexOf(false);
  },
});

// Property access benchmarks
const propertyTestArray = new BooleanArray(1_000_000);

Deno.bench({
  name: "size property access",
  group: "property-access",
  baseline: true,
  fn: () => {
    propertyTestArray.size;
  },
});

Deno.bench({
  name: "length property access",
  group: "property-access",
  fn: () => {
    propertyTestArray.length;
  },
});

Deno.bench({
  name: "buffer property access",
  group: "property-access",
  fn: () => {
    propertyTestArray.buffer;
  },
});

// Chunk alignment edge cases
const alignmentTestArray = new BooleanArray(100);

// Test operations on chunk boundaries (31, 32, 63, 64, etc.)
Deno.bench({
  name: "set - chunk boundary transitions",
  group: "chunk-alignment",
  baseline: true,
  fn: () => {
    alignmentTestArray.set(31, true);
    alignmentTestArray.set(32, true);
    alignmentTestArray.set(63, true);
    alignmentTestArray.set(64, true);
  },
});

Deno.bench({
  name: "get - chunk boundary transitions",
  group: "chunk-alignment",
  fn: () => {
    alignmentTestArray.get(31);
    alignmentTestArray.get(32);
    alignmentTestArray.get(63);
    alignmentTestArray.get(64);
  },
});

Deno.bench({
  name: "toggle - chunk boundary transitions",
  group: "chunk-alignment",
  fn: () => {
    alignmentTestArray.toggle(31);
    alignmentTestArray.toggle(32);
    alignmentTestArray.toggle(63);
    alignmentTestArray.toggle(64);
  },
});

// Cross-chunk range operations
Deno.bench({
  name: "set range - cross chunk boundaries",
  group: "chunk-alignment",
  fn: () => {
    alignmentTestArray.set(30, 5, true); // Crosses 32-bit boundary
    alignmentTestArray.set(62, 5, false); // Crosses 64-bit boundary
  },
});

Deno.bench({
  name: "get range - cross chunk boundaries",
  group: "chunk-alignment",
  fn: () => {
    alignmentTestArray.get(30, 5); // Crosses 32-bit boundary
    alignmentTestArray.get(62, 5); // Crosses 64-bit boundary
  },
});

// Memory efficiency comparison with native arrays
const nativeBoolArray = new Array(10_000).fill(false);
for (let i = 0; i < 10_000; i += 10) {
  nativeBoolArray[i] = true;
}

const boolArrayEquivalent = new BooleanArray(10_000);
for (let i = 0; i < 10_000; i += 10) {
  boolArrayEquivalent.set(i, true);
}

Deno.bench({
  name: "native Array<boolean> - set operation",
  group: "memory-efficiency",
  baseline: true,
  fn: () => {
    nativeBoolArray[5000] = true;
  },
});

Deno.bench({
  name: "BooleanArray - set operation",
  group: "memory-efficiency",
  fn: () => {
    boolArrayEquivalent.set(5000, true);
  },
});

Deno.bench({
  name: "native Array<boolean> - get operation",
  group: "memory-efficiency",
  fn: () => {
    nativeBoolArray[5000];
  },
});

Deno.bench({
  name: "BooleanArray - get operation",
  group: "memory-efficiency",
  fn: () => {
    boolArrayEquivalent.get(5000);
  },
});

Deno.bench({
  name: "native Array<boolean> - iteration",
  group: "memory-efficiency",
  fn: () => {
    for (let i = 0; i < nativeBoolArray.length; i++) {
      nativeBoolArray[i];
    }
  },
});

Deno.bench({
  name: "BooleanArray - iteration via forEach",
  group: "memory-efficiency",
  fn: () => {
    boolArrayEquivalent.forEach((_value, _index) => {
      // Just iterate
    });
  },
});

Deno.bench({
  name: "native Array<boolean> - find truthy indices",
  group: "memory-efficiency",
  fn: () => {
    const indices = [];
    for (let i = 0; i < nativeBoolArray.length; i++) {
      if (nativeBoolArray[i]) {
        indices.push(i);
      }
    }
  },
});

Deno.bench({
  name: "BooleanArray - find truthy indices",
  group: "memory-efficiency",
  fn: () => {
    const indices = [];
    for (const index of boolArrayEquivalent.truthyIndices()) {
      indices.push(index);
    }
  },
});

// Advanced truthyIndices patterns
const advancedTruthyArray = new BooleanArray(1_000_000);
// Create a complex pattern: clusters of bits with gaps
for (let cluster = 0; cluster < 100; cluster++) {
  const clusterStart = cluster * 10000;
  for (let i = 0; i < 50; i++) {
    advancedTruthyArray.set(clusterStart + i, true);
  }
}

Deno.bench({
  name: "truthyIndices - clustered pattern (full iteration)",
  group: "truthyIndices-advanced",
  baseline: true,
  fn: () => {
    for (const _index of advancedTruthyArray.truthyIndices()) {
      // Just iterate
    }
  },
});

Deno.bench({
  name: "truthyIndices - clustered pattern (single cluster)",
  group: "truthyIndices-advanced",
  fn: () => {
    for (const _index of advancedTruthyArray.truthyIndices(0, 10000)) {
      // Just iterate first cluster
    }
  },
});

Deno.bench({
  name: "truthyIndices - clustered pattern (middle cluster)",
  group: "truthyIndices-advanced",
  fn: () => {
    for (const _index of advancedTruthyArray.truthyIndices(500000, 510000)) {
      // Just iterate middle cluster
    }
  },
});

Deno.bench({
  name: "truthyIndices - empty range",
  group: "truthyIndices-advanced",
  fn: () => {
    for (const _index of advancedTruthyArray.truthyIndices(1000, 9000)) {
      // Iterate over gap (no set bits)
    }
  },
});

// Early termination patterns
Deno.bench({
  name: "truthyIndices - early termination (first 10)",
  group: "truthyIndices-advanced",
  fn: () => {
    let count = 0;
    for (const _index of advancedTruthyArray.truthyIndices()) {
      if (++count >= 10) break;
    }
  },
});

// Complex equals patterns
const equalsArrayA = new BooleanArray(10_000);
const equalsArrayB = new BooleanArray(10_000);
const equalsArrayC = new BooleanArray(10_000);

// Set up different patterns for comparison
equalsArrayA.fill(true);
equalsArrayB.fill(true);
equalsArrayC.fill(true);
equalsArrayC.set(9999, false); // Only last bit differs

Deno.bench({
  name: "equals - identical dense arrays",
  group: "equals-patterns",
  baseline: true,
  fn: () => {
    BooleanArray.equals(equalsArrayA, equalsArrayB);
  },
});

Deno.bench({
  name: "equals - arrays differing at end",
  group: "equals-patterns",
  fn: () => {
    BooleanArray.equals(equalsArrayA, equalsArrayC);
  },
});

const equalsArrayEarlyDiff = new BooleanArray(10_000);
equalsArrayEarlyDiff.fill(true);
equalsArrayEarlyDiff.set(0, false); // First bit differs

Deno.bench({
  name: "equals - arrays differing at start",
  group: "equals-patterns",
  fn: () => {
    BooleanArray.equals(equalsArrayA, equalsArrayEarlyDiff);
  },
});

const equalsArrayMiddleDiff = new BooleanArray(10_000);
equalsArrayMiddleDiff.fill(true);
equalsArrayMiddleDiff.set(5000, false); // Middle bit differs

Deno.bench({
  name: "equals - arrays differing in middle",
  group: "equals-patterns",
  fn: () => {
    BooleanArray.equals(equalsArrayA, equalsArrayMiddleDiff);
  },
});

// Size mismatch (should be fast)
const differentSizeArray = new BooleanArray(5_000);
differentSizeArray.fill(true);

Deno.bench({
  name: "equals - different sizes",
  group: "equals-patterns",
  fn: () => {
    BooleanArray.equals(equalsArrayA, differentSizeArray);
  },
});
