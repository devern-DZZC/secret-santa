# Event Itinerary and Giftee Cleanup Design

## Purpose

Update the existing Cousins' Secret Santa app for the confirmed 2026 event plan and remove gift recommendations from the product completely. The app must retain its festive reveal, private draw behavior, responsive layout, accessibility, and GitHub Pages compatibility.

## Event details

The exchange takes place on Sunday, 27 December 2026. The evening starts at 6:00 pm Trinidad time (UTC-4) and keeps the existing three-hour calendar duration.

The event is a two-stop itinerary:

1. Mini golf at Skallywag Bay, Chaguaramas, starting at 6:00 pm.
2. Dinner afterward at Sails Restaurant & Pub, Powerboats Marina, Western Main Road, Chaguaramas.

The event data will represent both stops as structured locations. Each stop contains a name, supporting address or activity text, and its own Google Maps search URL. This lets the event card offer accurate directions to either stop without merging two destinations into one ambiguous link.

## Event card

The landing-page event card and compact giftee-page event card will show the date and 6:00 pm start once, followed by the two itinerary stops in order. The first stop will be labelled “Mini golf” and the second “Dinner afterward.” Each stop will have its own clear “Open in Maps” link with an accessible name that identifies the destination.

The existing budget row remains conditional and hidden while no budget is configured. The existing wrapped-gift note remains on the full landing-page card only.

## Calendar invite

The downloadable calendar file remains a single event so a cousin can add the whole evening with one action. It will:

- start at 6:00 pm Trinidad time on Sunday, 27 December 2026;
- end at 9:00 pm using the existing three-hour duration;
- use Skallywag Bay, Chaguaramas as the calendar location because it is the meeting point;
- include the ordered itinerary, the Sails dinner location, and both Maps links in the description;
- preserve the existing event title and gift-wrapping note.

Calendar text continues to escape commas, semicolons, backslashes, and newlines correctly.

## Gift recommendation removal

Gift recommendations will be removed from the source model, not merely hidden in the interface. The `GiftIdea` type, `wishlist` property, and all placeholder recommendations will be deleted from the participant data. Public unlock results will contain only the participant identity fields needed by the reveal flow and will continue to exclude PINs and the assignment map.

Tests and documentation will stop promising or inspecting three gift ideas. This change does not regenerate, expose, or alter the existing Secret Santa draw.

## Giftee screen layout

After the reveal, the recipient card remains the visual focus. The removed recommendation section will be replaced by a short mission line that reinforces the action without suggesting gifts: “Your mission: pick out something thoughtful and keep it secret.”

The content order will be:

1. Recipient reveal card.
2. Short mission and secrecy message.
3. Compact two-stop event itinerary.
4. Replay and switch-person controls.

Spacing will be rebalanced so the shorter page feels intentional at 375 pixels wide. Existing reveal animation, reduced-motion behavior, sound, focus management, and tap-target sizing remain unchanged.

## Testing

Unit tests will verify the new start time, both structured locations, their Maps URLs, and the calendar event's UTC start and end values. The calendar description test will verify both itinerary stops without depending on a brittle full-file snapshot.

Unlock tests will continue to cover the full 10-by-10 PIN matrix and no-leak guarantees after the wishlist fields are removed. Giftee component tests will verify the recipient and mission copy after the three-tap reveal and confirm that recommendation headings and list items are absent.

Playwright tests will verify the landing page's two-stop itinerary, 6:00 pm time, both destination links, and the reveal flow without gift cards. Existing mobile overflow, minimum tap target, remembered unlock, wrong-PIN, reduced-motion, and console-error checks remain in place.

The normal validation commands are `npm test`, `npm run test:e2e`, and `npm run build`. Test failures involving the committed draw must continue to avoid printing assignments.

## Scope boundaries

This update does not change participants, PINs, exclusion rules, assignments, drawing behavior, budget, event title, animation style, sounds, or deployment configuration. It does not add a dinner time because dinner follows mini golf rather than beginning at a separately confirmed time.
