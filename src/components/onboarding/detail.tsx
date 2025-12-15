"use client"

import React from "react"
import {
  Building,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

import type { OnboardingProgress, OnboardingSchoolData } from "./types"
import { formatCapacity, formatCurrency, formatSchoolType } from "./util"

interface SchoolDetailProps {
  school: OnboardingSchoolData
  progress?: OnboardingProgress
  onEdit?: () => void
  onContinueSetup?: () => void
  showActions?: boolean
}

export default function SchoolDetail({
  school,
  progress,
  onEdit,
  onContinueSetup,
  showActions = true,
}: SchoolDetailProps) {
  const isCompleted = progress && progress.completionPercentage >= 100
  const canContinue = progress && progress.nextStep

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <h1>{school.name || "Unnamed School"}</h1>
            {school.isPublished ? (
              <Badge variant="default">Published</Badge>
            ) : (
              <Badge variant="secondary">Draft</Badge>
            )}
          </div>
          {school.description && (
            <p className="text-muted-foreground lead mb-4">
              {school.description}
            </p>
          )}
          {school.website && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="me-2 h-4 w-4" />
                Visit Website
              </a>
            </Button>
          )}
        </div>
        {showActions && (
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="me-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {onContinueSetup && canContinue && !isCompleted && (
              <Button onClick={onContinueSetup}>Continue Setup</Button>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle className="text-chart-2 h-5 w-5" />
              ) : (
                <Clock className="text-chart-1 h-5 w-5" />
              )}
              Setup Progress
            </CardTitle>
            <CardDescription>
              {isCompleted
                ? "Your school setup is complete!"
                : `${progress.completionPercentage}% complete`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress.completionPercentage} className="mb-4" />
            {progress.nextStep && !isCompleted && (
              <div className="text-muted-foreground text-sm">
                Next step: {progress.nextStep.replace("-", " ")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  School Type
                </p>
                <p className="text-sm">
                  {school.schoolLevel && school.schoolType
                    ? formatSchoolType(school.schoolLevel, school.schoolType)
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Domain
                </p>
                <p className="font-mono text-sm">
                  {school.domain || "Not set"}
                </p>
              </div>
            </div>

            {school.address && (
              <div className="flex items-start gap-2">
                <MapPin className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="text-sm">{school.address}</p>
                  {(school.city || school.state) && (
                    <p className="text-muted-foreground text-sm">
                      {[school.city, school.state, school.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {(school.maxStudents || school.maxTeachers) && (
              <div className="flex items-center gap-2">
                <Users className="text-muted-foreground h-4 w-4" />
                <p className="text-sm">
                  {formatCapacity(
                    school.maxStudents || 0,
                    school.maxTeachers || 0
                  )}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground font-medium">Created</p>
                <p>
                  {school.createdAt
                    ? new Date(school.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">
                  Last Updated
                </p>
                <p>
                  {school.updatedAt
                    ? new Date(school.updatedAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Student Capacity
                </p>
                <p className="text-lg font-semibold">
                  {school.maxStudents || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Faculty Size
                </p>
                <p className="text-lg font-semibold">
                  {school.maxTeachers || "Not set"}
                </p>
              </div>
            </div>

            {school.maxClasses && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Classes
                </p>
                <p className="text-sm">{school.maxClasses} classes</p>
              </div>
            )}

            {school.maxFacilities && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Facilities
                </p>
                <p className="text-sm">{school.maxFacilities} facilities</p>
              </div>
            )}

            {school.schoolLevel && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Education Level
                </p>
                <Badge variant="outline">{school.schoolLevel}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information */}
        {(school.tuitionFee ||
          school.registrationFee ||
          school.applicationFee) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {school.tuitionFee && school.currency && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Annual Tuition
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(school.tuitionFee, school.currency)}
                  </p>
                  {school.paymentSchedule && (
                    <p className="text-muted-foreground text-sm">
                      Paid {school.paymentSchedule}
                    </p>
                  )}
                </div>
              )}

              {(school.registrationFee || school.applicationFee) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {school.registrationFee && school.currency && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Registration Fee
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(
                            school.registrationFee,
                            school.currency
                          )}
                        </span>
                      </div>
                    )}
                    {school.applicationFee && school.currency && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Application Fee
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(
                            school.applicationFee,
                            school.currency
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Branding & Design */}
        {(school.logo || school.primaryColor) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Branding & Design
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {school.logo && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    Logo
                  </p>
                  <div className="bg-muted h-16 w-16 overflow-hidden rounded-md border">
                    <img
                      src={school.logo}
                      alt="School logo"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                </div>
              )}

              {school.primaryColor && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    Primary Color
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: school.primaryColor }}
                    />
                    <span className="font-mono text-sm">
                      {school.primaryColor}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {school.borderRadius && (
                  <div>
                    <p className="text-muted-foreground font-medium">
                      Border Radius
                    </p>
                    <p>{school.borderRadius}</p>
                  </div>
                )}
                {school.shadow && (
                  <div>
                    <p className="text-muted-foreground font-medium">Shadow</p>
                    <p>{school.shadow}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
