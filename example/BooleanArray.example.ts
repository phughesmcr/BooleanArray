/**
 * @module
 * @description
 * This module demonstrates the usage of the BooleanArray class.
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
array.setBool(0, true);

// get the first bit
console.log("Getting the first bit");
console.log(array.getBool(0));

// set the first 10 bits to true
console.log("Setting the first 10 bits to true");
array.setRange(0, 10, true);

// get the first 10 bits
console.log("Getting the first 20 bits");
console.log(array.getBools(0, 20));

// get the population count
console.log("Getting the population count (should be 10)");
console.log(array.getPopulationCount());

// setting the 33rd bit to true
console.log("Setting the 33rd bit to true");
array.setBool(32, true);

// getting the 33rd bit
console.log("Getting the 33rd bit");
console.log(array.getBool(32));

// setting the 34th bit to true
console.log("Setting the 34th bit to true");
array.setBool(33, true);

// getting the 34th bit
console.log("Getting the 34th bit");
console.log(array.getBool(33));

// get the population count
console.log("Getting the population count (should be 12)");
console.log(array.getPopulationCount());

// unset the 1st bit
console.log("Unsetting the 1st bit");
array.setBool(0, false);

// get the population count
console.log("Getting the population count (should be 11)");
console.log(array.getPopulationCount());

// get first set bit
console.log("Getting the first set bit (should be 1 - the 2nd bit)");
console.log(array.getFirstSetIndex());

// get last set bit
console.log("Getting the last set bit (should be 33 - the 34th bit)");
console.log(array.getLastSetIndex());

// get all truthy indices
console.log("Getting all truthy indices");
console.log([...array.truthyIndices()]);
