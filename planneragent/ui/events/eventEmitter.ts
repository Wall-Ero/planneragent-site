// planneragent/ui/events/eventEmitter.ts
// ==================================
// UI Event Emitter (NO SIDE EFFECTS)
// ==================================

import type { UiEvent } from "./uiEvents";

type UiEventListener = (event: UiEvent) => void;

const listeners: UiEventListener[] = [];

export function emitUiEvent(event: UiEvent): void {
  // 🔒 P8 rule: UI emits, system decides
  for (const listener of listeners) {
    listener(event);
  }
}

export function onUiEvent(listener: UiEventListener): void {
  listeners.push(listener);
}