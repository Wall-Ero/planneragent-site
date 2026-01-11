import { evaluateSandboxV2 } from "./sandbox/orchestrator.v2";
import { parseSandboxEvaluateRequestV2 } from "./sandbox/apiBoundary.v2";

interface Env {
  POLICIES_DB: D1Database;
    }

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const rawBody = await req.json();
      const request = parseSandboxEvaluateRequestV2(rawBody);

      // PASSI IL DB

      const result = await evaluateSandboxV2(request);

      return new Response(JSON.stringify(result, null, 2), {
        headers: { "content-type": "application/json" },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message ?? "Invalid request" }),
        { status: 400 }
      );
    }
  },
};