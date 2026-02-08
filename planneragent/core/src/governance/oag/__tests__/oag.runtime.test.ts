// core/src/governance/oag/__tests__/oag.runtime.test.ts
// ======================================================
// OAG Runtime — Canonical Tests v1
// ======================================================

import { describe, it, expect } from "vitest";
import type { OagGraph } from "../../authority.graph";
import { oagStoreSingleton } from "../authority.graph.store";
import { validateOagAndBuildProof } from "../validateOagAndBuildProof";

describe("OAG runtime (stateless)", () => {
  it("allows board bootstrap proof", async () => {
    const graph: OagGraph = {
      company_id: "c1",
      actors: [
        { actor_id: "board-01", type: "board" },
        { actor_id: "user-01", type: "human" }
      ],
      delegations: []
    };

    oagStoreSingleton.setGraph(graph);

    const res = await validateOagAndBuildProof({
      company_id: "c1",
      actor_id: "board-01",
      plan: "PRINCIPAL",
      intent: "ADVISE",
      domain: "supply_chain"
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.proof.authority).toBe("board");
      expect(res.proof.company_id).toBe("c1");
    }
  });

  it("blocks self-delegation via graph validation", async () => {
    const graph: OagGraph = {
      company_id: "c2",
      actors: [{ actor_id: "user-01", type: "human" }],
      delegations: [
        {
          company_id: "c2",
          from_actor_id: "user-01",
          to_actor_id: "user-01",
          plan: "JUNIOR",
          domain: "supply_chain",
          intents: ["ADVISE"],
          issued_at: new Date().toISOString(),
          issued_by: "human"
        }
      ]
    };

    oagStoreSingleton.setGraph(graph);

    const res = await validateOagAndBuildProof({
      company_id: "c2",
      actor_id: "user-01",
      plan: "JUNIOR",
      intent: "ADVISE",
      domain: "supply_chain"
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason.startsWith("OAG_INVALID")).toBe(true);
  });

  it("allows delegated human authority when delegation matches", async () => {
    const graph: OagGraph = {
      company_id: "c3",
      actors: [
        { actor_id: "scm-director-01", type: "human" },
        { actor_id: "scm-manager-01", type: "human" }
      ],
      delegations: [
        {
          company_id: "c3",
          from_actor_id: "scm-director-01",
          to_actor_id: "scm-manager-01",
          plan: "SENIOR",
          domain: "supply_chain",
          intents: ["ADVISE", "EXECUTE", "WARN"],
          sponsor_id: "scm-director-01",
          issued_at: new Date().toISOString(),
          issued_by: "human"
        }
      ]
    };

    oagStoreSingleton.setGraph(graph);

    const res = await validateOagAndBuildProof({
      company_id: "c3",
      actor_id: "scm-manager-01",
      plan: "SENIOR",
      intent: "ADVISE",
      domain: "supply_chain"
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.proof.authority).toBe("human");
      expect(res.proof.sponsor_id).toBe("scm-director-01");
    }
  });

  it("blocks intent not allowed for plan (VISION cannot ADVISE)", async () => {
    const graph: OagGraph = {
      company_id: "c4",
      actors: [{ actor_id: "board-01", type: "board" }],
      delegations: []
    };

    oagStoreSingleton.setGraph(graph);

    const res = await validateOagAndBuildProof({
      company_id: "c4",
      actor_id: "board-01",
      plan: "VISION",
      intent: "ADVISE",
      domain: "supply_chain"
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason.startsWith("INTENT_NOT_ALLOWED_FOR_PLAN")).toBe(true);
  });
});

