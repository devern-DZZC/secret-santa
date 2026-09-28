/**
 * Scrambles each receiver so the committed draw file can't be read at a glance.
 * This is obfuscation for family fun, not real security.
 *
 * Every receiver id is padded to a fixed width before scrambling, so the
 * encoded length never hints at whose name is inside.
 */
import { fnv1a, mulberry32 } from "./rng";

export const ENCODED_WIDTH = 24;

function keystream(salt: string, giverId: string, length: number): Uint8Array {
  const rng = mulberry32(fnv1a(`${salt}:${giverId}`));
  return Uint8Array.from({ length }, () => Math.floor(rng() * 256));
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

export function encodeReceiver(salt: string, giverId: string, receiverId: string): string {
  if (receiverId.length > ENCODED_WIDTH) throw new RangeError("Receiver id is too long to encode.");
  const plain = new TextEncoder().encode(receiverId.padEnd(ENCODED_WIDTH, " "));
  const key = keystream(salt, giverId, plain.length);
  return toBase64(plain.map((b, i) => b ^ key[i]!));
}

export function decodeReceiver(salt: string, giverId: string, encoded: string): string {
  const bytes = fromBase64(encoded);
  const key = keystream(salt, giverId, bytes.length);
  return new TextDecoder().decode(bytes.map((b, i) => b ^ key[i]!)).trimEnd();
}

export function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
