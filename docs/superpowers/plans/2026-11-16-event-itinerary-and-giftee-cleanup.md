# Event Itinerary and Giftee Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single East Gates venue with a two-stop Chaguaramas itinerary at 6:00 pm and remove gift recommendations from the data model and interface while preserving the private draw and festive reveal.

**Architecture:** Extend the existing event data with ordered `stops`, then let the event card and calendar builder consume the same source of truth. Remove wishlist data at the `Person` boundary so neither unlock results nor UI code can expose recommendations, and replace the old idea list with a compact mission block.

**Tech Stack:** React 18, TypeScript 5, Vite 8, Motion, Vitest and Testing Library, Playwright, plain CSS, static GitHub Pages deployment.

---

## File map

- `src/data/event.ts`: owns the date, duration, ordered stops, budget, and event note.
- `src/lib/ics.ts`: turns the event and both stops into one escaped calendar event.
- `src/ui/components/EventCard.tsx`: renders date, time, both stops, destination-specific Maps links, and the calendar download.
- `src/data/people.ts`: keeps identity, emoji, and PIN data only; recommendation fields are deleted.
- `src/ui/screens/Giftee.tsx`: preserves the reveal and replaces recommendations with mission copy.
- `src/styles/app.css`: styles itinerary links and the shorter giftee layout; removes recommendation-only styles.
- `tests/ics.test.ts`: verifies exact event facts and calendar output.
- `tests/ui/EventCard.test.tsx`: verifies both itinerary stops and their accessible links.
- `tests/rules.test.ts`: verifies each participant keeps the required identity fields without recommendation data.
- `tests/unlock.test.ts`: verifies unlock results contain public identity data without wishlist or PIN data.
- `tests/ui/Giftee.test.tsx`: verifies the reveal ends on the clean recommendation-free screen.
- `e2e/app.spec.ts`: verifies the changed landing and reveal flows in real mobile browsers.
- `README.md`: describes the confirmed event and recommendation-free experience.

### Task 1: Model the itinerary and update the calendar file

**Files:**
- Modify: `tests/ics.test.ts:19-44`
- Modify: `src/data/event.ts:1-23`
- Modify: `src/lib/ics.ts:8-29`

- [ ] **Step 1: Replace the event and calendar assertions with the approved facts**

Update the time, location, itinerary, and data-shape tests in `tests/ics.test.ts`:

```ts
it("starts at 6pm Trinidad time (22:00 UTC) on 27 Dec 2026 and runs 3 hours", () => {
  expect(lines).toContain("DTSTART:20261227T220000Z");
  expect(lines).toContain("DTEND:20261228T010000Z");
  expect(lines).toContain("DTSTAMP:20260928T220000Z");
});

it("uses the first stop as the location and includes the full itinerary", () => {
  expect(lines).toContain(`SUMMARY:${event.title.replace(/,/g, "\\,")}`);
  expect(ics).toContain("LOCATION:Skallywag Bay\\, Chaguaramas\\, Trinidad");
  expect(ics).toContain("1. Mini golf: Skallywag Bay");
  expect(ics).toContain("2. Dinner afterward: Sails Restaurant & Pub");
  expect(ics).toContain("Powerboats Marina\\, Western Main Road\\, Chaguaramas");
  expect(ics).toContain(event.stops[0].mapUrl);
  expect(ics).toContain(event.stops[1].mapUrl);
  expect(lines.some((line) => line.startsWith("UID:"))).toBe(true);
});
```

Replace the host-details test with:

```ts
it("matches the host's details", () => {
  expect(event.startsAt).toBe("2026-12-27T18:00:00-04:00");
  expect(event.stops).toEqual([
    {
      label: "Mini golf",
      name: "Skallywag Bay",
      address: "Chaguaramas, Trinidad",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Skallywag+Bay+Chaguaramas+Trinidad",
    },
    {
      label: "Dinner afterward",
      name: "Sails Restaurant & Pub",
      address: "Powerboats Marina, Western Main Road, Chaguaramas",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Sails+Restaurant+and+Pub+Chaguaramas+Trinidad",
    },
  ]);
  expect(event.budget).toBeNull();
});
```

- [ ] **Step 2: Run the calendar tests and confirm they fail for the old model**

Run: `npx vitest run tests/ics.test.ts`

Expected: FAIL because `event.stops` does not exist and the old event begins at 7:00 pm.

- [ ] **Step 3: Replace the single venue fields with ordered stops**

Change `src/data/event.ts` to this shape and data:

