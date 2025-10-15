"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createResult, getResult, updateResult } from "@/components/platform/grades/actions";
import { resultCreateSchema } from "@/components/platform/grades/validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { StudentAssignmentStep } from "./student-assignment";
import { GradingStep } from "./grading";
import { ResultFormFooter } from "./footer";
import { type Dictionary } from "@/components/internationalization/dictionaries";

interface ResultCreateFormProps {
  dictionary: Dictionary;
}

export function ResultCreateForm({ dictionary }: ResultCreateFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<z.infer<typeof resultCreateSchema>>({
    resolver: zodResolver(resultCreateSchema),
    defaultValues: {
      studentId: "",
      assignmentId: "",
      classId: "",
      score: 0,
      maxScore: 0,
      grade: "",
      feedback: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getResult({ id: currentId });
      const r = res.result as any;
      if (!r) return;
      form.reset({
        studentId: r.studentId ?? "",
        assignmentId: r.assignmentId ?? "",
        classId: r.classId ?? "",
        score: r.score ?? 0,
        maxScore: r.maxScore ?? 0,
        grade: r.grade ?? "",
        feedback: r.feedback ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof resultCreateSchema>) {
    const res = currentId
      ? await updateResult({ id: currentId, ...values })
      : await createResult(values);
    if (res?.success) {
      toast.success(currentId ? dictionary.school.grades.resultUpdated : dictionary.school.grades.resultCreated);
      closeModal();
      router.refresh();
    } else {
      toast.error(currentId ? dictionary.school.grades.failedToUpdate : dictionary.school.grades.failedToCreate);
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['studentId', 'assignmentId', 'classId'] as const;
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
        ? ['studentId', 'assignmentId', 'classId'] as const
        : ['score', 'maxScore', 'grade', 'feedback'] as const;
      
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
        return <StudentAssignmentStep form={form} isView={isView} dictionary={dictionary} />;
      case 2:
        return <GradingStep form={form} isView={isView} dictionary={dictionary} />;
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
              <h2>{isView ? dictionary.school.grades.viewResult : currentId ? dictionary.school.grades.editResult : dictionary.school.grades.createResult}</h2>
              <p className="muted">{isView ? dictionary.school.grades.viewResultDetails : currentId ? dictionary.school.grades.updateResultDetails : dictionary.school.grades.recordNewResult}</p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <ResultFormFooter
            currentStep={currentStep}
            isView={isView}
            currentId={currentId}
            onBack={handleBack}
            onNext={handleNext}
            onSaveCurrentStep={handleSaveCurrentStep}
            form={form}
            dictionary={dictionary}
          />
        </form>
      </Form>
    </div>
  );
}

export default ResultCreateForm;
