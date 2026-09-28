import "./setupUi";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PinPad } from "../../src/ui/screens/PinPad";
import { createAttemptTracker } from "../../src/lib/attempts";
import { people } from "../../src/data/people";

const devern = people.find((p) => p.id === "devern")!;

function setup() {
  const onUnlocked = vi.fn();
  const tracker = createAttemptTracker();
  render(<PinPad person={devern} tracker={tracker} onUnlocked={onUnlocked} onBack={() => {}} />);
  return { onUnlocked, user: userEvent.setup() };
}

const tapDigits = async (user: ReturnType<typeof userEvent.setup>, digits: string) => {
  for (const d of digits) await user.click(screen.getByRole("button", { name: d }));
};

beforeEach(() => localStorage.clear());

describe("PIN pad", () => {
  it("greets the person by name", () => {
    setup();
    expect(screen.getByRole("heading", { name: /hi devern/i })).toBeInTheDocument();
  });

  it("unlocks automatically on the 4th correct digit", async () => {
    const { onUnlocked, user } = setup();
    await tapDigits(user, "2004");
    await vi.waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
    expect(onUnlocked.mock.calls[0]![0].giver.id).toBe("devern");
  });

  it("announces progress for screen readers", async () => {
    const { user } = setup();
    await tapDigits(user, "20");
    expect(screen.getByRole("status")).toHaveTextContent("2 of 4 digits entered");
  });

  it("backspace removes the last digit", async () => {
    const { user } = setup();
    await tapDigits(user, "20");
    await user.click(screen.getByRole("button", { name: /delete last digit/i }));
    expect(screen.getByRole("status")).toHaveTextContent("1 of 4 digits entered");
  });

  it("a wrong PIN shows an error, clears the dots and does not unlock", async () => {
    const { onUnlocked, user } = setup();
    await tapDigits(user, "2356"); // Feisha's PIN
    expect(await screen.findByRole("alert")).toHaveTextContent(/that's not your pin/i);
    await vi.waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("0 of 4 digits entered"));
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it("accepts a hardware keyboard", async () => {
    const { onUnlocked, user } = setup();
    await user.keyboard("2004");
    await vi.waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
  });

  it("accepts a pasted PIN, ignoring non-digits and extra digits", async () => {
    const { onUnlocked } = setup();
    const input = screen.getByLabelText(/pin/i, { selector: "input" });
    fireEvent.change(input, { target: { value: "2a0 0419" } });
    await vi.waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
  });

  it("does not cut a pasted PIN short when it has spaces in it", async () => {
    const { onUnlocked, user } = setup();
    const input = screen.getByLabelText(/pin/i, { selector: "input" });
    expect(input).not.toHaveAttribute("maxlength");
    await user.click(input);
    await user.paste("20 04");
    await vi.waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
  });

  it("locks for 30 seconds after 5 wrong PINs, refusing even the right one", async () => {
    const { onUnlocked, user } = setup();
    for (let i = 0; i < 5; i++) {
      await tapDigits(user, "1111");
      await vi.waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("0 of 4 digits entered"));
    }
    expect(await screen.findByText(/the elves need a break/i)).toBeInTheDocument();
    // the alert is announced once; the ticking clock sits outside it
    expect(screen.getByRole("alert").textContent).not.toMatch(/\d:\d\d/);
    expect(screen.getByText(/^\d:\d\d$/)).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "2" })).toBeDisabled();
    await user.keyboard("2004");
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it("warns when only a couple of tries are left", async () => {
    const { user } = setup();
    for (let i = 0; i < 3; i++) {
      await tapDigits(user, "1111");
      await vi.waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("0 of 4 digits entered"));
    }
    expect(screen.getByRole("alert")).toHaveTextContent(/2 tries left/i);
  });
});
