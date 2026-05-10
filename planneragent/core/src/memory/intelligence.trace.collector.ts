// core/src/memory/intelligence.trace.collector.ts
// =====================================================
// PlannerAgent — Intelligence Trace Collector
// Canonical Source of Truth
// =====================================================

import type {
  IntelligenceParticipationRecord
} from "./intelligence.trace";

export class IntelligenceTraceCollector {

  private traces: IntelligenceParticipationRecord[] = [];

  append(
    trace: IntelligenceParticipationRecord
  ): void {
    this.traces.push(trace);
  }

  appendMany(
    traces: IntelligenceParticipationRecord[]
  ): void {
    this.traces.push(...traces);
  }

  all(): IntelligenceParticipationRecord[] {
    return [...this.traces];
  }

  count(): number {
    return this.traces.length;
  }

  clear(): void {
    this.traces = [];
  }

  byProvider(
    provider: string
  ): IntelligenceParticipationRecord[] {
    return this.traces.filter(
      t => t.provider === provider
    );
  }

  byRole(
    role: string
  ): IntelligenceParticipationRecord[] {
    return this.traces.filter(
      t => t.role === role
    );
  }
}