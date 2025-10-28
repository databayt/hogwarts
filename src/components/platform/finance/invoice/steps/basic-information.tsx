"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { InvoiceSchemaZod } from "../validation";

interface BasicInformationStepProps {
  isView: boolean;
}

export function BasicInformationStep({ isView }: BasicInformationStepProps) {
  const form = useFormContext<z.infer<typeof InvoiceSchemaZod>>();
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      {/* From and To Addresses - Side by Side */}
      <div className="grid grid-cols-2 gap-8">
        {/* From Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">From (Your Company)</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                {...register("from.name")}
                placeholder="Company Name"
                className={errors.from?.name ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("from.email")}
                placeholder="Company Email"
                className={errors.from?.email ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("from.address1")}
                placeholder="Company Address Line 1"
                className={errors.from?.address1 ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("from.address2")}
                placeholder="Address Line 2 (Optional)"
              />
            </div>
          </div>
        </div>

        {/* To Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">To (Client)</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                {...register("to.name")}
                placeholder="Client Name"
                className={errors.to?.name ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("to.email")}
                placeholder="Client Email"
                className={errors.to?.email ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("to.address1")}
                placeholder="Client Address Line 1"
                className={errors.to?.address1 ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Input
                {...register("to.address2")}
                placeholder="Client Address Line 2 (Optional)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
