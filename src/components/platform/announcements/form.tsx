"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createAnnouncement, getAnnouncement, updateAnnouncement } from "@/components/platform/announcements/actions";
import { announcementCreateSchema } from "@/components/platform/announcements/validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { InformationStep } from "./information";
import { ScopeStep } from "./scope";
import { AnnouncementFormFooter } from "./footer";

export function AnnouncementCreateForm() {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const form = useForm<z.infer<typeof announcementCreateSchema>>({
    resolver: zodResolver(announcementCreateSchema),
    defaultValues: {
      title: "",
      body: "",
      scope: "school",
      classId: "",
      role: "",
      published: false,
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getAnnouncement({ id: currentId });
      const a = res.announcement as any;
      if (!a) return;
      form.reset({
        title: a.title ?? "",
        body: a.body ?? "",
        scope: a.scope ?? "school",
        classId: a.classId ?? "",
        role: a.role ?? "",
        published: a.published ?? false,
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof announcementCreateSchema>) {
    const res = currentId
      ? await updateAnnouncement({ id: currentId, ...values })
      : await createAnnouncement(values);
    if (res?.success) {
      toast.success(currentId ? "Announcement updated" : "Announcement created");
      closeModal();
      router.refresh();
    } else {
      toast.error(currentId ? "Failed to update announcement" : "Failed to create announcement");
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['title', 'body'] as const;
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
        ? ['title', 'body'] as const
        : ['scope', 'classId', 'role', 'published'] as const;
      
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
        return <ScopeStep form={form} isView={isView} />;
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
              <h2 className="text-2xl font-semibold">{isView ? "View Announcement" : currentId ? "Edit Announcement" : "Create Announcement"}</h2>
              <p className="text-sm text-muted-foreground mt-2">{isView ? "View announcement details" : currentId ? "Update announcement details" : "Create a new announcement for your school"}</p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <AnnouncementFormFooter 
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

export default AnnouncementCreateForm;
