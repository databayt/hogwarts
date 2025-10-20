"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { completeOnboarding } from './actions';
import SuccessCompletionModal from '../success-completion-modal';
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
  id: string;
}

const LegalContent = (props: Props) => {
  const { dictionary, lang, id } = props;
  const router = useRouter();
  const schoolId = id;
  const [hostingType, setHostingType] = useState<string>('private-individual');
  const [safetyFeatures, setSafetyFeatures] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [schoolData, setSchoolData] = useState<any>(null);
  const { setCustomNavigation, enableNext } = useHostValidation();
  const dict = (dictionary as any)?.school?.onboarding || {};

  console.log("🏗️ [LEGAL CONTENT] Component initialized", {
    schoolId,
    initialHostingType: 'private-individual',
    initialSafetyFeatures: [],
    timestamp: new Date().toISOString()
  });

  // Set up custom navigation to handle completion
  useEffect(() => {
    const handleNext = async () => {
      console.log("🚀 [LEGAL CONTENT] CREATE SCHOOL button clicked", {
        schoolId,
        hostingType,
        safetyFeatures,
        timestamp: new Date().toISOString()
      });

      setIsSubmitting(true);
      console.log("⏳ [LEGAL CONTENT] Setting isSubmitting to true");

      try {
        console.log("📤 [LEGAL CONTENT] Calling completeOnboarding action with data:", {
          schoolId,
          operationalStatus: hostingType,
          safetyFeatures: safetyFeatures
        });

        const result = await completeOnboarding(schoolId, {
          operationalStatus: hostingType,
          safetyFeatures: safetyFeatures
        });

        console.log("📥 [LEGAL CONTENT] completeOnboarding action result:", result);

        if (result.success && result.data) {
          console.log("✅ [LEGAL CONTENT] Onboarding completed successfully", {
            school: result.data.school,
            redirectUrl: result.data.redirectUrl
          });

          // Store school data and show success modal instead of navigating
          setSchoolData(result.data.school);
          setShowSuccessModal(true);
          setIsSubmitting(false);
        } else {
          console.error("❌ [LEGAL CONTENT] Failed to complete onboarding:", result.error);
          console.log("🔄 [LEGAL CONTENT] Setting isSubmitting back to false");
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error("💥 [LEGAL CONTENT] Error completing onboarding:", error);
        console.log("🔄 [LEGAL CONTENT] Setting isSubmitting back to false due to error");
        setIsSubmitting(false);
      }
    };

    console.log("🔧 [LEGAL CONTENT] Setting up custom navigation", {
      hostingType,
      safetyFeatures,
      isSubmitting,
      nextDisabled: isSubmitting || !hostingType
    });

    setCustomNavigation({
      onNext: handleNext,
      nextDisabled: isSubmitting || !hostingType
    });

    return () => {
      console.log("🧹 [LEGAL CONTENT] Cleaning up custom navigation");
      setCustomNavigation(undefined);
    };
  }, [hostingType, safetyFeatures, schoolId, router, setCustomNavigation, isSubmitting]);

  // Enable next button when form is valid
  useEffect(() => {
    console.log("🔘 [LEGAL CONTENT] Checking form validity", {
      hostingType,
      isSubmitting,
      shouldEnableNext: hostingType && !isSubmitting
    });

    if (hostingType && !isSubmitting) {
      console.log("✅ [LEGAL CONTENT] Enabling next button");
      enableNext();
    }
  }, [hostingType, isSubmitting, enableNext]);

  // Handle dashboard navigation from modal
  const handleGoToDashboard = () => {
    if (schoolData?.domain) {
      // Construct the subdomain URL
      const protocol = window.location.protocol;
      const baseDomain = window.location.hostname.replace('ed.', '');
      const schoolUrl = `${protocol}//${schoolData.domain}.${baseDomain}/dashboard`;

      // Redirect to the school's subdomain dashboard
      window.location.href = schoolUrl;
    }
  };

  const toggleSafetyFeature = (feature: string) => {
    console.log("🔄 [LEGAL CONTENT] Toggling safety feature", {
      feature,
      currentFeatures: safetyFeatures,
      willAdd: !safetyFeatures.includes(feature)
    });

    setSafetyFeatures(prev => {
      const newFeatures = prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature];

      console.log("📝 [LEGAL CONTENT] Updated safety features", {
        previous: prev,
        new: newFeatures
      });

      return newFeatures;
    });
  };

  const safetyOptions = [
    dict.cctvSurveillance || 'CCTV surveillance system',
    dict.emergencyAlarm || 'Emergency alarm system',
    dict.transportationServices || 'Transportation services',
  ];

  const isFormValid = hostingType && safetyFeatures.length >= 0; // At least hosting type selected

  return (
    <>
      {/* Success Modal */}
      {schoolData && (
        <SuccessCompletionModal
          schoolData={schoolData}
          showModal={showSuccessModal}
          setShowModal={setShowSuccessModal}
          onGoToDashboard={handleGoToDashboard}
        />
      )}

      <div className="">
        <div className="">
        {/* Title at the top */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-4xl font-medium text-foreground">
            {dict.shareSafetyDetails || 'Share safety details'}
          </h2>
        </div>

        {/* Two sections side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-20 items-start">
          {/* Left column - Hosting type */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <h5 className="text-foreground">
                {dict.operationalStatus || "What is your school's operational status?"}
              </h5>
              <HelpCircle size={16} className="text-muted-foreground sm:w-4.5 sm:h-4.5" />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="hosting-type"
                  value="private-individual"
                  checked={hostingType === 'private-individual'}
                  onChange={(e) => {
                    console.log("🔘 [LEGAL CONTENT] Hosting type changed", {
                      from: hostingType,
                      to: e.target.value
                    });
                    setHostingType(e.target.value);
                  }}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  hostingType === 'private-individual'
                    ? 'border-foreground bg-foreground'
                    : 'border-muted-foreground bg-background'
                }`}>
                  {hostingType === 'private-individual' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-background"></div>
                  )}
                </div>
                <small className="text-foreground">{dict.existingSchoolLicenses || 'Existing school with valid licenses'}</small>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="hosting-type"
                  value="business"
                  checked={hostingType === 'business'}
                  onChange={(e) => {
                    console.log("🔘 [LEGAL CONTENT] Hosting type changed", {
                      from: hostingType,
                      to: e.target.value
                    });
                    setHostingType(e.target.value);
                  }}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  hostingType === 'business'
                    ? 'border-foreground bg-foreground'
                    : 'border-muted-foreground bg-background'
                }`}>
                  {hostingType === 'business' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-background"></div>
                  )}
                </div>
                <small className="text-foreground">{dict.newSchoolRegistration || 'New school seeking registration'}</small>
              </label>
            </div>
          </div>

          {/* Right column - Safety features and important info */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            {/* Safety Features */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <h5 className="text-foreground">
                  {dict.schoolSafetyFeatures || 'Does your school have any of these?'}
                </h5>
                <HelpCircle size={16} className="text-muted-foreground sm:w-4.5 sm:h-4.5" />
              </div>

              <div className="space-y-2">
                {safetyOptions.map((option) => (
                  <label key={option} className="flex items-center justify-between cursor-pointer">
                    <small className="text-foreground">{option}</small>
                    <input
                      type="checkbox"
                      checked={safetyFeatures.includes(option)}
                      onChange={() => toggleSafetyFeature(option)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      safetyFeatures.includes(option)
                        ? 'border-foreground bg-foreground'
                        : 'border-muted-foreground bg-background'
                    }`}>
                      {safetyFeatures.includes(option) && (
                        <svg className="w-2.5 h-2.5 text-background" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-border" />

            {/* Important Information */}
            <div className="space-y-3">
              <h6 className="text-foreground">
                {dict.importantThingsToKnow || 'Important things to know'}
              </h6>
              <small className="block text-muted-foreground leading-relaxed">
                {dict.complianceNotice || 'Be sure to comply with your'} <span className="underline">{dict.localEducationLaws || 'local education laws'}</span> {dict.andReviewOur || 'and review our'} <span className="underline">{dict.schoolRegistrationGuidelines || 'school registration guidelines'}</span> {dict.and || 'and'} <span className="underline">{dict.feeStructure || 'fee structure'}</span>.
              </small>
            </div>
          </div>
        </div>
      </div>

    </div>
    </>
  );
};

export default LegalContent; 