"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { createStudent, getStudent, updateStudent } from "@/components/platform/students/actions";
import { createStudentCreateSchema } from "@/components/platform/students/validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { InformationStep } from "./information";
import { EnrollmentStep } from "./enrollment";
import { StudentFormFooter } from "./footer";
import { getToastMessages } from "@/components/internationalization/helpers";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface StudentCreateFormProps {
  dictionary?: Dictionary['school']['students'];
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void;
}

export function StudentCreateForm({ dictionary, onSuccess }: StudentCreateFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Create localized schema (memoized)
  const studentCreateSchema = useMemo(() => {
    if (!dictionary) {
      // Fallback to legacy schema if dictionary not available
      const { studentCreateSchema: legacySchema } = require("./validation");
      return legacySchema;
    }
    // Create full dictionary object for schema factory
    const fullDict = { messages: dictionary as any } as Dictionary;
    return createStudentCreateSchema(fullDict);
  }, [dictionary]);

  // Get toast messages
  const t = useMemo(() => {
    if (!dictionary) return null;
    const fullDict = { messages: dictionary as any } as Dictionary;
    return getToastMessages(fullDict);
  }, [dictionary]);

  const form = useForm<z.infer<typeof studentCreateSchema>>({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: {
      givenName: "",
      middleName: "",
      surname: "",
      dateOfBirth: "",
      gender: undefined as unknown as "male" | "female" | undefined,
      enrollmentDate: "",
      userId: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getStudent({ id: currentId });
      const s = res.student as any;
      if (!s) return;
      form.reset({
        givenName: s.givenName ?? "",
        middleName: s.middleName ?? "",
        surname: s.surname ?? "",
        dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().slice(0, 10) : "",
        gender: ((s.gender ?? "") as string).toLowerCase() === "female" ? "female" : "male",
        enrollmentDate: s.enrollmentDate ? new Date(s.enrollmentDate).toISOString().slice(0, 10) : "",
        userId: s.userId ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof studentCreateSchema>) {
    const res = currentId
      ? await updateStudent({ id: currentId, ...values })
      : await createStudent(values);
    if (res?.success) {
      const successMsg = currentId
        ? (t?.success?.student?.updated() || "Student updated successfully")
        : (t?.success?.student?.created() || "Student created successfully");
      toast.success(successMsg);
      closeModal();
      // Use callback for optimistic update, fallback to router.refresh()
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else {
      const errorMsg = currentId
        ? (t?.error?.student?.updateFailed() || "Failed to update student")
        : (t?.error?.student?.createFailed() || "Failed to create student");
      toast.error(errorMsg);
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['givenName', 'middleName', 'surname', 'dateOfBirth', 'gender'] as const;
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
        ? ['givenName', 'middleName', 'surname', 'dateOfBirth', 'gender'] as const
        : ['enrollmentDate', 'userId'] as const;
      
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
        return <EnrollmentStep form={form} isView={isView} />;
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
              <h2 className="text-2xl font-semibold">{isView ? "View Student" : currentId ? "Edit Student" : "Create Student"}</h2>
              <p className="text-sm text-muted-foreground mt-2">{isView ? "View student details" : currentId ? "Update student details" : "Add a new student to your school"}</p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <StudentFormFooter 
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

export default StudentCreateForm;