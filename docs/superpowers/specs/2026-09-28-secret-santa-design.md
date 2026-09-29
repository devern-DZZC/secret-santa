# Cousins' Secret Santa - Design Spec

> Status: design only, not yet implemented. Hand this file to Claude Code as the source of truth.
> Host: Devern (also a participant).

---

## 1. Overview

A small, festive, mobile-first web app for a 10-person Secret Santa among cousins.

- **No backend and no database.** All data is hardcoded in source files and the site is deployed as static files.
- Each cousin **picks their name** and **enters a 4-digit PIN** that the host sends them privately.
- A correct PIN plays a festive reveal animation, then shows **who they're buying for** plus **3 gift ideas** for that person.
- Event **location, date/time and budget** are shown on the landing page and again on the result page.
- The draw must follow the **exclusion rules** in §3, and a thorough test suite must prove that it does.

### Goals

1. It is always correct: nobody draws themselves, nobody is drawn twice, and no excluded pair is ever matched.
2. It is simple to use, with no accounts or sign-up. It takes one name tap and 4 digits.
3. It feels festive, with creative animations that stay smooth on mid-range phones.
4. It is mobile-first and works well at 375px wide.

### Non-goals

- Real security. The assignments ship inside the JavaScript bundle, so a technical cousin could find them in dev tools. This is an accepted trade-off for family fun. The PIN stops casual peeking, not a determined snoop.
- Admin UI, editing in the browser, email or SMS sending, or multiple events.

---

## 2. Participants

| id                | Display name          | Notes                                     |
| ----------------- | --------------------- | ----------------------------------------- |
| `devern`          | Devern                | Host                                      |
| `feisha`          | Feisha                |                                           |
| `eeshana`         | Eeshana               |                                           |
| `nathan`          | Nathan                |                                           |
| `nirvana`         | Nirvana               |                                           |
| `chris-ali`       | Christopher Ali       | Shown as "Chris Ali" on small cards       |
| `chris-alexander` | Christopher Alexander | Shown as "Chris Alexander" on small cards |
| `brandon`         | Brandon               |                                           |
| `dana`            | Dana                  |                                           |
| `reyan`           | Reyan                 |                                           |

Each person also gets an `emoji` (for example 🦌 ⛄ 🎄 🍪 🔔 ⭐ 🧦 🕯️ 🎁 ❄️), a `pin`, and a `wishlist` of exactly 3 items. See §5.

---

## 3. Exclusion rules

All rules work in **both directions**: if A and B are excluded, A must not draw B, and B must not draw A.

| #  | Pair                            | Source rule                                            |
| -- | ------------------------------- | ------------------------------------------------------ |
| R1 | Devern ↔ Feisha                 | "devern and feisha"                                    |
| R2 | Eeshana ↔ Nathan                | "eeshana and nathan"                                   |
| R3 | Nirvana ↔ Christopher Alexander | "nirvana and chris alexander"                          |
| R4 | Christopher Ali ↔ Reyan         | "chris and reyan"                                      |
| R5 | Brandon ↔ Christopher Ali       | "brandon and chris and dana should not get each other" |
| R6 | Brandon ↔ Dana                  | (same group rule)                                      |
| R7 | Christopher Ali ↔ Dana          | (same group rule)                                      |

That makes **7 pairs**, or **14 forbidden directed assignments**, plus the 10 self-assignments.

> ⚠️ **Assumption to confirm:** in R4–R7, plain "chris" is taken to mean **Christopher Ali**, since Christopher Alexander was named in full in R3. If the host meant Christopher Alexander for any of these, edit `src/data/rules.js` and the matching test fixture. Both readings are feasible (see §4).

The rules are defined as data so they're easy to change:
```js
// src/data/rules.js
export const exclusions = [
  ["devern", "feisha"],
  ["eeshana", "nathan"],
  ["nirvana", "chris-alexander"],
  ["chris-ali", "reyan"],
  ["brandon", "chris-ali"],
  ["brandon", "dana"],
  ["chris-ali", "dana"],
];
```

---

## 4. Feasibility (verified by brute force)

All 10! = 3,628,800 possible assignments were enumerated against the rules above:

| Metric                                     | Value                   |
| ------------------------------------------ | ----------------------- |
| Valid draws (no self, no excluded pair)    | **244,800**             |
| Valid draws that also form one single loop | **60,192**              |
| Fewest options for any giver               | Christopher Ali: 6 of 9 |
| Brandon, Dana                              | 7 of 9 each             |
| Everyone else                              | 8 of 9 each             |

