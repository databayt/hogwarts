"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Users, GraduationCap, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { getSchoolOnboardingStatus } from '../legal/actions';
import SuccessModal from './success-modal';
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
  id: string;
}

export default function CongratulationsContent(props: Props) {
  const { dictionary, lang, id } = props;
  const router = useRouter();
  const schoolId = id;
  const [schoolData, setSchoolData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
        // Show the success modal after data is loaded
        setShowSuccessModal(true);
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
    <>
      {/* Success Modal */}
      {schoolData && (
        <SuccessModal
          schoolData={schoolData}
          showModal={showSuccessModal}
          setShowModal={setShowSuccessModal}
          onGoToDashboard={handleGoToDashboard}
        />
      )}

      {/* Regular content as fallback or when modal is closed */}
      <div className="max-w-4xl mx-auto py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-chart-2/10 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-chart-2" />
        </div>
        <h1 className="text-4xl font-bold mb-3">
          Congratulations! 🎉
        </h1>
        <p className="lead text-muted-foreground">
          {schoolData?.name || 'Your school'} is now set up and ready to go!
        </p>
      </div>

      {/* School URL Card */}
      {schoolData?.domain && (
        <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="muted mb-1">Your school's URL:</p>
              <h5>
                {schoolData.domain}.databayt.org
              </h5>
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
        <h3 className="mb-4">What's Next?</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleGoToDashboard}>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-chart-1/10 rounded-lg">
                <Users className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <h6 className="mb-1">Invite Your Team</h6>
                <p className="muted">
                  Add teachers, staff, and administrators to your school
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleGoToDashboard}>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-chart-3/10 rounded-lg">
                <GraduationCap className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <h6 className="mb-1">Add Students</h6>
                <p className="muted">
                  Import student data or add them individually
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleGoToDashboard}>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <Calendar className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <h6 className="mb-1">Set Up Classes</h6>
                <p className="muted">
                  Create class schedules and assign teachers
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleGoToDashboard}>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-chart-1/10 rounded-lg">
                <ArrowRight className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <h6 className="mb-1">Configure Settings</h6>
                <p className="muted">
                  Customize your school's preferences and policies
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="p-6 bg-muted/50">
        <h6 className="mb-3">💡 Quick Tips</h6>
        <ul className="space-y-2">
          <small className="block text-muted-foreground">• Your school portal is now live at <span className="font-medium">{schoolData?.domain}.databayt.org</span></small>
          <small className="block text-muted-foreground">• Share this URL with your staff and parents for easy access</small>
          <small className="block text-muted-foreground">• Check out the Help Center for guides and tutorials</small>
          <small className="block text-muted-foreground">• Contact support if you need any assistance getting started</small>
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
    </>
  );
}