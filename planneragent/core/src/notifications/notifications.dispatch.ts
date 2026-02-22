// core/src/notifications/notifications.dispatch.ts
// =====================================================
// Notifications Dispatcher — Canonical v1
// =====================================================

import {
  FounderAlertEvent,
  NotificationResult,
} from "./notification.types";

import { resolveChannels } from "./notification.registry";

import { sendWhatsApp } from "./providers/twilioWhatsApp";
import { sendEmail } from "./providers/emailProvider";

// -----------------------------------------------------
// In-memory rate limit (v1, per tenant + severity)
// -----------------------------------------------------

const RATE_LIMITS = {
  CRITICAL: 3,
  WARNING: 5,
};

const counters = new Map<string, number>();

// -----------------------------------------------------
// Public API
// -----------------------------------------------------

export async function notifyFounder(
  event: FounderAlertEvent
): Promise<NotificationResult> {
  const key = `${event.tenantId}:${event.severity}`;
  const count = counters.get(key) ?? 0;

  const limit =
    event.severity === "CRITICAL"
      ? RATE_LIMITS.CRITICAL
      : RATE_LIMITS.WARNING;

  if (count >= limit) {
    return { delivered: false, channelUsed: null };
  }

  counters.set(key, count + 1);

  const message = formatMessage(event);
  const channels = resolveChannels(event);

  for (const channel of channels) {
    try {
      if (channel === "WHATSAPP") {
        await sendWhatsApp(message, {
          accountSid: process.env.TWILIO_ACCOUNT_SID!,
          authToken: process.env.TWILIO_AUTH_TOKEN!,
          fromWhatsApp: process.env.TWILIO_WHATSAPP_FROM!,
          toWhatsApp: process.env.FOUNDER_WHATSAPP_TO!,
        });
        return { delivered: true, channelUsed: "WHATSAPP" };
      }

      if (channel === "EMAIL") {
        await sendEmail({
          to: process.env.FOUNDER_EMAIL_TO!,
          subject: `[PlannerAgent] ${event.eventType}`,
          body: message,
        });
        return { delivered: true, channelUsed: "EMAIL" };
      }
    } catch {
      // try next channel
    }
  }

  return { delivered: false, channelUsed: null };
}

// -----------------------------------------------------
// Formatting
// -----------------------------------------------------

function formatMessage(event: FounderAlertEvent): string {
  return `
PlannerAgent Alert

Event: ${event.eventType}
Severity: ${event.severity}
Tenant: ${event.tenantId}
Legal entity: ${event.legalEntityState}
Reason: ${event.reason}

No action was executed automatically.
Timestamp: ${event.timestamp}
`.trim();
}