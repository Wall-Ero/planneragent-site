// planneragent/ui/onboarding.ts

export function useOnboarding() {
  return {
    start: async (tenantId: string) =>
      fetch(`/onboarding/start?tenantId=${tenantId}`).then(r => r.json()),

    upgrade: async (payload: {
      tenantId: string;
      plan: "JUNIOR" | "SENIOR" | "PRINCIPAL";
      buyerEmail: string;
    }) =>
      fetch("/onboarding/upgrade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
  };
}