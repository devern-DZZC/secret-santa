import { CalendarBlank, CalendarPlus, Gift, MapPin, NavigationArrow, Wallet } from "@phosphor-icons/react";
import type { EventDetails } from "../../data/event";
import { buildIcs } from "../../lib/ics";
import { formatEventDate, formatEventTime } from "../format";

function downloadIcs(event: EventDetails) {
  const url = URL.createObjectURL(new Blob([buildIcs(event, Date.now())], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "cousins-secret-santa.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function EventCard({ event, compact = false }: { event: EventDetails; compact?: boolean }) {
  return (
    <section className={`event-card${compact ? " event-card--compact" : ""}`} aria-labelledby="event-heading">
      <h2 id="event-heading" className="event-card__title">
        {compact ? "See you there" : "Where and when"}
      </h2>
      <dl className="event-card__rows">
        <div className="event-card__row">
          <dt><CalendarBlank size={22} weight="duotone" aria-label="Date" /></dt>
          <dd>
            <strong>{formatEventDate(event.startsAt)}</strong>
            <span>{formatEventTime(event.startsAt)}</span>
          </dd>
        </div>
        <div className="event-card__row">
          <dt><MapPin size={22} weight="duotone" aria-label="Place" /></dt>
          <dd>
            <strong>{event.venueName}</strong>
            <span>{event.address}</span>
          </dd>
        </div>
        {event.budget && (
          <div className="event-card__row">
            <dt><Wallet size={22} weight="duotone" aria-label="Budget" /></dt>
            <dd>
              <strong>{event.budget}</strong>
              <span>Spending limit</span>
            </dd>
          </div>
        )}
        {!compact && event.notes && (
          <div className="event-card__row">
            <dt><Gift size={22} weight="duotone" aria-label="Note" /></dt>
            <dd><span>{event.notes}</span></dd>
          </div>
        )}
      </dl>
      <div className="event-card__actions">
        <a className="btn btn--ghost" href={event.mapUrl} target="_blank" rel="noopener noreferrer">
          <NavigationArrow size={20} weight="bold" aria-hidden="true" />
          <span>Open in Maps</span>
        </a>
        <button type="button" className="btn btn--ghost" onClick={() => downloadIcs(event)}>
          <CalendarPlus size={20} weight="bold" aria-hidden="true" />
          <span>Add to calendar</span>
        </button>
      </div>
    </section>
  );
}