The alternative reading (the group rule using Christopher Alexander) gives the same totals. The rules are comfortably satisfiable, and the test suite reproduces these numbers (§9.3).

---

## 5. Data model

### `src/data/event.js`
```js
export const event = {
  title: "Cousins' Secret Santa 2026",
  startsAt: "2026-12-__T__:__:00-04:00", // TODO host: ISO string, Trinidad time (UTC-4)
  venueName: "TODO",
  address: "TODO",
  mapUrl: "https://maps.google.com/?q=TODO",
  budget: "TODO (e.g. $200 TTD)",
  notes: "", // optional, e.g. "Bring gift wrapped with the recipient's name"
};
```

### `src/data/people.js`
```js
export const people = [
  {
    id: "devern",
    name: "Devern",
    shortName: "Devern",
    emoji: "🦌",
    pin: "____",            // string, exactly 4 digits; leading zeros allowed
    wishlist: [
      { idea: "TODO", note: "TODO (size, colour, brand, link…)" },
      { idea: "TODO", note: "" },
      { idea: "TODO", note: "" },
    ],
  },
  // …9 more, ids exactly as in §2
];
```

**Rules for PINs**

- Stored as **strings** so `"0427"` keeps its leading zero.
- Exactly 4 digits, matching `/^\d{4}$/`.
- **Unique** across all 10 people.
- No trivial PINs: `0000`, `1111`…`9999`, `1234`, `4321`, `1212`.
- `npm run pins:generate` fills any blank PINs with random values that follow these rules.

### `src/data/assignments.js`, generated and not hand-edited
```js
// AUTO-GENERATED by `npm run draw` on <timestamp>. Do not edit by hand.
export const assignments = { devern: "…", feisha: "…", /* giver → receiver */ };
```

---

## 6. Draw algorithm (`src/lib/draw.js`)

- `generateDraw(peopleIds, exclusions, rng = Math.random)` → returns a `{ giver: receiver }` map.
  - Uses **Sattolo's algorithm** to build a random **single cycle**, A → B → C → … → A. A single cycle guarantees there are no self-assignments and no two-person swaps.
  - It **rejects and retries** if any directed pair is excluded. The acceptance rate is about 16.6% (60,192 / 9!), so it takes about 6 tries on average.
  - Stops after **10,000 attempts** and throws `DrawImpossibleError` instead of looping forever.
  - `rng` can be injected so tests can use a seeded RNG.
- `validateDraw(assignments, peopleIds, exclusions)` → returns `{ ok: boolean, errors: string[] }`. It is a pure checker, reused by the tests and by the draw script.
  - Every person appears exactly once as a giver and exactly once as a receiver.
  - No one is assigned to themselves.
  - No excluded pair appears, in either direction.
  - The draw forms a single cycle of length 10.
  - There are no unknown ids.

### `scripts/draw.js` (`npm run draw`)

1. Generates a draw.
2. Runs `validateDraw`. If validation fails, it exits with a non-zero code and writes nothing.
3. Writes `src/data/assignments.js`.
4. Prints **only** `✅ Draw generated and verified for 10 people.` and **never prints pairings**, so the host stays surprised.
5. Refuses to overwrite an existing assignments file unless run with `--force`, so a finished draw isn't reshuffled by accident.

> Host tip: don't open `assignments.js` after running the draw.

### `scripts/pins.js`

- `npm run pins:generate` fills blank PINs and validates them. It doesn't overwrite existing PINs.
- `npm run pins:list` prints `Name → PIN` lines for the host to send privately. It never prints assignments.

---

## 7. Unlock logic (`src/lib/unlock.js`)
```js
export function unlock(personId, pin) → { receiver, wishlist } | null
```

- Returns `null` if the person is unknown, the PIN isn't a string, the PIN doesn't match `/^\d{4}$/`, or the PIN doesn't equal that person's PIN.
- On success it returns **only** that giver's receiver (name, emoji, wishlist) and **never** the full assignment map.
- Uses strict string comparison, so the number `427` does not unlock `"0427"`.

**Attempt limiting** (`src/lib/attempts.js`, UI-level)

