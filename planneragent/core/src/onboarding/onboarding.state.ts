// core/src/onboarding/onboarding.state.ts
// =====================================================
// Onboarding State — Pure domain object
// =====================================================

export type OnboardingStep =
  | "start"
  | "select_plan"
  | "checkout_created"
  | "payment_confirmed"
  | "completed";

export type OnboardingState = Readonly<{
  tenant_id: string;
  current_step: OnboardingStep;
  started_at_iso: string;
}>;

export function initialOnboardingState(
  tenant_id: string
): OnboardingState {
  return {
    tenant_id,
    current_step: "start",
    started_at_iso: new Date().toISOString(),
  };
}