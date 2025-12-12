"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createExam, getExam, updateExam } from "./actions";
import { examCreateSchema } from "./validation";
import { type ExamFormData } from "./types";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { BasicInformationStep } from "./basic-information";
import { ScheduleMarksStep } from "./schedule-marks";
import { InstructionsDetailsStep } from "./instructions-details";
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout";
import { ModalFooter } from "@/components/atom/modal/modal-footer";

interface ExamCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void;
}

export function ExamCreateForm({ onSuccess }: ExamCreateFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examCreateSchema) as any,
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
      forceCreate: false,
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

  async function onSubmit(values: ExamFormData) {
    const res = currentId
      ? await updateExam({
          id: currentId,
          ...values,
          forceUpdate: values.forceCreate, // Map forceCreate to forceUpdate for updates
        })
      : await createExam(values);
      
    if (res?.success) {
      toast.success(currentId ? "Exam updated" : "Exam created");
      closeModal();
      // Use callback for optimistic update, fallback to router.refresh()
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else {
      toast.error(currentId ? "Failed to update exam" : "Failed to create exam");
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['title', 'classId', 'subjectId', 'examType'] as Array<keyof ExamFormData>;
      const step1Valid = await form.trigger(step1Fields);
      if (step1Valid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      const step2Fields = ['examDate', 'startTime', 'endTime', 'duration', 'totalMarks', 'passingMarks'] as Array<keyof ExamFormData>;
      const step2Valid = await form.trigger(step2Fields);
      if (step2Valid) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      await (form.handleSubmit as any)(onSubmit)();
    }
  };

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const currentStepFields = (currentStep === 1
        ? ['title', 'classId', 'subjectId', 'examType']
        : currentStep === 2
        ? ['examDate', 'startTime', 'endTime', 'duration', 'totalMarks', 'passingMarks']
        : ['instructions']) as Array<keyof ExamFormData>;

      const stepValid = await form.trigger(currentStepFields);
      if (stepValid) {
        await (form.handleSubmit as any)(onSubmit)();
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
        return <BasicInformationStep form={form as any} isView={isView} />;
      case 2:
        return <ScheduleMarksStep form={form as any} isView={isView} />;
      case 3:
        return <InstructionsDetailsStep form={form as any} isView={isView} />;
      default:
        return null;
    }
  };

  const stepLabels: Record<number, string> = {
    1: "Basic Information",
    2: "Schedule & Marks",
    3: "Instructions & Details",
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={isView ? "View Exam" : currentId ? "Edit Exam" : "Create Exam"}
          description={isView ? "View exam details" : currentId ? "Update exam details" : "Schedule a new exam for your class"}
        >
          {renderCurrentStep()}
        </ModalFormLayout>

        <ModalFooter
          currentStep={currentStep}
          totalSteps={3}
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

export default ExamCreateForm;
