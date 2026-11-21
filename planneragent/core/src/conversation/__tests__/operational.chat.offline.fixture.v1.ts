import { expect, vi } from "vitest";
import { createRequire } from "node:module";
import gateway from "../../../../gateway/src/index";
import core from "../../worker";
import { PUBLIC_CONVERSATION_ID_HEADER_V1, PUBLIC_CONVERSATION_CONTEXT_HEADER_V1 } from "../anonymous.vision.conversation.contracts.v1";

// DOM boundary only: production main.ts creates the actual markup, listeners,
// composer/client and transcript. No UI business logic or Core reply is mocked.
// This proves the product code path in Node, not browser layout compatibility.
export class Element extends EventTarget {
  children: Element[] = [];
  parentElement: Element | null = null;
  dataset: Record<string, string> = {};
  attributes: Record<string, string> = {};
  value = ""; hidden = false; title = ""; ariaLabel = "";
  scrollTop = 0; offsetTop = 0;
  private text = "";
  constructor(readonly tagName = "div") { super(); }
  get className() { return this.attributes.class ?? ""; }
  set className(value: string) { this.attributes.class = value; }
  classList = { add: (...names: string[]) => { this.className = [...new Set([...this.className.split(/\s+/), ...names])].join(" "); } };
  style = { setProperty() {} };
  setAttribute(name: string, value: string) { this.attributes[name] = value; }
  append(...children: Element[]) { for (const child of children) { child.parentElement = this; this.children.push(child); } }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
  get textContent(): string { return this.text + this.children.map(child => child.textContent).join(""); }
  set textContent(value: string) { this.text = value; this.children = []; }
  querySelector<T = Element>(selector: string): T | null {
    for (const child of this.children) {
      if (selector.startsWith(".") ? child.className.split(/\s+/).includes(selector.slice(1)) :
        selector.startsWith("#") ? child.attributes.id === selector.slice(1) : child.tagName === selector) return child as T;
      const found = child.querySelector<T>(selector); if (found) return found;
    }
    return null;
  }
  set innerHTML(html: string) {
    this.children = []; this.text = "";
    const stack: Element[] = [this];
    for (const match of html.matchAll(/<\/?([A-Za-z][\w:-]*)\b([^>]*)>/g)) {
      const [token, tag, attrs] = match;
      if (token.startsWith("</")) { if (stack.length > 1) stack.pop(); continue; }
      const element = new Element(tag);
      for (const attr of attrs.matchAll(/([\w:-]+)="([^"]*)"/g)) element.setAttribute(attr[1], attr[2]);
      stack.at(-1)!.append(element);
      if (!token.endsWith("/>") && !["input", "img", "br", "hr", "meta", "link"].includes(tag)) stack.push(element);
    }
  }
}
createRequire(import.meta.url)("../../../qualification/teacher-one-shot/offline.network-deny.cjs");
const deniedFetch = globalThis.fetch;
const offlineEnv = Object.freeze({ INTERPRETATION_STUDENT_SHADOW_STATE: "DISABLED",
  INTERPRETATION_STUDENT_KILL_SWITCH: "true", INTERPRETATION_STUDENT_LIVE_STATE: "DISABLED",
  INTERPRETATION_STUDENT_SECONDARY_KILL_SWITCH: "true" });
let sequence = 0;

