/// <reference lib="deno.ns" />
/// <reference lib="dom" />
// deno-lint-ignore-file no-console

import { BooleanArray } from "../mod.ts";

type GcFn = () => void;

type Scenario = {
  name: string;
  iterations: number;
  fn: () => void;
};

type MemorySnapshot = ReturnType<typeof Deno.memoryUsage>;

const gc = (globalThis as { gc?: GcFn }).gc;

if (typeof gc !== "function") {
  throw new Error("Run with: deno run --v8-flags=--expose-gc bench/gc_allocations.ts");
}

const forceGc: GcFn = gc;

function collect(): void {
  for (let i = 0; i < 3; i++) {
    forceGc();
  }
}

function formatBytes(bytes: number): string {
  const sign = bytes < 0 ? "-" : "";
  const abs = Math.abs(bytes);
  if (abs >= 1024 * 1024) return `${sign}${(abs / (1024 * 1024)).toFixed(2)} MiB`;
  if (abs >= 1024) return `${sign}${(abs / 1024).toFixed(2)} KiB`;
  return `${sign}${abs} B`;
}

function diff(after: MemorySnapshot, before: MemorySnapshot): MemorySnapshot {
  return {
    rss: after.rss - before.rss,
    heapTotal: after.heapTotal - before.heapTotal,
    heapUsed: after.heapUsed - before.heapUsed,
    external: after.external - before.external,
  };
}

function printRow(label: string, delta: MemorySnapshot, iterations: number): void {
  const bytesPerIter = (delta.heapUsed + delta.external) / iterations;
  console.log(
    [
      label.padEnd(42),
      `heap=${formatBytes(delta.heapUsed)}`.padStart(18),
      `external=${formatBytes(delta.external)}`.padStart(22),
      `rss=${formatBytes(delta.rss)}`.padStart(18),
      `approx/iter=${formatBytes(bytesPerIter)}`.padStart(24),
    ].join("  "),
  );
}

function runScenario(scenario: Scenario): void {
  collect();
  const before = Deno.memoryUsage();

  for (let i = 0; i < scenario.iterations; i++) {
    scenario.fn();
  }

  const beforeCollection = Deno.memoryUsage();
  collect();
  const afterCollection = Deno.memoryUsage();

  console.log(`\n${scenario.name} (${scenario.iterations.toLocaleString()} iterations)`);
  printRow("before GC", diff(beforeCollection, before), scenario.iterations);
  printRow("retained after GC", diff(afterCollection, before), scenario.iterations);
}

const small = new BooleanArray(1024);
const medium = new BooleanArray(10_000);
const source = new BooleanArray(1024);
const dest = new BooleanArray(1024);
const boolOut = new Array<boolean>(1024);
const indexOut = new Uint32Array(1024);
const noopForEach = (): void => {};

source.fill(true);
medium.set(0, 10_000, true);

const scenarios: Scenario[] = [
  {
    name: "constructor medium",
    iterations: 50_000,
    fn: () => {
      new BooleanArray(1024);
    },
  },
  {
    name: "copyFrom aligned full",
    iterations: 250_000,
    fn: () => {
      dest.copyFrom(source);
    },
  },
  {
    name: "copyFrom aligned partial",
    iterations: 250_000,
    fn: () => {
      dest.copyFrom(source, 32, 64, 512);
    },
  },
  {
    name: "get range allocating",
    iterations: 100_000,
    fn: () => {
      small.get(0, 1024);
    },
  },
  {
    name: "getInto preallocated",
    iterations: 100_000,
    fn: () => {
      small.getInto(0, 1024, boolOut);
    },
  },
  {
    name: "truthyIndices spread allocating",
    iterations: 50_000,
    fn: () => {
      [...medium.truthyIndices()];
    },
  },
  {
    name: "truthyIndicesInto preallocated",
    iterations: 50_000,
    fn: () => {
      medium.truthyIndicesInto(indexOut);
    },
  },
  {
    name: "values iterator",
    iterations: 100_000,
    fn: () => {
      const iterator = small.values();
      iterator.next();
    },
  },
  {
    name: "forEach zero-allocation iteration",
    iterations: 100_000,
    fn: () => {
      small.forEach(noopForEach, 0, 32);
    },
  },
];

console.log("GC allocation pressure benchmark");
console.log("Measures memory growth during tight loops, then retained memory after forced GC.");

for (const scenario of scenarios) {
  runScenario(scenario);
}
