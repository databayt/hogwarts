"use client";

import { UsageBasedPricing, type UsageBasedPricingProps } from "@/components/billingsdk/usage-based-pricing";
import { DetailedUsageTable } from "@/components/billingsdk/detailed-usage-table";
import type { UsageResource } from "@/lib/billingsdk-config";

interface UsageSectionProps {
  resources: UsageResource[];
  // Usage-based pricing props (optional - only if plan supports usage-based billing)
  showUsageSlider?: boolean;
  usageValue?: number;
  onUsageChange?: (value: number) => void;
  onUsageChangeEnd?: (value: number) => void;
  minCredits?: number;
  maxCredits?: number;
  basePrice?: number;
  includedCredits?: number;
}

export function UsageSection({
  resources,
  showUsageSlider = false,
  usageValue,
  onUsageChange,
  onUsageChangeEnd,
  minCredits = 0,
  maxCredits = 10000,
  basePrice = 0,
  includedCredits = 0,
}: UsageSectionProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2>Resource Usage</h2>
        <p className="muted">
          Monitor your resource consumption and plan limits
        </p>
      </div>

      {/* Detailed Usage Table */}
      <DetailedUsageTable
        title="Current Usage"
        description="Track your resource usage across students, teachers, classes, and storage"
        resources={resources}
      />

      {/* Optional: Usage-Based Pricing Slider for plans with variable pricing */}
      {showUsageSlider && onUsageChange && (
        <UsageBasedPricing
          title="Adjust Credits"
          subtitle="Select how many credits you need per month"
          value={usageValue}
          onChange={onUsageChange}
          onChangeEnd={onUsageChangeEnd}
          min={minCredits}
          max={maxCredits}
          basePrice={basePrice}
          includedCredits={includedCredits}
          currency="$"
        />
      )}
    </section>
  );
}
