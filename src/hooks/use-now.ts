"use client";

import { useSyncExternalStore } from "react";

// Shared wall clock. Returns null during SSR and hydration so server and client markup
// match, then the current time in ms, refreshed every `tick` ms while anything listens.
type Clock = { now: number | null; timer?: ReturnType<typeof setInterval>; listeners: Set<() => void> };
const clocks = new Map<number, Clock>();

function clock(tick: number): Clock {
  let c = clocks.get(tick);
  if (!c) {
    c = { now: null, listeners: new Set() };
    clocks.set(tick, c);
  }
  return c;
}

function subscribeTo(tick: number) {
  return (cb: () => void) => {
    const c = clock(tick);
    c.listeners.add(cb);
    if (!c.timer) {
      c.now = Date.now();
      c.timer = setInterval(() => {
        c.now = Date.now();
        c.listeners.forEach((l) => l());
      }, tick);
    }
    return () => {
      c.listeners.delete(cb);
      if (!c.listeners.size && c.timer) {
        clearInterval(c.timer);
        c.timer = undefined;
        c.now = null;
      }
    };
  };
}

const subscribers = new Map<number, (cb: () => void) => () => void>();

export function useNow(tick = 1000): number | null {
  let subscribe = subscribers.get(tick);
  if (!subscribe) {
    subscribe = subscribeTo(tick);
    subscribers.set(tick, subscribe);
  }
  return useSyncExternalStore(
    subscribe,
    () => clock(tick).now,
    () => null,
  );
}
