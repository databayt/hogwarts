"use client";

import React from 'react';
import SchoolCard from './school-card';
import NewSchoolOptions from './new-school-options';

interface School {
  id: string;
  name: string;
  startDate: string;
  status: 'draft' | 'pending' | 'active';
  subdomain?: string;
}

interface SchoolOnboardingDashboardProps {
  userName?: string;
  schools?: School[];
  onSchoolClick?: (id: string) => void;
  onCreateNew?: () => void;
  onCreateFromTemplate?: () => void;
  totalSchools?: number; // Total number of schools available
  dictionary?: any;
  locale?: string;
}

const SchoolOnboardingDashboard: React.FC<SchoolOnboardingDashboardProps> = ({
  userName = "Admin",
  schools = [],
  onSchoolClick,
  onCreateNew,
  onCreateFromTemplate,
  totalSchools,
  dictionary,
  locale
}) => {
  const dict = dictionary?.onboarding || {};
  const draftSchools = schools.filter(school => school.status === 'draft');
  const hasInProgressSchools = draftSchools.length > 0;
  const hasMoreSchools = totalSchools && totalSchools > schools.length;

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
      {/* Welcome Header */}
      <div>
        <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl lg:text-2xl">
          {dict.welcomeStatic || 'Welcome'}
        </h3>
      </div>

      {/* Finish school setup section */}
      {hasInProgressSchools && (
        <div className="space-y-2 sm:space-y-3">
          <h5 className="text-base sm:text-lg font-semibold">
            {dict.completeSetup || 'Complete your school setup'}
          </h5>
          
          <div className="space-y-2">
            {draftSchools.map((school) => (
              <SchoolCard
                key={school.id}
                id={school.id}
                name={school.name}
                startDate={school.startDate}
                status={school.status}
                subdomain={school.subdomain}
                onClick={onSchoolClick}
                dictionary={dictionary}
              />
            ))}
            {hasMoreSchools && (
              <div className="text-center py-2">
                <p className="muted">
                  +{totalSchools! - schools.length} {totalSchools! - schools.length > 1 ? (dict.moreSchoolsPlural || 'more schools') : (dict.moreSchools || 'more school')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start a new school section */}
      <NewSchoolOptions
        onCreateNew={onCreateNew}
        onCreateFromTemplate={onCreateFromTemplate}
        dictionary={dictionary}
        locale={locale}
      />
    </div>
  );
};

export default SchoolOnboardingDashboard; 