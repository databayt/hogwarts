"use client";

import { CalendarIcon, DeleteIcon } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorToast, SuccessToast } from "@/components/atom/toast";

import { InvoiceSchemaZod } from "../validation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { createInvoice, updateInvoice, getInvoiceById } from "@/components/invoice/actions/invoice";
import * as z from "zod";

interface ICreateEditInvoice {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined | null;
  currency?: string | undefined;
  invoiceId?: string | undefined; //for edit section
}

export default function CreateEditInvoice({
  firstName,
  lastName,
  email,
  currency,
  invoiceId, //
}: ICreateEditInvoice) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    control,
    reset,
  } = useForm<z.infer<typeof InvoiceSchemaZod>>({
    resolver: zodResolver(InvoiceSchemaZod),
    defaultValues: {
      invoice_no: "",
      invoice_date: new Date(),
      due_date: new Date(),
      currency: currency || "USD",
      from: {
        name: `${firstName} ${lastName}`,
        email: email as string,
        address1: "",
        address2: "",
        address3: "",
      },
      to: {
        name: "",
        email: "",
        address1: "",
        address2: "",
        address3: "",
      },
      items: [
        {
          item_name: "",
          quantity: 0,
          price: 0,
          total: 0,
        },
      ],
      sub_total: 0,
      tax_percentage: 0,
      discount: 0,
      total: 0,
      notes: "",
      status: "UNPAID" as const,
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      if (!invoiceId) return;
      setIsLoading(true);
      const response = await getInvoiceById(invoiceId);

      if (response.success && response.data) {
        const { from, to, items, ...rest } = response.data;
        const formData = {
          invoice_no: rest.invoice_no,
          invoice_date: new Date(rest.invoice_date),
          due_date: new Date(rest.due_date),
          currency: rest.currency || undefined,
          from: {
            name: from.name,
            email: from.email || undefined,
            address1: from.address1,
            address2: from.address2 || undefined,
            address3: from.address3 || undefined,
          },
          to: {
            name: to.name,
            email: to.email || undefined,
            address1: to.address1,
            address2: to.address2 || undefined,
            address3: to.address3 || undefined,
          },
          items: items.map(item => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
          sub_total: rest.sub_total,
          discount: rest.discount || undefined,
          tax_percentage: rest.tax_percentage || undefined,
          total: rest.total,
          notes: rest.notes || undefined,
          status: rest.status,
        } as const;
        
        reset(formData);
              } else {
          ErrorToast(response.error || "Failed to fetch invoice data");
        }
      } catch (error) {
        ErrorToast("Failed to fetch invoice data");
      } finally {
      setIsLoading(false);
    }
  };

  //edit component
  useEffect(() => {
    if (invoiceId) {
      fetchData();
    }
  }, [invoiceId]);

  //items
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  //total of items
  const items = watch("items");
  useEffect(() => {
    items.forEach((item, index) => {
      const quantity = parseFloat(item.quantity.toString()) || 0;
      const price = parseFloat(item.price.toString()) || 0;

      const total = quantity * price;

      // console.log(total);
      setValue(`items.${index}.total`, total);
    });
    const sub_total = items.reduce((preve, curr) => preve + curr.total, 0);
    setValue("sub_total", sub_total);
  }, [JSON.stringify(items), setValue]);

  //add new item row
  const handleAddNewItemRow = (e: any) => {
    e.preventDefault();
    append({
      item_name: "",
      quantity: 0,
      price: 0,
      total: 0,
    });
  };
  //remove item row
  const handleRemoveItem = (index: number) => {
    remove(index);
  };

  const onSubmit = async (data: z.infer<typeof InvoiceSchemaZod>) => {
    setIsLoading(true);
    try {
      const response = !invoiceId
        ? await createInvoice(data)
        : await updateInvoice(invoiceId, data);

      if (response.success) {
        SuccessToast();
        router.push("/invoice");
      } else {
        ErrorToast(response.error || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      ErrorToast("Failed to process invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const sub_total = watch("sub_total") || 0;
  const discount = watch("discount") || 0;
  const sub_totalRemoveDiscount = sub_total - discount;
  const taxAmount =
    (sub_totalRemoveDiscount * watch("tax_percentage")) / 100 || 0;
  const totalAmount = sub_totalRemoveDiscount - taxAmount;

  useEffect(() => {
    setValue("total", totalAmount);
  }, [totalAmount]);

  const totalAmountInCurrencyFormat = new Intl.NumberFormat("en-us", {
    style: "currency",
    currency: currency || watch("currency") || "INR",
  }).format(totalAmount);

  return (
    <form
      className="grid py-4 gap-4 lg:gap-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-2 gap-4 lg:gap-6">
        <div className="grid">
          <div className="flex items-center">
            <div className="min-w-9 min-h-9 text-center border h-full flex justify-center items-center bg-neutral-100 rounded-l-md ">
              #
            </div>
            <Input
              type="text"
              placeholder="Invoice No."
              className="rounded-l-none"
              {...register("invoice_no", { required: true })}
              disabled={isLoading}
            />
          </div>
          {errors?.invoice_no && (
            <p className="text-xs text-red-500">{errors.invoice_no.message}</p>
          )}
        </div>

        <div></div>

        <div className="grid">
          <div className="flex items-center">
            <div className="min-w-9 min-h-9 text-center border h-full flex justify-center items-center bg-neutral-100 rounded-l-md ">
              <CalendarIcon className="size-4" />
            </div>
            <Popover>
              <PopoverTrigger className="w-full" asChild>
                <Button
                  type="button"
                  variant={"outline"}
                  className={cn(
                    "pl-3 text-left font-normal",
                    !getValues("invoice_date") && "text-muted-foreground",
                    "justify-start font-normal rounded-l-none flex-1 w-full "
                  )}
                  disabled={isLoading}
                >
                  {getValues("invoice_date") ? (
                    format(getValues("invoice_date"), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={getValues("invoice_date")}
                  onSelect={(date) => {
                    setValue("invoice_date", date as Date, {
                      shouldValidate: true,
                    });
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
          {errors?.invoice_date && (
            <p className="text-xs text-red-500">
              {errors.invoice_date.message}
            </p>
          )}
        </div>

        <div className="grid">
          <div className="flex items-center">
            <div className="min-w-9 min-h-9 text-center border h-full flex justify-center items-center bg-neutral-100 rounded-l-md ">
              <CalendarIcon className="size-4" />
            </div>
            <Popover>
              <PopoverTrigger className="w-full" asChild>
                <Button
                  type="button"
                  variant={"outline"}
                  className={cn(
                    "pl-3 text-left font-normal",
                    !watch("due_date") && "text-muted-foreground",
                    "justify-start font-normal rounded-l-none flex-1 w-full "
                  )}
                  disabled={isLoading}
                >
                  {watch("due_date") ? (
                    format(watch("due_date"), "PPP")
                  ) : (
                    <span>Due date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={watch("due_date")}
                  onSelect={(date) => {
                    setValue("due_date", date as Date, {
                      shouldValidate: true,
                    });
                  }}
                  disabled={(date) =>
                    date < new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
          {errors?.due_date && (
            <p className="text-xs text-red-500">{errors.due_date.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:gap-6">
        {/**from (current user details) */}
        <div className="grid gap-2">
          <Label>From</Label>
          <div>
            <Input
              type="text"
              placeholder="From name"
              {...register("from.name", { required: true })}
              disabled={isLoading}
            />
            {errors.from?.name && (
              <p className="text-xs text-red-500">{errors.from.name.message}</p>
            )}
          </div>
          <div>
            <Input
              type="text"
              placeholder="joe@example.com"
              {...register("from.email", { required: true })}
              disabled={isLoading}
            />
            {errors.from?.email && (
              <p className="text-xs text-red-500">
                {errors.from.email.message}
              </p>
            )}
          </div>
          <div>
            <Input
              type="text"
              placeholder="Bldg No. / Flat No. / Shop No. / Building Name"
              {...register("from.address1", { required: true })}
              disabled={isLoading}
            />
            {errors.from?.address1 && (
              <p className="text-xs text-red-500">
                {errors.from.address1.message}
              </p>
            )}
          </div>
          <div>
            <Input
              type="text"
              placeholder="Street name / Landmark"
              {...register("from.address2", { required: true })}
              disabled={isLoading}
            />
            {errors.from?.address2 && (
              <p className="text-xs text-red-500">
                {errors.from.address2.message}
              </p>
            )}
          </div>
          <div>
            <Input
              type="text"
              placeholder="City / State / Country / Pincode "
              {...register("from.address3", { required: true })}
              disabled={isLoading}
            />
            {errors.from?.address3 && (
              <p className="text-xs text-red-500">
                {errors.from.address3.message}
              </p>
            )}
          </div>
        </div>

        {/**to (client details) */}
        <div className="grid gap-2">
          <Label>To</Label>
          <div>
            <Input
              type="text"
              placeholder="To name"
              {...register("to.name", { required: true })}
              disabled={isLoading}
            />
            {errors.to?.name && (
              <p className="text-xs text-red-500">{errors.to.name.message}</p>
            )}
          </div>
          <div>
            <Input
              type="text"
              placeholder="joe@example.com"
              {...register("to.email", { required: true })}
              disabled={isLoading}
            />
            {errors.to?.email && (
              <p className="text-xs text-red-500">{errors.to.email.message}</p>
            )}
          </div>
          <div>
            <Input
              type="text"
              placeholder="Bldg No. / Flat No. / Shop No. / Building Name"
              {...register("to.address1", { required: true })}
              disabled={isLoading}
            />
            {errors.to?.address1 && (
              <p className="text-xs text-red-500">
                {errors.to.address1.message}
              </p>
            )}
          </div>
          <div>
            <Input
              type="text"
              placeholder="Street name / Landmark"
              {...register("to.address2", { required: true })}
              disabled={isLoading}
            />
            {errors.to?.address2 && (
              <p className="text-xs text-red-500">
                {errors.to.address2.message}
              </p>
            )}
          </div>
          <div>
            <Input
              type="text"
              placeholder="City / State / Country / Pincode "
              {...register("to.address3", { required: true })}
              disabled={isLoading}
            />
            {errors.to?.address3 && (
              <p className="text-xs text-red-500">
                {errors.to.address3.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/**item details */}
      <div className="grid gap-2">
        <div className="grid grid-cols-6 bg-neutral-50 py-1 px-1 gap-2">
          <div className="col-span-3">Item</div>
          <div>Quantity</div>
          <div>Price</div>
          <div>Total</div>
        </div>

        {fields.map((item, index) => {
          return (
            <div className="grid grid-cols-6 gap-2" key={index}>
              <div className="col-span-3">
                <Input
                  placeholder="Enter item name"
                  type="text"
                  {...register(`items.${index}.item_name`, { required: true })}
                  disabled={isLoading}
                />
                {errors.items && errors.items[index]?.item_name && (
                  <p className="text-xs text-red-500">
                    {errors.items[index]?.item_name.message}
                  </p>
                )}
              </div>
              <div>
                <Input
                  placeholder="Enter quantity"
                  {...register(`items.${index}.quantity`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                  type="number"
                  disabled={isLoading}
                />
                {errors.items && errors.items[index]?.quantity && (
                  <p className="text-xs text-red-500">
                    {errors.items[index]?.quantity.message}
                  </p>
                )}
              </div>
              <div>
                <Input
                  placeholder="Enter price"
                  {...register(`items.${index}.price`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                  type="number"
                  disabled={isLoading}
                />
                {errors.items && errors.items[index]?.price && (
                  <p className="text-xs text-red-500">
                    {errors.items[index]?.price.message}
                  </p>
                )}
              </div>
              <div className="relative ">
                <Input
                  placeholder="Enter total"
                  {...register(`items.${index}.total`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                  type="number"
                  disabled
                />
                {errors.items && errors.items[index]?.total && (
                  <p className="text-xs text-red-500">
                    {errors.items[index]?.total.message}
                  </p>
                )}
                {index !== 0 && (
                  <div className="absolute top-0 right-0">
                    <Button
                      type="button"
                      variant={"ghost"}
                      size={"icon"}
                      className="bg-red-50 text-red-500"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isLoading}
                    >
                      <DeleteIcon />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <Button
          type="button"
          disabled={isLoading}
          className="w-fit"
          onClick={handleAddNewItemRow}
        >
          Add Item
        </Button>
      </div>

      {/**sub total , discount, tax, total */}
      <div>
        <div className="max-w-sm w-full ml-auto grid gap-2">
          <div className="grid grid-cols-2">
            <Label>Sub total : </Label>
            <Input
              disabled
              placeholder="Sub total"
              type="number"
              {...register("sub_total", { valueAsNumber: true })}
            />
          </div>
          <div className="grid grid-cols-2">
            <Label>Discount : </Label>
            <Input
              placeholder="discount"
              type="number"
              {...register("discount", { valueAsNumber: true })}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2">
            <Label> </Label>
            <Input
              placeholder="Sub total"
              type="number"
              value={sub_totalRemoveDiscount ?? ""}
              disabled
            />
          </div>
          <div className="grid grid-cols-2">
            <Label>
              Tax:{" "}
              <Input
                placeholder="%"
                type="text"
                className="min-w-14 w-14 max-w-14"
                {...register("tax_percentage", { valueAsNumber: true })}
                disabled={isLoading}
              />
              %{" "}
            </Label>
            <Input
              placeholder="tax amount"
              type="number"
              value={taxAmount}
              disabled
            />
            {errors.tax_percentage && (
              <p className="text-xs text-red-500 block">
                {errors.tax_percentage.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2">
            <Label>Total</Label>
            <Input
              placeholder="Total"
              type="number"
              className="font-semibold"
              disabled
              {...register("total", { valueAsNumber: true })}
            />
          </div>
          <div className="flex items-center justify-center min-h-14 font-bold text-lg">
            {totalAmountInCurrencyFormat}
          </div>
        </div>
      </div>

      {/**notes */}
      <div className="grid gap-2 max-w-xl">
        <Label>Notes:</Label>
        <Textarea
          disabled={isLoading}
          placeholder="Enter your notes"
          {...register("notes")}
        />
      </div>

      <Button size={"lg"}>
        {isLoading ? "Please wait..." : invoiceId ? "Update Invoice" : "Create Invoice"}
      </Button>
    </form>
  );
}
