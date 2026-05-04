/// <reference lib="deno.ns" />
/// <reference lib="dom" />
// deno-lint-ignore-file no-console

import { and, andInto, BooleanArray } from "../mod.ts";

type GcFn = () => void;
type MemorySnapshot = ReturnType<typeof Deno.memoryUsage>;
type Scenario = {
  name: string;
  iterations: number;
  fn: () => void;
  warmupIterations?: number;
  isExternalPackage?: boolean;
  comparisonBaselineName?: string;
  maxSteadyStateBeforeGcBytesPerIter?: number;
};
type ScenarioSummary = {
  scenario: Scenario;
  lowestBeforeGc: MemorySnapshot;
  highestSteadyStateBeforeGc: MemorySnapshot;
};
type ModuleRecord = Record<string, unknown>;
type Constructable = new (...args: unknown[]) => unknown;
type Method = (...args: unknown[]) => unknown;

const DEFAULT_ROUNDS = 3;
const DEFAULT_WARMUP_ITERATIONS = 10_000;
const ZERO_ALLOCATION_TOLERANCE_BYTES_PER_ITER = 0.5;
const checkMode = Deno.args.includes("--check");

const gc = (globalThis as { gc?: GcFn }).gc;

if (typeof gc !== "function") {
  throw new Error("Run with: deno run --v8-flags=--expose-gc bench/external_gc_allocations.ts");
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

function totalBytes(delta: MemorySnapshot): number {
  return delta.heapUsed + delta.external;
}

function bytesPerIteration(delta: MemorySnapshot, iterations: number): number {
  return totalBytes(delta) / iterations;
}

function printRow(label: string, delta: MemorySnapshot, iterations: number): void {
  const bytesPerIter = totalBytes(delta) / iterations;
  console.log(
    [
      label.padEnd(28),
      `heap=${formatBytes(delta.heapUsed)}`.padStart(18),
      `external=${formatBytes(delta.external)}`.padStart(22),
      `rss=${formatBytes(delta.rss)}`.padStart(18),
      `approx/iter=${formatBytes(bytesPerIter)}`.padStart(24),
    ].join("  "),
  );
}

function asRecord(value: unknown): ModuleRecord {
  if (value === null || typeof value !== "object") {
    throw new TypeError("Expected module object");
  }
  return value as ModuleRecord;
}

function resolveExport(moduleValue: unknown, names: string[]): unknown {
  const moduleRecord = asRecord(moduleValue);
  for (const name of names) {
    const value = moduleRecord[name];
    if (value !== undefined) return value;
  }
  return moduleValue;
}

function construct(factory: unknown, args: unknown[] = []): ModuleRecord {
  if (typeof factory !== "function") {
    throw new TypeError("Expected constructor function");
  }
  return new (factory as Constructable)(...args) as ModuleRecord;
}

function callMethod(target: ModuleRecord, methodName: string, args: unknown[] = []): unknown {
  return getMethod(target, methodName).apply(target, args);
}

function getMethod(target: ModuleRecord, methodName: string): Method {
  const method = target[methodName];
  if (typeof method !== "function") {
    throw new TypeError(`Expected method ${methodName}`);
  }
  return method as Method;
}

function hasMethod(target: ModuleRecord, methodName: string): boolean {
  return typeof target[methodName] === "function";
}

function setIndices(target: ModuleRecord, indices: Iterable<number>): void {
  for (const index of indices) {
    callMethod(target, "set", [index, 1]);
  }
}

async function optionalImport(specifier: string): Promise<unknown | undefined> {
  try {
    return await import(specifier);
  } catch (error) {
    console.log(`Skipping ${specifier}: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function measureScenario(scenario: Scenario): MemorySnapshot {
  collect();
  const before = Deno.memoryUsage();
  for (let i = 0; i < scenario.iterations; i++) {
    scenario.fn();
  }
  const beforeCollection = Deno.memoryUsage();
  collect();
  return diff(beforeCollection, before);
}

function warmupScenario(scenario: Scenario): void {
  const iterations = Math.min(scenario.iterations, scenario.warmupIterations ?? DEFAULT_WARMUP_ITERATIONS);
  for (let i = 0; i < iterations; i++) {
    scenario.fn();
  }
  collect();
}

function runScenario(scenario: Scenario): ScenarioSummary {
  const rounds = new Array<MemorySnapshot>(DEFAULT_ROUNDS);
  console.log(`\n${scenario.name} (${scenario.iterations.toLocaleString()} iterations)`);
  warmupScenario(scenario);
  for (let round = 0; round < DEFAULT_ROUNDS; round++) {
    const delta = measureScenario(scenario);
    rounds[round] = delta;
    printRow(`round ${round + 1} before GC`, delta, scenario.iterations);
  }

  let lowest = rounds[0]!;
  for (let i = 1; i < rounds.length; i++) {
    const candidate = rounds[i]!;
    if (totalBytes(candidate) < totalBytes(lowest)) {
      lowest = candidate;
    }
  }
  printRow("lowest before GC", lowest, scenario.iterations);

  let highestSteadyState = rounds[1] ?? rounds[0]!;
  for (let i = 2; i < rounds.length; i++) {
    const candidate = rounds[i]!;
    if (totalBytes(candidate) > totalBytes(highestSteadyState)) {
      highestSteadyState = candidate;
    }
  }
  if (rounds.length > 1) {
    printRow("highest steady-state before GC", highestSteadyState, scenario.iterations);
  }

  return {
    scenario,
    lowestBeforeGc: lowest,
    highestSteadyStateBeforeGc: highestSteadyState,
  };
}

function checkExternalEvidence(summaries: ScenarioSummary[]): boolean {
  let passed = true;
  console.log("\nExternal allocation comparison check");

  for (const summary of summaries) {
    const budget = summary.scenario.maxSteadyStateBeforeGcBytesPerIter;
    if (budget === undefined) continue;

    const actual = bytesPerIteration(summary.highestSteadyStateBeforeGc, summary.scenario.iterations);
    const budgetOk = actual <= budget;
    passed &&= budgetOk;
    console.log(
      `${budgetOk ? "PASS" : "FAIL"} ${summary.scenario.name}: highest steady-state before-GC ${
        actual.toFixed(4)
      } B/iter <= ${budget} B/iter`,
    );
  }

  const externalPackages = summaries.filter((summary) => summary.scenario.isExternalPackage === true);
  if (externalPackages.length === 0) {
    console.log("FAIL no external packages were available for comparison");
    return false;
  }

  for (const externalPackage of externalPackages) {
    const baselineName = externalPackage.scenario.comparisonBaselineName;
    if (baselineName === undefined) {
      console.log(`FAIL ${externalPackage.scenario.name} is missing a comparison baseline`);
      passed = false;
      continue;
    }
    const local = summaries.find((summary) => summary.scenario.name === baselineName);
    if (local === undefined) {
      console.log(`FAIL missing baseline scenario ${baselineName} for ${externalPackage.scenario.name}`);
      passed = false;
      continue;
    }
    const localBytes = bytesPerIteration(local.highestSteadyStateBeforeGc, local.scenario.iterations);
    const externalBytes = bytesPerIteration(
      externalPackage.highestSteadyStateBeforeGc,
      externalPackage.scenario.iterations,
    );
    const ok = localBytes <= externalBytes ||
      (localBytes <= ZERO_ALLOCATION_TOLERANCE_BYTES_PER_ITER &&
        externalBytes <= ZERO_ALLOCATION_TOLERANCE_BYTES_PER_ITER);
    passed &&= ok;
    const comparator = localBytes <= externalBytes ? "<=" : "~=";
    console.log(
      `${ok ? "PASS" : "FAIL"} ${local.scenario.name} ${
        localBytes.toFixed(4)
      } B/iter ${comparator} ${externalPackage.scenario.name} ${externalBytes.toFixed(4)} B/iter`,
    );
  }

  return passed;
}

async function main(): Promise<void> {
  const bitsetModule = await optionalImport("npm:bitset@5.2.3");
  const fastBitSetModule = await optionalImport("npm:fast-bitset@1.3.2");
  const fastbitsetModule = await optionalImport("npm:fastbitset@0.4.1");
  const bitwiseModule = await optionalImport("npm:bitwise@2.2.1");
  const bitArrayModule = await optionalImport("npm:bit-array@0.2.4");

  const bitwiseA = new BooleanArray(10_000);
  const bitwiseB = new BooleanArray(10_000);
  const bitwiseOut = new BooleanArray(10_000);
  bitwiseA.set(0, 5_000, true);
  bitwiseB.set(2_500, 5_000, true);
  const queryIndices = new Uint32Array([0, 1024, 2_500, 4_999, 5_000, 7_499, 9_000, 9_999]);
  let membershipSink = 0;

  const aIndices = Array.from({ length: 5_000 }, (_, index) => index);
  const bIndices = Array.from({ length: 5_000 }, (_, index) => index + 2_500);
  const bitwiseBitsA = new Array<0 | 1>(10_000).fill(0);
  const bitwiseBitsB = new Array<0 | 1>(10_000).fill(0);
  for (const index of aIndices) {
    bitwiseBitsA[index] = 1;
  }
  for (const index of bIndices) {
    bitwiseBitsB[index] = 1;
  }

  const scenarios: Scenario[] = [
    {
      name: "BooleanArray andInto preallocated",
      iterations: 100_000,
      maxSteadyStateBeforeGcBytesPerIter: 0.5,
      fn: () => {
        andInto(bitwiseA, bitwiseB, bitwiseOut);
      },
    },
    {
      name: "BooleanArray and allocating",
      iterations: 100_000,
      fn: () => {
        and(bitwiseA, bitwiseB);
      },
    },
    {
      name: "BooleanArray get membership query",
      iterations: 250_000,
      maxSteadyStateBeforeGcBytesPerIter: 0.5,
      fn: () => {
        for (let i = 0; i < queryIndices.length; i++) {
          membershipSink += bitwiseA.get(queryIndices[i]!) ? 1 : 0;
        }
      },
    },
  ];

  if (bitsetModule !== undefined) {
    const BitSet = resolveExport(bitsetModule, ["default", "BitSet"]);
    const bitsetA = construct(BitSet);
    const bitsetB = construct(BitSet);
    setIndices(bitsetA, aIndices);
    setIndices(bitsetB, bIndices);
    const bitsetAnd = getMethod(bitsetA, "and");
    const bitsetGet = getMethod(bitsetA, "get");

    scenarios.push({
      name: "npm:bitset immutable AND",
      iterations: 100_000,
      isExternalPackage: true,
      comparisonBaselineName: "BooleanArray andInto preallocated",
      fn: () => {
        bitsetAnd.call(bitsetA, bitsetB);
      },
    });
    scenarios.push({
      name: "npm:bitset get membership query",
      iterations: 250_000,
      isExternalPackage: true,
      comparisonBaselineName: "BooleanArray get membership query",
      fn: () => {
        for (let i = 0; i < queryIndices.length; i++) {
          membershipSink += bitsetGet.call(bitsetA, queryIndices[i]!) ? 1 : 0;
        }
      },
    });
  }

  if (fastBitSetModule !== undefined) {
    const FastBitSet = resolveExport(fastBitSetModule, ["default", "BitSet"]);
    const fastBitSetA = construct(FastBitSet, [10_000]);
    const fastBitSetB = construct(FastBitSet, [10_000]);
    setIndices(fastBitSetA, aIndices);
    setIndices(fastBitSetB, bIndices);
    const fastBitSetAnd = getMethod(fastBitSetA, "and");
    const fastBitSetGet = getMethod(fastBitSetA, "get");

    scenarios.push({
      name: "npm:fast-bitset AND",
      iterations: 100_000,
      isExternalPackage: true,
      comparisonBaselineName: "BooleanArray andInto preallocated",
      fn: () => {
        fastBitSetAnd.call(fastBitSetA, fastBitSetB);
      },
    });
    scenarios.push({
      name: "npm:fast-bitset get membership query",
      iterations: 250_000,
      isExternalPackage: true,
      comparisonBaselineName: "BooleanArray get membership query",
      fn: () => {
        for (let i = 0; i < queryIndices.length; i++) {
          membershipSink += fastBitSetGet.call(fastBitSetA, queryIndices[i]!) ? 1 : 0;
        }
      },
    });
  }

  if (fastbitsetModule !== undefined) {
    const FastBitSet = resolveExport(fastbitsetModule, ["default", "FastBitSet"]);
    const fastbitsetA = construct(FastBitSet, [aIndices]);
    const fastbitsetB = construct(FastBitSet, [bIndices]);
    const fastbitsetIntersection = getMethod(
      fastbitsetA,
      hasMethod(fastbitsetA, "intersection") ? "intersection" : "and",
    );
    const fastbitsetHas = getMethod(fastbitsetA, "has");

    scenarios.push({
      name: "npm:fastbitset intersection",
      iterations: 100_000,
      isExternalPackage: true,
      comparisonBaselineName: "BooleanArray andInto preallocated",
      fn: () => {
        fastbitsetIntersection.call(fastbitsetA, fastbitsetB);
      },
    });
    scenarios.push({
      name: "npm:fastbitset has membership query",
      iterations: 250_000,
      isExternalPackage: true,
      comparisonBaselineName: "BooleanArray get membership query",
      fn: () => {
        for (let i = 0; i < queryIndices.length; i++) {
          membershipSink += fastbitsetHas.call(fastbitsetA, queryIndices[i]!) ? 1 : 0;
        }
      },
    });
  }

  if (bitwiseModule !== undefined) {
    const bitwise = asRecord(resolveExport(bitwiseModule, ["default"]));
    const bits = asRecord(bitwise["bits"]);
    const bitwiseBitsAnd = getMethod(bits, "and");
    scenarios.push({
      name: "npm:bitwise bits.and",
      iterations: 100_000,
      isExternalPackage: true,
      comparisonBaselineName: "BooleanArray andInto preallocated",
      fn: () => {
        bitwiseBitsAnd.call(bits, bitwiseBitsA, bitwiseBitsB);
      },
    });
  }

  if (bitArrayModule !== undefined) {
    const BitArray = resolveExport(bitArrayModule, ["default", "BitArray"]);
    const bitArrayA = construct(BitArray, [10_000]);
    const bitArrayB = construct(BitArray, [10_000]);
    for (const index of aIndices) {
      callMethod(bitArrayA, "set", [index, true]);
    }
    for (const index of bIndices) {
      callMethod(bitArrayB, "set", [index, true]);
    }
    const bitArrayAnd = getMethod(bitArrayA, "and");
    const bitArrayGet = getMethod(bitArrayA, "get");

    scenarios.push({
      name: "npm:bit-array AND",
      iterations: 100_000,
      isExternalPackage: true,
      comparisonBaselineName: "BooleanArray andInto preallocated",
      fn: () => {
        bitArrayAnd.call(bitArrayA, bitArrayB);
      },
    });
    scenarios.push({
      name: "npm:bit-array get membership query",
      iterations: 250_000,
      isExternalPackage: true,
      comparisonBaselineName: "BooleanArray get membership query",
      fn: () => {
        for (let i = 0; i < queryIndices.length; i++) {
          membershipSink += bitArrayGet.call(bitArrayA, queryIndices[i]!) ? 1 : 0;
        }
      },
    });
  }

  console.log("External package GC allocation comparison");
  console.log("This optional benchmark downloads npm packages when they are not already cached.");
  const summaries = new Array<ScenarioSummary>(scenarios.length);
  let index = 0;
  for (const scenario of scenarios) {
    summaries[index++] = runScenario(scenario);
  }

  if (checkMode && !checkExternalEvidence(summaries)) {
    Deno.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  Deno.exit(1);
});
