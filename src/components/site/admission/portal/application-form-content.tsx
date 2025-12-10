"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, Save, Send } from "lucide-react";
import { toast } from "sonner";

import type { School } from "../../types";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { PublicCampaign } from "../types";
import { FORM_STEPS, type ApplicationFormData } from "../types";
import { createApplicationStepSchemas, createFullApplicationSchema, type FullApplicationFormData } from "../validation";
import { saveApplicationSession, submitApplication } from "../actions";

// Step Components
import StepPersonal from "../steps/step-personal";
import StepContact from "../steps/step-contact";
import StepGuardian from "../steps/step-guardian";
import StepAcademic from "../steps/step-academic";
import StepDocuments from "../steps/step-documents";
import StepReview from "../steps/step-review";

interface Props {
  school: School;
  campaign: PublicCampaign;
  dictionary: Dictionary;
  lang: Locale;
  subdomain: string;
  initialData?: Partial<ApplicationFormData>;
  sessionToken?: string;
}

export default function ApplicationFormContent({
  school,
  campaign,
  dictionary,
  lang,
  subdomain,
  initialData,
  sessionToken: initialSessionToken,
}: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(initialSessionToken || null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Skip campaign step since we already have campaignId
  const steps = FORM_STEPS.slice(1);
  const totalSteps = steps.length;

  // Create schemas
  const stepSchemas = createApplicationStepSchemas();
  const fullSchema = createFullApplicationSchema();

  // Initialize form with default values
  const defaultValues: Partial<ApplicationFormData> = {
    campaignId: campaign.id,
    country: "Sudan",
    ...initialData,
  };

  const methods = useForm<FullApplicationFormData>({
    resolver: zodResolver(fullSchema) as any,
    defaultValues: defaultValues as FullApplicationFormData,
    mode: "onChange",
  });

  const { handleSubmit, trigger, getValues, watch, formState } = methods;
  const formData = watch();

  // Auto-save every 30 seconds
  const autoSave = useCallback(async () => {
    if (!formData.email) return;

    setIsSaving(true);
    try {
      const result = await saveApplicationSession(subdomain, {
        formData: getValues(),
        currentStep,
        email: formData.email,
        campaignId: campaign.id,
      }, sessionToken || undefined);

      if (result.success && result.data) {
        setSessionToken(result.data.sessionToken);
        setLastSaved(new Date());
        // Save to localStorage as backup
        localStorage.setItem(`application_${subdomain}_${campaign.id}`, JSON.stringify({
          formData: getValues(),
          currentStep,
          sessionToken: result.data.sessionToken,
        }));
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [formData.email, subdomain, campaign.id, currentStep, sessionToken, getValues]);

  // Auto-save timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.email && formState.isDirty) {
        autoSave();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [formData.email, formState.isDirty, autoSave]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!initialData) {
      const saved = localStorage.getItem(`application_${subdomain}_${campaign.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.formData) {
            Object.keys(parsed.formData).forEach((key) => {
              methods.setValue(key as keyof FullApplicationFormData, parsed.formData[key]);
            });
          }
          if (parsed.currentStep) {
            setCurrentStep(parsed.currentStep);
          }
          if (parsed.sessionToken) {
            setSessionToken(parsed.sessionToken);
          }
        } catch (e) {
          console.error("Failed to load saved application:", e);
        }
      }
    }
  }, [initialData, subdomain, campaign.id, methods]);

  // Get current step schema
  const getCurrentStepSchema = () => {
    const stepId = steps[currentStep]?.id;
    switch (stepId) {
      case "personal":
        return stepSchemas.personal;
      case "contact":
        return stepSchemas.contact;
      case "guardian":
        return stepSchemas.guardian;
      case "academic":
        return stepSchemas.academic;
      case "documents":
        return stepSchemas.documents;
      default:
        return z.object({});
    }
  };

  // Validate current step
  const validateCurrentStep = async () => {
    const stepId = steps[currentStep]?.id;
    const fields = steps[currentStep]?.fields || [];
    return await trigger(fields as (keyof FullApplicationFormData)[]);
  };

  // Handle next step
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
        // Auto-save on step change
        if (formData.email) {
          autoSave();
        }
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Manual save
  const handleSave = async () => {
    if (!formData.email) {
      toast.error(lang === "ar" ? "يرجى إدخال البريد الإلكتروني للحفظ" : "Please enter your email to save");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveApplicationSession(subdomain, {
        formData: getValues(),
        currentStep,
        email: formData.email,
        campaignId: campaign.id,
      }, sessionToken || undefined);

      if (result.success && result.data) {
        setSessionToken(result.data.sessionToken);
        setLastSaved(new Date());
        toast.success(lang === "ar" ? "تم حفظ الطلب" : "Application saved");
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch (error) {
      toast.error(lang === "ar" ? "فشل في الحفظ" : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: FullApplicationFormData) => {
    setIsSubmitting(true);
    try {
      const result = await submitApplication(subdomain, sessionToken || "", data as ApplicationFormData);

      if (result.success && result.data) {
        // Clear localStorage
        localStorage.removeItem(`application_${subdomain}_${campaign.id}`);

        // Redirect to success page
        router.push(
          `/${lang}/s/${subdomain}/apply/success?number=${result.data.applicationNumber}&token=${result.data.accessToken}`
        );
      } else {
        toast.error(result.error || "Failed to submit application");
      }
    } catch (error) {
      toast.error(lang === "ar" ? "فشل في تقديم الطلب" : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    const stepId = steps[currentStep]?.id;
    switch (stepId) {
      case "personal":
        return <StepPersonal dictionary={dictionary} lang={lang} />;
      case "contact":
        return <StepContact dictionary={dictionary} lang={lang} />;
      case "guardian":
        return <StepGuardian dictionary={dictionary} lang={lang} />;
      case "academic":
        return <StepAcademic dictionary={dictionary} lang={lang} campaign={campaign} />;
      case "documents":
        return <StepDocuments dictionary={dictionary} lang={lang} campaign={campaign} />;
      case "review":
        return <StepReview dictionary={dictionary} lang={lang} campaign={campaign} />;
      default:
        return null;
    }
  };

  const currentStepInfo = steps[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground mt-1">{school.name}</p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {lang === "ar" ? "الخطوة" : "Step"} {currentStep + 1} / {totalSteps}
              </span>
              <span>
                {lang === "ar" ? currentStepInfo?.labelAr : currentStepInfo?.label}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 overflow-x-auto py-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : index < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>
                {lang === "ar" ? currentStepInfo?.labelAr : currentStepInfo?.label}
              </CardTitle>
              <CardDescription>
                {lang === "ar" ? currentStepInfo?.descriptionAr : currentStepInfo?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 me-2" />
              {lang === "ar" ? "السابق" : "Previous"}
            </Button>

            <div className="flex items-center gap-2">
              {/* Save button */}
              <Button
                type="button"
                variant="ghost"
                onClick={handleSave}
                disabled={isSaving || !formData.email}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 me-2" />
                )}
                {lang === "ar" ? "حفظ" : "Save"}
              </Button>

              {/* Next/Submit button */}
              {isLastStep ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 me-2" />
                  )}
                  {lang === "ar" ? "تقديم الطلب" : "Submit Application"}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  {lang === "ar" ? "التالي" : "Next"}
                  <ArrowRight className="w-4 h-4 ms-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Last saved indicator */}
          {lastSaved && (
            <p className="text-center text-xs text-muted-foreground">
              {lang === "ar" ? "آخر حفظ:" : "Last saved:"}{" "}
              {lastSaved.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US")}
            </p>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
