"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  Globe,
  GraduationCap,
  Users,
} from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

interface School {
  id: string
  name: string
  domain: string
  logoUrl?: string | null
  address?: string | null
  phoneNumber?: string | null
  email?: string | null
  website?: string | null
  timezone?: string
  planType?: string
  maxStudents?: number
  maxTeachers?: number
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface TenantWelcomeProps {
  school: School
  subdomain: string
}

export default function TenantWelcome({
  school,
  subdomain,
}: TenantWelcomeProps) {
  const { locale } = useLocale()
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.tenant?.welcome

  const getPlanBadge = (planType?: string) => {
    if (!planType) return null

    const planColors = {
      basic: "bg-blue-100 text-blue-800",
      premium: "bg-purple-100 text-purple-800",
      enterprise: "bg-green-100 text-green-800",
    }

    return (
      <Badge
        className={
          planColors[planType as keyof typeof planColors] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {planType.charAt(0).toUpperCase() + planType.slice(1)}{" "}
        {t?.plan?.suffix || "Plan"}
      </Badge>
    )
  }

  const getStatusBadge = (isActive?: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        {t?.status?.active || "Active"}
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800">
        {t?.status?.pending || "Pending"}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Building2 className="text-primary h-6 w-6" />
              </div>
              <div>
                <h4 className="text-gray-900">{school.name}</h4>
                <p className="text-gray-500">{subdomain}.databayt.org</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getStatusBadge(school.isActive)}
              {getPlanBadge(school.planType)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="bg-primary/10 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full">
            <GraduationCap className="text-primary h-12 w-12" />
          </div>
          <h1 className="mb-4 text-gray-900">
            {t?.title || "Welcome to"} {school.name}
          </h1>
          <p className="lead mx-auto max-w-3xl text-gray-600">
            {t?.portalDescription ||
              "Your comprehensive school management portal is ready. Access student records, manage classes, track attendance, and more all in one place."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{t?.stats?.students || "Students"}</CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <h3>
                {school.maxStudents || t?.stats?.unlimited || "Unlimited"}
              </h3>
              <p className="muted">
                {t?.stats?.maxStudentCapacity || "Maximum student capacity"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{t?.stats?.teachers || "Teachers"}</CardTitle>
              <BookOpen className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <h3>
                {school.maxTeachers || t?.stats?.unlimited || "Unlimited"}
              </h3>
              <p className="muted">
                {t?.stats?.maxTeacherCapacity || "Maximum teacher capacity"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{t?.stats?.timezone || "Timezone"}</CardTitle>
              <Clock className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <h3>{school.timezone || "UTC"}</h3>
              <p className="muted">
                {t?.stats?.schoolTimezone || "School timezone"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <span>{t?.accessPortal?.title || "Access Your Portal"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600">
                {t?.accessPortal?.description ||
                  "Log in to access your school's dashboard, manage students, create classes, and view reports."}
              </p>
              <Button className="w-full" asChild>
                <Link href={`/${locale}/login`}>
                  {t?.accessPortal?.loginButton || "Login to Portal"}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{t?.getStarted?.title || "Get Started"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600">
                {t?.getStarted?.description ||
                  "New to the platform? Complete your school setup, add your first students, and configure your classes."}
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/${locale}/onboarding`}>
                  {t?.getStarted?.setupButton || "Complete Setup"}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* School Info */}
        {school.address || school.phoneNumber || school.email ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {t?.schoolInfo?.title || "School Information"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {school.address && (
                  <div>
                    <h5 className="mb-1 text-gray-900">
                      {t?.schoolInfo?.address || "Address"}
                    </h5>
                    <p className="text-gray-600">{school.address}</p>
                  </div>
                )}
                {school.phoneNumber && (
                  <div>
                    <h5 className="mb-1 text-gray-900">
                      {t?.schoolInfo?.phone || "Phone"}
                    </h5>
                    <p className="text-gray-600">{school.phoneNumber}</p>
                  </div>
                )}
                {school.email && (
                  <div>
                    <h5 className="mb-1 text-gray-900">
                      {t?.schoolInfo?.email || "Email"}
                    </h5>
                    <p className="text-gray-600">{school.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>
            {t?.footer?.poweredBy ||
              "Powered by Databayt - School Management Platform"}
          </p>
          <p className="muted mt-1">
            {t?.footer?.createdOn || "Created on"}{" "}
            {school.createdAt
              ? formatDate(school.createdAt, locale)
              : t?.footer?.recently || "Recently"}
          </p>
        </div>
      </div>
    </div>
  )
}
