"use client"

import { useState, useCallback } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

/**
 * AppearanceSettings - Compute environment configuration
 *
 * Settings form with compute environment selection, GPU controls, and appearance options.
 *
 * @example
 * ```tsx
 * <AppearanceSettings />
 * ```
 */
export function AppearanceSettings() {
  const [gpuCount, setGpuCount] = useState(8)

  const handleGpuAdjustment = useCallback((adjustment: number) => {
    setGpuCount((prevCount) => Math.max(1, Math.min(99, prevCount + adjustment)))
  }, [])

  const handleGpuInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10)
      if (!isNaN(value) && value >= 1 && value <= 99) {
        setGpuCount(value)
      }
    },
    []
  )

  return (
    <div className="w-full max-w-2xl space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Compute Environment</legend>
        <p className="text-sm text-muted-foreground">
          Select the compute environment for your cluster.
        </p>

        <RadioGroup defaultValue="kubernetes" className="space-y-3">
          <label
            htmlFor="kubernetes"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-accent"
          >
            <div className="flex-1">
              <div className="font-medium">Kubernetes</div>
              <p className="text-sm text-muted-foreground">
                Run GPU workloads on a K8s configured cluster. This is the default.
              </p>
            </div>
            <RadioGroupItem value="kubernetes" id="kubernetes" />
          </label>

          <label
            htmlFor="vm"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-accent"
          >
            <div className="flex-1">
              <div className="font-medium">Virtual Machine</div>
              <p className="text-sm text-muted-foreground">
                Access a VM configured cluster to run workloads. (Coming soon)
              </p>
            </div>
            <RadioGroupItem value="vm" id="vm" />
          </label>
        </RadioGroup>
      </fieldset>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label htmlFor="number-of-gpus" className="text-sm font-medium">
            Number of GPUs
          </label>
          <p className="text-sm text-muted-foreground">You can add more later.</p>
        </div>
        <div className="flex items-center gap-1">
          <Input
            id="number-of-gpus"
            value={gpuCount}
            onChange={handleGpuInputChange}
            className="h-8 w-14 font-mono text-center"
            maxLength={3}
          />
          <Button
            variant="outline"
            size="icon"
            type="button"
            aria-label="Decrement"
            onClick={() => handleGpuAdjustment(-1)}
            disabled={gpuCount <= 1}
            className="size-8"
          >
            <Minus className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            type="button"
            aria-label="Increment"
            onClick={() => handleGpuAdjustment(1)}
            disabled={gpuCount >= 99}
            className="size-8"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label htmlFor="tinting" className="text-sm font-medium">
            Wallpaper Tinting
          </label>
          <p className="text-sm text-muted-foreground">
            Allow the wallpaper to be tinted.
          </p>
        </div>
        <Switch id="tinting" defaultChecked />
      </div>
    </div>
  )
}
