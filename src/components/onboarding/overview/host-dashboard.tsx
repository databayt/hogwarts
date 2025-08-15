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
}

const SchoolOnboardingDashboard: React.FC<SchoolOnboardingDashboardProps> = ({
  userName = "Admin",
  schools = [
    {
      id: "1",
      name: "Al-Noor Primary School",
      startDate: "January 15, 2025",
      status: "draft",
      subdomain: "al-noor"
    },
    {
      id: "2", 
      name: "Future Leaders Academy",
      startDate: "January 20, 2025",
      status: "pending",
      subdomain: "future-leaders"
    }
  ],
  onSchoolClick,
  onCreateNew,
  onCreateFromTemplate
}) => {
  const draftSchools = schools.filter(school => school.status === 'draft');
  const hasInProgressSchools = draftSchools.length > 0;

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
      {/* Welcome Header */}
      <div>
        <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl lg:text-2xl">
          Welcome back, {userName}
        </h3>
      </div>

      {/* Finish school setup section */}
      {hasInProgressSchools && (
        <div className="space-y-2 sm:space-y-3">
          <h5 className="text-base sm:text-lg font-semibold">
            Complete your school setup
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Start a new school section */}
      <NewSchoolOptions
        onCreateNew={onCreateNew}
        onCreateFromTemplate={onCreateFromTemplate}
      />
    </div>
  );
};

export default SchoolOnboardingDashboard; 