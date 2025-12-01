"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createEvent, getEvent, updateEvent } from "@/components/platform/events/actions";
import { eventCreateSchema } from "@/components/platform/events/validation";
import { Form } from "@/components/ui/form";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import { BasicInformationStep } from "./basic-information";
import { ScheduleLocationStep } from "./schedule-location";
import { DetailsAttendeesStep } from "./details-attendees";
import { EventFormFooter } from "./footer";

interface EventCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void;
}

export function EventCreateForm({ onSuccess }: EventCreateFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  
  const form = useForm<z.infer<typeof eventCreateSchema>>({
    resolver: zodResolver(eventCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "ACADEMIC",
      eventDate: new Date(),
      startTime: "",
      endTime: "",
      location: "",
      organizer: "",
      targetAudience: "",
      maxAttendees: undefined,
      isPublic: false,
      registrationRequired: false,
      notes: "",
    },
  });

  const isView = !!(modal.id && modal.id.startsWith("view:"));
  const currentId = modal.id ? (modal.id.startsWith("view:") ? modal.id.split(":")[1] : modal.id) : undefined;

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getEvent({ id: currentId });
      const e = res.event as any;
      if (!e) return;
      
      form.reset({
        title: e.title ?? "",
        description: e.description ?? "",
        eventType: e.eventType ?? "ACADEMIC",
        eventDate: e.eventDate ? new Date(e.eventDate) : new Date(),
        startTime: e.startTime ?? "",
        endTime: e.endTime ?? "",
        location: e.location ?? "",
        organizer: e.organizer ?? "",
        targetAudience: e.targetAudience ?? "",
        maxAttendees: e.maxAttendees ?? undefined,
        isPublic: e.isPublic ?? false,
        registrationRequired: e.registrationRequired ?? false,
        notes: e.notes ?? "",
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  async function onSubmit(values: z.infer<typeof eventCreateSchema>) {
    const res = currentId
      ? await updateEvent({ id: currentId, ...values })
      : await createEvent(values);

    if (res?.success) {
      toast.success(currentId ? "Event updated" : "Event created");
      closeModal();
      // Use callback for optimistic update, fallback to router.refresh()
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else {
      toast.error(currentId ? "Failed to update event" : "Failed to create event");
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ['title', 'eventType'] as const;
      const step1Valid = await form.trigger(step1Fields);
      if (step1Valid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      const step2Fields = ['eventDate', 'startTime', 'endTime'] as const;
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
        ? ['title', 'eventType'] as const
        : currentStep === 2
        ? ['eventDate', 'startTime', 'endTime', 'location'] as const
        : ['organizer', 'targetAudience', 'maxAttendees', 'isPublic', 'registrationRequired', 'notes'] as const;
      
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
        return <ScheduleLocationStep form={form} isView={isView} />;
      case 3:
        return <DetailsAttendeesStep form={form} isView={isView} />;
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
                {isView ? "View Event" : currentId ? "Edit Event" : "Create Event"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {isView ? "View event details" : currentId ? "Update event details" : "Schedule a new school event"}
              </p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              <div className="overflow-y-auto">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          <EventFormFooter 
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

export default EventCreateForm;
