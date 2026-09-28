import { useCallback, useEffect, useState } from "react";
import { PERSON_IDS, type PersonId } from "../data/people";

export type Route =
  | { name: "home" }
  | { name: "who" }
  | { name: "pin"; id: PersonId }
  | { name: "giftee"; id: PersonId };

const isPersonId = (id: string | undefined): id is PersonId =>
  !!id && (PERSON_IDS as readonly string[]).includes(id);

export function parseHash(hash: string): Route {
  const [, screen, id] = hash.replace(/^#/, "").split("/");
  if (screen === "who") return { name: "who" };
  if (screen === "pin" || screen === "giftee") {
    return isPersonId(id) ? { name: screen, id } : { name: "who" };
  }
  return { name: "home" };
}

export function toHash(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "who":
      return "#/who";
    default:
      return `#/${route.name}/${route.id}`;
  }
}

export type Navigate = (route: Route, options?: { replace?: boolean }) => void;

/** Keeps the current screen in the URL hash so the back button works. */
export function useHashRoute(): [Route, Navigate] {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback<Navigate>((next, { replace = false } = {}) => {
    const hash = toHash(next);
    if (replace) window.history.replaceState(null, "", hash);
    else window.history.pushState(null, "", hash);
    setRoute(next);
    window.scrollTo?.({ top: 0 });
  }, []);

  return [route, navigate];
}
