// core/src/industrial/uic.interface.ts
// =====================================================
// Universal Industrial Capability (UIC)
// Canonical Source of Truth
// =====================================================

export type IndustrialDomain =
  | "supply_chain"
  | "procurement"
  | "manufacturing"
  | "logistics"
  | "finance"
  | "communication";

export type CapabilityVerb =
  | "read"
  | "write"
  | "notify"
  | "plan"
  | "execute";

export type IndustrialCapability = {
  id: string;                  // es: "notify_supplier"
  domain: IndustrialDomain;
  verb: CapabilityVerb;
  description: string;
};

export type CapabilityMap = Record<string, IndustrialCapability>;
