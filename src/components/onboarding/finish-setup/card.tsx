"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface FinishSetupCardProps {
  title?: string;
  description?: string;
}

export function FinishSetupCard({ 
  title = "Finish Setup",
  description = "Congratulations! You're ready to complete your school setup."
}: FinishSetupCardProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-6 w-6 text-primary" />
        </div>
        <h3>{title}</h3>
        <p className="lead">{description}</p>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          This is the final step of your school setup process. 
          Once completed, your school will be ready to go live!
        </p>
      </CardContent>
    </Card>
  );
}

export default FinishSetupCard;