/// <reference lib="deno.ns" />
/// <reference lib="dom" />
// deno-lint-ignore-file no-console

import {
  and,
  andInto,
  BooleanArray,
  containsAll,
  difference,
  differenceInto,
  fromArray,
  fromObjects,
  intersects,
  nandInto,
  norInto,
  notInto,
  orInto,
  xnorInto,
  xorInto,
} from "../mod.ts";

type GcFn = () => void;

type Scenario = {
  name: string;
  iterations: number;
  fn: () => void;
  rounds?: number;
  warmupIterations?: number;
  maxSteadyStateBeforeGcBytesPerIter?: number;
};

type MemorySnapshot = ReturnType<typeof Deno.memoryUsage>;
type RoundMeasurement = {
  beforeGc: MemorySnapshot;
  retainedAfterGc: MemorySnapshot;
};
type ScenarioSummary = {
  scenario: Scenario;
  lowestBeforeGc: MemorySnapshot;
  lowestRetainedAfterGc: MemorySnapshot;
  highestSteadyStateBeforeGc: MemorySnapshot;
};

const DEFAULT_ROUNDS = 3;
const DEFAULT_WARMUP_ITERATIONS = 10_000;
const checkMode = Deno.args.includes("--check");

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

function bytesPerIteration(delta: MemorySnapshot, iterations: number): number {
  return (delta.heapUsed + delta.external) / iterations;
}

function measureRound(scenario: Scenario): RoundMeasurement {
  collect();
  const before = Deno.memoryUsage();

  for (let i = 0; i < scenario.iterations; i++) {
    scenario.fn();
  }

  const beforeCollection = Deno.memoryUsage();
  collect();
  const afterCollection = Deno.memoryUsage();

  return {
    beforeGc: diff(beforeCollection, before),
    retainedAfterGc: diff(afterCollection, before),
  };
}

function warmupScenario(scenario: Scenario): void {
  const iterations = Math.min(scenario.iterations, scenario.warmupIterations ?? DEFAULT_WARMUP_ITERATIONS);
  for (let i = 0; i < iterations; i++) {
    scenario.fn();
  }
  collect();
}

function totalBytes(delta: MemorySnapshot): number {
  return delta.heapUsed + delta.external;
}

function selectLowestAllocRound(rounds: RoundMeasurement[], key: keyof RoundMeasurement): MemorySnapshot {
  let best = rounds[0]![key];
  for (let i = 1; i < rounds.length; i++) {
    const candidate = rounds[i]![key];
    if (totalBytes(candidate) < totalBytes(best)) {
      best = candidate;
    }
  }
  return best;
}

function selectHighestAllocRound(
  rounds: RoundMeasurement[],
  key: keyof RoundMeasurement,
  startRound: number,
): MemorySnapshot {
  let worst = rounds[startRound]![key];
  for (let i = startRound + 1; i < rounds.length; i++) {
    const candidate = rounds[i]![key];
    if (totalBytes(candidate) > totalBytes(worst)) {
      worst = candidate;
    }
  }
  return worst;
}

function runScenario(scenario: Scenario): ScenarioSummary {
  const roundCount = scenario.rounds ?? DEFAULT_ROUNDS;
  const rounds = new Array<RoundMeasurement>(roundCount);

  console.log(`\n${scenario.name} (${scenario.iterations.toLocaleString()} iterations)`);
  warmupScenario(scenario);
  for (let round = 0; round < roundCount; round++) {
    const measurement = measureRound(scenario);
    rounds[round] = measurement;
    printRow(`round ${round + 1} before GC`, measurement.beforeGc, scenario.iterations);
    printRow(`round ${round + 1} retained after GC`, measurement.retainedAfterGc, scenario.iterations);
  }
  const lowestBeforeGc = selectLowestAllocRound(rounds, "beforeGc");
  const lowestRetainedAfterGc = selectLowestAllocRound(rounds, "retainedAfterGc");
  const steadyStateStartRound = roundCount > 1 ? 1 : 0;
  const highestSteadyStateBeforeGc = selectHighestAllocRound(rounds, "beforeGc", steadyStateStartRound);
  printRow("lowest before GC", lowestBeforeGc, scenario.iterations);
  printRow("lowest retained after GC", lowestRetainedAfterGc, scenario.iterations);
  if (roundCount > 1) {
    printRow("highest steady-state before GC", highestSteadyStateBeforeGc, scenario.iterations);
  }

  return {
    scenario,
    lowestBeforeGc,
    lowestRetainedAfterGc,
    highestSteadyStateBeforeGc,
  };
}

