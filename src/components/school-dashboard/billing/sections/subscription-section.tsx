"use client"

import type { CurrentPlan, Plan } from "@/lib/billingsdk-config"
import {
  CancelSubscriptionCard,
  type CancelSubscriptionCardProps,
} from "@/components/billingsdk/cancel-subscription-card"
import {
  SubscriptionManagement,
  type SubscriptionManagementProps,
} from "@/components/billingsdk/subscription-management"
import {
  UpdatePlanCard,
  type UpdatePlanCardProps,
} from "@/components/billingsdk/update-plan-card"

interface SubscriptionSectionProps {
  currentPlan: CurrentPlan
  plans: Plan[]
  onPlanChange: (planId: string) => void
  onCancelSubscription: (planId: string) => Promise<void>
  onKeepSubscription?: (planId: string) => Promise<void>
  showCancelCard?: boolean
  showUpdateCard?: boolean
}

export function SubscriptionSection({
  currentPlan,
  plans,
  onPlanChange,
  onCancelSubscription,
  onKeepSubscription,
  showCancelCard = false,
  showUpdateCard = false,
}: SubscriptionSectionProps) {
  // Prepare props for the dialogs embedded in SubscriptionManagement
  const cancelSubscriptionProps = {
    title: "Cancel Subscription",
    description:
      "We're sorry to see you go. Your subscription will remain active until the end of the billing period.",
    plan: currentPlan.plan,
    warningTitle: "What you'll lose",
    warningText:
      "Access to all premium features including advanced reports, custom branding, and priority support.",
    keepButtonText: "Keep My Subscription",
    continueButtonText: "Continue Cancellation",
    finalTitle: "Final Confirmation",
    finalSubtitle: "Are you sure you want to cancel your subscription?",
    finalWarningText:
      "This action cannot be undone and you'll lose access to all premium features.",
    goBackButtonText: "Go Back",
    confirmButtonText: "Yes, Cancel Subscription",
    onCancel: onCancelSubscription,
    onKeepSubscription,
  }

  const updatePlanProps = {
    currentPlan: currentPlan.plan,
    plans,
    onPlanChange,
    title: "Change Plan",
    triggerText: "Change Plan",
  }

  return (
    <section className="space-y-6">
      {/* Main Subscription Management Component */}
      <SubscriptionManagement
        currentPlan={currentPlan}
        cancelSubscription={cancelSubscriptionProps}
        updatePlan={updatePlanProps}
      />

      {/* Optional: Standalone Update Plan Card for more visibility */}
      {showUpdateCard && (
        <UpdatePlanCard
          currentPlan={currentPlan.plan}
          plans={plans}
          onPlanChange={onPlanChange}
          title="Upgrade Your Plan"
        />
      )}

      {/* Optional: Standalone Cancel Card when user explicitly navigates to cancel */}
      {showCancelCard && (
        <CancelSubscriptionCard {...cancelSubscriptionProps} />
      )}
    </section>
  )
}
