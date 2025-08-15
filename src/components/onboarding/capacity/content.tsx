"use client";

import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useListing } from '@/components/onboarding/use-listing';
import { cn } from "@/lib/utils";

export default function CapacityContent() {
  const { enableNext } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [counts, setCounts] = useState({
    students: 400, // init with 400 students
    teachers: 10,  // init with 10 teachers
    classrooms: 10, // init with 10 classrooms
    facilities: 5,  // init with 5 facilities
  });

  // Load existing values from listing
  useEffect(() => {
    if (listing) {
      setCounts({
        students: listing.guestCount || 400,
        teachers: listing.bedrooms || 10,
        classrooms: listing.beds || 10,
        facilities: listing.bathrooms || 5,
      });
    }
  }, [listing]);

  // Enable next button since we have default values
  useEffect(() => {
    enableNext();
  }, [enableNext]);

  // Format number to 4 digits with leading zeros
  const formatNumber = (num: number): string => {
    return num.toString().padStart(4, '0');
  };

  const updateCount = async (field: keyof typeof counts, delta: number) => {
    const newCounts = {
      ...counts,
      [field]: Math.max(0, counts[field] + delta)
    };
    setCounts(newCounts);

    // Update backend data
    try {
      const updateData: any = {};
      if (field === 'students') updateData.guestCount = newCounts.students;
      if (field === 'teachers') updateData.bedrooms = newCounts.teachers;
      if (field === 'classrooms') updateData.beds = newCounts.classrooms;
      if (field === 'facilities') updateData.bathrooms = newCounts.facilities;
      
      if (Object.keys(updateData).length > 0) {
        await updateListingData(updateData);
      }
    } catch (error) {
      console.error('Error updating basics data:', error);
    }
  };

  const CounterRow = ({ 
    label, 
    value, 
    onDecrease, 
    onIncrease,
    step = 1,
    minValue = 0
  }: { 
    label: string; 
    value: number; 
    onDecrease: () => void; 
    onIncrease: () => void;
    step?: number;
    minValue?: number;
  }) => (
    <div className="flex items-center justify-between py-4 sm:py-6 border-b border-border last:border-b-0">
      <div className="text-foreground text-sm sm:text-base font-medium">
        {label}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onDecrease}
          disabled={value <= minValue}
          className={cn(
            "w-10 h-10 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center transition-colors min-h-[40px] sm:min-h-[28px]",
            value <= minValue
              ? "border-muted text-muted-foreground cursor-not-allowed"
              : "border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground active:scale-95"
          )}
        >
          <Minus size={16} strokeWidth={2} className="sm:w-3.5 sm:h-3.5" />
        </button>
        <span className="w-16 text-center text-lg sm:text-base font-medium font-mono">
          {formatNumber(value)}
        </span>
        <button
          onClick={onIncrease}
          className="w-10 h-10 sm:w-7 sm:h-7 rounded-full border border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground flex items-center justify-center transition-colors min-h-[40px] sm:min-h-[28px] active:scale-95"
        >
          <Plus size={16} strokeWidth={2} className="sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="">
      <div className="items-center justify-center">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
          {/* Left div - Title */}
          <div className="flex-1 flex flex-col">
            <h3 className="">
              Share some basics <br />
              about your school
            </h3>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">
              Tell us about your school's capacity and facilities.
            </p>
          </div>

          {/* Right div - Counter Controls */}
          <div className="flex-1">
            <div className="bg-background">
              <CounterRow
                label="Students"
                value={counts.students}
                onDecrease={() => updateCount('students', -20)}
                onIncrease={() => updateCount('students', 20)}
                step={20}
                minValue={0}
              />
              <CounterRow
                label="Teachers"
                value={counts.teachers}
                onDecrease={() => updateCount('teachers', -1)}
                onIncrease={() => updateCount('teachers', 1)}
                step={1}
                minValue={0}
              />
              <CounterRow
                label="Classrooms"
                value={counts.classrooms}
                onDecrease={() => updateCount('classrooms', -1)}
                onIncrease={() => updateCount('classrooms', 1)}
                step={1}
                minValue={0}
              />
              <CounterRow
                label="Facilities"
                value={counts.facilities}
                onDecrease={() => updateCount('facilities', -1)}
                onIncrease={() => updateCount('facilities', 1)}
                step={1}
                minValue={0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}