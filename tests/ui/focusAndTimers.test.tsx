import { setReducedMotion } from "./setupUi";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../src/ui/App";


beforeEach(() => {
  localStorage.clear();
  window.location.hash = "";
  setReducedMotion(true);
});

describe("keyboard and screen reader focus", () => {
  it("moves focus to the new screen's heading after navigating", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /find my giftee/i }));
    const heading = await screen.findByRole("heading", { name: /who are you/i });
    await vi.waitFor(() => expect(document.activeElement).toBe(heading));
  });
});

describe("the landing page on the night itself", () => {
  it("shows the gifting-time message instead of a countdown once the event starts", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-12-27T19:30:00-04:00"));
    render(<App />);
    expect(screen.getByText(/it's gifting time/i)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
