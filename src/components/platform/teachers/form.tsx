"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createTeacher, getTeacher, updateTeacher } from "@/components/platform/teachers/actions";
import { teacherCreateSchema } from "@/components/platform/teachers/validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { InformationStep } from "./information";
import { ContactStep } from "./contact";
import { TeacherFormFooter } from "./footer";

export function TeacherCreateForm() {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<z.infer<typeof teacherCreateSchema>>({
    resolver: zodResolver(teacherCreateSchema),
    defaultValues: {
      givenName: "",
      surname: "",
      gender: undefined as unknown as "male" | "female" | undefined,
      emailAddress: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getTeacher({ id: currentId });
      const t = res.teacher as any;
      if (!t) return;
      form.reset({
        givenName: t.givenName ?? "",
        surname: t.surname ?? "",
        gender: ((t.gender ?? "") as string).toLowerCase() === "female" ? "female" : "male",
        emailAddress: t.emailAddress ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof teacherCreateSchema>) {
    const res = currentId
      ? await updateTeacher({ id: currentId, ...values })
      : await createTeacher(values);
    if (res?.success) {
      toast.success(currentId ? "Teacher updated" : "Teacher created");
      closeModal();
      router.refresh();
    } else {
      toast.error(currentId ? "Failed to update teacher" : "Failed to create teacher");
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['givenName', 'surname', 'gender'] as const;
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
        ? ['givenName', 'surname', 'gender'] as const
        : ['emailAddress'] as const;
      
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
              <h2 className="text-2xl font-semibold">{isView ? "View Teacher" : currentId ? "Edit Teacher" : "Create Teacher"}</h2>
              <p className="text-sm text-muted-foreground mt-2">{isView ? "View teacher details" : currentId ? "Update teacher details" : "Add a new teacher to your school"}</p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <TeacherFormFooter 
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

export default TeacherCreateForm;
