/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { BooleanArray } from "../src/BooleanArray.ts";
import { and, not, or } from "../src/methods.ts";

// Add before benchmarks
const warmupArray = new BooleanArray(1024);
for (let i = 0; i < 1000; i++) {
  warmupArray.setBool(i, true);
  warmupArray.getBool(i);
  warmupArray.toggleBool(i);
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

// getBool benchmarks
Deno.bench({
  name: "getBool - small array",
  group: "getBool",
  baseline: true,
  fn: () => {
    smallArray.getBool(16);
  },
});

Deno.bench({
  name: "getBool - medium array",
  group: "getBool",
  fn: () => {
    mediumArray.getBool(512);
  },
});

Deno.bench({
  name: "getBool - large array",
  group: "getBool",
  fn: () => {
    largeArray.getBool(500_000);
  },
});

// setBool benchmarks
Deno.bench({
  name: "setBool - small array",
  group: "setBool",
  baseline: true,
  fn: () => {
    smallArray.setBool(16, true);
  },
});

Deno.bench({
  name: "setBool - medium array",
  group: "setBool",
  fn: () => {
    mediumArray.setBool(512, true);
  },
});

Deno.bench({
  name: "setBool - large array",
  group: "setBool",
  fn: () => {
    largeArray.setBool(500_000, true);
  },
});

// toggleBool benchmarks
Deno.bench({
  name: "toggleBool - small array",
  group: "toggleBool",
  baseline: true,
  fn: () => {
    smallArray.toggleBool(16);
  },
});

Deno.bench({
  name: "toggleBool - medium array",
  group: "toggleBool",
  fn: () => {
    mediumArray.toggleBool(512);
  },
});

Deno.bench({
  name: "toggleBool - large array",
  group: "toggleBool",
  fn: () => {
    largeArray.toggleBool(500_000);
  },
});

// Bulk operations
Deno.bench({
  name: "setRange(32 bits) - small array",
  group: "setRange",
  baseline: true,
  fn: () => {
    smallArray.setRange(0, 32, true);
  },
});

Deno.bench({
  name: "setRange(1024 bits) - medium array",
  group: "setRange",
  fn: () => {
    mediumArray.setRange(0, 1024, true);
  },
});

Deno.bench({
  name: "setRange(1M bits) - large array",
  group: "setRange",
  fn: () => {
    largeArray.setRange(0, 1_000_000, true);
  },
});

// Population count setup
const emptySmallArray = new BooleanArray(32);

const sparseSmallArray = new BooleanArray(32);
sparseSmallArray.setBool(0, true);
sparseSmallArray.setBool(31, true);

const denseSmallArray = new BooleanArray(32);
denseSmallArray.setAll();

const sparseMediumArray = new BooleanArray(1024);
for (let i = 0; i < 32; i++) {
  sparseMediumArray.setBool(i * 32, true);
}

const denseMediumArray = new BooleanArray(1024);
denseMediumArray.setAll();

const sparseLargeArray = new BooleanArray(1_000_000);
for (let i = 0; i < 1000; i++) {
  sparseLargeArray.setBool(i * 1000, true);
}

const denseLargeArray = new BooleanArray(1_000_000);
denseLargeArray.setAll();

// Population count benchmarks
Deno.bench({
  name: "getPopulationCount - small array (empty)",
  group: "population",
  baseline: true,
  fn: () => {
    emptySmallArray.getPopulationCount();
  },
});

Deno.bench({
  name: "getPopulationCount - small array (sparse)",
  group: "population",
  fn: () => {
    sparseSmallArray.getPopulationCount();
  },
});

Deno.bench({
  name: "getPopulationCount - small array (dense)",
  group: "population",
  fn: () => {
    denseSmallArray.getPopulationCount();
  },
});

Deno.bench({
  name: "getPopulationCount - medium array (sparse)",
  group: "population",
  fn: () => {
    sparseMediumArray.getPopulationCount();
  },
});

Deno.bench({
  name: "getPopulationCount - medium array (dense)",
  group: "population",
  fn: () => {
    denseMediumArray.getPopulationCount();
  },
});

Deno.bench({
  name: "getPopulationCount - large array (sparse)",
  group: "population",
  fn: () => {
    sparseLargeArray.getPopulationCount();
  },
});

Deno.bench({
  name: "getPopulationCount - large array (dense)",
  group: "population",
  fn: () => {
    denseLargeArray.getPopulationCount();
  },
});

// Bitwise operations
const a = new BooleanArray(1024);
const b = new BooleanArray(1024);

// Setup some patterns
a.setRange(0, 512, true);
b.setRange(256, 512, true);

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
  iterArray.setBool(i, true);
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
  name: "setBool - edge alignment",
  group: "edge-cases",
  fn: () => {
    edgeArray.setBool(32, true);
  },
});

