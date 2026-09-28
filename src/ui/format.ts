const TZ = "America/Port_of_Spain";

export const formatEventDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ })
    .format(new Date(iso));

export const formatEventTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ })
    .format(new Date(iso))
    .replace("AM", "am")
    .replace("PM", "pm");

export const formatClock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
