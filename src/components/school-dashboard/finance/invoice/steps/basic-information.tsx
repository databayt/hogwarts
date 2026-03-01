"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useFormContext } from "react-hook-form"
import { z } from "zod"

import { Input } from "@/components/ui/input"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { InvoiceSchemaZod } from "../validation"

interface BasicInformationStepProps {
  isView: boolean
}

export function BasicInformationStep({ isView }: BasicInformationStepProps) {
  const form = useFormContext<z.infer<typeof InvoiceSchemaZod>>()
  const {
    register,
    formState: { errors },
  } = form
  const { dictionary } = useDictionary()
  const fd = (dictionary as any)?.finance
  const iform = fd?.invoiceForm as Record<string, string> | undefined

  return (
    <div className="space-y-6">
      {/* From and To Addresses - Side by Side */}
      <div className="grid grid-cols-2 gap-8">
        {/* From Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {iform?.fromYourCompany || "From (Your Company)"}
          </h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                {...register("from.name")}
                placeholder={iform?.companyName || "Company Name"}
                className={errors.from?.name ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("from.email")}
                placeholder={iform?.companyEmail || "Company Email"}
                className={errors.from?.email ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("from.address1")}
                placeholder={
                  iform?.companyAddressLine1 || "Company Address Line 1"
                }
                className={errors.from?.address1 ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("from.address2")}
                placeholder={
                  iform?.addressLine2Optional || "Address Line 2 (Optional)"
                }
              />
            </div>
          </div>
        </div>

        {/* To Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {iform?.toClient || "To (Client)"}
          </h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                {...register("to.name")}
                placeholder={iform?.clientName || "Client Name"}
                className={errors.to?.name ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("to.email")}
                placeholder={iform?.clientEmail || "Client Email"}
                className={errors.to?.email ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("to.address1")}
                placeholder={
                  iform?.clientAddressLine1 || "Client Address Line 1"
                }
                className={errors.to?.address1 ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("to.address2")}
                placeholder={
                  iform?.clientAddressLine2Optional ||
                  "Client Address Line 2 (Optional)"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
