/**
 * PUBLIC TEST FIXTURE, not the real draw.
 * E2E builds (`vite build --mode e2e`) use this instead of src/data/assignments.ts,
 * so automated browser tests and screenshots never show the real pairings.
 */
import { encodeReceiver } from "../../src/lib/secretCodec";
import { FIXTURE_DRAW } from "../helpers/fixtureDraw";

export const drawSalt = "e2e-fixture-salt";

export const encodedDraw: Record<string, string> = Object.fromEntries(
  Object.entries(FIXTURE_DRAW).map(([giver, receiver]) => [giver, encodeReceiver(drawSalt, giver, receiver)]),
);
