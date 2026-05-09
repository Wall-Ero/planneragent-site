// core/src/governance/oag/organizational.authority.reconstruction.ts
// ======================================================
// Organizational Authority Reconstruction
// Canonical Source of Truth
// ======================================================

import type {
  OrganizationalAuthorityLink
} from "./organizational.authority.link";

import {
  validateOrganizationalAuthorityLink
} from "./organizational.authority.validation";

export interface OrganizationalAuthorityReconstruction {

  authority_state:
    | "UNDECLARED"
    | "DECLARED"
    | "RECONSTRUCTED"
    | "VALIDATED";

  organizational_confidence: number;

  authority_signals: string[];

  reconstructed_links:
    OrganizationalAuthorityLink[];
}

export function reconstructOrganizationalAuthority(
  links: OrganizationalAuthorityLink[]
): OrganizationalAuthorityReconstruction {

  if (!links.length) {
    return {

      authority_state:
        "UNDECLARED",

      organizational_confidence: 0,

      authority_signals: [],

      reconstructed_links: []
    };
  }

  const authoritySignals =
    new Set<string>();

  let maxConfidence = 0;

  let reconstructed = false;

  let validated = false;

  for (const link of links) {

    const validation =
      validateOrganizationalAuthorityLink(
        link
      );

    maxConfidence =
      Math.max(
        maxConfidence,
        validation.confidence
      );

    validation.reasons.forEach(
      r => authoritySignals.add(r)
    );

    if (validation.reconstructed) {
      reconstructed = true;
    }

    if (
      validation.confidence >= 1
    ) {
      validated = true;
    }
  }

  return {

    authority_state:
      validated
        ? "VALIDATED"
        : reconstructed
          ? "RECONSTRUCTED"
          : "DECLARED",

    organizational_confidence:
      maxConfidence,

    authority_signals:
      [...authoritySignals],

    reconstructed_links:
      links
  };
}