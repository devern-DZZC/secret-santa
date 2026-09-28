# Cousins' Secret Santa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, mobile-first Secret Santa app where each of 10 cousins picks their name, enters a fixed PIN and gets a festive reveal of who they're buying for. The draw is proven correct by tests that never reveal the pairings.

**Architecture:** All logic lives in pure TypeScript modules under `src/lib` (draw, encoding, unlock, attempts, storage, countdown, ics), each fully unit-tested. The data lives in `src/data`, with the draw stored in scrambled form. The React UI in `src/ui` is a small screen state machine synced to the URL hash. Playwright tests a build that uses a public fixture draw.

**Tech Stack:** Vite 6, React 18, TypeScript 5, Motion, canvas-confetti, @phosphor-icons/react, Fontsource (Fredoka, Figtree), Vitest + @vitest/coverage-v8, Playwright, tsx (scripts), GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-09-28-secret-santa-design.md` (§14 overrides earlier sections).

**Execution method:** Native, because the host asked to plan and build in one go. Implement every task in this session, then have one fresh reviewer check the whole branch.

## Global Constraints

- Person ids exactly: `devern, feisha, eeshana, nathan, nirvana, chris-ali, chris-alexander, brandon, dana, reyan`.
- There are exactly 7 exclusion pairs (spec §3), and they apply in both directions.
- PINs are fixed and stored as strings (spec §14.2).
- Every draw is a single 10-cycle. It is generated with Sattolo plus rejection, and it throws `DrawImpossibleError` after 10,000 attempts.
- There are no readable pairings anywhere in the repo, test names, test output, console output or e2e runs (spec §14.3).
- Event: `2026-12-27T19:00:00-04:00`, The Alley, East Gates Mall, Trincity. `budget: null`.
- UI copy contains no `—` or `–`, no all-caps labels, and body text is at least 16px.
- Every animation has a reduced-motion variant. Animate only transform and opacity.
- `src/lib/**` has 100% line and branch coverage.

## Review Focus

1. **The PIN pad is typed on a hardware keyboard or pasted.** Digits entered through the hidden input must behave exactly like keypad taps. Non-digits are ignored, and input stops at 4 digits. *Test in Task 5 (`PinPad.test.tsx`).*
2. **localStorage is unavailable** (Safari private mode, blocked storage). The app must still unlock and reveal, and it just won't remember anything. *Test in Task 3 (`storage.test.ts`: throwing storage).*
3. **The URL hash names a giftee screen without an unlock**, such as `#/reveal/dana` pasted by a cousin. It must go back to the PIN screen for that person and never show a recipient. *Test in Task 5 (`router.test.ts`).*
4. **The countdown after the event starts.** It must show a friendly "It's gifting time" state instead of negative numbers. *Test in Task 4 (`countdown.test.ts`).*
5. **Someone edits the rules or people but forgets to redraw.** The committed-draw test must fail with a label-only message. *Test in Task 2 (`assignments.test.ts`).*

---

### Task 1: Scaffold

**Files:** `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `.gitignore`, `README.md`

- [ ] Create the Vite React-TS project and install the dependencies above.
- [ ] Vite `base: "./"`. In `mode === "e2e"`, alias `@data/assignments` to `tests/fixtures/assignments.e2e.ts`.
- [ ] Vitest runs in the jsdom environment, with v8 coverage thresholds of 100 on `src/lib/**`.
- [ ] Scripts: `dev, build, preview, test, test:e2e, draw, pins:list, typecheck`.
- [ ] Verify with `npm run build`, which exits 0. Then commit.

### Task 2: Data, draw engine and committed draw

**Files:** `src/data/{people,rules,event}.ts`, `src/lib/{draw,secretCodec,rng}.ts`, `scripts/draw.ts`, `src/data/assignments.ts` (generated), `tests/{rules,exclusions,draw,assignments,codec}.test.ts`, `tests/helpers/{assertSecret,permutations}.ts`

**Interfaces (produces):**
- `type PersonId = typeof PERSON_IDS[number]`, `interface Person { id; name; shortName; emoji; pin: string; wishlist: [GiftIdea, GiftIdea, GiftIdea] }`
- `exclusions: ReadonlyArray<readonly [PersonId, PersonId]>`
- `generateDraw(ids: string[], exclusions, rng?: () => number): Record<string,string>`
- `validateDraw(draw, ids, exclusions, opts?: { requireSingleCycle?: boolean }): { ok: boolean; errors: string[] }`, where errors name the rule (`"rule R3 violated"`, `"self-assignment"`, `"duplicate receiver"`, `"not a single cycle"`, `"unknown id"`, `"missing giver"`) and never ids.
- `class DrawImpossibleError extends Error`
- `mulberry32(seed: number): () => number`
- `encodeReceiver(salt, giverId, receiverId): string`, `decodeReceiver(salt, giverId, encoded): string`
- `assignments.ts` exports `drawSalt: string` and `encodedDraw: Record<PersonId, string>`, plus `getReceiverId(giverId): string | undefined`.

- [ ] **Tests first:**
  - `rules.test.ts`: the rules equal the 7 spec pairs (order- and orientation-insensitive), every id exists, and there are no self or duplicate pairs.
  - `exclusions.test.ts`: `test.each` over the 14 directed pairs. For each, the validator rejects a known-valid public fixture cycle with the pair swapped in, and the pair appears 0 times in 100,000 seeded draws. Plus 10 self-draw cases.
  - `draw.test.ts`:
    - 100,000 seeded draws all pass validation,
    - the same seed gives the same draw,
    - exhaustively checking all 10! permutations gives **244,800** valid draws without the single-cycle check and **60,192** with it,
    - fairness: each giver's receiver frequencies are within ±10% of the enumerated expectation, and every allowed pair is seen,
    - an impossible rule set throws `DrawImpossibleError` in under 1 second,
    - groups of 2 and 3 form cycles.
  - `codec.test.ts`: encode and decode round-trip every id, the encoded value isn't the plain id, and decoding with a different giver or salt doesn't return the original.
  - `assignments.test.ts`: the decoded real draw passes validation, covers exactly the 10 ids, and the file source contains no plain `"<id>"` values as receivers. It uses `assertSecret` only.
- [ ] Run them and confirm they fail because the modules are missing.
- [ ] Implement `rng.ts`, `draw.ts`, `secretCodec.ts` and the data files.
- [ ] Implement `scripts/draw.ts`: generate, validate, write the encoded file, print exactly `✅ Draw generated and verified for 10 people.`, and exit 1 without `--force` if the file exists.
- [ ] Run `npm run draw`, then `npm test`, and confirm everything is green. Commit.

### Task 3: Unlock, attempts and storage

**Files:** `src/lib/{unlock,attempts,storage}.ts`, `tests/{unlock,attempts,storage}.test.ts`

**Interfaces:**
- `unlock(personId: unknown, pin: unknown): { giver: PublicPerson; receiver: PublicPerson } | null`, where `PublicPerson = Omit<Person, "pin">`.
- `createAttemptTracker(opts: { max: 5; lockMs: 30000; now?: () => number; store?: SafeStorage })`, which returns `{ isLocked(id): boolean; lockRemainingMs(id): number; recordFailure(id): void; recordSuccess(id): void }`.
- `safeStorage: { get(k): string | null; set(k, v): void; remove(k): void }`, which never throws.
- `rememberUnlock(id)`, `isRemembered(id): boolean`, `forgetUnlock(id)`.

- [ ] **Tests first:**
  - The 10×10 matrix: 10 unlocks, each matching the decoded receiver compared with `assertSecret`, and 90 nulls.
  - PIN integrity checks.
  - The bad-input list from spec §9.5 and unknown ids.
  - No leaks: the result's keys are exactly `giver, receiver`, and no `pin` appears anywhere in the result.
  - Lockout with an injected clock.
  - Per-person remembered unlocks.
  - Throwing storage is tolerated.
- [ ] Run them and confirm they fail. Then implement, run until green, and commit.

### Task 4: Countdown and calendar

**Files:** `src/lib/{countdown,ics}.ts`, `tests/{countdown,ics}.test.ts`

- `getCountdown(targetIso, nowMs): { done: boolean; days; hours; minutes; seconds }`, which returns `done: true` with zeros once the target has passed.
- `buildIcs(event, nowMs): string`, which produces a VEVENT with `DTSTART:20261227T230000Z`, a 3-hour duration, a LOCATION, and CRLF line endings.
- [ ] Write the tests, confirm they fail, implement, confirm they pass, and commit.

### Task 5: UI screens

**Files:** `src/ui/App.tsx`, `src/ui/router.ts`, `src/ui/screens/{Landing,WhoAreYou,PinPad,Reveal,Giftee}.tsx`, `src/ui/scene/{Lights,Snow,Sleigh}.tsx`, `src/ui/components/{EventCard,Countdown,Ornament,GiftBox,Button}.tsx`, `src/styles/*.css`, `tests/ui/*.test.tsx`

- Router: `parseHash(hash): Route`, where `Route = {name:"home"} | {name:"who"} | {name:"pin", id} | {name:"reveal", id}`. The reveal route renders only after an in-memory unlock or a remembered unlock. Otherwise it redirects to `pin`.
- [ ] **Component tests first** (Testing Library):
  - `PinPad` checks automatically on the 4th digit and handles typed and pasted input.
  - A wrong PIN shows the error and clears the digits.
  - A lockout shows the countdown message.
  - A guarded reveal route redirects to the PIN screen.
- [ ] Build the screens per spec §8 and §14.4, using the Motion `AnimatePresence` screen transitions and the reduced-motion paths.
- [ ] Verify with `npm test` and `npm run build`. Review screenshots at 375px. Commit.

### Task 6: E2E and deploy

**Files:** `playwright.config.ts`, `e2e/app.spec.ts`, `tests/fixtures/assignments.e2e.ts`, `.github/workflows/deploy.yml`

- Playwright runs the `vite build --mode e2e && vite preview` web server on iPhone 13 and Pixel 7 (Chromium). Screenshots, trace and video are off.
- The specs follow spec §9.6, using fixture recipients.
- The workflow runs on push to `main`: `npm ci`, then `npm test`, then `npx playwright install --with-deps chromium`, then `npm run test:e2e`, then `npm run build`, then `upload-pages-artifact` and `deploy-pages`.
- [ ] Verify with `npm run test:e2e`, which should pass on both projects. Commit.

### Task 7: Verification and delivery

- [ ] Do a fresh full run of `npm run typecheck && npm test && npm run test:e2e && npm run build`.
- [ ] Run the taste pre-flight (spec §14.4) and grep `src/` for `—` and `–`.
- [ ] Get an independent review of the whole branch.
- [ ] Copy the project to `~/Projects/secret-santa` with git history, excluding `node_modules`.
