// deno-lint-ignore-file no-console
/// <reference lib="deno.ns" />
/// <reference lib="dom" />

/**
 * @description This module demonstrates the usage of the BooleanArray class.
 * @module
 */

import { BooleanArray } from "../mod.ts";

console.clear();

// create a new BooleanArray with a size of 64
console.log("Creating a new BooleanArray with a size of 64");
const array = new BooleanArray(64);

// log the size
console.log("Size of the array:", array.size);

// set the first bit to true
console.log("Setting the first bit to true");
array.set(0, true);

// get the first bit
console.log("Getting the first bit");
console.log(array.get(0));

// set the first 10 bits to true
console.log("Setting the first 10 bits to true");
array.set(0, 10, true);

// get the first 10 bits
console.log("Getting the first 20 bits");
console.log(array.get(0, 20));

// get the population count
console.log("Getting the population count (should be 10)");
console.log(array.getTruthyCount());

// setting the 33rd bit to true
console.log("Setting the 33rd bit to true");
array.set(32, true);

// getting the 33rd bit
console.log("Getting the 33rd bit");
console.log(array.get(32));

// setting the 34th bit to true
console.log("Setting the 34th bit to true");
array.set(33, true);

// getting the 34th bit
console.log("Getting the 34th bit");
console.log(array.get(33));

// get the population count
console.log("Getting the population count (should be 12)");
console.log(array.getTruthyCount());

// unset the 1st bit
console.log("Unsetting the 1st bit");
array.set(0, false);

// get the population count
console.log("Getting the population count (should be 11)");
console.log(array.getTruthyCount());

// get first set bit
console.log("Getting the first set bit (should be 1 - the 2nd bit)");
console.log(array.indexOf(true));

// get last set bit
console.log("Getting the last set bit (should be 33 - the 34th bit)");
console.log(array.lastIndexOf(true));

// get all truthy indices
console.log("Getting all truthy indices");
console.log([...array.truthyIndices()]);

// get all values
console.log("Getting all values");
console.log([...array]);