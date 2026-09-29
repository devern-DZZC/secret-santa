# Cousins' Secret Santa 🎁

A festive, mobile-first Secret Santa page for 10 cousins. Each cousin picks their name, types their 4-digit PIN and unwraps a gift to find out who they're buying for, plus 3 gift ideas for that person.

- **Event:** Sunday 27 December 2026, 7:00 pm at The Alley, East Gates Mall, Trincity
- **No database.** Everything is hardcoded and the site is plain static files on GitHub Pages.
- **The draw is hidden, even from you.** It's stored scrambled, and the tests check it without ever printing who drew whom.

## Quick start

```bash
npm install
npm run dev          # open the local link it prints
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local preview with hot reload |
| `npm test` | Every unit test, including the checks on the real draw (results hidden) |
| `npm run test:e2e` | Phone-sized browser tests (iPhone 13 and Pixel 7) using a **public test draw** |
| `npm run build` | Production build into `dist/` |
| `npm run draw` | Makes the draw. Refuses if one exists already |
| `npm run draw -- --force` | Throws away the current draw and makes a new one |
| `npm run pins:list` | Prints everyone's PIN so you can send them privately |

## Before you send the link

1. **Update the gift ideas** in `src/data/people.ts`. The ones there now are placeholders. Changing them never changes the draw.
2. **Set the budget** (optional) in `src/data/event.ts`, for example `budget: "$200 TTD"`. It stays hidden while it's `null`.
3. **Decide on the draw.** A draw has already been made and checked. If you ever change the people or the rules, run `npm run draw -- --force` and then `npm test`.
4. Run `npm test`. You'll see test names and ✓ marks, never pairings.
5. Run `npm run pins:list` and send each cousin their PIN privately.

## How the draw stays secret

- `src/data/assignments.ts` holds each receiver **scrambled** and padded to the same length, so you can't read it or guess from the length. Please don't try to decode it.
- The tests on the real draw fail with a rule label only (for example `rule R3 violated`), never names.
- The browser tests and screenshots use a separate public draw (`tests/fixtures/`), so a test run can never show the real one.
- `npm run draw` prints one line: `✅ Draw generated and verified for 10 people.`

This is family-fun privacy, not bank-grade security. Someone determined, with the source code and time to spare, could work it out.

## Rules the draw follows

Everyone gives exactly once and receives exactly once, nobody draws themselves, and everyone forms one big gift loop. These pairs never draw each other, in either direction:

| Rule | Pair |
|---|---|
| R1 | Devern and Feisha |
| R2 | Eeshana and Nathan |
| R3 | Nirvana and Christopher Alexander |
| R4 | Christopher Ali and Reyan |
| R5 | Brandon and Christopher Ali |
| R6 | Brandon and Dana |
| R7 | Christopher Ali and Dana |
| R8 | Devern and Nirvana |

The tests prove this several ways:
- 16 forbidden directions, each checked separately,
- 10 self-draw checks,
- 100,000 random draws,
- an exhaustive check of all 3,628,800 possible assignments (exactly 47,200 are valid single loops),
- a fairness check,
- and the 10 × 10 PIN matrix (each PIN opens only its owner).

## Sound

- **Background music:** "We Wish You a Merry Christmas" (traditional, public domain) on a music box with sleigh bells. It starts on the first tap, because phones don't allow sound before that, loops quietly, and dips under the reveal fanfare.
- **Sound effects:** gift taps jingle like sleigh bells, the reveal plays a bell fanfare, and the keypad clicks and dings.

Everything is made live in the browser with the Web Audio API, so there are no audio files to download. The two buttons at the top right switch the music and the sound effects on or off separately, and the phone remembers each choice. On iPhone, the silent switch also mutes them.

## Deploy to GitHub Pages

1. Create a GitHub repo and push this folder to its `main` branch. Free GitHub Pages needs a **public** repo, so the code (including PINs) is visible to anyone who goes looking.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Every push to `main` runs the tests and, only if they all pass, deploys. The site appears at `https://<your-username>.github.io/<repo-name>/`.

## Project layout

```
src/data/        people, PINs, gift ideas, rules, event details, scrambled draw
src/lib/         draw engine, scrambling, unlock, cooldown, countdown, calendar file
src/ui/          screens (landing, who are you, PIN pad, reveal and giftee), night scene
tests/           unit tests (Vitest)
e2e/             phone browser tests (Playwright)
scripts/         draw, PIN list, link-preview image
docs/superpowers design spec and implementation plan
```

## Credits

Christmas illustrations (Santa, reindeer, sleigh, trees, snowman and the cousins' icons) are from Microsoft's [Fluent Emoji](https://github.com/microsoft/fluentui-emoji), flat style, MIT licence. `node scripts/art/extract.mjs` regenerates them. Headline font: Berkshire Swash. UI font: Fredoka.
