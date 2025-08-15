"use client";

import React from 'react';
import { GraduationCap, Building, BookOpen, Users, Shield, Wrench } from 'lucide-react';
import SelectionCard from './selection-card';
import { cn } from '@/lib/utils';

interface SchoolTypeOption {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

interface SchoolTypeSelectorProps {
  selectedType?: string;
  onSelect?: (typeId: string) => void;
  compact?: boolean;
  className?: string;
}

const SchoolTypeSelector: React.FC<SchoolTypeSelectorProps> = ({
  selectedType,
  onSelect,
  compact = false,
  className,
}) => {
  const schoolTypes: SchoolTypeOption[] = [
    { id: 'primary', name: 'Primary School', icon: GraduationCap },
    { id: 'secondary', name: 'Secondary School', icon: Building },
    { id: 'k-12', name: 'K-12 / Basic Education', icon: BookOpen },
    { id: 'academy', name: 'Academy / Institute', icon: Users },
    { id: 'international', name: 'International School', icon: Building },
    { id: 'training', name: 'Training Center', icon: BookOpen },
    { id: 'public', name: 'Public School', icon: Users },
    { id: 'private', name: 'Private School', icon: Shield },
    { id: 'technical', name: 'Technical School', icon: Wrench },
  ];

  if (compact) {
    return (
      <div className={cn('w-full', className)}>
        <div className="grid grid-cols-4 gap-3">
          {schoolTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <SelectionCard
                key={type.id}
                id={type.id}
                title={type.name}
                icon={<IconComponent size={20} />}
                isSelected={selectedType === type.id}
                onClick={onSelect}
                compact={true}
                className="h-20"
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {schoolTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <SelectionCard
              key={type.id}
              id={type.id}
              title={type.name}
              icon={<IconComponent size={32} />}
              isSelected={selectedType === type.id}
              onClick={onSelect}
              className="p-6"
            />
          );
        })}
      </div>
    </div>
  );
};

export default SchoolTypeSelector;