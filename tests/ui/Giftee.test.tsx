import { setReducedMotion } from "./setupUi";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Giftee } from "../../src/ui/screens/Giftee";
import { unlock } from "../../src/lib/unlock";

const confetti = vi.hoisted(() => vi.fn());
vi.mock("canvas-confetti", () => ({ default: confetti }));

// Full-motion path: the unwrap plays. (Draw is the public fixture, see setupUi.)
beforeEach(() => setReducedMotion(false));

const result = () => unlock("feisha", "2356")!;

describe("gift reveal", () => {
  it("takes 3 taps to open, then shows the giftee and 3 gift ideas", async () => {
    const user = userEvent.setup();
    render(<Giftee result={result()} playReveal onSwitch={() => {}} />);
    expect(screen.getByRole("heading", { name: /ready, feisha/i })).toBeInTheDocument();
    expect(screen.queryByText(/you're secret santa for/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open your gift, 3 taps to go/i }));
    await user.click(await screen.findByRole("button", { name: /open your gift, 2 taps to go/i }));
    await user.click(await screen.findByRole("button", { name: /open your gift, 1 tap to go/i }));

    expect(await screen.findByText(/you're secret santa for/i, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(confetti).toHaveBeenCalled();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("can skip the animation", async () => {
    const user = userEvent.setup();
    render(<Giftee result={result()} playReveal onSwitch={() => {}} />);
    await user.click(screen.getByRole("button", { name: /skip the animation/i }));
    expect(await screen.findByText(/you're secret santa for/i)).toBeInTheDocument();
  });

  it("goes straight to the giftee on a return visit, and can replay the reveal", async () => {
    const user = userEvent.setup();
    render(<Giftee result={result()} playReveal={false} onSwitch={() => {}} />);
    expect(screen.getByText(/you're secret santa for/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /replay the reveal/i }));
    expect(await screen.findByRole("heading", { name: /ready, feisha/i })).toBeInTheDocument();
  });
});