- After **5 wrong PINs for the same name**, the keypad locks for **30 seconds** and shows a friendly countdown ("The elves need a break… 0:27").
- A correct PIN resets the counter.
- The counters are per name and live in memory plus `localStorage`, wrapped in try/catch so the app still works when storage is blocked.

**Remembering an unlock**

- After a successful unlock, `localStorage` stores `unlocked:<personId> = true` on that device, so a return visit to *that* name skips the PIN.
- Choosing **any other name always asks for a PIN**.
- A small "Not you? Switch person" link clears the remembered unlock.

---

## 8. UX and UI

### 8.1 Screens and flow

1. **Landing (****`/`****)**
   - A string of lights twinkles across the top, and snow falls in the background.
   - Title, a live **countdown** to `event.startsAt` (days : hrs : mins : secs), and a festive subtitle.
   - **Event card:** 📅 date and time (local format), 📍 venue and address with an **Open in Maps** button, 💰 budget, and an **Add to calendar** button that downloads a generated `.ics` file.
   - The main button is **"Find out who you're gifting 🎁"**.
2. **Who are you?**
   - A 2-column grid of **10 ornament cards**, each showing the emoji and short name. Tapping one makes it swing gently.
3. **PIN pad**
   - The chosen ornament hangs at the top with "Hi Feisha! Enter your PIN."
   - 4 dots fill as digits are entered. There's a custom 3×4 keypad with 1–9, ⌫ and 0, and the PIN checks automatically on the 4th digit.
   - A hidden `<input inputmode="numeric" autocomplete="off">` backs the keypad for accessibility and keyboard entry.
   - **Wrong PIN:** the ornament shakes, the dots flash red, the input clears, and a soft message appears. The phone vibrates with `navigator.vibrate(80)` where supported.
   - **Right PIN:** the ornament glows and cracks open, then transitions to the reveal.
4. **Reveal**
   - A wrapped gift box wobbles with "Tap to unwrap! (3)". Each tap makes it shake harder and counts down.
   - On the 3rd tap the lid pops off, **confetti** bursts in red, green and gold, and the recipient's emoji and name rise out of the box.
   - The reveal can be skipped with a "Skip animation" link.
5. **Your giftee**
   - "You're Secret Santa for… **Nathan** ⛄"
   - **3 gift idea cards** flip in one after another, each with the idea and a note.
   - The event details are repeated in compact form.
   - Buttons: "Replay the reveal ✨" and "Not you? Switch person".
   - A reminder: "Shh! 🤫 Keep it secret until the exchange."

### 8.2 Visual style

- Palette: deep pine green `#0f3d2e`, cranberry `#b3202a`, warm gold `#e8b64c`, snow white `#fdfaf4`, night sky `#0b1a2a`. All colours are defined as CSS variables.
- Type: one rounded display font for headings (for example "Mountains of Christmas" or "Fredoka") and a clean sans-serif for body text. Body text is at least 16px.
- Cards have soft shadows, rounded corners of 16px or more, and a subtle paper or felt texture drawn with CSS gradients rather than images.
- Short, warm microcopy with light emoji use.

### 8.3 Animations

| Animation                               | Where                      | Technique                                                                          |
| --------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| Falling snow, 3 depth layers with drift | Everywhere, behind content | CSS keyframes on a few absolutely positioned layers, or one lightweight `<canvas>` |
| Twinkling string lights                 | Header                     | CSS keyframes with staggered `animation-delay`                                     |
| Sleigh flying across the sky            | Header, about every 30 s   | CSS `transform: translateX`                                                        |
| Ornament swing on tap                   | Name grid                  | CSS `rotate` around the top pivot                                                  |
| Ornament shake on a wrong PIN           | PIN pad                    | CSS keyframes                                                                      |
| Gift box wobble, lid pop, name rise     | Reveal                     | CSS transforms                                                                     |
| Confetti burst                          | Reveal                     | `canvas-confetti` (about 6 KB)                                                     |
| Gift card flip-in, staggered            | Giftee page                | CSS 3D `rotateY`                                                                   |
| Countdown digit flip                    | Landing                    | CSS                                                                                |

**Performance rules**

- Animate only `transform` and `opacity`.
- Keep the snow flake count modest and pause it when the tab is hidden.
- Target 60 fps on a mid-range Android phone.

**Accessibility**

- `prefers-reduced-motion: reduce` turns off snow, sleigh and wobble, replaces confetti with a simple fade, and shows the recipient right away.