// Setup arrays with different patterns for get/set index tests
const emptyIndexArray = new BooleanArray(1024);

const firstSetArray = new BooleanArray(1024);
firstSetArray.setBool(0, true);

const lastSetArray = new BooleanArray(1024);
lastSetArray.setBool(1023, true);

const middleSetArray = new BooleanArray(1024);
middleSetArray.setBool(512, true);

// getBools benchmarks
Deno.bench({
  name: "getBools - small range (32 bits)",
  group: "getBools",
  baseline: true,
  fn: () => {
    mediumArray.getBools(0, 32);
  },
});

Deno.bench({
  name: "getBools - medium range (256 bits)",
  group: "getBools",
  fn: () => {
    mediumArray.getBools(256, 256);
  },
});

Deno.bench({
  name: "getBools - large range (1024 bits)",
  group: "getBools",
  fn: () => {
    largeArray.getBools(0, 1024);
  },
});

// getFirstSetIndex benchmarks
Deno.bench({
  name: "getFirstSetIndex - empty array",
  group: "getFirstSetIndex",
  baseline: true,
  fn: () => {
    emptyIndexArray.getFirstSetIndex();
  },
});

Deno.bench({
  name: "getFirstSetIndex - first bit set",
  group: "getFirstSetIndex",
  fn: () => {
    firstSetArray.getFirstSetIndex();
  },
});

Deno.bench({
  name: "getFirstSetIndex - middle bit set",
  group: "getFirstSetIndex",
  fn: () => {
    middleSetArray.getFirstSetIndex();
  },
});

Deno.bench({
  name: "getFirstSetIndex - last bit set",
  group: "getFirstSetIndex",
  fn: () => {
    lastSetArray.getFirstSetIndex();
  },
});

// getLastSetIndex benchmarks
Deno.bench({
  name: "getLastSetIndex - empty array",
  group: "getLastSetIndex",
  baseline: true,
  fn: () => {
    emptyIndexArray.getLastSetIndex();
  },
});

Deno.bench({
  name: "getLastSetIndex - first bit set",
  group: "getLastSetIndex",
  fn: () => {
    firstSetArray.getLastSetIndex();
  },
});

Deno.bench({
  name: "getLastSetIndex - middle bit set",
  group: "getLastSetIndex",
  fn: () => {
    middleSetArray.getLastSetIndex();
  },
});

