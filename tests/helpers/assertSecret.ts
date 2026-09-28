/**
 * Assertion helper for anything that touches the real draw.
 * On failure it reports only the label, never the values compared,
 * so a failing test can't spoil who drew whom.
 */
export class SecretAssertionError extends Error {
  constructor(label: string) {
    super(label);
    this.name = "SecretAssertionError";
    this.stack = `${this.name}: ${label}`; // no stack frames with values
  }
}

export function assertSecret(condition: boolean, label: string): asserts condition {
  if (!condition) throw new SecretAssertionError(label);
}
