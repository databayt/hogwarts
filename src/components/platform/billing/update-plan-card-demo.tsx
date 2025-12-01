"use client";

import { UpdatePlanCard } from "@/components/billingsdk/update-plan-card";
import { plans } from "@/lib/billingsdk-config";

export function UpdatePlanCardDemo() {
  return (
    <UpdatePlanCard
      currentPlan={plans[1]} // Pro plan
      plans={plans}
      onPlanChange={(planId) => console.log("Plan selected:", planId)}
      title="Upgrade Your Plan"
    />
  );
}