function checkBudgets(summaries: ScenarioSummary[]): boolean {
  let passed = true;
  console.log("\nAllocation budget check");

  for (const summary of summaries) {
    const budget = summary.scenario.maxSteadyStateBeforeGcBytesPerIter;
    if (budget === undefined) continue;

    const actual = bytesPerIteration(summary.highestSteadyStateBeforeGc, summary.scenario.iterations);
    const ok = actual <= budget;
    passed &&= ok;
    const status = ok ? "PASS" : "FAIL";
    console.log(
      `${status} ${summary.scenario.name}: highest steady-state before-GC ${
        actual.toFixed(4)
      } B/iter <= ${budget} B/iter`,
    );
  }

  return passed;
}

const small = new BooleanArray(1024);
const medium = new BooleanArray(10_000);
const source = new BooleanArray(1024);
const dest = new BooleanArray(1024);
const rawExportOut = new Uint32Array(source.wordLength);
const rawImportArray = new Array<number>(source.wordLength);
const bitwiseA = new BooleanArray(10_000);
const bitwiseB = new BooleanArray(10_000);
const bitwiseOut = new BooleanArray(10_000);
const bitwiseInPlace = new BooleanArray(10_000);
const rawWordLength = bitwiseA.wordLength;
const rawA = new Uint32Array(rawWordLength);
const rawB = new Uint32Array(rawWordLength);
const rawOut = new Uint32Array(rawWordLength);
const booleanArrayA = new Array<boolean>(10_000).fill(false);
const booleanArrayB = new Array<boolean>(10_000).fill(false);
const booleanArrayOut = new Array<boolean>(10_000).fill(false);
const setA = new Set<number>();
const setB = new Set<number>();
const setOut = new Set<number>();
const boolOut = new Array<boolean>(1024);
const byteOut = new Uint8Array(1024);
const byteMaskSource = new Uint8Array(1024);
const byteMaskArray = new Array<number>(1024);
const indexOut = new Uint32Array(1024);
const bulkIndices = new Uint32Array(1024);
const bulkIndexArray = new Array<number>(1024);
const duplicateIndexStream = new Uint32Array(2048);
const copyBooleanSource = new Array<boolean>(1024).fill(false);
const copyObjectSource = new Array<{ entity: number }>(512);
const setObjectSource = new Array<{ entity: number }>(512);
const framePrevious = new BooleanArray(10_000);
const frameCurrent = new BooleanArray(10_000);
const frameVisibleMask = new BooleanArray(10_000);
const frameDamageMask = new BooleanArray(10_000);
const frameScratch = new BooleanArray(10_000);
const frameSpawnObjects = new Array<{ entity: number }>(512);
const frameVisibleIndices = new Uint32Array(10_000);
const frameExportBytes = new Uint8Array(1024);
const noopForEach = (): void => {};
let cursorSink = 0;
let baselineSink = 0;
let querySink = 0;
let iteratorSink = 0;
let frameSink = 0;

source.fill(true);
medium.set(0, 10_000, true);
bitwiseA.set(0, 5_000, true);
bitwiseB.set(2_500, 5_000, true);
bitwiseInPlace.set(0, 5_000, true);
framePrevious.set(0, 3_000, true);
framePrevious.set(7_000, 1_000, true);
frameVisibleMask.set(1_000, 6_000, true);
frameDamageMask.set(2_500, 300, true);
rawA.set(bitwiseA.buffer);
rawB.set(bitwiseB.buffer);
for (let i = 0; i < 5_000; i++) {
  booleanArrayA[i] = true;
  setA.add(i);
}
for (let i = 2_500; i < 7_500; i++) {
  booleanArrayB[i] = true;
  setB.add(i);
}
for (let i = 0; i < bulkIndices.length; i++) {
  bulkIndices[i] = i;
  bulkIndexArray[i] = i;
  duplicateIndexStream[i] = i & 1023;
  duplicateIndexStream[i + bulkIndices.length] = i & 1023;
  byteMaskSource[i] = (i & 1) === 0 ? 1 : 0;
  byteMaskArray[i] = byteMaskSource[i]!;
  copyBooleanSource[i] = (i & 1) === 0;
  if (i < rawImportArray.length) {
    rawImportArray[i] = i % 3 === 0 ? 0xFFFFFFFF : 0;
  }
  if (i < frameSpawnObjects.length) {
    frameSpawnObjects[i] = { entity: 8_000 + i };
  }
  if (i < copyObjectSource.length) {
    copyObjectSource[i] = { entity: i * 2 };
    setObjectSource[i] = { entity: i };
  }
}

