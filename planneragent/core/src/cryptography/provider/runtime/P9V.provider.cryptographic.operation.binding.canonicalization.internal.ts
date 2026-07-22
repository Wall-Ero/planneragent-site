// ============================================================
// PlannerAgent - P9V Canonical Binding UTF-8 Bytes
// ============================================================
//
// INTERNAL P9V CAPABILITY
//
// This module is the single P9V-owned source of truth for
// canonical operation-binding normalization and UTF-8 encoding.
// It is not a provider-runtime public contract.
//
// ============================================================

import type {
  ProviderCryptographicOperationCanonicalBinding,
} from "./P9V.provider.cryptographic.operation.binding";


function normalizeCanonicalValue(
  value:
    unknown
): unknown {

  if (Array.isArray(value)) {

    return value.map(
      item =>
        normalizeCanonicalValue(
          item
        )
    );

  }

  if (
    value &&
    typeof value === "object"
  ) {

    const source =
      value as Record<string, unknown>;

    const normalized:
      Record<string, unknown> = {};

    const keys =
      Object.keys(
        source
      ).sort();

    for (const key of keys) {

      const item =
        source[key];

      if (item === undefined) {

        continue;

      }

      normalized[key] =
        normalizeCanonicalValue(
          item
        );

    }

    return normalized;

  }

  return value;

}


export function canonicalizeProviderCryptographicOperationBindingToUtf8Bytes(
  binding:
    ProviderCryptographicOperationCanonicalBinding
): Uint8Array {

  const serializedBinding =
    JSON.stringify(
      normalizeCanonicalValue(
        binding
      )
    );

  return new TextEncoder().encode(
    serializedBinding
  );

}
