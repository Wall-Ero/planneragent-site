// core/src/onboarding/routes.onboarding.ts
// =====================================================
// Onboarding Routes — Private flow (no public pricing)
// =====================================================

import { Hono } from "hono";
import { initialOnboardingState } from "./onboarding.state";
import { auditOnboardingStep } from "./onboarding.audit";
import { createCheckout } from "../billing/billing.gateway";

export const onboardingRoutes = new Hono();

onboardingRoutes.get("/start", async (c) => {
  const tenant_id = c.req.query("tenantId");
  if (!tenant_id) {
    return c.json({ error: "tenantId required" }, 400);
  }

  const state = initialOnboardingState(tenant_id);

  await auditOnboardingStep(tenant_id, "start");

  return c.json(state);
});

onboardingRoutes.post("/upgrade", async (c) => {
  const body = await c.req.json<{
    tenantId: string;
    plan: "JUNIOR" | "SENIOR" | "PRINCIPAL";
    buyerEmail: string;
  }>();

  const checkout = await createCheckout({
    tenant_id: body.tenantId,
    buyer_email: body.buyerEmail,
    plan: body.plan,
    now_utc: new Date().toISOString(),
  });

  await auditOnboardingStep(body.tenantId, "checkout_created", {
    plan: body.plan,
    provider: checkout.provider,
  });

  return c.json(checkout);
});