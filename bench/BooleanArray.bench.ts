import { BooleanArray } from "../src/BooleanArray.ts";

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
