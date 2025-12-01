'use client'

import { UpdatePlanDialog } from '@/components/billingsdk/update-plan-dialog';
import { plans } from '@/lib/billingsdk-config';

export function UpdatePlanDialogDemo() {

  return (
    <div className="flex flex-1 flex-col justify-center text-center p-4 mx-auto min-h-[300px]">
      <UpdatePlanDialog
        currentPlan={plans[1]}
        plans={plans}
        onPlanChange={(planId) => {
          console.log(planId)
        }}
        triggerText="Update Plan"
      />
    </div>
  );
}
