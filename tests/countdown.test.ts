import { describe, expect, it } from "vitest";
import { getCountdown } from "../src/lib/countdown";

const TARGET = "2026-12-27T19:00:00-04:00";
const targetMs = Date.parse(TARGET);

describe("countdown to the exchange", () => {
  it("breaks the time left into days, hours, minutes and seconds", () => {
    const now = targetMs - ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000;
    expect(getCountdown(TARGET, now)).toEqual({ done: false, days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it("rounds partial seconds down", () => {
    expect(getCountdown(TARGET, targetMs - 1500)).toEqual({ done: false, days: 0, hours: 0, minutes: 0, seconds: 1 });
  });

  it("is done (with zeros, never negatives) at and after the start time", () => {
    const zero = { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    expect(getCountdown(TARGET, targetMs)).toEqual(zero);
    expect(getCountdown(TARGET, targetMs + 86_400_000)).toEqual(zero);
  });

  it("counts from today (28 Sep 2026, 6pm Trinidad) to 27 Dec, 7pm", () => {
    const c = getCountdown(TARGET, Date.parse("2026-09-28T18:00:00-04:00"));
    expect(c).toMatchObject({ done: false, days: 90, hours: 1, minutes: 0, seconds: 0 });
  });
});
