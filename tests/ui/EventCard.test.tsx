import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { event } from "../../src/data/event";
import { EventCard } from "../../src/ui/components/EventCard";

describe("event itinerary card", () => {
  it("shows both stops with destination-specific map links", () => {
    render(<EventCard event={event} />);

    expect(screen.getByText("Mini golf")).toBeInTheDocument();
    expect(screen.getByText("Skallywag Bay")).toBeInTheDocument();
    expect(screen.getByText("Dinner afterward")).toBeInTheDocument();
    expect(screen.getByText("Sails Restaurant & Pub")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Skallywag Bay in Maps" })).toHaveAttribute(
      "href",
      event.stops[0]!.mapUrl,
    );
    expect(screen.getByRole("link", { name: "Open Sails Restaurant & Pub in Maps" })).toHaveAttribute(
      "href",
      event.stops[1]!.mapUrl,
    );
    expect(screen.getByRole("button", { name: "Add to calendar" })).toBeInTheDocument();
  });
});
