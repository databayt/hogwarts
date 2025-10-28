"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { InvoiceSchemaZod } from "../validation";
import { useEffect } from "react";

interface ReviewSubmitStepProps {
  isView: boolean;
}

export function ReviewSubmitStep({ isView }: ReviewSubmitStepProps) {
  const form = useFormContext<z.infer<typeof InvoiceSchemaZod>>();
  const { register, watch, setValue, formState: { errors } } = form;

  const sub_total = watch("sub_total") || 0;
  const discount = watch("discount") || 0;
  const tax_percentage = watch("tax_percentage") || 0;
  const sub_totalRemoveDiscount = sub_total - discount;
  const taxAmount = (sub_totalRemoveDiscount * tax_percentage) / 100 || 0;
  const totalAmount = sub_totalRemoveDiscount + taxAmount;

  useEffect(() => {
    setValue("total", totalAmount);
  }, [totalAmount, setValue]);

  const totalAmountInCurrencyFormat = new Intl.NumberFormat("en-us", { 
    style: "currency", 
    currency: watch("currency") || "USD" 
  }).format(totalAmount);

  return (
    <div className="space-y-6">
      {/* Invoice Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Invoice Summary</h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              {...register("sub_total", { valueAsNumber: true })}
              type="number"
              placeholder="Sub Total"
              min="0"
              step="0.01"
              className={`h-10 w-full ${errors.sub_total ? "border-red-500" : ""}`}
              readOnly
            />

          </div>
          <div className="flex-1">
            <Input
              {...register("discount", { valueAsNumber: true })}
              type="number"
              placeholder="Discount Amount"
              min="0"
              step="0.01"
              className={`h-10 w-full ${errors.discount ? "border-red-500" : ""}`}
              onChange={(e) => {
                const discountValue = parseFloat(e.target.value) || 0;
                setValue("discount", discountValue);
              }}
            />

          </div>
          <div className="flex-1">
            <Input
              {...register("tax_percentage", { valueAsNumber: true })}
              type="number"
              placeholder="Tax Percentage (%)"
              min="0"
              step="0.01"
              className={`h-10 w-full ${errors.tax_percentage ? "border-red-500" : ""}`}
              onChange={(e) => {
                const taxValue = parseFloat(e.target.value) || 0;
                setValue("tax_percentage", taxValue);
              }}
            />

          </div>
          <div className="flex-1">
            <Input
              {...register("total", { valueAsNumber: true })}
              type="number"
              placeholder="Total Amount"
              min="0"
              step="0.01"
              className={`h-10 w-full ${errors.total ? "border-red-500" : ""}`}
              readOnly
            />

          </div>
        </div>
        
        {/* Calculated Values Display */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sub Total:</span>
            <span>{new Intl.NumberFormat("en-us", { 
              style: "currency", 
              currency: watch("currency") || "USD" 
            }).format(sub_total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Discount:</span>
            <span>{new Intl.NumberFormat("en-us", { 
              style: "currency", 
              currency: watch("currency") || "USD" 
            }).format(discount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax ({tax_percentage}%):</span>
            <span>{new Intl.NumberFormat("en-us", { 
              style: "currency", 
              currency: watch("currency") || "USD" 
            }).format(taxAmount)}</span>
          </div>
          <div className="flex justify-between font-medium border-t pt-2">
            <span>Total:</span>
            <span>{totalAmountInCurrencyFormat}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Textarea
          {...register("notes")}
          placeholder="Additional notes or terms (Optional)"
          className="min-h-[60px]"
        />
      </div>
    </div>
  );
}
