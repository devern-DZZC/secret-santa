import { drawSalt, encodedDraw } from "@data/assignments";
import { decodeReceiver } from "./secretCodec";

/** The only place the draw gets unscrambled. Call it through unlock(). */
export function getReceiverId(giverId: string): string | undefined {
  const encoded = encodedDraw[giverId];
  return encoded === undefined ? undefined : decodeReceiver(drawSalt, giverId, encoded);
}
