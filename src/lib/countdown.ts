export interface Countdown {
  done: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getCountdown(targetIso: string, nowMs: number): Countdown {
  const left = Math.floor((Date.parse(targetIso) - nowMs) / 1000);
  if (left <= 0) return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    done: false,
    days: Math.floor(left / 86_400),
    hours: Math.floor((left % 86_400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
  };
}
