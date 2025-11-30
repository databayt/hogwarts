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
import { EmploymentDetailsStep } from "./employment";
import { QualificationsStep } from "./qualifications";
import { ExperienceStep } from "./experience";
import { SubjectExpertiseStep } from "./expertise";
import { ReviewStep } from "./review";
import { TeacherFormFooter } from "./footer";

interface TeacherCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void;
}

export function TeacherCreateForm({ onSuccess }: TeacherCreateFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<z.infer<typeof teacherCreateSchema>>({
    resolver: zodResolver(teacherCreateSchema) as any,
    defaultValues: {
      givenName: "",
      surname: "",
      gender: undefined as unknown as "male" | "female" | undefined,
      emailAddress: "",
      // Employment details
      employeeId: "",
      joiningDate: undefined,
      employmentStatus: "ACTIVE",
      employmentType: "FULL_TIME",
      contractStartDate: undefined,
      contractEndDate: undefined,
      // Arrays for future steps
      phoneNumbers: [],
      qualifications: [],
      experiences: [],
      subjectExpertise: [],
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
        // Employment details
        employeeId: t.employeeId ?? "",
        joiningDate: t.joiningDate ? new Date(t.joiningDate) : undefined,
        employmentStatus: t.employmentStatus ?? "ACTIVE",
        employmentType: t.employmentType ?? "FULL_TIME",
        contractStartDate: t.contractStartDate ? new Date(t.contractStartDate) : undefined,
        contractEndDate: t.contractEndDate ? new Date(t.contractEndDate) : undefined,
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
      // Use callback for optimistic update, fallback to router.refresh()
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else {
      toast.error(currentId ? "Failed to update teacher" : "Failed to create teacher");
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['givenName', 'surname', 'gender', 'birthDate'] as const;
      const step1Valid = await form.trigger(step1Fields);
      if (step1Valid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      const step2Fields = ['emailAddress'] as const;
      const step2Valid = await form.trigger(step2Fields);
      if (step2Valid) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      // Employment fields are optional, just move to next step
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Qualifications are optional, move to next
      setCurrentStep(5);
    } else if (currentStep === 5) {
      // Experience is optional, move to next
      setCurrentStep(6);
    } else if (currentStep === 6) {
      // Subject expertise is optional, move to review
      setCurrentStep(7);
    } else if (currentStep === 7) {
      // Submit from review step
      await form.handleSubmit(onSubmit)();
    }
  };

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const currentStepFields =
        currentStep === 1 ? ['givenName', 'surname', 'gender', 'birthDate'] as const :
        currentStep === 2 ? ['emailAddress'] as const :
        ['employeeId', 'joiningDate', 'employmentStatus', 'employmentType', 'contractStartDate', 'contractEndDate'] as const;

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
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
      case 3:
        return <EmploymentDetailsStep form={form} isView={isView} />;
      case 4:
        return <QualificationsStep form={form} isView={isView} />;
      case 5:
        return <ExperienceStep form={form} isView={isView} />;
      case 6:
        return <SubjectExpertiseStep form={form} isView={isView} />;
      case 7:
        return <ReviewStep form={form} isView={isView} />;
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