export async function mount(options: { hold?: boolean; holdTurn?: number; malformed?: boolean; noForwarding?: boolean; transportError?: boolean;
  stripContinuity?: boolean; stripContextResponse?: boolean; edgeClient?: string; mutateContinuity?: (headers: Headers, turn: number) => void } = {}) {
  const root = new Element(); root.setAttribute("id", "app");
  const documentRoot = new Element(); documentRoot.append(root);
  const document = { querySelector: (selector: string) => documentRoot.querySelector(selector), createElement: (tag: string) => new Element(tag) };
  vi.stubGlobal("document", document);
  vi.stubGlobal("window", { addEventListener() {}, requestAnimationFrame: () => 1 });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const requests: Record<string, unknown>[] = [], replies: Record<string, unknown>[] = [];
  const statuses: number[] = [];
  const clientRequests: Record<string, unknown>[] = [], clientStatuses: number[] = [];
  const clientHeaders: Headers[] = [], coreHeaders: Headers[] = [], responseHeaders: Headers[] = [], clientResponseHeaders: Headers[] = [];
  const realCore = vi.fn(async (request: Request) => {
    if (new URL(request.url).pathname === "/conversation") { requests.push(await request.clone().json()); coreHeaders.push(new Headers(request.headers)); }
    const response = await core.fetch(request, offlineEnv as never);
    if (new URL(request.url).pathname === "/conversation") { replies.push(await response.clone().json()); statuses.push(response.status); responseHeaders.push(new Headers(response.headers)); }
    return response;
  });
  const gatewayFetch = vi.spyOn(gateway, "fetch");
  let release: (() => void) | undefined;
  let signal: AbortSignal | undefined;
  const edgeClient = options.edgeClient ?? `offline-ui-${++sequence}`;
  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input), "https://planneragent.test");
    if (url.origin !== "https://planneragent.test") return deniedFetch(input, init);
    if (url.pathname === "/conversation") { clientRequests.push(JSON.parse(String(init?.body))); clientHeaders.push(new Headers(init?.headers)); }
    if (options.transportError && url.pathname === "/conversation") throw new TypeError("SYNTHETIC_TRANSPORT_FAILURE");
    const headers = new Headers(init?.headers); headers.set("cf-connecting-ip", edgeClient);
    if (url.pathname === "/conversation") {
      if (options.stripContinuity) { headers.delete(PUBLIC_CONVERSATION_ID_HEADER_V1); headers.delete(PUBLIC_CONVERSATION_CONTEXT_HEADER_V1); }
      options.mutateContinuity?.(headers, clientRequests.length);
    }
    let request = new Request(url, { ...init, headers });
    if (options.malformed && url.pathname === "/conversation") request = new Request(url, { method: "POST", headers, body: '{"version":2}' });
    if (options.noForwarding && url.pathname === "/conversation") { clientStatuses.push(404); return new Response("Not found", { status: 404 }); } // Deliberate negative control, not the positive E2E.
    let response = await gateway.fetch(request, { CORE: { fetch: realCore } as never });
    if (options.stripContextResponse && url.pathname === "/conversation") {
      const filtered = new Headers(response.headers); filtered.delete(PUBLIC_CONVERSATION_CONTEXT_HEADER_V1);
      response = new Response(response.body, { status: response.status, headers: filtered });
    }
    if (url.pathname === "/conversation") clientStatuses.push(response.status);
    if (url.pathname === "/conversation") clientResponseHeaders.push(new Headers(response.headers));
    if ((options.hold || options.holdTurn === clientRequests.length) && url.pathname === "/conversation") {
      signal = init?.signal ?? undefined;
      return new Promise<Response>((resolve, reject) => {
        release = () => resolve(response);
        const abort = () => reject(new DOMException("Aborted", "AbortError"));
        if (signal?.aborted) abort(); else signal?.addEventListener("abort", abort, { once: true });
      });
    }
    return response;
  });
  await import("../../../../ui/main");
  await vi.waitFor(() => expect(root.querySelector(".composer-action")).not.toBeNull());
  const composer = root.querySelector<Element>(".composer")!, input = root.querySelector<Element>("#message")!;
  const submit = (message: string) => { input.value = message; input.dispatchEvent(new Event("input")); composer.dispatchEvent(new Event("submit", { cancelable: true })); };
  return { root, requests, replies, statuses, clientRequests, clientStatuses, clientHeaders, coreHeaders, responseHeaders, clientResponseHeaders, realCore, gatewayFetch, submit,
    exchanges: () => [...(root.querySelector<Element>(".conversation-transcript")?.children ?? [])], signal: () => signal, release: () => release?.(),
    answer: () => root.querySelector<Element>(".conversation-turn-planneragent"),
    state: () => root.querySelector<Element>(".conversation-exchange")?.dataset.exchangeState };
}
