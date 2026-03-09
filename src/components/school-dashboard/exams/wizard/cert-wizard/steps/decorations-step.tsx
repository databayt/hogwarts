"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

import { WizardCard } from "../../atoms/wizard-card"
import { useCertWizard } from "../context/cert-wizard-provider"
import type { CertDecorationConfig } from "../types"

const BORDER_STYLES = [
  { value: "gold", en: "Gold", ar: "ذهبي" },
  { value: "silver", en: "Silver", ar: "فضي" },
  { value: "blue", en: "Blue", ar: "أزرق" },
  { value: "custom", en: "Custom", ar: "مخصص" },
] as const

const SEAL_POSITIONS = [
  { value: "bottom-right", en: "Bottom Right", ar: "أسفل اليمين" },
  { value: "center", en: "Center", ar: "الوسط" },
  { value: "background", en: "Background", ar: "الخلفية" },
] as const

export function DecorationsStep({ lang }: { lang: string }) {
  const { state, dispatch } = useCertWizard()
  const isAr = lang === "ar"
  const { decorations } = state

  function updateDecorations(partial: Partial<CertDecorationConfig>) {
    dispatch({
      type: "SET_DECORATIONS",
      payload: { ...decorations, ...partial },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {isAr ? "الزخارف" : "Decorations"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "خصص الزخارف والعناصر البصرية للشهادة"
            : "Customize visual decorations for the certificate"}
        </p>
      </div>

      {/* Border */}
      <WizardCard state="idle" className="cursor-default space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{isAr ? "الإطار" : "Border"}</p>
            <p className="text-muted-foreground text-xs">
              {isAr
                ? "إطار زخرفي حول الشهادة"
                : "Decorative border around certificate"}
            </p>
          </div>
          <Switch
            checked={decorations.border.enabled}
            onCheckedChange={(v) =>
              updateDecorations({
                border: { ...decorations.border, enabled: v },
              })
            }
          />
        </div>
        {decorations.border.enabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "نمط الإطار" : "Border Style"}</Label>
              <Select
                value={decorations.border.style ?? "gold"}
                onValueChange={(v) =>
                  updateDecorations({
                    border: {
                      ...decorations.border,
                      style: v as CertDecorationConfig["border"]["style"],
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BORDER_STYLES.map((bs) => (
                    <SelectItem key={bs.value} value={bs.value}>
                      {isAr ? bs.ar : bs.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {isAr ? "سمك الإطار" : "Border Width"}:{" "}
                {decorations.border.width ?? 2}px
              </Label>
              <Slider
                value={[decorations.border.width ?? 2]}
                min={1}
                max={5}
                step={1}
                onValueChange={([v]) =>
                  updateDecorations({
                    border: { ...decorations.border, width: v },
                  })
                }
              />
            </div>
          </div>
        )}
      </WizardCard>

      {/* Corner Ornaments */}
      <WizardCard state="idle" className="cursor-default">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {isAr ? "زخارف الأركان" : "Corner Ornaments"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isAr ? "زخارف في أركان الشهادة" : "Decorative corner elements"}
            </p>
          </div>
          <Switch
            checked={decorations.cornerOrnaments.enabled}
            onCheckedChange={(v) =>
              updateDecorations({ cornerOrnaments: { enabled: v } })
            }
          />
        </div>
      </WizardCard>

      {/* Seal */}
      <WizardCard state="idle" className="cursor-default space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{isAr ? "الختم" : "Seal"}</p>
            <p className="text-muted-foreground text-xs">
              {isAr ? "ختم رسمي على الشهادة" : "Official seal on certificate"}
            </p>
          </div>
          <Switch
            checked={decorations.seal.enabled}
            onCheckedChange={(v) =>
              updateDecorations({
                seal: { ...decorations.seal, enabled: v },
              })
            }
          />
        </div>
        {decorations.seal.enabled && (
          <div className="space-y-2">
            <Label>{isAr ? "موقع الختم" : "Seal Position"}</Label>
            <Select
              value={decorations.seal.position ?? "bottom-right"}
              onValueChange={(v) =>
                updateDecorations({
                  seal: {
                    ...decorations.seal,
                    position: v as CertDecorationConfig["seal"]["position"],
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEAL_POSITIONS.map((sp) => (
                  <SelectItem key={sp.value} value={sp.value}>
                    {isAr ? sp.ar : sp.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </WizardCard>

      {/* Watermark */}
      <WizardCard state="idle" className="cursor-default space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {isAr ? "العلامة المائية" : "Watermark"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isAr ? "نص شفاف في الخلفية" : "Transparent background text"}
            </p>
          </div>
          <Switch
            checked={decorations.watermark.enabled}
            onCheckedChange={(v) =>
              updateDecorations({
                watermark: { ...decorations.watermark, enabled: v },
              })
            }
          />
        </div>
        {decorations.watermark.enabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "النص" : "Text"}</Label>
              <Input
                value={decorations.watermark.text ?? ""}
                onChange={(e) =>
                  updateDecorations({
                    watermark: {
                      ...decorations.watermark,
                      text: e.target.value,
                    },
                  })
                }
                placeholder={isAr ? "مثال: سري" : "e.g., CONFIDENTIAL"}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {isAr ? "الشفافية" : "Opacity"}:{" "}
                {Math.round((decorations.watermark.opacity ?? 0.1) * 100)}%
              </Label>
              <Slider
                value={[(decorations.watermark.opacity ?? 0.1) * 100]}
                min={5}
                max={30}
                step={5}
                onValueChange={([v]) =>
                  updateDecorations({
                    watermark: {
                      ...decorations.watermark,
                      opacity: v / 100,
                    },
                  })
                }
              />
            </div>
          </div>
        )}
      </WizardCard>

      {/* Ribbon */}
      <WizardCard state="idle" className="cursor-default space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{isAr ? "الشريط" : "Ribbon"}</p>
            <p className="text-muted-foreground text-xs">
              {isAr ? "شريط زخرفي مع نص" : "Decorative ribbon with text"}
            </p>
          </div>
          <Switch
            checked={decorations.ribbon.enabled}
            onCheckedChange={(v) =>
              updateDecorations({
                ribbon: { ...decorations.ribbon, enabled: v },
              })
            }
          />
        </div>
        {decorations.ribbon.enabled && (
          <div className="space-y-2">
            <Label>{isAr ? "نص الشريط" : "Ribbon Text"}</Label>
            <Input
              value={decorations.ribbon.text ?? ""}
              onChange={(e) =>
                updateDecorations({
                  ribbon: { ...decorations.ribbon, text: e.target.value },
                })
              }
              placeholder={isAr ? "مثال: بتفوق" : "e.g., With Honors"}
            />
          </div>
        )}
      </WizardCard>
    </div>
  )
}
