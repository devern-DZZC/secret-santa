import type { PersonId } from "./people";

/**
 * Pairs who must not draw each other, in either direction.
 * Rule numbers (R1 to R7) are the position in this list and appear in test output.
 * "Chris" in the host's rules means Christopher Ali (confirmed).
 */
export const exclusions: ReadonlyArray<readonly [PersonId, PersonId]> = [
  ["devern", "feisha"], // R1
  ["eeshana", "nathan"], // R2
  ["nirvana", "chris-alexander"], // R3
  ["chris-ali", "reyan"], // R4
  ["brandon", "chris-ali"], // R5
  ["brandon", "dana"], // R6
  ["chris-ali", "dana"], // R7
];
