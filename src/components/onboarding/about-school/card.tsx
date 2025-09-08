"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';

interface AboutSchoolCardProps {
  title?: string;
  description?: string;
}

export function AboutSchoolCard({ 
  title = "About Your School",
  description = "Welcome! Let's start building your school profile."
}: AboutSchoolCardProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Building className="h-6 w-6 text-primary" />
        </div>
        <h3>{title}</h3>
        <p className="lead">{description}</p>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          This is the first step of your school onboarding process. 
          We'll help you set up everything you need to get started.
        </p>
      </CardContent>
    </Card>
  );
}

export default AboutSchoolCard;