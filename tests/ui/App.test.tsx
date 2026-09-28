import "./setupUi";
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../src/ui/App";
import { rememberUnlock } from "../../src/lib/remember";
import { FIXTURE_DRAW } from "../helpers/fixtureDraw";
import { people } from "../../src/data/people";

const nameOf = (id: string) => people.find((p) => p.id === id)!.name;

async function go(hash: string) {
  window.location.hash = hash;
  render(<App />);
  await act(() => new Promise((r) => setTimeout(r, 0)));
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = "";
});

describe("App flow", () => {
  it("shows the event details and countdown on the landing page", async () => {
    await go("#/");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/secret santa/i);
    expect(screen.getByText(/the alley/i)).toBeInTheDocument();
    expect(screen.getByText(/27 december/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open in maps/i })).toHaveAttribute(
      "href",
      expect.stringContaining("google.com/maps"),
    );
    expect(screen.getByText(/days/i)).toBeInTheDocument();
  });

  it("goes landing → who are you → PIN → reveal → giftee", async () => {
    const user = userEvent.setup();
    await go("#/");
    await user.click(screen.getByRole("button", { name: /find my giftee/i }));
    expect(await screen.findByRole("heading", { name: /who are you/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^i'm /i })).toHaveLength(10);
    await user.click(screen.getByRole("button", { name: /i'm feisha/i }));
    expect(await screen.findByRole("heading", { name: /hi feisha/i })).toBeInTheDocument();
    await user.keyboard("2356");
    // reduced motion: the gift opens straight away
    expect(await screen.findByText(/you're secret santa for/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: nameOf(FIXTURE_DRAW.feisha!) })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("never shows a giftee from a pasted link without the PIN", async () => {
    await go("#/giftee/dana");
    expect(await screen.findByRole("heading", { name: /hi dana/i })).toBeInTheDocument();
    expect(screen.queryByText(/you're secret santa for/i)).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#/pin/dana");
  });

  it("a remembered cousin skips the PIN, but only for their own name", async () => {
    rememberUnlock("dana", "0946");
    const user = userEvent.setup();
    await go("#/who");
    await user.click(screen.getByRole("button", { name: /i'm dana/i }));
    expect(await screen.findByText(/you're secret santa for/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /not you/i }));
    await user.click(await screen.findByRole("button", { name: /i'm brandon/i }));
    expect(await screen.findByRole("heading", { name: /hi brandon/i })).toBeInTheDocument();
  });

  it("switching person forgets the remembered unlock", async () => {
    rememberUnlock("dana", "0946");
    const user = userEvent.setup();
    await go("#/giftee/dana");
    await user.click(await screen.findByRole("button", { name: /not you/i }));
    expect(localStorage.getItem("ss:remembered")).toBeNull();
  });

  it("a remembered PIN that no longer matches asks for the PIN again", async () => {
    rememberUnlock("dana", "9999");
    await go("#/giftee/dana");
    expect(await screen.findByRole("heading", { name: /hi dana/i })).toBeInTheDocument();
  });
});