const scenarios: Scenario[] = [
  {
    name: "constructor medium",
    iterations: 50_000,
    fn: () => {
      new BooleanArray(1024);
    },
  },
  {
    name: "boolean[] constructor medium baseline",
    iterations: 50_000,
    fn: () => {
      new Array<boolean>(1024).fill(false);
    },
  },
  {
    name: "Uint32Array constructor medium baseline",
    iterations: 50_000,
    fn: () => {
      new Uint32Array(32);
    },
  },
  {
    name: "copyFrom aligned full",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFrom(source);
    },
  },
  {
    name: "copyFrom aligned partial",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFrom(source, 32, 64, 512);
    },
  },
  {
    name: "copyFrom unaligned partial",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFrom(source, 3, 19, 511);
    },
  },
  {
    name: "copyFrom unaligned overlapping self-copy",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFrom(dest, 3, 19, 511);
    },
  },
  {
    name: "cloneInto preallocated",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      source.cloneInto(dest);
    },
  },
  {
    name: "copyFromUint32Array preallocated",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFromUint32Array(source.buffer);
    },
  },
  {
    name: "copyFromUint32Array number[] preallocated",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFromUint32Array(rawImportArray);
    },
  },
  {
    name: "copyFromUint8Array preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFromUint8Array(byteMaskSource);
    },
  },
  {
    name: "copyFromUint8Array number[] preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFromUint8Array(byteMaskArray);
    },
  },
  {
    name: "copyToUint8Array preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      source.copyToUint8Array(byteOut);
    },
  },
  {
    name: "copyToUint32Array preallocated",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      source.copyToUint32Array(rawExportOut);
    },
  },
  {
    name: "fromArray boolean[] allocating",
    iterations: 100_000,
    fn: () => {
      fromArray(1024, copyBooleanSource);
    },
  },
  {
    name: "copyFromArray boolean[] preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFromArray(copyBooleanSource);
    },
  },
  {
    name: "fromArray index array allocating",
    iterations: 100_000,
    fn: () => {
      fromArray(1024, bulkIndexArray);
    },
  },
  {
    name: "copyFromArray index Uint32Array preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFromArray(bulkIndices);
    },
  },
  {
    name: "copyFromArray index number[] preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFromArray(bulkIndexArray);
    },
  },
  {
    name: "copyFromArray duplicate index stream preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFromArray(duplicateIndexStream);
    },
  },
  {
    name: "fromObjects allocating",
    iterations: 100_000,
    fn: () => {
      fromObjects(1024, "entity", copyObjectSource);
    },
  },
  {
    name: "copyFromObjects preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.copyFromObjects("entity", copyObjectSource);
    },
  },
  {
    name: "setFromObjects preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.setFromObjects("entity", setObjectSource, true);
      dest.setFromObjects("entity", setObjectSource, false);
    },
  },
  {
    name: "game frame scratch-buffer reuse",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      frameCurrent.copyFrom(framePrevious);
      frameCurrent.setFromObjects("entity", frameSpawnObjects, true);
      andInto(frameCurrent, frameVisibleMask, frameScratch);
      frameSink ^= frameScratch.intersects(frameDamageMask) ? 1 : 0;
      frameSink ^= frameScratch.truthyIndicesInto(frameVisibleIndices);
      frameScratch.getUint8Into(0, 1024, frameExportBytes);
      frameSink ^= frameExportBytes[0]!;
    },
  },
  {
    name: "fill and clear bulk mutation",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.fill(true);
      dest.clear();
    },
  },
  {
    name: "set range bulk mutation",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.set(0, 1024, true);
      dest.set(0, 1024, false);
    },
  },
  {
    name: "setFromIndices preallocated Uint32Array",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.setFromIndices(bulkIndices, true);
      dest.setFromIndices(bulkIndices, false);
    },
  },
  {
    name: "setFromIndices preallocated number[]",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.setFromIndices(bulkIndexArray, true);
      dest.setFromIndices(bulkIndexArray, false);
    },
  },
  {
    name: "single-bit mutation operations",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      dest.set(17, true);
      dest.toggle(17);
      dest.set(17, false);
    },
  },
  {
    name: "and functional allocating",
    iterations: 100_000,
    fn: () => {
      and(bitwiseA, bitwiseB);
    },
  },
  {
    name: "boolean[] AND allocating baseline",
    iterations: 100_000,
    fn: () => {
      const out = new Array<boolean>(booleanArrayA.length);
      for (let i = 0; i < booleanArrayA.length; i++) {
        out[i] = booleanArrayA[i]! && booleanArrayB[i]!;
      }
      baselineSink ^= out[2_500] ? 1 : 0;
    },
  },
  {
    name: "Uint32Array AND allocating baseline",
    iterations: 100_000,
    fn: () => {
      const out = new Uint32Array(rawWordLength);
      for (let i = 0; i < rawWordLength; i++) {
        out[i] = rawA[i]! & rawB[i]!;
      }
      baselineSink ^= out[78]!;
    },
  },
  {
    name: "Uint32Array AND preallocated baseline",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      for (let i = 0; i < rawWordLength; i++) {
        rawOut[i] = rawA[i]! & rawB[i]!;
      }
      baselineSink ^= rawOut[78]!;
    },
  },
  {
    name: "boolean[] AND preallocated baseline",
    iterations: 100_000,
    fn: () => {
      for (let i = 0; i < booleanArrayA.length; i++) {
        booleanArrayOut[i] = booleanArrayA[i]! && booleanArrayB[i]!;
      }
      baselineSink ^= booleanArrayOut[2_500] ? 1 : 0;
    },
  },
  {
    name: "Set<number> intersection allocating baseline",
    iterations: 50_000,
    fn: () => {
      const out = new Set<number>();
      for (const index of setA) {
        if (setB.has(index)) {
          out.add(index);
        }
      }
      baselineSink ^= out.size;
    },
  },
  {
    name: "Set<number> intersection reused baseline",
    iterations: 50_000,
    fn: () => {
      setOut.clear();
      for (const index of setA) {
        if (setB.has(index)) {
          setOut.add(index);
        }
      }
      baselineSink ^= setOut.size;
    },
  },
  {
    name: "andInto preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      andInto(bitwiseA, bitwiseB, bitwiseOut);
    },
  },
  {
    name: "orInto preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      orInto(bitwiseA, bitwiseB, bitwiseOut);
    },
  },
  {
    name: "xorInto preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      xorInto(bitwiseA, bitwiseB, bitwiseOut);
    },
  },
  {
    name: "differenceInto preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      differenceInto(bitwiseA, bitwiseB, bitwiseOut);
    },
  },
  {
    name: "nandInto preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      nandInto(bitwiseA, bitwiseB, bitwiseOut);
    },
  },
  {
    name: "norInto preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      norInto(bitwiseA, bitwiseB, bitwiseOut);
    },
  },
  {
    name: "xnorInto preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      xnorInto(bitwiseA, bitwiseB, bitwiseOut);
    },
  },
  {
    name: "notInto preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      notInto(bitwiseA, bitwiseOut);
    },
  },
  {
    name: "in-place bitwise operations",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      bitwiseInPlace.copyFrom(bitwiseA);
      bitwiseInPlace.and(bitwiseB).or(bitwiseB).xor(bitwiseB).difference(bitwiseB);
      bitwiseInPlace.not().nand(bitwiseB).nor(bitwiseB).xnor(bitwiseB);
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
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      small.getInto(0, 1024, boolOut);
    },
  },
  {
    name: "getUint8Into preallocated",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      small.getUint8Into(0, 1024, byteOut);
    },
  },
  {
    name: "single-bit get query",
    iterations: 250_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      querySink ^= small.get(17) ? 1 : 0;
    },
  },
  {
    name: "count and state queries",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      querySink ^= medium.getCount(true);
      querySink ^= medium.getCount(false);
      querySink ^= medium.isFull() ? 1 : 0;
      querySink ^= medium.isEmpty() ? 1 : 0;
    },
  },
  {
    name: "index search queries",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      querySink ^= bitwiseA.indexOf(true);
      querySink ^= bitwiseA.indexOf(false);
      querySink ^= bitwiseA.lastIndexOf(true);
      querySink ^= bitwiseA.lastIndexOf(false);
    },
  },
  {
    name: "equals query",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      querySink ^= bitwiseA.equals(bitwiseB) ? 1 : 0;
      querySink ^= bitwiseA.equals(bitwiseA) ? 1 : 0;
    },
  },
  {
    name: "and then isEmpty allocating overlap query",
    iterations: 100_000,
    fn: () => {
      querySink ^= and(bitwiseA, bitwiseB).isEmpty() ? 1 : 0;
    },
  },
  {
    name: "intersects query",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      querySink ^= intersects(bitwiseA, bitwiseB) ? 1 : 0;
      querySink ^= bitwiseA.intersects(bitwiseB) ? 1 : 0;
    },
  },
  {
    name: "difference then isEmpty allocating subset query",
    iterations: 100_000,
    fn: () => {
      querySink ^= difference(bitwiseB, bitwiseA).isEmpty() ? 1 : 0;
    },
  },
  {
    name: "containsAll query",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      querySink ^= containsAll(bitwiseA, bitwiseB) ? 1 : 0;
      querySink ^= bitwiseA.containsAll(bitwiseB) ? 1 : 0;
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
    name: "boolean[] truthy indices allocating baseline",
    iterations: 50_000,
    fn: () => {
      const out: number[] = [];
      for (let i = 0; i < booleanArrayA.length; i++) {
        if (booleanArrayA[i]) {
          out.push(i);
        }
      }
      baselineSink ^= out.length;
    },
  },
  {
    name: "truthyIndicesInto preallocated",
    iterations: 50_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      medium.truthyIndicesInto(indexOut);
    },
  },
  {
    name: "falsyIndicesInto preallocated",
    iterations: 50_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      bitwiseA.falsyIndicesInto(indexOut);
    },
  },
  {
    name: "nextTruthyIndex cursor",
    iterations: 50_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      let count = 0;
      for (let index = medium.nextTruthyIndex(); index !== -1; index = medium.nextTruthyIndex(index + 1)) {
        count++;
      }
      cursorSink ^= count;
    },
  },
  {
    name: "nextFalsyIndex cursor",
    iterations: 50_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      let count = 0;
      for (let index = bitwiseA.nextFalsyIndex(); index !== -1; index = bitwiseA.nextFalsyIndex(index + 1)) {
        count++;
      }
      cursorSink ^= count;
    },
  },
  {
    name: "values iterator",
    iterations: 100_000,
    fn: () => {
      const iterator = small.values();
      const result = iterator.next();
      iteratorSink ^= result.value ? 1 : 0;
      iteratorSink ^= result.done ? 1 : 0;
    },
  },
  {
    name: "default iterator",
    iterations: 100_000,
    fn: () => {
      const iterator = small[Symbol.iterator]();
      const result = iterator.next();
      iteratorSink ^= result.value ? 1 : 0;
      iteratorSink ^= result.done ? 1 : 0;
    },
  },
  {
    name: "keys iterator",
    iterations: 100_000,
    fn: () => {
      const iterator = small.keys();
      const result = iterator.next();
      iteratorSink ^= result.value ?? 0;
      iteratorSink ^= result.done ? 1 : 0;
    },
  },
  {
    name: "entries iterator",
    iterations: 100_000,
    fn: () => {
      const iterator = small.entries();
      const result = iterator.next();
      if (result.value !== undefined) {
        iteratorSink ^= result.value[0];
        iteratorSink ^= result.value[1] ? 1 : 0;
      }
      iteratorSink ^= result.done ? 1 : 0;
    },
  },
  {
    name: "truthyIndices iterator",
    iterations: 100_000,
    fn: () => {
      const iterator = medium.truthyIndices();
      const result = iterator.next();
      iteratorSink ^= result.value ?? 0;
      iteratorSink ^= result.done ? 1 : 0;
    },
  },
  {
    name: "forEach zero-allocation iteration",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      small.forEach(noopForEach, 0, 32);
    },
  },
  {
    name: "forEachTruthy zero-allocation iteration",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      medium.forEachTruthy(noopForEach);
    },
  },
  {
    name: "forEachFalsy zero-allocation iteration",
    iterations: 100_000,
    maxSteadyStateBeforeGcBytesPerIter: 0.5,
    fn: () => {
      bitwiseA.forEachFalsy(noopForEach);
    },
  },
];

console.log("GC allocation pressure benchmark");
console.log("Measures memory growth during tight loops, forcing GC between each round.");

const summaries: ScenarioSummary[] = [];
for (const scenario of scenarios) {
  summaries.push(runScenario(scenario));
}

if (checkMode && !checkBudgets(summaries)) {
  Deno.exit(1);
}

if (cursorSink === Number.MIN_SAFE_INTEGER) {
  console.log("unreachable", cursorSink);
}

if (baselineSink === Number.MIN_SAFE_INTEGER) {
  console.log("unreachable", baselineSink);
}

if (querySink === Number.MIN_SAFE_INTEGER) {
  console.log("unreachable", querySink);
}

if (iteratorSink === Number.MIN_SAFE_INTEGER) {
  console.log("unreachable", iteratorSink);
}

if (frameSink === Number.MIN_SAFE_INTEGER) {
  console.log("unreachable", frameSink);
}
