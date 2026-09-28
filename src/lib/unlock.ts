import { people, type Person } from "../data/people";
import { getReceiverId } from "./drawStore";

export const PIN_PATTERN = /^\d{4}$/;

export const TRIVIAL_PINS: readonly string[] = [
  ...Array.from({ length: 10 }, (_, d) => String(d).repeat(4)),
  "1234",
  "4321",
  "1212",
];

export type PublicPerson = Omit<Person, "pin">;

export interface UnlockResult {
  giver: PublicPerson;
  receiver: PublicPerson;
}

const toPublic = ({ pin: _pin, ...rest }: Person): PublicPerson => rest;

/**
 * Returns this person's giftee only when the PIN is exactly theirs.
 * Anything else (wrong PIN, numbers, stray spaces, unknown names) returns null.
 */
export function unlock(personId: unknown, pin: unknown): UnlockResult | null {
  if (typeof personId !== "string" || typeof pin !== "string" || !PIN_PATTERN.test(pin)) return null;
  const giver = people.find((p) => p.id === personId);
  if (!giver || giver.pin !== pin) return null;
  const receiverId = getReceiverId(giver.id);
  const receiver = people.find((p) => p.id === receiverId);
  if (!receiver) return null;
  return { giver: toPublic(giver), receiver: toPublic(receiver) };
}
