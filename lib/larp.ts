"use client";

import { useSyncExternalStore } from "react";

/*
  Shared "larp" state. The footer headline sets it (LET'S TALK. becomes
  LET'S LARP.) and the nav's contact button reads it, so both labels change
  together. A module-level store: no provider, and only the two components
  that subscribe re-render.
*/
let larp = false;
const listeners = new Set<() => void>();

export const larpStore = {
  get: () => larp,
  set(next: boolean) {
    if (next === larp) return;
    larp = next;
    listeners.forEach((fn) => fn());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

export function useLarp() {
  return useSyncExternalStore(larpStore.subscribe, larpStore.get, () => false);
}
