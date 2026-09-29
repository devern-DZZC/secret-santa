import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, m } from "motion/react";
import { people, type PersonId } from "../data/people";
import { createAttemptTracker } from "../lib/attempts";
import { forgetUnlock, getRemembered, rememberUnlock } from "../lib/remember";
import { unlock, type UnlockResult } from "../lib/unlock";
import { useHashRoute } from "./router";
import { screenTransition, useCalmMode } from "./motion";
import { Lights } from "./scene/Lights";
import { Snow } from "./scene/Snow";
import { Sleigh } from "./scene/Sleigh";
import { Village } from "./scene/Village";
import { SoundToggle } from "./components/SoundToggle";
import { Giftee } from "./screens/Giftee";
import { Landing } from "./screens/Landing";
import { PinPad } from "./screens/PinPad";
import { WhoAreYou } from "./screens/WhoAreYou";

/** Unlock from memory (this session) or from this device's remembered PIN. */
function resolveGiftee(id: PersonId, session: UnlockResult | null): UnlockResult | null {
  if (session?.giver.id === id) return session;
  const remembered = getRemembered();
  return remembered?.id === id ? unlock(id, remembered.pin) : null;
}

export function App() {
  const calm = useCalmMode();
  const [route, navigate] = useHashRoute();
  const [session, setSession] = useState<UnlockResult | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const tracker = useMemo(() => createAttemptTracker(), []);

  const giftee = useMemo(
    () => (route.name === "giftee" ? resolveGiftee(route.id, session) : null),
    [route, session],
  );

  // A giftee link without a valid unlock always goes back to the PIN screen.
  useEffect(() => {
    if (route.name === "giftee" && !giftee) navigate({ name: "pin", id: route.id }, { replace: true });
  }, [route, giftee, navigate]);

  const pick = (id: PersonId) => {
    if (resolveGiftee(id, session)) {
      setJustUnlocked(false);
      navigate({ name: "giftee", id });
    } else navigate({ name: "pin", id });
  };

  const unlocked = (result: UnlockResult, pin: string) => {
    rememberUnlock(result.giver.id, pin);
    setSession(result);
    setJustUnlocked(true);
    navigate({ name: "giftee", id: result.giver.id });
  };

  const switchPerson = () => {
    forgetUnlock();
    setSession(null);
    navigate({ name: "who" });
  };

  const key = route.name === "pin" || route.name === "giftee" ? `${route.name}-${route.id}` : route.name;

  let screen: React.ReactNode = null;
  if (route.name === "home") screen = <Landing onStart={() => navigate({ name: "who" })} />;
  else if (route.name === "who") screen = <WhoAreYou onPick={pick} onBack={() => navigate({ name: "home" })} />;
  else if (route.name === "pin") {
    const person = people.find((p) => p.id === route.id)!;
    screen = (
      <PinPad person={person} tracker={tracker} onUnlocked={unlocked} onBack={() => navigate({ name: "who" })} />
    );
  } else if (giftee) screen = <Giftee result={giftee} playReveal={justUnlocked} onSwitch={switchPerson} />;

  return (
    <div className="page">
      <div className="sky" aria-hidden="true" />
      {!calm && <Snow />}
      {!calm && route.name !== "pin" && <Sleigh />}
      {route.name !== "pin" && <Village />}
      <Lights />
      <SoundToggle />
      <main className={`app app--${route.name}`}>
        <AnimatePresence mode="wait">
          <m.div key={key} {...screenTransition(calm)}>
            {screen}
          </m.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
