"use client";

import React from 'react';
import { HostStepHeader } from '@/components/onboarding';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { Card } from '@/components/ui/card';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FinishSetupContent() {
  const { enableNext } = useHostValidation();

  // Enable next button for this informational page
  React.useEffect(() => {
    enableNext();
  }, [enableNext]);

  const nextSteps = [
    {
      title: "Set Up Your Dashboard",
      description: "Customize your school dashboard and configure key settings.",
      link: "/dashboard/settings"
    },
    {
      title: "Add Faculty & Staff",
      description: "Invite teachers and staff members to join your school platform.",
      link: "/dashboard/staff"
    },
    {
      title: "Configure Academic Calendar",
      description: "Set up terms, schedules, and important academic dates.",
      link: "/dashboard/calendar"
    },
    {
      title: "Prepare for Enrollment",
      description: "Set up admission forms and enrollment workflows.",
      link: "/dashboard/enrollment"
    }
  ];

  return (
    <div className="space-y-8">
      <HostStepHeader
        stepNumber={9}
        title="Congratulations! Your school is ready"
        description="You've completed the initial setup. Here's what you can do next to get started."
      />

      <div className="max-w-2xl mx-auto">
        <Card className="p-8 mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-center mb-2">
            Setup Complete!
          </h3>
          <p className="text-muted-foreground text-center">
            Your school profile has been created successfully. You can now proceed with the next steps to fully configure your platform.
          </p>
        </Card>

        <div className="space-y-4">
          {nextSteps.map((step, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <Button variant="ghost" className="ml-4" asChild>
                  <a href={step.link}>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Need Help?</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Our support team is here to help you get started. Check out these resources:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Visit our <a href="/help" className="text-primary hover:underline">Help Center</a></li>
            <li>Watch <a href="/tutorials" className="text-primary hover:underline">Video Tutorials</a></li>
            <li>Contact <a href="/support" className="text-primary hover:underline">Support Team</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
