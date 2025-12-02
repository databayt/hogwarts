"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CURRENCY_OPTIONS } from "../config";
import { z } from "zod";
import { InvoiceSchemaZod } from "../validation";
import { Icons } from "@/components/atom/icons";

interface ClientItemsStepProps {
  isView: boolean;
  currentId?: string;
}

export function ClientItemsStep({ isView, currentId }: ClientItemsStepProps) {
  const form = useFormContext<z.infer<typeof InvoiceSchemaZod>>();
  const { register, watch, setValue, getValues, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const calculateTotals = () => {
    const items = watch("items") || [];
    const subTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    setValue("sub_total", subTotal);
  };

  const handleAddNewItemRow = (e: React.MouseEvent) => {
    e.preventDefault();
    append({
      item_name: "",
      quantity: 1,
      price: 0,
      total: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    remove(index);
    setTimeout(calculateTotals, 100);
  };

  return (
    <div className="space-y-6">
      {/* Basic Invoice Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Invoice Details</h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              {...register("invoice_no")}
              placeholder="Invoice Number"
              className={`h-10 w-full ${errors.invoice_no ? "border-red-500" : ""}`}
              readOnly={!currentId} // Read-only when creating new invoice
            />
            {!currentId && (
              <p className="text-xs text-muted-foreground mt-1">
                Invoice no. auto-gen.
              </p>
            )}
          </div>
          
          <div className="flex-1">
            <Select
              onValueChange={(value) => setValue("currency", value)}
              defaultValue={getValues("currency") || "USD"}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select Currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !watch("invoice_date") && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {watch("invoice_date") ? (
                    format(watch("invoice_date"), "MMM do, yyyy")
                  ) : (
                    <span>Invoice Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watch("invoice_date")}
                  onSelect={(date) => setValue("invoice_date", date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

          </div>

          <div className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !watch("due_date") && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {watch("due_date") ? (
                    format(watch("due_date"), "MMM do, yyyy")
                  ) : (
                    <span>Due Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watch("due_date")}
                  onSelect={(date) => setValue("due_date", date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium">Invoice Items</h3>
          <button
            type="button"
            onClick={handleAddNewItemRow}
            className=""
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <Input
                  {...register(`items.${index}.item_name`)}
                  placeholder="Item Name"
                  className={errors.items?.[index]?.item_name ? "border-red-500" : ""}
                />
              </div>
              <div className="col-span-2">
                <Input
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  type="number"
                  placeholder="Qty"
                  min="0"
                  step="1"
                  className={errors.items?.[index]?.quantity ? "border-red-500" : ""}
                  onChange={(e) => {
                    const quantity = parseFloat(e.target.value) || 0;
                    const price = watch(`items.${index}.price`) || 0;
                    setValue(`items.${index}.total`, quantity * price);
                    setTimeout(calculateTotals, 100);
                  }}
                />
              </div>
              <div className="col-span-2">
                <Input
                  {...register(`items.${index}.price`, { valueAsNumber: true })}
                  type="number"
                  placeholder="Price"
                  min="0"
                  step="0.01"
                  className={errors.items?.[index]?.price ? "border-red-500" : ""}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    const quantity = watch(`items.${index}.quantity`) || 0;
                    setValue(`items.${index}.total`, quantity * price);
                    setTimeout(calculateTotals, 100);
                  }}
                />
              </div>
              <div className="col-span-2">
                <Input
                  {...register(`items.${index}.total`, { valueAsNumber: true })}
                  type="number"
                  placeholder="Total"
                  min="0"
                  step="0.01"
                  className={errors.items?.[index]?.total ? "border-red-500" : ""}
                  readOnly
                />
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className=""
                >
                  <Icons.trash className="h-6 w-6 text-red-500 ml-2" />
                </button>
              </div>
            </div>
          ))}
        </div>
        

      </div>
    </div>
  );
}
