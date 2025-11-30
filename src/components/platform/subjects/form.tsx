"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createSubject, getSubject, updateSubject } from "@/components/platform/subjects/actions";
import { subjectCreateSchema } from "@/components/platform/subjects/validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { InformationStep } from "./information";
import { SubjectFormFooter } from "./footer";

interface SubjectCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void;
}

export function SubjectCreateForm({ onSuccess }: SubjectCreateFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<z.infer<typeof subjectCreateSchema>>({
    resolver: zodResolver(subjectCreateSchema),
    defaultValues: {
      subjectName: "",
      departmentId: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getSubject({ id: currentId });
      const s = res.subject as any;
      if (!s) return;
      form.reset({
        subjectName: s.subjectName ?? "",
        departmentId: s.departmentId ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof subjectCreateSchema>) {
    const res = currentId
      ? await updateSubject({ id: currentId, ...values })
      : await createSubject(values);
    if (res?.success) {
      toast.success(currentId ? "Subject updated" : "Subject created");
      closeModal();
      // Use callback for optimistic update, fallback to router.refresh()
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else {
      toast.error(currentId ? "Failed to update subject" : "Failed to create subject");
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['subjectName', 'departmentId'] as const;
      const step1Valid = await form.trigger(step1Fields);
      if (step1Valid) {
        await form.handleSubmit(onSubmit)();
      }
    }
  };

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const currentStepFields = ['subjectName', 'departmentId'] as const;
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
    closeModal();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <InformationStep form={form} isView={isView} />;
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
              <h2 className="text-2xl font-semibold">{isView ? "View Subject" : currentId ? "Edit Subject" : "Create Subject"}</h2>
              <p className="text-sm text-muted-foreground mt-2">{isView ? "View subject details" : currentId ? "Update subject details" : "Add a new subject to your school"}</p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <SubjectFormFooter 
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

export default SubjectCreateForm;
