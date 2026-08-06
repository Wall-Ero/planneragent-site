import type { PlanTier } from "../contracts.v2";

export const VISION_NO_EXECUTION_REASON = "VISION_OBSERVATION_ONLY" as const;
export type VisionExecutionBoundaryInput = Readonly<{
  plan: PlanTier;
  executionAllowed: boolean;
  governanceReason: string;
}>;
export type VisionExecutionBoundaryResult = Readonly<{
  executionAllowed: boolean;
  governanceReason: string;
  executionPreviewExecutable: boolean;
  issueExecutionActionId: boolean;
  resolveExecutionCredential: boolean;
  permitExecutionSuccessEvidence: boolean;
}>;

export function enforceVisionExecutionBoundary(input:VisionExecutionBoundaryInput):VisionExecutionBoundaryResult{
  if(input.plan!=="VISION")return Object.freeze({executionAllowed:input.executionAllowed,governanceReason:input.governanceReason,executionPreviewExecutable:input.executionAllowed,issueExecutionActionId:input.executionAllowed,resolveExecutionCredential:input.executionAllowed,permitExecutionSuccessEvidence:input.executionAllowed});
  return Object.freeze({executionAllowed:false,governanceReason:VISION_NO_EXECUTION_REASON,executionPreviewExecutable:false,issueExecutionActionId:false,resolveExecutionCredential:false,permitExecutionSuccessEvidence:false});
}
