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
import { AssignmentFormFooter } from "./footer";

export function AssignmentCreateForm() {
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
      const a = res.assignment as any;
      if (!a) return;
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
    const res = currentId
      ? await updateAssignment({ id: currentId, ...values })
      : await createAssignment(values);
    if (res?.success) {
      toast.success(currentId ? "Assignment updated" : "Assignment created");
      closeModal();
      router.refresh();
    } else {
      toast.error(currentId ? "Failed to update assignment" : "Failed to create assignment");
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

  return (
    <div className="flex h-full flex-col">
      <Form {...form}>
        <form className="flex flex-col h-full" onSubmit={(e) => e.preventDefault()}>
          <div className="flex-grow flex gap-6">
            {/* Title Section */}
            <div className="w-1/3">
              <h2 className="text-2xl font-semibold">{isView ? "View Assignment" : currentId ? "Edit Assignment" : "Create Assignment"}</h2>
              <p className="text-sm text-muted-foreground mt-2">{isView ? "View assignment details" : currentId ? "Update assignment details" : "Create a new assignment for your class"}</p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <AssignmentFormFooter 
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

export default AssignmentCreateForm;
