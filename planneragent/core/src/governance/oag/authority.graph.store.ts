// core/src/governance/oag/authority.graph.store.ts
// ======================================================
// OAG Graph Store — Runtime Singleton (Canonical)
// ======================================================

import type { OagGraph } from "../authority.graph";

class OagStoreSingleton {
  private graph: OagGraph | null = null;

  setGraph(graph: OagGraph) {
    this.graph = graph;
  }

  getGraph(): OagGraph | null {
    return this.graph;
  }

  clear() {
    this.graph = null;
  }
}

export const oagStoreSingleton = new OagStoreSingleton();