### 8.4 Mobile and accessibility checklist

- Designed first for a **375×667** screen, then scaled up. The content column is at most 480px wide and centred on desktop.
- All tap targets are at least **44×44px**, and the keypad buttons are at least 64px.
- The layout respects safe-area insets (`env(safe-area-inset-*)`) for notched phones.
- The PIN area has `aria-live` announcements ("2 of 4 digits entered", "Incorrect PIN").
- All buttons are real `<button>` elements with visible focus states.
- Colour contrast meets WCAG AA.
- An Open Graph image and title make the link preview look good when shared in WhatsApp.

---

## 9. Testing (required)

**Tools:** Vitest for unit and property tests, and Playwright for end-to-end tests on a mobile viewport.
**CI gate:** `npm test` must pass before deploying.

### 9.1 Rule fixture tests (`tests/rules.test.js`)

- The `exclusions` data contains **exactly** the 7 pairs from §3, in any order and either orientation. This guards against someone accidentally editing a rule.
- Every id used in the rules exists in `people`.
- There are no duplicate or self-pairs in the rules.

### 9.2 Per-rule tests (`tests/exclusions.test.js`)

Uses a parameterised `test.each` over all **14 directed forbidden assignments**:

| Giver           | Must never draw |
| --------------- | --------------- |
| devern          | feisha          |
| feisha          | devern          |
| eeshana         | nathan          |
| nathan          | eeshana         |
| nirvana         | chris-alexander |
| chris-alexander | nirvana         |
| chris-ali       | reyan           |
| reyan           | chris-ali       |
| brandon         | chris-ali       |
| chris-ali       | brandon         |
| brandon         | dana            |
| dana            | brandon         |
| chris-ali       | dana            |
| dana            | chris-ali       |

For each row:

1. **Validator rejects it.** Take a known-valid draw, swap in the forbidden pair, and assert that `validateDraw` returns `ok: false` with an error naming the rule.
2. **Generator never produces it.** Across 100,000 generated draws, the forbidden directed pair appears **0 times**.

A separate test covers **self-draws**: for each of the 10 people, `validateDraw` rejects a draw where that person draws themselves, and the generator never produces one across 100,000 runs.

### 9.3 Draw property tests (`tests/draw.test.js`)

- **100,000 random draws**, each checked to confirm that:
  - all 10 people give exactly once,
  - all 10 people receive exactly once,
  - nobody draws themselves,
  - no excluded pair appears,
  - the draw forms a single cycle of length 10.
- **Seeded determinism:** the same seed produces the same draw.
- **Exhaustive cross-check:** enumerate all 10! permutations and assert that `validateDraw` accepts exactly **244,800** draws when the single-cycle check is off and **60,192** when it's on. This proves the validator matches the rules exactly.
- **Fairness:** across 100,000 draws, each giver's allowed receivers each appear within ±10% of the expected share. For example, Christopher Ali has 6 allowed receivers, so each should appear about 1/6 of the time, weighted by valid cycles. Compute the expected share by enumeration. Every allowed pairing should appear at least once.
- **Impossible rules:** a rule set that can't be satisfied (for example, excluding everyone from one person) throws `DrawImpossibleError` quickly, well within the 10,000-attempt cap, and never hangs.
- **Small groups:** a group of 2 either produces A → B → A or is handled explicitly. A group of 3 always forms a 3-cycle.

### 9.4 Committed draw test (`tests/assignments.test.js`)

- The real `src/data/assignments.js` passes `validateDraw` with the real people and rules.
- It covers exactly the 10 ids in `people`.
- **Failure output must not print the full map.** Assertions report only the broken rule, for example "rule R3 violated", so the host doesn't see spoilers when a test fails.

### 9.5 PIN tests (`tests/unlock.test.js`)

- **The 10×10 matrix:** for every person P and every PIN belonging to person Q, call `unlock(P.id, Q.pin)`:
  - when P = Q, which is **10 cases**: it succeeds and returns exactly `assignments[P.id]`'s person and wishlist,
  - when P ≠ Q, which is **90 cases**: it returns `null`.
