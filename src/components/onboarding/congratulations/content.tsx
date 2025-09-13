"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Users, GraduationCap, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { getSchoolOnboardingStatus } from '../legal/actions';

export default function CongratulationsContent() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const [schoolData, setSchoolData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchoolData() {
      try {
        const result = await getSchoolOnboardingStatus(schoolId);
        if (result.success && result.data) {
          setSchoolData(result.data);
        }
      } catch (error) {
        console.error('Error fetching school data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSchoolData();
  }, [schoolId]);

  const handleGoToDashboard = () => {
    if (schoolData?.domain) {
      // Construct the subdomain URL
      const protocol = window.location.protocol;
      const baseDomain = window.location.hostname.replace('ed.', '');
      const schoolUrl = `${protocol}//${schoolData.domain}.${baseDomain}/dashboard`;
      
      // Redirect to the school's subdomain dashboard
      window.location.href = schoolUrl;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse">
          <div className="h-12 w-48 bg-muted rounded mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-4xl font-bold mb-3">
          Congratulations! 🎉
        </h1>
        <p className="text-xl text-muted-foreground">
          {schoolData?.name || 'Your school'} is now set up and ready to go!
        </p>
      </div>

      {/* School URL Card */}
      {schoolData?.domain && (
        <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your school's URL:</p>
              <p className="text-lg font-semibold">
                {schoolData.domain}.databayt.org
              </p>
            </div>
            <Button
              onClick={handleGoToDashboard}
              size="lg"
              className="gap-2"
            >
              Go to Dashboard
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Next Steps */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">What's Next?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleGoToDashboard}>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Invite Your Team</h3>
                <p className="text-sm text-muted-foreground">
                  Add teachers, staff, and administrators to your school
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleGoToDashboard}>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Add Students</h3>
                <p className="text-sm text-muted-foreground">
                  Import student data or add them individually
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleGoToDashboard}>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Set Up Classes</h3>
                <p className="text-sm text-muted-foreground">
                  Create class schedules and assign teachers
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleGoToDashboard}>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <ArrowRight className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Configure Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Customize your school's preferences and policies
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">💡 Quick Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Your school portal is now live at <span className="font-medium">{schoolData?.domain}.databayt.org</span></li>
          <li>• Share this URL with your staff and parents for easy access</li>
          <li>• Check out the Help Center for guides and tutorials</li>
          <li>• Contact support if you need any assistance getting started</li>
        </ul>
      </Card>

      {/* CTA Buttons */}
      <div className="flex gap-4 mt-8 justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push(`/onboarding/${schoolId}/overview`)}
        >
          Review Settings
        </Button>
        <Button
          size="lg"
          onClick={handleGoToDashboard}
          className="gap-2"
        >
          Go to School Dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}