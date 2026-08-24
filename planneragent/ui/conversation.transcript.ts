export const MAX_VISIBLE_EXCHANGES = 3;

export type ConversationExchangeV1 = Readonly<{
  element: HTMLElement;
  userTurn: HTMLElement;
  assistantTurn?: HTMLElement;
  state: "PENDING" | "COMPLETE" | "FAILED";
}>;

function createTurn(document: Document, speaker: "You" | "PlannerAgent", text: string, kind: "user" | "planneragent"): HTMLElement {
  const turn = document.createElement("div");
  turn.className = `conversation-turn conversation-turn-${kind}`;
  const label = document.createElement("div");
  label.className = "conversation-speaker";
  label.textContent = speaker;
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  turn.append(label, paragraph);
  return turn;
}

export function createConversationTranscriptV1(document: Document): HTMLElement {
  const transcript = document.createElement("div");
  transcript.className = "conversation-transcript";
  transcript.setAttribute("role", "log");
  transcript.setAttribute("aria-live", "polite");
  transcript.setAttribute("aria-relevant", "additions");
  return transcript;
}

export function positionConversationTurnAtStartV1(transcript: HTMLElement, turn: HTMLElement): void {
  transcript.scrollTop = turn.offsetTop;
}

export function beginConversationExchangeV1(document: Document, transcript: HTMLElement, text: string): ConversationExchangeV1 {
  const element = document.createElement("div");
  element.className = "conversation-exchange";
  element.dataset.exchangeState = "pending";
  const userTurn = createTurn(document, "You", text, "user");
  element.append(userTurn);
  transcript.append(element);
  positionConversationTurnAtStartV1(transcript, element);
  return Object.freeze({ element, userTurn, state: "PENDING" });
}

export function completeConversationExchangeV1(document: Document, exchange: ConversationExchangeV1, text: string): ConversationExchangeV1 {
  const assistantTurn = createTurn(document, "PlannerAgent", text, "planneragent");
  exchange.element.append(assistantTurn);
  exchange.element.dataset.exchangeState = "complete";
  const transcript = exchange.element.parentElement;
  if (transcript) positionConversationTurnAtStartV1(transcript, assistantTurn);
  return Object.freeze({ ...exchange, assistantTurn, state: "COMPLETE" });
}

export function failConversationExchangeV1(exchange: ConversationExchangeV1): ConversationExchangeV1 {
  exchange.element.dataset.exchangeState = "failed";
  return Object.freeze({ ...exchange, state: "FAILED" });
}

export function trimConversationExchangesV1(exchanges: readonly ConversationExchangeV1[]): ConversationExchangeV1[] {
  const retained = [...exchanges];
  while (retained.length > MAX_VISIBLE_EXCHANGES) {
    const removable = retained.findIndex(({ state }) => state !== "PENDING");
    if (removable < 0) break;
    retained.splice(removable, 1)[0]?.element.remove();
  }
  return retained;
}