- **PIN data integrity:** all 10 PINs are unique strings of exactly 4 digits, and none is on the trivial list.
- **Bad inputs return&#x20;****`null`****:** `""`, `"123"`, `"12345"`, `"abcd"`, `"12a4"`, `" 1234"`, `"1234 "`, `null`, `undefined`, the number `1234`, and a number with a leading zero (`427` for `"0427"`).
- **Unknown ids return&#x20;****`null`****:** `"santa"`, `""`, `"Devern"` (wrong case), `null`.
- **No leaks:** the unlock result contains only the one recipient. It has no `assignments` key, no other people's data, and no PINs.
- **Attempt limit:** 5 wrong PINs lock that name for 30 seconds using fake timers. During the lock, even the correct PIN is refused. After 30 seconds it works again. The lock on one name doesn't affect other names. A correct PIN resets the counter.
- **Remembered unlock is per person:** after unlocking A, choosing B still requires B's PIN.

### 9.6 UI tests (`e2e/*.spec.js`, Playwright, iPhone 13 and Pixel 7 viewports)

- The landing page shows the title, countdown, venue, a Maps link with the correct `href`, and the budget.
- Choosing a name and entering a **wrong** PIN shows the error state, and the recipient name is not in the DOM.
- Choosing a name and entering the **right** PIN, then tapping the gift 3 times, shows the correct recipient and 3 wishlist items.
- With reduced motion on, the reveal appears without the tap sequence.
- After reloading, the unlocked person skips the PIN, and choosing another person asks for a PIN.
- There's no horizontal scroll at 375px, and all buttons are at least 44px (checked through bounding boxes).
- The console has no errors.

### 9.7 Coverage target

- `src/lib/**` has **100% line and branch coverage**, enforced in the Vitest config.

---

## 10. Tech stack and project structure

- **Vite** with **vanilla JavaScript** (ES modules). React isn't required.
- Plain CSS with custom properties, plus `canvas-confetti` as the only runtime dependency.
- Vitest, @vitest/coverage-v8, and Playwright as dev dependencies.
- Static hosting on **Vercel**, Netlify or GitHub Pages. The repo should be **private** because it contains PINs and assignments.
```php
secret-santa/
├─ index.html
├─ public/            # og-image.png, favicon
├─ src/
│  ├─ main.js         # router between screens (hash-based: #/, #/who, #/pin/:id, #/reveal)
│  ├─ data/
│  │  ├─ event.js
│  │  ├─ people.js
│  │  ├─ rules.js
│  │  └─ assignments.js   # generated
│  ├─ lib/
│  │  ├─ draw.js       # generateDraw, validateDraw, DrawImpossibleError
│  │  ├─ unlock.js
│  │  ├─ attempts.js
│  │  ├─ storage.js    # try/catch-safe localStorage wrapper
│  │  ├─ countdown.js
│  │  └─ ics.js        # calendar file builder
│  ├─ ui/              # one module per screen + snow, lights, confetti helpers
│  └─ styles/
├─ scripts/
│  ├─ draw.js
│  └─ pins.js
├─ tests/              # Vitest
├─ e2e/                # Playwright
└─ SPEC.md
```

### npm scripts

| Script                        | Purpose                                               |
| ----------------------------- | ----------------------------------------------------- |
| `dev`                         | Vite dev server                                       |
| `build` / `preview`           | Production build and local preview                    |
| `test`                        | Vitest (unit, property and coverage)                  |
| `test:e2e`                    | Playwright                                            |
| `draw`                        | Generate and verify assignments without printing them |
| `pins:generate` / `pins:list` | Create and validate PINs, or print them for the host  |

---

## 11. Build order (for Claude Code)

1. Scaffold Vite with Vitest and Playwright, and add the data files with placeholders.
2. Write `lib/draw.js` and **all of §9.1–9.4 first**, then make them pass.
3. Write `scripts/draw.js` and `scripts/pins.js`.
4. Write `lib/unlock.js`, `lib/attempts.js` and `lib/storage.js`, with §9.5 tests first.
5. Build the static screens: landing, countdown, event card and `.ics`.
6. Build the name grid and PIN pad.
7. Build the reveal and giftee page, then add all animations and reduced-motion handling.
8. Add the §9.6 end-to-end tests and do mobile polish.
9. Deploy, run `npm run draw` once, run `npm run pins:list`, and send the PINs privately.

---

## 12. Acceptance criteria

