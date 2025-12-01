"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrialExpiryCard } from "@/components/billingsdk/trial-expiry-card";
import { IconCreditCard, IconSettings, IconArrowUpRight } from "@tabler/icons-react";
import type { CurrentPlan } from "@/lib/billingsdk-config";
import { formatDollars } from "../adapters";

interface HeaderSectionProps {
  currentPlan: CurrentPlan;
  isOnTrial: boolean;
  trialEndDate: Date | null;
  trialFeatures: string[];
  totalBalance: number;
  username: string;
  onViewPlans: () => void;
  onCancelPlan: () => void;
  onUpgrade: () => void;
  onSettings: () => void;
}

export function HeaderSection({
  currentPlan,
  isOnTrial,
  trialEndDate,
  trialFeatures,
  totalBalance,
  username,
  onViewPlans,
  onCancelPlan,
  onUpgrade,
  onSettings,
}: HeaderSectionProps) {
  const statusVariant = {
    active: "default",
    inactive: "secondary",
    past_due: "destructive",
    cancelled: "outline",
  } as const;

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Billing</h1>
          <p className="muted">
            Manage your subscription and billing information
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSettings}>
            <IconSettings className="me-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={onUpgrade}>
            <IconArrowUpRight className="me-2 h-4 w-4" />
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Current Plan Overview Card */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{currentPlan.plan.title} Plan</CardTitle>
              <CardDescription>
                {currentPlan.nextBillingDate !== "N/A"
                  ? `Next billing date: ${currentPlan.nextBillingDate}`
                  : "No upcoming billing"}
              </CardDescription>
            </div>
            <Badge variant={statusVariant[currentPlan.status]}>
              {currentPlan.status === "active" ? "Active" : currentPlan.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-bold">{currentPlan.price || "Free"}/mo</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Billing Type</p>
              <p className="text-2xl font-bold capitalize">{currentPlan.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                <IconCreditCard className="h-5 w-5" />
                {currentPlan.paymentMethod}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Credits</p>
              <p className="text-2xl font-bold">{formatDollars(totalBalance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trial Card - Only shown if on trial */}
      {isOnTrial && trialEndDate && (
        <TrialExpiryCard
          trialEndDate={trialEndDate}
          onUpgrade={onUpgrade}
          features={trialFeatures}
          title="Trial Period"
          description="Experience all premium features"
          upgradeButtonText="Upgrade Now"
          className="w-full"
        />
      )}
    </section>
  );
}