Deno.bench({
  name: "getLastSetIndex - last bit set",
  group: "getLastSetIndex",
  fn: () => {
    lastSetArray.getLastSetIndex();
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

clearSmallArray.setAll();
clearMediumArray.setAll();
clearLargeArray.setAll();

Deno.bench({
  name: "clear - small array",
  group: "clear",
  baseline: true,
  fn: () => {
    clearSmallArray.clear();
  },
});

Deno.bench({
  name: "clear - medium array",
  group: "clear",
  fn: () => {
    clearMediumArray.clear();
  },
});

Deno.bench({
  name: "clear - large array",
  group: "clear",
  fn: () => {
    clearLargeArray.clear();
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
  rangeArray.setBool(i, true);
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
  if (i % 100 === 0) sparseRangeArray.setBool(i, true);
  if (i % 2 === 0) mediumRangeArray.setBool(i, true);
  if (i % 100 !== 0) denseRangeArray.setBool(i, true);
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
  sparseA.setBool(i, true);
  sparseB.setBool(i, true);
}

const denseA = new BooleanArray(1024);
const denseB = new BooleanArray(1024);
denseA.setAll();
denseB.setAll();

const diffA = new BooleanArray(1024);
const diffB = new BooleanArray(1024);
diffA.setRange(0, 512, true);
diffB.setRange(256, 768, true);

// Large arrays for scaling tests
const largeA = new BooleanArray(1_000_000);
const largeB = new BooleanArray(1_000_000);
for (let i = 0; i < 1_000_000; i += 1000) {
  largeA.setBool(i, true);
  largeB.setBool(i, true);
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
edgeCaseA.setBool(32, true);
edgeCaseB.setBool(32, true);

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
  startIndexArray.setBool(i, true);
}

const denseStartIndexArray = new BooleanArray(1_000_000);
denseStartIndexArray.setAll();

const chunkBoundaryArray = new BooleanArray(1024);
chunkBoundaryArray.setBool(31, true);
chunkBoundaryArray.setBool(32, true);
chunkBoundaryArray.setBool(63, true);
chunkBoundaryArray.setBool(64, true);

// getFirstSetIndex with startIndex benchmarks
Deno.bench({
  name: "getFirstSetIndex(startIndex) - start of array",
  group: "getFirstSetIndex-start",
  baseline: true,
  fn: () => {
    startIndexArray.getFirstSetIndex(0);
  },
});

Deno.bench({
  name: "getFirstSetIndex(startIndex) - middle of array",
  group: "getFirstSetIndex-start",
  fn: () => {
    startIndexArray.getFirstSetIndex(500_000);
  },
});

Deno.bench({
  name: "getFirstSetIndex(startIndex) - end of array",
  group: "getFirstSetIndex-start",
  fn: () => {
    startIndexArray.getFirstSetIndex(999_000);
  },
});

// Test with different densities
Deno.bench({
  name: "getFirstSetIndex(startIndex) - sparse array",
  group: "getFirstSetIndex-density",
  baseline: true,
  fn: () => {
    startIndexArray.getFirstSetIndex(500_000);
  },
});

Deno.bench({
  name: "getFirstSetIndex(startIndex) - dense array",
  group: "getFirstSetIndex-density",
  fn: () => {
    denseStartIndexArray.getFirstSetIndex(500_000);
  },
});

// Test chunk boundary cases
Deno.bench({
  name: "getFirstSetIndex(startIndex) - at chunk boundary",
  group: "getFirstSetIndex-boundary",
  baseline: true,
  fn: () => {
    chunkBoundaryArray.getFirstSetIndex(31);
  },
});

Deno.bench({
  name: "getFirstSetIndex(startIndex) - across chunk boundary",
  group: "getFirstSetIndex-boundary",
  fn: () => {
    chunkBoundaryArray.getFirstSetIndex(32);
  },
});

// Test with different array sizes
Deno.bench({
  name: "getFirstSetIndex(startIndex) - small array (32 bits)",
  group: "getFirstSetIndex-size",
  baseline: true,
  fn: () => {
    sparseSmallArray.getFirstSetIndex(16);
  },
});

Deno.bench({
  name: "getFirstSetIndex(startIndex) - medium array (1024 bits)",
  group: "getFirstSetIndex-size",
  fn: () => {
    sparseMediumArray.getFirstSetIndex(512);
  },
});

Deno.bench({
  name: "getFirstSetIndex(startIndex) - large array (1M bits)",
  group: "getFirstSetIndex-size",
  fn: () => {
    startIndexArray.getFirstSetIndex(500_000);
  },
});

// Setup arrays for getLastSetIndex with startIndex benchmarks
const lastIndexArray = new BooleanArray(1_000_000);
for (let i = 0; i < 1_000_000; i += 1000) {
  lastIndexArray.setBool(i, true);
}

const denseLastIndexArray = new BooleanArray(1_000_000);
denseLastIndexArray.setAll();

const lastIndexBoundaryArray = new BooleanArray(1024);
lastIndexBoundaryArray.setBool(31, true);
lastIndexBoundaryArray.setBool(32, true);
lastIndexBoundaryArray.setBool(63, true);
lastIndexBoundaryArray.setBool(64, true);

// getLastSetIndex with startIndex benchmarks
Deno.bench({
  name: "getLastSetIndex(startIndex) - end of array",
  group: "getLastSetIndex-start",
  baseline: true,
  fn: () => {
    lastIndexArray.getLastSetIndex(1_000_000);
  },
});

Deno.bench({
  name: "getLastSetIndex(startIndex) - middle of array",
  group: "getLastSetIndex-start",
  fn: () => {
    lastIndexArray.getLastSetIndex(500_000);
  },
});

Deno.bench({
  name: "getLastSetIndex(startIndex) - start of array",
  group: "getLastSetIndex-start",
  fn: () => {
    lastIndexArray.getLastSetIndex(1000);
  },
});

// Test with different densities
Deno.bench({
  name: "getLastSetIndex(startIndex) - sparse array",
  group: "getLastSetIndex-density",
  baseline: true,
  fn: () => {
    lastIndexArray.getLastSetIndex(500_000);
  },
});

Deno.bench({
  name: "getLastSetIndex(startIndex) - dense array",
  group: "getLastSetIndex-density",
  fn: () => {
    denseLastIndexArray.getLastSetIndex(500_000);
  },
});

// Test chunk boundary cases
Deno.bench({
  name: "getLastSetIndex(startIndex) - at chunk boundary",
  group: "getLastSetIndex-boundary",
  baseline: true,
  fn: () => {
    lastIndexBoundaryArray.getLastSetIndex(32);
  },
});

Deno.bench({
  name: "getLastSetIndex(startIndex) - across chunk boundary",
  group: "getLastSetIndex-boundary",
  fn: () => {
    lastIndexBoundaryArray.getLastSetIndex(33);
  },
});

// Test with different array sizes
Deno.bench({
  name: "getLastSetIndex(startIndex) - small array (32 bits)",
  group: "getLastSetIndex-size",
  baseline: true,
  fn: () => {
    sparseSmallArray.getLastSetIndex(16);
  },
});

Deno.bench({
  name: "getLastSetIndex(startIndex) - medium array (1024 bits)",
  group: "getLastSetIndex-size",
  fn: () => {
    sparseMediumArray.getLastSetIndex(512);
  },
});

Deno.bench({
  name: "getLastSetIndex(startIndex) - large array (1M bits)",
  group: "getLastSetIndex-size",
  fn: () => {
    lastIndexArray.getLastSetIndex(500_000);
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
    BooleanArray.fromArray(smallIndices, 32);
  },
});

Deno.bench({
  name: "fromArray - medium sparse array (32 bits)",
  group: "fromArray",
  fn: () => {
    BooleanArray.fromArray(mediumIndices, 1024);
  },
});

Deno.bench({
  name: "fromArray - large sparse array (1000 bits)",
  group: "fromArray",
  fn: () => {
    BooleanArray.fromArray(largeIndices, 1_000_000);
  },
});

Deno.bench({
  name: "fromArray - dense consecutive indices (1000 bits)",
  group: "fromArray",
  fn: () => {
    BooleanArray.fromArray(denseIndices, 1_000_000);
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
    BooleanArray.fromArray(randomIndices, 1_000_000);
  },
});

Deno.bench({
  name: "fromArray - clustered indices (1000 bits)",
  group: "fromArray-patterns",
  fn: () => {
    BooleanArray.fromArray(clusterIndices, 1_000_000);
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
    BooleanArray.fromArray(size1k, 1000);
  },
});

Deno.bench({
  name: "fromArray - 10K size (10% density)",
  group: "fromArray-scaling",
  fn: () => {
    BooleanArray.fromArray(size10k, 10_000);
  },
});

Deno.bench({
  name: "fromArray - 100K size (10% density)",
  group: "fromArray-scaling",
  fn: () => {
    BooleanArray.fromArray(size100k, 100_000);
  },
});

Deno.bench({
  name: "fromArray - 1M size (10% density)",
  group: "fromArray-scaling",
  fn: () => {
    BooleanArray.fromArray(size1m, 1_000_000);
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
    BooleanArray.fromArray(edgeCaseIndices, 100);
  },
});

Deno.bench({
  name: "fromArray - maximum safe size",
  group: "fromArray-edge",
  fn: () => {
    BooleanArray.fromArray(maxSizeIndices, BooleanArray.MAX_SAFE_SIZE);
  },
});

// Compare with alternative methods
const comparisonIndices = Array.from({ length: 1000 }, (_, i) => i * 100);

Deno.bench({
  name: "fromArray - direct creation",
  group: "fromArray-comparison",
  baseline: true,
  fn: () => {
    BooleanArray.fromArray(comparisonIndices, 100_000);
  },
});

Deno.bench({
  name: "manual setBool - equivalent operation",
  group: "fromArray-comparison",
  fn: () => {
    const array = new BooleanArray(100_000);
    for (const index of comparisonIndices) {
      array.setBool(index, true);
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
    BooleanArray.fromArray(sortedIndices, 10_000);
  },
});

Deno.bench({
  name: "fromArray - unsorted indices",
  group: "fromArray-sorting",
  fn: () => {
    BooleanArray.fromArray(unsortedIndices, 10_000);
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
  name: "manual setBool - equivalent operation",
  group: "fromObjects-comparison",
  fn: () => {
    const array = new BooleanArray(100_000);
    for (const obj of comparisonObjects) {
      array.setBool(obj.index, true);
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
instanceA.setRange(0, 512, true);
instanceB.setRange(256, 512, true);

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
  forEachTestArray.setBool(i, true);
}

const forEachEmptyArray = new BooleanArray(10_000);
const forEachDenseArray = new BooleanArray(10_000);
forEachDenseArray.setAll();

Deno.bench({
  name: "forEachBool - sparse array (10% set)",
  group: "forEachBool",
  baseline: true,
  fn: () => {
    forEachTestArray.forEachBool((_index, _value) => {
      // Just iterate
    });
  },
});

Deno.bench({
  name: "forEachBool - empty array",
  group: "forEachBool",
  fn: () => {
    forEachEmptyArray.forEachBool((_index, _value) => {
      // Just iterate
    });
  },
});

Deno.bench({
  name: "forEachBool - dense array (100% set)",
  group: "forEachBool",
  fn: () => {
    forEachDenseArray.forEachBool((_index, _value) => {
      // Just iterate
    });
  },
});

Deno.bench({
  name: "forEachBool - partial range (1000 elements)",
  group: "forEachBool",
  fn: () => {
    forEachTestArray.forEachBool(
      (_index, _value) => {
        // Just iterate
      },
      1000,
      1000,
    );
  },
});

// setAll benchmarks
const setAllSmallArray = new BooleanArray(32);
const setAllMediumArray = new BooleanArray(1024);
const setAllLargeArray = new BooleanArray(1_000_000);

Deno.bench({
  name: "setAll - small array",
  group: "setAll",
  baseline: true,
  fn: () => {
    setAllSmallArray.setAll();
  },
});

Deno.bench({
  name: "setAll - medium array",
  group: "setAll",
  fn: () => {
    setAllMediumArray.setAll();
  },
});

Deno.bench({
  name: "setAll - large array",
  group: "setAll",
  fn: () => {
    setAllLargeArray.setAll();
  },
});

// In-place vs Copy operation benchmarks
const copyTestA = new BooleanArray(1024);
const copyTestB = new BooleanArray(1024);
copyTestA.setRange(0, 512, true);
copyTestB.setRange(256, 768, true);

Deno.bench({
  name: "and() - copy operation (inPlace=false)",
  group: "inPlace-comparison",
  baseline: true,
  fn: () => {
    and(copyTestA, copyTestB, false);
  },
});

Deno.bench({
  name: "and() - in-place operation (inPlace=true)",
  group: "inPlace-comparison",
  fn: () => {
    const a = copyTestA.clone();
    and(a, copyTestB, true);
  },
});

Deno.bench({
  name: "or() - copy operation (inPlace=false)",
  group: "inPlace-comparison",
  fn: () => {
    or(copyTestA, copyTestB, false);
  },
});

Deno.bench({
  name: "or() - in-place operation (inPlace=true)",
  group: "inPlace-comparison",
  fn: () => {
    const a = copyTestA.clone();
    or(a, copyTestB, true);
  },
});

Deno.bench({
  name: "not() - copy operation (inPlace=false)",
  group: "inPlace-comparison",
  fn: () => {
    not(copyTestA, false);
  },
});

Deno.bench({
  name: "not() - in-place operation (inPlace=true)",
  group: "inPlace-comparison",
  fn: () => {
    const a = copyTestA.clone();
    not(a, true);
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
  name: "BooleanArray.validateValue() - valid values",
  group: "utility-methods",
  fn: () => {
    BooleanArray.validateValue(0);
    BooleanArray.validateValue(100);
    BooleanArray.validateValue(1024);
    BooleanArray.validateValue(BooleanArray.MAX_SAFE_SIZE - 1);
  },
});

Deno.bench({
  name: "BooleanArray.isValidValue() - valid values",
  group: "utility-methods",
  fn: () => {
    BooleanArray.isValidValue(0);
    BooleanArray.isValidValue(100);
    BooleanArray.isValidValue(1024);
    BooleanArray.isValidValue(BooleanArray.MAX_SAFE_SIZE - 1);
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
  name: "MAX_SAFE_SIZE array - setBool",
  group: "edge-cases-size",
  fn: () => {
    maxSizeArray.setBool(BooleanArray.MAX_SAFE_SIZE - 1, true);
  },
});

Deno.bench({
  name: "MAX_SAFE_SIZE array - getBool",
  group: "edge-cases-size",
  fn: () => {
    maxSizeArray.getBool(BooleanArray.MAX_SAFE_SIZE - 1);
  },
});

Deno.bench({
  name: "MAX_SAFE_SIZE array - isEmpty",
  group: "edge-cases-size",
  fn: () => {
    maxSizeArray.isEmpty();
  },
});