- [ ] `npm test` passes with 100% coverage on `src/lib`, and `npm run test:e2e` passes on both phone viewports.
- [ ] All 14 directed exclusion tests and all 10 self-draw tests pass.
- [ ] The PIN matrix passes: 10 of 10 correct PINs unlock and 90 of 90 wrong ones are denied.
- [ ] The exhaustive cross-check matches the expected counts of 244,800 and 60,192.
- [ ] `npm run draw` never prints pairings.
- [ ] Lighthouse mobile scores are 90 or higher for Performance and Accessibility.
- [ ] Every animation is disabled or simplified under reduced motion.

---

## 13. Host decisions (resolved 2026-09-28)

- [x] "chris" in rules R4 to R7 means **Christopher Ali**. Confirmed by the host.
- [x] Event: **The Alley, East Gates Mall, Trincity, Trinidad**, **Sunday 27 December 2026 at 7:00 pm** (`2026-12-27T19:00:00-04:00`).
- [x] Budget: not decided yet. `event.budget` is `null` and the budget row stays hidden until it's set.
- [x] Gift ideas: placeholder ideas for everyone for now. The host will replace them with real ones later. Changing wishlists never affects the draw.
- [x] PINs: **fixed per person** and reused for every draw, so tests stay simple (see §14.2).

---

## 14. Addendum: build decisions (2026-09-28)

These override earlier sections where they conflict.

### 14.1 Stack and hosting
- **React 18 + TypeScript + Vite.** React makes the multi-step reveal flow (screen state, keypad, animated transitions) simpler to build and test than vanilla JS.
- **Motion** (`motion/react`) handles screen transitions, keypad shake and the reveal sequence. CSS keyframes handle the ambient snow and lights. `canvas-confetti` does the burst.
- **Phosphor icons** (`@phosphor-icons/react`) for UI glyphs. Emoji only for each cousin's avatar.
- Fonts are self-hosted with Fontsource: **Fredoka** (display) and **Figtree** (body).
- **GitHub Pages.** Vite `base: "./"` plus hash-based screens, so the site works under any repo name. A GitHub Actions workflow runs `npm test`, then builds and deploys. It never deploys if any test fails.
- Caveat: free GitHub Pages needs a **public** repo, which makes the source (including PINs) readable. That's accepted per §1 non-goals. The assignments are scrambled (§14.3), so they're never readable at a glance.

### 14.2 Fixed PINs
| Person | PIN |
|---|---|
| Devern | 2004 |
| Feisha | 2356 |
| Eeshana | 3817 |
| Nathan | 4702 |
| Nirvana | 5169 |
| Christopher Ali | 6431 |
| Christopher Alexander | 7258 |
| Brandon | 8093 |
| Dana | 0946 |
| Reyan | 1587 |

All 10 are unique, 4-digit strings, and none is on the trivial list. `pins:generate` is dropped. `npm run pins:list` still prints the list for sending.

### 14.3 Keeping the draw hidden from the host
- `src/data/assignments.ts` never stores readable pairings. It stores a random per-draw `salt` and, for each giver, an **encoded** receiver: base64 of the receiver id XOR-ed with a keystream seeded from `salt + giverId`. This is scrambling, not security.
- `decodeReceiver(giverId)` is the only way to read a pairing, and only `unlock()` calls it in the app.
- **Tests on the real draw never reveal it:**
  - Test names never include a receiver.
  - Assertions go through `assertSecret(condition, label)`, which fails with a label only (for example `rule R3 violated`), never with the values that were compared.
  - No snapshots of assignment data.
- **E2E tests never render the real draw.** Playwright builds the app in `e2e` mode, which swaps in a public fixture draw (`tests/fixtures/`). Screenshots, traces and video are off.
- `npm run draw` prints one success line and refuses to overwrite an existing draw unless run with `--force`.

### 14.4 Visual direction (frontend-design and taste skills)
**Design read:** a private family event page and reveal game for 10 Trinidadian cousins on their phones. The language is playful and festive, it leans on a hand-built night scene with React, Motion and native CSS, and it avoids stock Christmas-card clichés.

**Dials:** DESIGN_VARIANCE 5 (single-column mobile, centred like an invitation), MOTION_INTENSITY 7 (one big orchestrated reveal, restrained ambient motion), VISUAL_DENSITY 3 (airy, one thing per screen).

**Tokens**
| Token | Hex | Role |
|---|---|---|
| Night | `#0b1a2a` | Page background (one dark theme, locked) |
| Pine | `#0f3d2e` | Raised surfaces, ornament strings |
| Cranberry | `#b3202a` | The single accent: primary buttons, the gift box |
| Gold | `#e8b64c` | Light bulbs and small highlights only |
| Snow | `#fdfaf4` | Text and snowflakes |
| Mist | `#a9b8c6` | Secondary text (AA contrast on Night) |

