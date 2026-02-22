// core/src/notifications/notification.types.ts
// Canonical notification domain types

export type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL";

export type LegalEntityState = "PRE_SRL" | "SRL_ACTIVE";

export type FounderAlertEvent = Readonly<{
  eventType: string;
  severity: NotificationSeverity;
  tenantId: string;
  legalEntityState: LegalEntityState;
  reason: string;
  timestamp: string; // ISO UTC
}>;

export type NotificationChannel = "WHATSAPP" | "EMAIL";

export type NotificationResult = Readonly<{
  delivered: boolean;
  channelUsed: NotificationChannel | null;
}>;