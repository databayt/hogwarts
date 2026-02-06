"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

/**
 * ShadcnFieldChoiceCard - Radio group with descriptive cards
 *
 * Presents radio button interface for environment selection with detailed descriptions.
 *
 * @example
 * ```tsx
 * <ShadcnFieldChoiceCard />
 * ```
 */
export function ShadcnFieldChoiceCard() {
  return (
    <div className="w-full max-w-md">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Compute Environment</legend>
        <p className="text-muted-foreground text-sm">
          Select the compute environment for your cluster.
        </p>

        <RadioGroup defaultValue="kubernetes" className="space-y-3">
          <label
            htmlFor="kubernetes"
            className="border-border hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-4"
          >
            <RadioGroupItem
              value="kubernetes"
              id="kubernetes"
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">Kubernetes</div>
              <p className="text-muted-foreground text-sm">
                Run GPU workloads on a K8s configured cluster.
              </p>
            </div>
          </label>

          <label
            htmlFor="vm"
            className="border-border hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-4"
          >
            <RadioGroupItem value="vm" id="vm" className="mt-1" />
            <div className="flex-1">
              <div className="font-medium">Virtual Machine</div>
              <p className="text-muted-foreground text-sm">
                Access a VM configured cluster to run workloads.
              </p>
            </div>
          </label>
        </RadioGroup>
      </fieldset>
    </div>
  )
}
