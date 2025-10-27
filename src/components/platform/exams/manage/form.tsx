"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createExam, getExam, updateExam } from "./actions";
import { examCreateSchema } from "./validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { BasicInformationStep } from "./basic-information";
import { ScheduleMarksStep } from "./schedule-marks";
import { InstructionsDetailsStep } from "./instructions-details";
import { ExamFormFooter } from "./footer";

export function ExamCreateForm() {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  
  const form = useForm<z.infer<typeof examCreateSchema>>({
    resolver: zodResolver(examCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      classId: "",
      subjectId: "",
      examDate: new Date(),
      startTime: "",
      endTime: "",
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
      examType: "MIDTERM",
      instructions: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getExam({ id: currentId });
      const e = res.exam as any;
      if (!e) return;
      
      form.reset({
        title: e.title ?? "",
        description: e.description ?? "",
        classId: e.classId ?? "",
        subjectId: e.subjectId ?? "",
        examDate: e.examDate ? new Date(e.examDate) : new Date(),
        startTime: e.startTime ?? "",
        endTime: e.endTime ?? "",
        duration: e.duration ?? 60,
        totalMarks: e.totalMarks ?? 100,
        passingMarks: e.passingMarks ?? 40,
        examType: e.examType ?? "MIDTERM",
        instructions: e.instructions ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof examCreateSchema>) {
    const res = currentId
      ? await updateExam({ id: currentId, ...values })
      : await createExam(values);
      
    if (res?.success) {
      toast.success(currentId ? "Exam updated" : "Exam created");
      closeModal();
      router.refresh();
    } else {
      toast.error(currentId ? "Failed to update exam" : "Failed to create exam");
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['title', 'classId', 'subjectId', 'examType'] as const;
      const step1Valid = await form.trigger(step1Fields);
      if (step1Valid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      const step2Fields = ['examDate', 'startTime', 'endTime', 'duration', 'totalMarks', 'passingMarks'] as const;
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
        ? ['title', 'classId', 'subjectId', 'examType'] as const
        : currentStep === 2
        ? ['examDate', 'startTime', 'endTime', 'duration', 'totalMarks', 'passingMarks'] as const
        : ['instructions'] as const;
      
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
        return <ScheduleMarksStep form={form} isView={isView} />;
      case 3:
        return <InstructionsDetailsStep form={form} isView={isView} />;
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
                {isView ? "View Exam" : currentId ? "Edit Exam" : "Create Exam"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {isView ? "View exam details" : currentId ? "Update exam details" : "Schedule a new exam for your class"}
              </p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <ExamFormFooter 
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

export default ExamCreateForm;
