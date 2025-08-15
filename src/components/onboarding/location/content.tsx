"use client";

import React from 'react';
import { useListing } from '@/components/onboarding/use-listing';
import { LocationForm } from '@/components/onboarding/location/form';

export default function LocationContent() {
  const { listing } = useListing();

  return (
    <div className="">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-4">
            <h3>
              Where's your school
              <br />
              located?
            </h3>
            <p>
              Your school's address will be visible to parents and staff.
            </p>
          </div>

          {/* Right side - Location Form */}
          <div>
            <LocationForm />
          </div>
        </div>
      </div>
    </div>
  );
}
