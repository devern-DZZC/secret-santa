/** npm run pins:list  Prints each cousin's PIN to send privately. Never prints the draw. */
import { people } from "../src/data/people";

console.log("Send each cousin their PIN privately:\n");
for (const p of people) console.log(`${p.name.padEnd(24)} ${p.pin}`);