```ts
export interface EventStop {
  label: string;
  name: string;
  address: string;
  mapUrl: string;
}

export interface EventDetails {
  title: string;
  /** ISO time with Trinidad's offset (UTC-4, no daylight saving). */
  startsAt: string;
  durationHours: number;
  stops: readonly EventStop[];
  /** Spending limit, e.g. "$200 TTD". Leave null to hide it until it's decided. */
  budget: string | null;
  notes: string;
}

export const event: EventDetails = {
  title: "Cousins' Secret Santa 2026",
  startsAt: "2026-12-27T18:00:00-04:00",
  durationHours: 3,
  stops: [
    {
      label: "Mini golf",
      name: "Skallywag Bay",
      address: "Chaguaramas, Trinidad",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Skallywag+Bay+Chaguaramas+Trinidad",
    },
    {
      label: "Dinner afterward",
      name: "Sails Restaurant & Pub",
      address: "Powerboats Marina, Western Main Road, Chaguaramas",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Sails+Restaurant+and+Pub+Chaguaramas+Trinidad",
    },
  ],
  budget: null,
  notes: "Bring your gift wrapped, with your giftee's name on it.",
};
```

- [ ] **Step 4: Build the calendar location and description from the ordered stops**

In `src/lib/ics.ts`, build the meeting location and itinerary before returning the calendar lines:

```ts
const firstStop = event.stops[0];
if (!firstStop) throw new Error("The event needs at least one stop");
const description = [
  event.notes,
  "",
  "Itinerary:",
  ...event.stops.flatMap((stop, index) => [
    `${index + 1}. ${stop.label}: ${stop.name}`,
    stop.address,
    stop.mapUrl,
  ]),
].join("\n");
```

Then replace the existing calendar location and description lines with:

```ts
`LOCATION:${escape(`${firstStop.name}, ${firstStop.address}`)}`,
`DESCRIPTION:${escape(description)}`,
```

- [ ] **Step 5: Run the focused test and typecheck**

Run: `npx vitest run tests/ics.test.ts && npm run typecheck`

Expected: the calendar test file passes and TypeScript reports no errors.

- [ ] **Step 6: Commit the event model and calendar update**

```bash
git add src/data/event.ts src/lib/ics.ts tests/ics.test.ts
git commit -m "feat: add Chaguaramas event itinerary"
```

### Task 2: Render both destinations cleanly in the event card

**Files:**
- Create: `tests/ui/EventCard.test.tsx`
- Modify: `src/ui/components/EventCard.tsx:1-64`
- Modify: `src/styles/app.css:817-873`

- [ ] **Step 1: Add a component test for the two-stop event card**

Create `tests/ui/EventCard.test.tsx`:

