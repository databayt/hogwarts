"use client";

import React from 'react';
import HostStepHeader from '@/components/onboarding/step-header';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

export default function StandOutContent() {
  const { enableNext } = useHostValidation();

  // Enable next button for this informational page
  React.useEffect(() => {
    enableNext();
  }, [enableNext]);

  const features = [
    {
      title: "Academic Excellence",
      description: "Showcase your school's academic achievements, programs, and unique teaching methodologies.",
      highlights: ["Curriculum", "Teaching Methods", "Academic Results"]
    },
    {
      title: "Student Life",
      description: "Highlight the vibrant student community, extracurricular activities, and support services.",
      highlights: ["Activities", "Clubs", "Support Services"]
    },
    {
      title: "Facilities",
      description: "Present your modern facilities, technology infrastructure, and learning spaces.",
      highlights: ["Classrooms", "Labs", "Sports Facilities"]
    },
    {
      title: "Community",
      description: "Share your school's values, culture, and connection with the local community.",
      highlights: ["Values", "Culture", "Community Engagement"]
    }
  ];

  return (
    <div className="space-y-8">
      <HostStepHeader
        stepNumber={5}
        title="Make your school stand out"
        description="Highlight what makes your school special and attract the right students and families."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="p-6 space-y-4">
            <h3 className="text-xl font-semibold">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
            <div className="flex flex-wrap gap-2">
              {feature.highlights.map((highlight, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {highlight}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 p-6 rounded-lg">
        <h4 className="font-medium mb-2">Pro Tips</h4>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Be specific about your school's unique offerings and strengths</li>
          <li>Use clear, professional language that resonates with parents</li>
          <li>Highlight achievements and accreditations</li>
          <li>Share your school's vision and educational philosophy</li>
        </ul>
      </div>
    </div>
  );
}
