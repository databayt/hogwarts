"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { createInvoice, updateInvoice, getInvoiceById } from "@/components/platform/finance/invoice/actions";
import { InvoiceSchemaZod } from "./validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { BasicInformationStep } from "./steps/basic-information";
import { ClientItemsStep } from "./steps/client-items";
import { ReviewSubmitStep } from "./steps/review-submit";
import { InvoiceFormFooter } from "./footer";
import { STEPS, STEP_FIELDS } from "./config";
import { ErrorToast, SuccessToast } from "@/components/atom/toast";

interface InvoiceFormProps {
  invoiceId?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  currency?: string | null;
}

export function InvoiceCreateForm({
  invoiceId,
  firstName,
  lastName,
  email,
  currency = "USD"
}: InvoiceFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof InvoiceSchemaZod>>({
    resolver: zodResolver(InvoiceSchemaZod),
    defaultValues: {
      invoice_no: "",
      invoice_date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      currency: currency || "USD",
      from: {
        name: `${firstName || ""} ${lastName || ""}`.trim() || "Your Company Name",
        email: email || "",
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
      discount: 0,
      tax_percentage: 0,
      total: 0,
      notes: "",
      status: "UNPAID" as const,
    },
  });

  // Generate a unique invoice number for new invoices
  useEffect(() => {
    const generateInvoiceNumber = () => {
      try {
        // Generate a unique invoice number using our new shorter format
        // Format: I + 2-digit year + 3-digit sequence
        const currentYear = new Date().getFullYear();
        const yearPrefix = currentYear.toString().slice(-2);
        const randomSuffix = Math.floor(Math.random() * 999) + 1;
        const uniqueInvoiceNo = `I${yearPrefix}${randomSuffix.toString().padStart(3, '0')}`;
        form.setValue("invoice_no", uniqueInvoiceNo);
      } catch (error) {
        console.error("Failed to generate invoice number:", error);
      }
    };

    if (!invoiceId) {
      generateInvoiceNumber();
    }
  }, [invoiceId, form]);

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  // Load existing invoice data for editing
  useEffect(() => {
    const loadInvoice = async () => {
      if (!invoiceId) return;
      
      try {
        setIsLoading(true);
        const response = await getInvoiceById(invoiceId);
        
        if (response.success && response.data) {
          const { from, to, items, ...rest } = response.data;
          const formData = {
            invoice_no: rest.invoice_no,
            invoice_date: new Date(rest.invoice_date),
            due_date: new Date(rest.due_date),
            currency: rest.currency || "USD",
            from: {
              name: from.name,
              email: from.email || "",
              address1: from.address1,
              address2: from.address2 || "",
              address3: from.address3 || "",
            },
            to: {
              name: to.name,
              email: to.email || "",
              address1: to.address1,
              address2: to.address2 || "",
              address3: to.address3 || "",
            },
            items: items.map(item => ({
              item_name: item.item_name,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
            sub_total: rest.sub_total,
            discount: rest.discount || 0,
            tax_percentage: rest.tax_percentage || 0,
            total: rest.total,
            notes: rest.notes || "",
            status: rest.status,
          };
          
          form.reset(formData);
        } else {
          ErrorToast(response.error || "Failed to fetch invoice data");
        }
      } catch (error) {
        ErrorToast("Failed to fetch invoice data");
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId, form]);

  async function onSubmit(values: z.infer<typeof InvoiceSchemaZod>) {
    try {
      setIsLoading(true);
      
      const response = invoiceId
        ? await updateInvoice(invoiceId, values)
        : await createInvoice(values);

      if (response.success) {
        SuccessToast("Invoice saved successfully");
        closeModal();
        router.refresh();
      } else {
        ErrorToast(response.error || "Failed to process invoice");
      }
    } catch (error) {
      console.error("Invoice submission error:", error);
      ErrorToast("Failed to process invoice");
    } finally {
      setIsLoading(false);
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = STEP_FIELDS[1];
      const step1Valid = await form.trigger(step1Fields);
      if (step1Valid) {
        setCurrentStep(2);
      } else {
        ErrorToast("Please fill in all required fields correctly");
      }
    } else if (currentStep === 2) {
      const step2Fields = STEP_FIELDS[2];
      const step2Valid = await form.trigger(step2Fields);
      if (step2Valid) {
        setCurrentStep(3);
      } else {
        ErrorToast("Please fill in all required fields correctly");
      }
    } else if (currentStep === 3) {
      await form.handleSubmit(onSubmit)();
    }
  };

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const currentStepFields = STEP_FIELDS[currentStep as keyof typeof STEP_FIELDS];
      const stepValid = await form.trigger(currentStepFields);
      if (stepValid) {
        await form.handleSubmit(onSubmit)();
      } else {
        ErrorToast("Please fill in all required fields correctly");
      }
    } else {
      // For creating, just go to next step
      await handleNext();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      closeModal();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <BasicInformationStep isView={isView} />;
      case 2: return <ClientItemsStep isView={isView} currentId={currentId} />;
      case 3: return <ReviewSubmitStep isView={isView} />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Form {...form}>
        <form className="flex flex-col h-full" onSubmit={(e) => e.preventDefault()}>
          <div className="flex-grow flex gap-6">
            {/* Title Section */}
            <div className="w-1/3">
              <h2 className="text-2xl font-semibold">
                {isView ? "View Invoice" : currentId ? "Edit Invoice" : "Create Invoice"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {isView 
                  ? "View invoice details" 
                  : currentId 
                    ? "Update invoice details" 
                    : "Create a new invoice for your client"
                }
              </p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <InvoiceFormFooter 
            currentStep={currentStep}
            isView={isView}
            currentId={currentId}
            onBack={handleBack}
            onNext={handleNext}
            onSaveCurrentStep={handleSaveCurrentStep}
            form={form}
          />
        </form>
      </Form>
    </div>
  );
}

export default InvoiceCreateForm;


