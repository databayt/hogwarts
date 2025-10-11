"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClass, getClass, updateClass } from "@/components/platform/classes/actions";
import { classCreateSchema } from "@/components/platform/classes/validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { InformationStep } from "./information";
import { ScheduleStep } from "./schedule";
import { ClassFormFooter } from "./footer";

export function ClassCreateForm() {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<z.infer<typeof classCreateSchema>>({
    resolver: zodResolver(classCreateSchema),
    defaultValues: {
      name: "",
      subjectId: "",
      teacherId: "",
      termId: "",
      startPeriodId: "",
      endPeriodId: "",
      classroomId: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getClass({ id: currentId });
      const c = res.class as any;
      if (!c) return;
      form.reset({
        name: c.name ?? "",
        subjectId: c.subjectId ?? "",
        teacherId: c.teacherId ?? "",
        termId: c.termId ?? "",
        startPeriodId: c.startPeriodId ?? "",
        endPeriodId: c.endPeriodId ?? "",
        classroomId: c.classroomId ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof classCreateSchema>) {
    const res = currentId
      ? await updateClass({ id: currentId, ...values })
      : await createClass(values);
    if (res?.success) {
      toast.success(currentId ? "Class updated" : "Class created");
      closeModal();
      router.refresh();
    } else {
      toast.error(currentId ? "Failed to update class" : "Failed to create class");
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['name', 'subjectId', 'teacherId'] as const;
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
        ? ['name', 'subjectId', 'teacherId'] as const
        : ['termId', 'startPeriodId', 'endPeriodId', 'classroomId'] as const;
      
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
        return <ScheduleStep form={form} isView={isView} />;
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
              <h2 className="text-2xl font-semibold">{isView ? "View Class" : currentId ? "Edit Class" : "Create Class"}</h2>
              <p className="text-sm text-muted-foreground mt-2">{isView ? "View class details" : currentId ? "Update class details" : "Create a new class for your school"}</p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <ClassFormFooter 
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

export default ClassCreateForm;
