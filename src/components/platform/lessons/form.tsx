"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createLesson, getLesson, updateLesson } from "@/components/platform/lessons/actions";
import { lessonCreateSchema } from "@/components/platform/lessons/validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { BasicInformationStep } from "./basic-information";
import { ScheduleDetailsStep } from "./schedule-details";
import { ContentAssessmentStep } from "./content-assessment";
import { LessonFormFooter } from "./footer";

interface LessonCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void;
}

export function LessonCreateForm({ onSuccess }: LessonCreateFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  
  const form = useForm<z.infer<typeof lessonCreateSchema>>({
    resolver: zodResolver(lessonCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      classId: "",
      lessonDate: new Date(),
      startTime: "",
      endTime: "",
      objectives: "",
      materials: "",
      activities: "",
      assessment: "",
      notes: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getLesson({ id: currentId });
      const l = res.lesson as any;
      if (!l) return;
      
      form.reset({
        title: l.title ?? "",
        description: l.description ?? "",
        classId: l.classId ?? "",
        lessonDate: l.lessonDate ? new Date(l.lessonDate) : new Date(),
        startTime: l.startTime ?? "",
        endTime: l.endTime ?? "",
        objectives: l.objectives ?? "",
        materials: l.materials ?? "",
        activities: l.activities ?? "",
        assessment: l.assessment ?? "",
        notes: l.notes ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof lessonCreateSchema>) {
    const res = currentId
      ? await updateLesson({ id: currentId, ...values })
      : await createLesson(values);

    if (res?.success) {
      toast.success(currentId ? "Lesson updated" : "Lesson created");
      closeModal();
      // Use callback for optimistic update, fallback to router.refresh()
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else {
      toast.error(currentId ? "Failed to update lesson" : "Failed to create lesson");
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
      const step2Fields = ['lessonDate', 'startTime', 'endTime'] as const;
      const step2Valid = await form.trigger(step2Fields);
      if (step2Valid) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      await form.handleSubmit(onSubmit)();
    }
  };

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const currentStepFields = currentStep === 1
        ? ['title', 'description', 'classId'] as const
        : currentStep === 2
        ? ['lessonDate', 'startTime', 'endTime'] as const
        : ['objectives', 'materials', 'activities', 'assessment', 'notes'] as const;

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
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      closeModal();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInformationStep form={form} isView={isView} />;
      case 2:
        return <ScheduleDetailsStep form={form} isView={isView} />;
      case 3:
        return <ContentAssessmentStep form={form} isView={isView} />;
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
              <h2 className="text-2xl font-semibold">
                {isView ? "View Lesson" : currentId ? "Edit Lesson" : "Create Lesson"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {isView ? "View lesson details" : currentId ? "Update lesson details" : "Plan a new lesson for your class"}
              </p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <LessonFormFooter 
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

export default LessonCreateForm;
