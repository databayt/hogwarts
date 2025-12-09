"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createAssignment, getAssignment, updateAssignment } from "@/components/platform/assignments/actions";
import { assignmentCreateSchema } from "@/components/platform/assignments/validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { InformationStep } from "./information";
import { DetailsStep } from "./details";
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout";
import { ModalFooter } from "@/components/atom/modal/modal-footer";

interface AssignmentCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void;
}

export function AssignmentCreateForm({ onSuccess }: AssignmentCreateFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<z.infer<typeof assignmentCreateSchema>>({
    resolver: zodResolver(assignmentCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      classId: "",
      type: "HOMEWORK",
      totalPoints: 0,
      weight: 0,
      dueDate: new Date(),
      instructions: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getAssignment({ id: currentId });
      if (!res.success || !res.data) return;
      const a = res.data as any;
      form.reset({
        title: a.title ?? "",
        description: a.description ?? "",
        classId: a.classId ?? "",
        type: a.type ?? "HOMEWORK",
        totalPoints: a.totalPoints ?? 0,
        weight: a.weight ?? 0,
        dueDate: a.dueDate ? new Date(a.dueDate) : new Date(),
        instructions: a.instructions ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof assignmentCreateSchema>) {
    try {
      const res = currentId
        ? await updateAssignment({ id: currentId, ...values })
        : await createAssignment(values);
      if (res?.success) {
        toast.success(currentId ? "Assignment updated" : "Assignment created");
        closeModal();
        // Use callback for optimistic update, fallback to router.refresh()
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toast.error(res?.error || (currentId ? "Failed to update assignment" : "Failed to create assignment"));
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred");
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['title', 'description', 'classId'] as const;
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
        ? ['title', 'description', 'classId'] as const
        : ['type', 'totalPoints', 'weight', 'dueDate', 'instructions'] as const;
      
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
        return <DetailsStep form={form} isView={isView} />;
      default:
        return null;
    }
  };

  const stepLabels: Record<number, string> = {
    1: "Basic Information",
    2: "Assignment Details",
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={isView ? "View Assignment" : currentId ? "Edit Assignment" : "Create Assignment"}
          description={isView ? "View assignment details" : currentId ? "Update assignment details" : "Create a new assignment for your class"}
        >
          {renderCurrentStep()}
        </ModalFormLayout>

        <ModalFooter
          currentStep={currentStep}
          totalSteps={2}
          stepLabel={stepLabels[currentStep]}
          isView={isView}
          isEdit={!!currentId}
          isDirty={form.formState.isDirty}
          onBack={handleBack}
          onNext={handleNext}
          onSaveStep={handleSaveCurrentStep}
        />
      </form>
    </Form>
  );
}

export default AssignmentCreateForm;
