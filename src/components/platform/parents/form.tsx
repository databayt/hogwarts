"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createParent, getParent, updateParent } from "@/components/platform/parents/actions";
import { parentCreateSchema } from "@/components/platform/parents/validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { InformationStep } from "./information";
import { ContactStep } from "./contact";
import { ParentFormFooter } from "./footer";

interface ParentCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void;
}

export function ParentCreateForm({ onSuccess }: ParentCreateFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<z.infer<typeof parentCreateSchema>>({
    resolver: zodResolver(parentCreateSchema),
    defaultValues: {
      givenName: "",
      surname: "",
      emailAddress: "",
      userId: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getParent({ id: currentId });
      const p = res.parent as any;
      if (!p) return;
      form.reset({
        givenName: p.givenName ?? "",
        surname: p.surname ?? "",
        emailAddress: p.emailAddress ?? "",
        userId: p.userId ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof parentCreateSchema>) {
    const res = currentId
      ? await updateParent({ id: currentId, ...values })
      : await createParent(values);
    if (res?.success) {
      toast.success(currentId ? "Parent updated" : "Parent created");
      closeModal();
      // Use callback for optimistic update, fallback to router.refresh()
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else {
      toast.error(currentId ? "Failed to update parent" : "Failed to create parent");
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['givenName', 'surname'] as const;
      const step1Valid = await form.trigger(step1Fields);
      if (step1Valid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      await form.handleSubmit(onSubmit)();
    }
  };

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const currentStepFields = currentStep === 1 
        ? ['givenName', 'surname'] as const
        : ['emailAddress', 'userId'] as const;
      
      const stepValid = await form.trigger(currentStepFields);
      if (stepValid) {
        await form.handleSubmit(onSubmit)();
      }
    } else {
      // For creating, just go to next step
      await handleNext();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      closeModal();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <InformationStep form={form} isView={isView} />;
      case 2:
        return <ContactStep form={form} isView={isView} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <Form {...form}>
        <form className="flex flex-col h-full" onSubmit={(e) => e.preventDefault()}>
          <div className="flex-grow flex flex-col md:flex-row gap-6">
            {/* Title Section */}
            <div className="md:w-1/3">
              <h2 className="text-2xl font-semibold">{isView ? "View Parent" : currentId ? "Edit Parent" : "Create Parent"}</h2>
              <p className="text-sm text-muted-foreground mt-2">{isView ? "View parent details" : currentId ? "Update parent details" : "Add a new parent to your school"}</p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <ParentFormFooter 
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

export default ParentCreateForm;
