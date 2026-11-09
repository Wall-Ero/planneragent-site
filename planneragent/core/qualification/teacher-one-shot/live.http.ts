import { Agent, request as httpsRequest } from "node:https";
import { hybridSnapshotV1 } from "../../src/conversation/cognition/hybrid.conversational.contracts.v1";
import { denyRealDispatchV1, LIVE_NETWORK_ENABLED_V1, OneShotTransportErrorV1, TEACHER_ENDPOINT_V1 } from "./live.contracts";
import { validateNativeAuthorizationV1, requireNativeLocalInputBoundsV1 } from "./live.authorization";
import { LiveAttemptJournalV1 } from "./live.journal";
import { inspectFrozenOneShotPayloadV1 } from "./executor";

export type OneShotHttpRequestV1 = Readonly<{ method: "POST"; url: string; body: string; headers: Readonly<Record<string, string>> }>;
export type OneShotHttpResponseV1 = Readonly<{ status: number; url: string;
  headers: Readonly<Record<string, string | readonly string[] | undefined>>; body: AsyncIterable<Uint8Array>; close: () => void }>;
export interface OneShotHttpClientV1 { post(request: OneShotHttpRequestV1, signal: AbortSignal): Promise<OneShotHttpResponseV1> }

// The native implementation exists for review, but cannot reach a socket in 13J.
// No switch, env, token presence or test success can bypass this unconditional denial.
export class HardDisabledHttpsClientV1 implements OneShotHttpClientV1 {
  async post(input: OneShotHttpRequestV1, signal: AbortSignal): Promise<OneShotHttpResponseV1> {
    denyRealDispatchV1();
  }
}

// STEP13K: native backend is prepared, but the source gate remains false.
export class GuardedNativeHttpsClientV1 implements OneShotHttpClientV1 {
  private consumed = false;
  constructor(private readonly authorization: unknown, private readonly journal: LiveAttemptJournalV1) {}
  async post(input: OneShotHttpRequestV1, signal: AbortSignal): Promise<OneShotHttpResponseV1> {
    if (!LIVE_NETWORK_ENABLED_V1) denyRealDispatchV1();
    validateNativeAuthorizationV1(this.authorization);
    requireNativeLocalInputBoundsV1();
    if (!(this.journal instanceof LiveAttemptJournalV1) || this.journal.storage_mode !== "FIXED_LIVE_LOCATION" ||
        this.journal.inspect().state !== "CONSUMED_OUTCOME_UNKNOWN") throw new OneShotTransportErrorV1("DISPATCH_PERMISSION_DENIED");
    if (this.consumed) throw new OneShotTransportErrorV1("SECONDARY_REQUEST_DENIED");
    this.consumed = true;
    if (input.url !== TEACHER_ENDPOINT_V1 || input.method !== "POST") throw new OneShotTransportErrorV1("ENDPOINT_INVALID");
    const body = inspectFrozenOneShotPayloadV1().wire.body;
    if (input.body !== body || !/^Bearer [A-Za-z0-9_-]{20,256}$/.test(input.headers.authorization ?? "") ||
        Object.keys(input.headers).sort().join(",") !== "accept,accept-encoding,authorization,content-length,content-type" ||
        input.headers.accept !== "application/json" || input.headers["content-type"] !== "application/json" ||
        input.headers["accept-encoding"] !== "identity" || input.headers["content-length"] !== String(Buffer.byteLength(body))) {
      throw new OneShotTransportErrorV1("NATIVE_REQUEST_INVALID");
    }
    if (signal.aborted) throw new OneShotTransportErrorV1("DEADLINE_EXCEEDED");
    this.journal.claimNativeRequest();
    const agent = new Agent({ keepAlive: false, maxSockets: 1, rejectUnauthorized: true });
    return new Promise((resolve, reject) => {
      try {
      const outgoing = httpsRequest(input.url, { method: "POST", headers: input.headers, signal, agent, rejectUnauthorized: true }, response => {
        resolve({ status: response.statusCode ?? 0, url: input.url, headers: response.headers, body: response,
          close: () => { response.destroy(); agent.destroy(); } });
      });
      outgoing.once("error", () => { agent.destroy(); reject(new OneShotTransportErrorV1("CONNECTION_FAILED")); });
      outgoing.end(input.body, "utf8"); // One request, no redirect/retry/proxy/provider discovery logic.
      } catch { agent.destroy(); reject(new OneShotTransportErrorV1("CONNECTION_FAILED")); }
    });
  }
}

export type InjectedHttpFixtureV1 = Readonly<{
  status: number; headers: Readonly<Record<string, string | readonly string[]>>;
  chunks: readonly string[]; url?: string; byte_chunks?: readonly (readonly number[])[];
  header_delay_ms?: number; chunk_delay_ms?: number; connection_failure?: boolean; body_failure?: boolean;
}>;
async function fixtureDelay(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) throw new OneShotTransportErrorV1("DEADLINE_EXCEEDED");
  if (!ms) return;
  await new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); reject(new OneShotTransportErrorV1("DEADLINE_EXCEEDED")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}

// A data-only injectable client. It accepts no callback, URL loader or network implementation.
export class InjectedHttpFixtureClientV1 implements OneShotHttpClientV1 {
  private readonly fixture: InjectedHttpFixtureV1;
  private count = 0;
  private closed = false;
  private readChunks = 0;
  private captured?: Readonly<{ method: string; url: string; body: string; headers: Readonly<Record<string, string>>; authorization_nonempty: boolean }>;
  constructor(fixture: InjectedHttpFixtureV1) { this.fixture = hybridSnapshotV1(fixture); }
  async post(input: OneShotHttpRequestV1, signal: AbortSignal): Promise<OneShotHttpResponseV1> {
    if (++this.count !== 1) throw new OneShotTransportErrorV1("SECONDARY_REQUEST_DENIED");
    this.captured = hybridSnapshotV1({ method: input.method, url: input.url, body: input.body,
      headers: { "content-type": input.headers["content-type"], accept: input.headers.accept, "accept-encoding": input.headers["accept-encoding"],
        "content-length": input.headers["content-length"], authorization: "Bearer [REDACTED]" },
      authorization_nonempty: input.headers.authorization === "Bearer [OFFLINE_PLACEHOLDER_NOT_A_CREDENTIAL]" });
    await fixtureDelay(this.fixture.header_delay_ms ?? 0, signal);
    if (this.fixture.connection_failure) throw new Error("INJECTED_UNTRUSTED_ERROR_MUST_NOT_ESCAPE");
    const owner = this;
    async function* body() {
      const chunks = owner.fixture.byte_chunks ? owner.fixture.byte_chunks.map(c => Uint8Array.from(c)) : owner.fixture.chunks.map(c => Buffer.from(c, "utf8"));
      for (const chunk of chunks) {
        await fixtureDelay(owner.fixture.chunk_delay_ms ?? 0, signal);
        if (owner.closed || signal.aborted) throw new OneShotTransportErrorV1("DEADLINE_EXCEEDED");
        owner.readChunks++; yield chunk;
      }
      if (owner.fixture.body_failure) throw new Error("INJECTED_UNTRUSTED_BODY_FAILURE");
    }
    return { status: this.fixture.status, url: this.fixture.url ?? input.url, headers: this.fixture.headers,
      body: body(), close: () => { this.closed = true; } };
  }
  inspect() { return hybridSnapshotV1({ calls: this.count, closed: this.closed, chunks_read: this.readChunks, ...(this.captured ? { request: this.captured } : {}) }); }
}
