import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { beginConversationExchangeV1, completeConversationExchangeV1, createConversationTranscriptV1, failConversationExchangeV1, MAX_VISIBLE_EXCHANGES, trimConversationExchangesV1, type ConversationExchangeV1 } from "./conversation.transcript.ts";

class FakeElement {
  className = "";
  textContent = "";
  dataset: Record<string, string> = {};
  children: FakeElement[] = [];
  parentElement: FakeElement | null = null;
  scrollTop = 0;
  offsetTop = 0;
  attributes: Record<string, string> = {};
  append(...children: FakeElement[]) { for (const child of children) { child.parentElement = this; child.offsetTop = this.offsetTop + this.children.length * 100; this.children.push(child); } }
  remove() { if (!this.parentElement) return; this.parentElement.children = this.parentElement.children.filter((child) => child !== this); this.parentElement = null; }
  setAttribute(name: string, value: string) { this.attributes[name] = value; }
}

const fakeDocument = { createElement: () => new FakeElement() } as unknown as Document;
const asFake = (element: HTMLElement) => element as unknown as FakeElement;

describe("CONVERSATION-TRANSCRIPT-V1", () => {
  it("creates a pending user exchange and safely completes the same exchange", () => {
    const transcript = createConversationTranscriptV1(fakeDocument);
    const pending = beginConversationExchangeV1(fakeDocument, transcript, '<img src=x onerror="alert(1)">');
    assert.equal(asFake(transcript).children.length, 1);
    assert.equal(asFake(pending.userTurn).children[1]?.textContent, '<img src=x onerror="alert(1)">');
    const complete = completeConversationExchangeV1(fakeDocument, pending, "PlannerAgent answer");
    assert.equal(complete.element, pending.element);
    assert.equal(asFake(complete.element).children.length, 2);
    assert.equal(asFake(complete.assistantTurn!).children[1]?.textContent, "PlannerAgent answer");
    assert.equal(asFake(transcript).scrollTop, asFake(complete.assistantTurn!).offsetTop);
  });

  it("retains two and three complete exchanges, then removes only the oldest pair", () => {
    const transcript = createConversationTranscriptV1(fakeDocument);
    let exchanges: ConversationExchangeV1[] = [];
    for (let index = 1; index <= 4; index++) {
      const pending = beginConversationExchangeV1(fakeDocument, transcript, `question-${index}`);
      exchanges.push(completeConversationExchangeV1(fakeDocument, pending, `answer-${index}`));
      exchanges = trimConversationExchangesV1(exchanges);
      assert.equal(exchanges.length, Math.min(index, MAX_VISIBLE_EXCHANGES));
    }
    assert.deepEqual(exchanges.map(({ userTurn }) => asFake(userTurn).children[1]?.textContent), ["question-2", "question-3", "question-4"]);
    assert.deepEqual(exchanges.map(({ assistantTurn }) => asFake(assistantTurn!).children[1]?.textContent), ["answer-2", "answer-3", "answer-4"]);
    assert.equal(asFake(transcript).children.length, 3);
  });

  it("preserves a failed user turn without rendering failure data as assistant speech", () => {
    const transcript = createConversationTranscriptV1(fakeDocument);
    const failed = failConversationExchangeV1(beginConversationExchangeV1(fakeDocument, transcript, "question"));
    assert.equal(failed.state, "FAILED");
    assert.equal(asFake(failed.element).children.length, 1);
    assert.equal(asFake(failed.element).children.some((child) => child.textContent.includes("SERVICE_UNAVAILABLE")), false);
  });

  it("keeps invitation centering separate from top-aligned conditional transcript scrolling", () => {
    const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
    assert.match(styles, /\.conversation-content[^}]*justify-content:\s*center/);
    assert.match(styles, /\.conversation-transcript[^}]*overflow-y:\s*auto/);
    assert.doesNotMatch(styles, /\.conversation-transcript[^}]*justify-content:\s*center/);
  });

  it("leaves the isolated current-message request and Abort client behavior unchanged", () => {
    const client = readFileSync(new URL("./conversation.client.ts", import.meta.url), "utf8");
    assert.match(client, /body:\s*JSON\.stringify\(\{\s*version:\s*1,\s*request_id:\s*requestId,\s*message:\s*text\s*\}\)/);
    assert.doesNotMatch(client, /transcript|exchange|history|previous/i);
    assert.match(client, /stop\(\):\s*void\s*\{[^}]*active\?\.controller\.abort\(\)/);
    assert.match(client, /controller\.signal\.aborted[^}]*ABORTED/);
  });
});
