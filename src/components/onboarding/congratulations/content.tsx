"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { getSchoolOnboardingStatus } from "../legal/actions"
import SuccessModal from "./success-modal"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  id: string
}

export default function CongratulationsContent(props: Props) {
  const { dictionary, lang, id } = props
  const router = useRouter()
  const schoolId = id
  const [schoolData, setSchoolData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    async function fetchSchoolData() {
      try {
        const result = await getSchoolOnboardingStatus(schoolId)
        if (result.success && result.data) {
          setSchoolData(result.data)
        }
      } catch (error) {
        console.error("Error fetching school data:", error)
      } finally {
        setLoading(false)
        // Show the success modal after data is loaded
        setShowSuccessModal(true)
      }
    }
    fetchSchoolData()
  }, [schoolId])

  const handleGoToDashboard = () => {
    if (schoolData?.domain) {
      // Construct the subdomain URL
      const protocol = window.location.protocol
      const baseDomain = window.location.hostname.replace("ed.", "")
      const schoolUrl = `${protocol}//${schoolData.domain}.${baseDomain}/dashboard`

      // Redirect to the school's subdomain lab
      window.location.href = schoolUrl
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse">
          <div className="bg-muted mb-4 h-12 w-48 rounded"></div>
          <div className="bg-muted h-4 w-32 rounded"></div>
        </div>
      </div>
    )
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
      <div>
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="bg-chart-2/10 mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full">
            <CheckCircle className="text-chart-2 h-12 w-12" />
          </div>
          <h1 className="mb-3 text-4xl font-bold">Congratulations! 🎉</h1>
          <p className="lead text-muted-foreground">
            {schoolData?.name || "Your school"} is now set up and ready to go!
          </p>
        </div>

        {/* School URL Card */}
        {schoolData?.domain && (
          <Card className="bg-primary/5 border-primary/20 mb-8 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="muted mb-1">Your school's URL:</p>
                <h5>{schoolData.domain}.databayt.org</h5>
              </div>
              <Button onClick={handleGoToDashboard} size="lg" className="gap-2">
                Go to Dashboard
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Next Steps */}
        <div className="mb-8">
          <h3 className="mb-4">What's Next?</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
              onClick={handleGoToDashboard}
            >
              <div className="flex items-start gap-4">
                <div className="bg-chart-1/10 rounded-lg p-2">
                  <Users className="text-chart-1 h-6 w-6" />
                </div>
                <div>
                  <h6 className="mb-1">Invite Your Team</h6>
                  <p className="muted">
                    Add teachers, staff, and administrators to your school
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
              onClick={handleGoToDashboard}
            >
              <div className="flex items-start gap-4">
                <div className="bg-chart-3/10 rounded-lg p-2">
                  <GraduationCap className="text-chart-3 h-6 w-6" />
                </div>
                <div>
                  <h6 className="mb-1">Add Students</h6>
                  <p className="muted">
                    Import student data or add them individually
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
              onClick={handleGoToDashboard}
            >
              <div className="flex items-start gap-4">
                <div className="bg-chart-2/10 rounded-lg p-2">
                  <Calendar className="text-chart-2 h-6 w-6" />
                </div>
                <div>
                  <h6 className="mb-1">Set Up Classes</h6>
                  <p className="muted">
                    Create class schedules and assign teachers
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
              onClick={handleGoToDashboard}
            >
              <div className="flex items-start gap-4">
                <div className="bg-chart-1/10 rounded-lg p-2">
                  <ArrowRight className="text-chart-1 h-6 w-6" />
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
        <Card className="bg-muted/50 p-6">
          <h6 className="mb-3">💡 Quick Tips</h6>
          <ul className="space-y-2">
            <small className="text-muted-foreground block">
              • Your school portal is now live at{" "}
              <span className="font-medium">
                {schoolData?.domain}.databayt.org
              </span>
            </small>
            <small className="text-muted-foreground block">
              • Share this URL with your staff and parents for easy access
            </small>
            <small className="text-muted-foreground block">
              • Check out the Help Center for guides and tutorials
            </small>
            <small className="text-muted-foreground block">
              • Contact support if you need any assistance getting started
            </small>
          </ul>
        </Card>

        {/* CTA Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push(`/onboarding/${schoolId}/overview`)}
          >
            Review Settings
          </Button>
          <Button size="lg" onClick={handleGoToDashboard} className="gap-2">
            Go to School Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
