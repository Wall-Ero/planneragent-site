// core/src/notifications/notification.registry.ts
// =====================================================
// Notification Registry — Canonical
// Decides WHICH channels are allowed
// =====================================================

// Channel resolution rules (data-driven, no side effects)

import { FounderAlertEvent, NotificationChannel } from "./notification.types";

export function resolveChannels(
  event: FounderAlertEvent
): ReadonlyArray<NotificationChannel> {
  if (event.severity === "CRITICAL") {
    return ["WHATSAPP", "EMAIL"];
  }

  if (event.severity === "WARNING") {
    return ["WHATSAPP"];
  }

  return ["EMAIL"];
}