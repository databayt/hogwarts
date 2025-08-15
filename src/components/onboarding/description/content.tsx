"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  GraduationCap, 
  BookOpen, 
  Library, 
  School, 
  Building2, 
  Landmark, 
  Wrench,
  Heart
} from 'lucide-react';
import { useListing } from '@/components/onboarding/use-listing';
import { FORM_LIMITS } from '@/components/onboarding/constants.client';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { SelectionCard } from '@/components/onboarding';
import { cn } from "@/lib/utils";

export default function DescriptionContent() {
  const router = useRouter();
  const params = useParams();
  const { setCustomNavigation } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [currentStep, setCurrentStep] = useState<'level' | 'type'>('level');
  const [selectedLevel, setSelectedLevel] = useState<string>('primary');
  const [selectedType, setSelectedType] = useState<string>('private');

  // Get the ID from the URL params
  const id = params?.id as string;

  // Load existing data from listing
  useEffect(() => {
    if (listing) {
      if (listing.schoolLevel) {
        setSelectedLevel(listing.schoolLevel);
      }
      if (listing.schoolType) {
        setSelectedType(listing.schoolType);
      }
    }
  }, [listing]);

  const levelOptions = [
    {
      id: 'primary',
      title: 'Primary School',
      description: 'Elementary education (typically ages 6-11)',
      icon: BookOpen,
    },
    {
      id: 'secondary',
      title: 'Secondary School',
      description: 'Middle and high school education (typically ages 12-18)',
      icon: GraduationCap,
    },
    {
      id: 'both',
      title: 'Primary & Secondary',
      description: 'Complete K-12 education system',
      icon: Library,
    },
  ];

  const schoolTypes = [
    {
      id: 'private',
      title: 'Private',
      icon: Building2,
    },
    {
      id: 'public',
      title: 'Public',
      icon: School,
    },
    {
      id: 'international',
      title: 'International',
      icon: Landmark,
    },
    {
      id: 'technical',
      title: 'Technical',
      icon: Wrench,
    },
    {
      id: 'special',
      title: 'Special',
      icon: Heart,
    }
  ];

  const handleBack = () => {
    if (currentStep === 'type') {
      setCurrentStep('level');
      return;
    }
    router.push(`/onboarding/${id}/title`);
  };

  const handleNext = async () => {
    if (currentStep === 'level') {
      try {
        await updateListingData({
          schoolLevel: selectedLevel
        });
        setCurrentStep('type');
      } catch (error) {
        console.error('Error updating school level:', error);
      }
      return;
    }
    
    if (currentStep === 'type' && selectedType) {
      try {
        await updateListingData({
          schoolType: selectedType
        });
        router.push(`/onboarding/${id}/location`);
      } catch (error) {
        console.error('Error updating school type:', error);
      }
    }
  };

  const nextDisabled = (currentStep === 'level' && !selectedLevel) ||
                      (currentStep === 'type' && !selectedType);

  // Set custom navigation in context
  useEffect(() => {
    setCustomNavigation({
      onBack: handleBack,
      onNext: handleNext,
      nextDisabled: nextDisabled
    });

    return () => {
      setCustomNavigation(undefined);
    };
  }, [currentStep, selectedLevel, selectedType]);

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
  };

  return (
    <div className="">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h3>
              {currentStep === 'level' ? (
                <>
                  What grade levels
                  <br />
                  does your school teach?
                </>
              ) : (
                <>
                  What type of school
                  <br />
                  are you setting up?
                </>
              )}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {currentStep === 'level' 
                ? "Select the education levels your school provides."
                : "Choose your school's organizational model."}
            </p>
          </div>

          {/* Right side - Content */}
          <div>
            {currentStep === 'level' ? (
              <div className="space-y-3">
                {levelOptions.map((level) => (
                  <SelectionCard
                    key={level.id}
                    id={level.id}
                    title={level.title}
                    description={level.description}
                    icon={<level.icon size={24} />}
                    isSelected={selectedLevel === level.id}
                    onClick={handleLevelSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {schoolTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-lg border transition-all text-center h-[120px] hover:border-foreground/50",
                      selectedType === type.id
                        ? "border-foreground bg-accent"
                        : "border-border"
                    )}
                  >
                    <type.icon size={24} className="mb-3" />
                    <div className="font-medium">
                      {type.title}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}