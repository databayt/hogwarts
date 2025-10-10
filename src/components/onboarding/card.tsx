"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, MapPin, Users, GraduationCap, DollarSign, Building } from 'lucide-react';
import type { OnboardingSchoolData, OnboardingProgress, OnboardingStep } from './types';
import { formatCurrency, formatCapacity, formatSchoolType } from './util';
import { STEP_GROUPS, ONBOARDING_STEPS } from "./config";

interface SchoolCardProps {
  school: OnboardingSchoolData;
  progress?: OnboardingProgress;
  onClick?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

export function SchoolCard({ 
  school, 
  progress, 
  onClick, 
  onEdit, 
  showActions = true 
}: SchoolCardProps) {
  const handleCardClick = () => {
    if (onClick) onClick();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  return (
    <Card 
      className={`w-full transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h5 className="truncate">
              {school.name || 'Unnamed School'}
            </h5>
            {school.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {school.description}
              </CardDescription>
            )}
          </div>
          {progress && (
            <Badge variant={progress.completionPercentage >= 80 ? 'default' : 'secondary'}>
              {progress.completionPercentage}% Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* School Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 muted">
          {school.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{school.city}, {school.state}</span>
            </div>
          )}
          
          {(school.maxStudents || school.maxTeachers) && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {formatCapacity(school.maxStudents || 0, school.maxTeachers || 0)}
              </span>
            </div>
          )}
          
          {(school.schoolLevel || school.schoolType) && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {formatSchoolType(school.schoolLevel || '', school.schoolType || '')}
              </span>
            </div>
          )}
          
          {school.tuitionFee && school.currency && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {formatCurrency(school.tuitionFee, school.currency)} / year
              </span>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between muted">
              <span className="text-muted-foreground">Setup Progress</span>
              <span>{progress.completionPercentage}%</span>
            </div>
            <Progress value={progress.completionPercentage} className="h-2" />
          </div>
        )}
        
        {/* Timestamps */}
        <div className="flex items-center gap-4 muted">
          {school.createdAt && (
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Created {new Date(school.createdAt).toLocaleDateString()}
            </div>
          )}
          {school.updatedAt && school.updatedAt !== school.createdAt && (
            <div className="flex items-center gap-1">
              Updated {new Date(school.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t">
            {onClick && (
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={handleCardClick}
              >
                Continue Setup
              </Button>
            )}
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEditClick}
              >
                Edit
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProgressCardProps {
  progress: OnboardingProgress;
  onContinue?: () => void;
  showDetails?: boolean;
}

export function ProgressCard({ 
  progress, 
  onContinue, 
  showDetails = true 
}: ProgressCardProps) {
  const getGroupProgress = (groupName: keyof typeof STEP_GROUPS) => {
    const groupSteps = Object.values(ONBOARDING_STEPS)
      .filter(step => step.group === groupName)
      .map(step => step.step);
    
    const completedInGroup = progress.completedSteps.filter(step => 
      groupSteps.includes(step)
    ).length;
    
    return Math.round((completedInGroup / groupSteps.length) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Onboarding Progress
        </CardTitle>
        <CardDescription>
          Track your school setup completion
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Overall Progress</span>
            <p className="muted">
              {progress.completionPercentage}% Complete
            </p>
          </div>
          <Progress value={progress.completionPercentage} className="h-3" />
        </div>
        
        {/* Group Progress */}
        {showDetails && (
          <div className="space-y-4">
            <h6>Progress by Section</h6>
            {Object.entries(STEP_GROUPS).map(([groupKey, group]) => {
              const groupProgress = getGroupProgress(groupKey as keyof typeof STEP_GROUPS);
              return (
                <div key={groupKey} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="muted">{group.title}</p>
                      <p className="muted">{group.description}</p>
                    </div>
                    <Badge 
                      variant={groupProgress >= 100 ? 'default' : 'secondary'}
                      className="muted"
                    >
                      {groupProgress}%
                    </Badge>
                  </div>
                  <Progress value={groupProgress} className="h-2" />
                </div>
              );
            })}
          </div>
        )}
        
        {/* Next Step */}
        {progress.nextStep && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <h6>Next Step</h6>
                <p className="muted">
                  {getStepTitle(progress.nextStep)}
                </p>
              </div>
              {onContinue && (
                <Button size="sm" onClick={onContinue}>
                  Continue
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StepCardProps {
  step: OnboardingStep;
  isCompleted?: boolean;
  isCurrent?: boolean;
  isAccessible?: boolean;
  onClick?: () => void;
}

export function StepCard({ 
  step, 
  isCompleted = false, 
  isCurrent = false, 
  isAccessible = true,
  onClick 
}: StepCardProps) {
  const stepConfig = ONBOARDING_STEPS[step];
  if (!stepConfig) return null;

  const getStepIcon = () => {
    switch (step) {
      case 'title':
        return <Building className="h-4 w-4" />;
      case 'description':
        return <GraduationCap className="h-4 w-4" />;
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'capacity':
        return <Users className="h-4 w-4" />;
      case 'price':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  const getCardVariant = () => {
    if (isCurrent) return 'default';
    if (isCompleted) return 'secondary';
    if (!isAccessible) return 'outline';
    return 'outline';
  };

  return (
    <Card 
      className={`transition-all duration-200 ${
        onClick && isAccessible 
          ? 'cursor-pointer hover:shadow-md' 
          : isAccessible ? '' : 'opacity-50 cursor-not-allowed'
      } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick && isAccessible ? onClick : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${
            isCompleted ? 'bg-green-100 text-green-600' :
            isCurrent ? 'bg-primary/10 text-primary' :
            'bg-muted text-muted-foreground'
          }`}>
            {getStepIcon()}
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{stepConfig.title}</CardTitle>
            {stepConfig.isRequired && (
              <Badge variant="outline" className="text-xs mt-1">
                Required
              </Badge>
            )}
          </div>
          {isCompleted && (
            <Badge variant="default" className="text-xs">
              ✓ Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="text-sm">
          {stepConfig.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

// Helper function imports (need to be defined in this file for now)

function getStepTitle(step: string): string {
  return (ONBOARDING_STEPS as any)[step]?.title || step;
}

export default SchoolCard;