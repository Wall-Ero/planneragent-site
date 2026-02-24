// core/src/ledger/ledger.event.ts
// =====================================================
// Ledger Event — Legal-Grade Evidence Schema (Canonical)
// Append-only · Human-readable · Audit-first
// =====================================================

/**
 * NON NEGOZIABILE:
 * - append-only
 * - leggibile senza codice
 * - orientato a responsabilità legale, non logging tecnico
 */

// -----------------------------------------------------
// EVENT CATEGORIES (Responsibility classes)
// -----------------------------------------------------

export type LedgerEventCategory =
  | "ui_signal"              // osservazione, mai decisionale
  | "intent_declared"        // qualcuno ha espresso una volontà
  | "authority_granted"      // è stato concesso potere
  | "approval_given"         // un umano ha approvato
  | "execution_attempted"    // qualcuno ha provato ad agire
  | "execution_blocked"      // il sistema ha bloccato
  | "execution_completed"    // azione completata
  | "commercial"             // fatti economici verificabili
  | "governance"             // regole, stati costituzionali
  | "notification";          // comunicazioni ufficiali inviate

// -----------------------------------------------------
// DOMAIN EVENT TYPES (chiusi e tipizzati)
// -----------------------------------------------------

export type LedgerEventType =
  // Governance / SRL
  | "OPEN_SRL_ELIGIBLE"
  | "OPEN_SRL_TRIGGERED"

  // Commercial
  | "CHECKOUT_CREATED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "SUBSCRIPTION_STARTED"
  | "SUBSCRIPTION_CANCELED";

// -----------------------------------------------------
// ACTOR & RESPONSIBILITY CONTEXT
// -----------------------------------------------------

export type LedgerActor = Readonly<{
  actor_id: string;               // user_id | system | webhook
  actor_type: "human" | "system";
  role?: string;                  // Vision | Junior | Senior | Principal
}>;

// -----------------------------------------------------
// LEDGER EVENT (LEGAL EVIDENCE)
// -----------------------------------------------------

export type LedgerEvent = Readonly<{
  id: string;

  /**
   * Classe di responsabilità
   * (serve per audit, board, legal review)
   */
  category: LedgerEventCategory;

  /**
   * Cosa è successo
   * - tipizzato per eventi di dominio
   * - stringa libera SOLO per ui_signal
   */
  type: LedgerEventType | string;

  /**
   * Chi è responsabile (se applicabile)
   */
  actor?: LedgerActor;

  /**
   * Contesto dell’evento
   * Deve essere JSON leggibile e autoesplicativo
   */
  payload: Readonly<Record<string, unknown>>;

  /**
   * Timestamp ISO, unico riferimento temporale
   */
  created_at: string;
}>;