```tsx
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
      event.stops[0].mapUrl,
    );
    expect(screen.getByRole("link", { name: "Open Sails Restaurant & Pub in Maps" })).toHaveAttribute(
      "href",
      event.stops[1].mapUrl,
    );
    expect(screen.getByRole("button", { name: "Add to calendar" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the new component test and confirm it fails**

Run: `npx vitest run tests/ui/EventCard.test.tsx`

Expected: FAIL because the old event card expects `venueName`, `address`, and `mapUrl`.

- [ ] **Step 3: Render each stop inside the event rows**

Keep the date row and conditional budget/note rows in `EventCard.tsx`. Replace the single venue row and bottom Maps link with this mapped row:

```tsx
{event.stops.map((stop) => (
  <div className="event-card__row" key={stop.name}>
    <dt><MapPin size={22} weight="duotone" aria-hidden="true" /></dt>
    <dd>
      <span className="event-card__eyebrow">{stop.label}</span>
      <strong>{stop.name}</strong>
      <span className="event-card__address">{stop.address}</span>
      <a
        className="event-card__map-link"
        href={stop.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${stop.name} in Maps`}
      >
        <NavigationArrow size={18} weight="bold" aria-hidden="true" />
        Open in Maps
      </a>
    </dd>
  </div>
))}
```

The action area should then contain only the existing “Add to calendar” button:

```tsx
<div className="event-card__actions">
  <button type="button" className="btn btn--ghost" onClick={() => downloadIcs(event)}>
    <CalendarPlus size={20} weight="bold" aria-hidden="true" />
    <span>Add to calendar</span>
  </button>
</div>
```

- [ ] **Step 4: Add compact, accessible itinerary styling**

Update the event-card selectors in `src/styles/app.css` so metadata and links remain distinct:

```css
.event-card__eyebrow {
  display: block;
  margin-bottom: 2px;
  color: var(--red);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.event-card__address {
  display: block;
  color: var(--ink-soft);
  font-size: 0.98rem;
}

.event-card__map-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 2px;
  color: var(--green);
  font-size: 0.94rem;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.event-card__map-link:focus-visible {
  border-radius: 6px;
  outline: 3px solid var(--gold);
  outline-offset: 2px;
}
```

Keep `.event-card__actions .btn` at `min-height: 52px` so the calendar action stays comfortably tappable.

- [ ] **Step 5: Run the card test and the current UI suite**

Run: `npx vitest run tests/ui/EventCard.test.tsx tests/ui/App.test.tsx tests/ui/Giftee.test.tsx`

Expected: all selected component tests pass.

- [ ] **Step 6: Commit the itinerary card**

```bash
git add src/ui/components/EventCard.tsx src/styles/app.css tests/ui/EventCard.test.tsx
git commit -m "feat: show both event destinations"
```

### Task 3: Remove recommendations from data, unlock results, and the giftee screen

**Files:**
- Modify: `tests/rules.test.ts:47-55`
- Modify: `tests/unlock.test.ts:32-43,85-97`
- Modify: `tests/ui/Giftee.test.tsx:17-31`
- Modify: `src/data/people.ts:1-160`
- Modify: `src/ui/screens/Giftee.tsx:1-201`
- Modify: `src/styles/app.css:1371-1437`

- [ ] **Step 1: Change the unlock test to require recommendation-free public people**

First replace the participant-shape test in `tests/rules.test.ts` with:

```ts
it("gives everyone public identity data without gift recommendations", () => {
  for (const person of people) {
    expect(person.name.trim()).not.toBe("");
    expect(person.shortName.trim()).not.toBe("");
    expect(person.emoji.trim()).not.toBe("");
    expect("wishlist" in person).toBe(false);
  }
});
```

Replace the wishlist comparison in the correct-PIN matrix test with:

```ts
const expectedPublicKeys = "emoji,id,name,shortName";
assertSecret(
  Object.keys(result.giver).sort().join() === expectedPublicKeys,
  "giver contains private or obsolete fields",
);
assertSecret(
  Object.keys(result.receiver).sort().join() === expectedPublicKeys,
  "giftee contains private or obsolete fields",
);
```

Extend the no-leak test with:

```ts
assertSecret(!json.includes("wishlist"), "unlock result includes a wishlist");
```

Add this data-shape test to the `PIN data` group:

```ts
it("stores no gift recommendations", () => {
  expect(people.every((person) => !("wishlist" in person))).toBe(true);
});
```

- [ ] **Step 2: Change the reveal test to require the mission and no recommendations**

Rename the first test in `tests/ui/Giftee.test.tsx` to `takes 3 taps to open, then shows the giftee without gift recommendations` and replace its final list assertion with:

```tsx
expect(screen.getByText(/your mission: pick out something thoughtful and keep it secret/i)).toBeInTheDocument();
expect(screen.queryByText(/would love/i)).not.toBeInTheDocument();
expect(document.querySelectorAll(".idea")).toHaveLength(0);
```

- [ ] **Step 3: Run the recommendation-removal tests and confirm they fail**

Run: `npx vitest run tests/rules.test.ts tests/unlock.test.ts tests/ui/Giftee.test.tsx`

Expected: FAIL because participant and unlock data still contain `wishlist`, and the giftee screen still renders idea cards.

- [ ] **Step 4: Delete gift recommendations from the participant model and records**

In `src/data/people.ts`, remove the `GiftIdea` interface and the `wishlist` property from `Person`. The resulting public model must be:

```ts
export interface Person {
  id: PersonId;
  /** Full name, shown on the giftee page. */
  name: string;
  /** Shorter name for ornaments and greetings. */
  shortName: string;
  emoji: string;
  pin: string;
}
```

Remove every `wishlist: [...]` block from the ten participant records and remove the recommendation comment at the top. Preserve every id, name, emoji, and PIN exactly.

- [ ] **Step 5: Replace the idea section with one focused mission block**

In `src/ui/screens/Giftee.tsx`, change the art import to `import { Art } from "../art";` and delete `IDEA_ART`. Replace the entire `.ideas` section and existing hush paragraph with:

```tsx
<section className="giftee__mission" aria-label="Secret Santa mission">
  <p>Your mission: pick out something thoughtful and keep it secret.</p>
  <p className="hush">
    <span aria-hidden="true">🤫</span> Shh! Keep it secret until the lime.
  </p>
</section>
```

Leave the recipient card, compact event card, replay button, switch-person button, focus management, confetti, reduced-motion branch, and sounds unchanged.

- [ ] **Step 6: Remove recommendation styles and style the shorter mission section**

Delete `.ideas`, `.ideas__title`, `.ideas__list`, `.idea`, `.idea__icon`, and `.idea__text` rules from `src/styles/app.css`. Replace the old hush-only block with:

```css
.giftee__mission {
  display: grid;
  gap: 8px;
  margin-top: 24px;
  padding-inline: 12px;
  color: var(--snow);
  font: 500 1.08rem / 1.45 var(--font-ui);
  text-align: center;
  text-wrap: balance;
}

.hush {
  color: #ffe7a7;
  font-size: 1rem;
}
```

- [ ] **Step 7: Run focused data and giftee tests**

Run: `npx vitest run tests/rules.test.ts tests/unlock.test.ts tests/ui/Giftee.test.tsx && npm run typecheck`

Expected: all selected tests pass and TypeScript reports no errors.

- [ ] **Step 8: Confirm runtime source no longer contains recommendation fields or classes**

Run: `rg -n "wishlist|GiftIdea|ideas__|idea__|className=\"ideas|className=\"idea" src tests --glob '!tests/ui/Giftee.test.tsx'`

Expected: no matches. The negative assertions in `tests/ui/Giftee.test.tsx` remain intentional.

- [ ] **Step 9: Commit the recommendation removal**

```bash
git add src/data/people.ts src/ui/screens/Giftee.tsx src/styles/app.css tests/rules.test.ts tests/unlock.test.ts tests/ui/Giftee.test.tsx
git commit -m "feat: remove gift recommendations"
```

### Task 4: Update browser coverage and active documentation

**Files:**
- Modify: `e2e/app.spec.ts:20-71`
- Modify: `README.md:1-72,101-108`

- [ ] **Step 1: Update the landing-page browser test for both destinations**

Replace the old venue assertions in `e2e/app.spec.ts` with:

```ts
await expect(page.getByText("Skallywag Bay", { exact: true })).toBeVisible();
await expect(page.getByText("Sails Restaurant & Pub", { exact: true })).toBeVisible();
await expect(page.getByText(/27 December 2026/)).toBeVisible();
await expect(page.getByText("6:00 pm")).toBeVisible();
await expect(page.getByRole("link", { name: "Open Skallywag Bay in Maps" })).toHaveAttribute(
  "href",
  /query=Skallywag\+Bay\+Chaguaramas\+Trinidad/,
);
await expect(page.getByRole("link", { name: "Open Sails Restaurant & Pub in Maps" })).toHaveAttribute(
  "href",
  /query=Sails\+Restaurant\+and\+Pub\+Chaguaramas\+Trinidad/,
);
```

- [ ] **Step 2: Update the successful reveal browser test**

Rename it to `the right PIN and 3 taps reveal only the giftee and event details`. Replace the `.idea` count with:

```ts
await expect(page.getByText(/your mission: pick out something thoughtful and keep it secret/i)).toBeVisible();
await expect(page.locator(".idea")).toHaveCount(0);
await expect(page.getByText("Skallywag Bay", { exact: true })).toBeVisible();
await expect(page.getByText("Sails Restaurant & Pub", { exact: true })).toBeVisible();
```

- [ ] **Step 3: Make the replay scroll test independent of the removed idea-list height**

Before clicking replay, scroll to the document bottom rather than asserting the shorter page has more than 200 pixels of scroll:

```ts
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await replay.click();
await expect(page.getByRole("button", { name: /open your gift/i })).toBeInViewport();
await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
```

- [ ] **Step 4: Update the README's product and event descriptions**

Change the opening paragraph to say the app reveals only who each cousin is buying for. Change the event line to:

```md
- **Event:** Sunday 27 December 2026 from 6:00 pm — mini golf at Skallywag Bay, then dinner at Sails Restaurant & Pub in Chaguaramas.
```

Delete the “Update the gift ideas” item from “Before you send the link,” renumber the remaining items, and change the project-layout description from `people, PINs, gift ideas` to `people, PINs`.

- [ ] **Step 5: Run the end-to-end tests on both configured phone projects**

Run: `npm run test:e2e`

Expected: all Playwright tests pass for the iPhone 13 and Pixel 7 projects, including the 375-pixel overflow and tap-target checks.

- [ ] **Step 6: Commit browser coverage and documentation**

```bash
git add e2e/app.spec.ts README.md
git commit -m "test: cover itinerary and simplified reveal"
```

### Task 5: Complete verification without exposing the draw

**Files:**
- Verify only; no expected source edits.

- [ ] **Step 1: Run the complete unit suite with enforced coverage**

Run: `npm test`

Expected: all Vitest tests pass, `src/lib/**` remains at 100% line and branch coverage, and assignment checks report only pass/fail status without pairings.

- [ ] **Step 2: Build the GitHub Pages production bundle**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully and produce `dist/`.

- [ ] **Step 3: Re-run the mobile browser suite against the production-equivalent Vite server**

Run: `npm run test:e2e`

Expected: all configured browser projects pass with no console errors, no horizontal overflow at 375 pixels, and minimum 44-pixel controls.

- [ ] **Step 4: Inspect the final change set for scope and secrets**

Run: `git diff HEAD~4 --check && git status --short && git log -5 --oneline`

Expected: no whitespace errors; only the approved event, calendar, recommendation-removal, UI, test, and documentation files are changed; no command or test output prints assignments.

- [ ] **Step 5: Record the verification result**

If all commands pass, report the updated event, the recommendation removal, and the three successful verification commands. Do not print or decode `src/data/assignments.ts`.