**Type:** Fredoka for headings and the countdown digits, Figtree for everything else. Sentence case throughout, with no all-caps labels.

**Layout:** a 480px column centred on a full-bleed night scene, with a string of lights pinned across the top of every screen. The name picker is a wall of **hanging ornaments on strings of different lengths**, not a plain grid of cards.

**Principles**
1. Spend the boldness on one moment, the gift unwrap. Everything else stays calm.
2. Every tap gets physical feedback: press, swing, shake or pop.
3. Local warmth in the copy, lightly (for example "days till the lime"). No em-dashes anywhere visible.
4. Reduced motion always gets a complete, calm version of each screen.

**Review against defaults:** the generic take would be a red-and-green card with a script Christmas font, a centred title over snow and a plain 2×5 grid of name buttons. This design replaces the script font with rounded Fredoka, the name grid with the ornament wall, and generic copy with Trini vernacular. It uses one accent colour instead of alternating red and green.

**Dark mode:** the app is dark-only on purpose, because the night scene is the brand. It still meets WCAG AA throughout.

---

## 15. Addendum: Christmas redesign (2026-09-28, evening)

The host found the night theme too dark and plain. This section replaces §14.4's visual direction.

**Brief (host's words):** very Christmas-themed, red, green and white, more background animation (snow, twinkling lights), Santa and reindeer, less plain and professional, and sound on the gift taps and the reveal.

**Design read:** a festive family party invite and reveal game for Trinidadian cousins on their phones. The look is a Christmas card come to life: bright, playful and abundant. It's built with React, Motion and native CSS, plus Fluent Emoji illustrations. Dials: DESIGN_VARIANCE 5, MOTION_INTENSITY 8, VISUAL_DENSITY 4.

**Tokens**
| Token | Hex | Role |
|---|---|---|
| Red | `#c8102e` | The sky and page background (a light theme, locked) |
| Green | `#148a3f` | Primary buttons, keypad digits, the gift box |
| Snow | `#fffdf8` | Cards, tags, keys, text on red |
| Gold | `#ffc93c` | Lights, stars and sparkles only |
| Ink | `#1d3a2a` | Text on white cards |

**Type:** Berkshire Swash for headlines, like a vintage Christmas card. Fredoka for everything else.

**Scene (all transform/opacity, and off for reduced motion):**
- a pine garland of 15 twinkling multicolour bulbs,
- 64 snowflakes at three depths, including spinning crystals,
- Santa's sleigh with three reindeer and a sparkle trail, crossing every 17 seconds (not on the PIN screen),
- a snowy village with trees, a house and a snowman at the end of each page.

**Illustrations:** Microsoft Fluent Emoji (flat, MIT), extracted by `scripts/art/extract.mjs`. Each cousin's emoji maps to its illustration, so every phone shows the same artwork.

**Sound:** the Web Audio API synthesises everything, with no files. There's a key tick, a wrong-PIN two-tone, an unlock ding-ding, sleigh bells on each gift tap (growing with each tap) and a bell arpeggio with sleigh-bell shimmer on the reveal. The mute preference is stored in `ss:sound` and defaults to on.

**Review against defaults:** the generic take would be a red page with a script font and snow. This design adds the hanging gift-tag countdown, the patterned ornament wall on a garland, snowball keys, a candy-cane edge on every card, and the sleigh flyover as a recurring character. It also keeps the Trini vernacular in the copy.

**Background music (added later that evening):** the host chose "We Wish You a Merry Christmas" from three previews.
- **Arrangement:** a music box plus waltz bass, chord plucks and quiet sleigh bells, at 165 bpm in 3/4 time. The score lives in `src/lib/musicScore.ts`, and a look-ahead Web Audio scheduler plays it from `src/ui/music.ts`.
- **When it plays:** it starts on the first click or keypress, pauses while the tab is hidden, and ducks under the reveal fanfare for about 3 seconds.
- **Control:** it has its own switch, stored in `ss:music` and on by default, separate from the sound effects switch.

**Bug fix:** "Replay the reveal" now scrolls to the top so the gift is in view on phones. Before, the page stayed scrolled to the bottom. This is covered by a unit test and an e2e test on both phone sizes.
