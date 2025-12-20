"use client"

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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
        {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
      </Badge>
    )
  }

  const getStatusBadge = (isActive?: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Building2 className="text-primary h-6 w-6" />
              </div>
              <div>
                <h4 className="text-gray-900">{school.name}</h4>
                <p className="text-gray-500">{subdomain}.databayt.org</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
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
          <h1 className="mb-4 text-gray-900">Welcome to {school.name}</h1>
          <p className="lead mx-auto max-w-3xl text-gray-600">
            Your comprehensive school management portal is ready. Access student
            records, manage classes, track attendance, and more all in one
            place.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Students</CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <h3>{school.maxStudents || "Unlimited"}</h3>
              <p className="muted">Maximum student capacity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Teachers</CardTitle>
              <BookOpen className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <h3>{school.maxTeachers || "Unlimited"}</h3>
              <p className="muted">Maximum teacher capacity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Timezone</CardTitle>
              <Clock className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <h3>{school.timezone || "UTC"}</h3>
              <p className="muted">School timezone</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Access Your Portal</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600">
                Log in to access your school's dashboard, manage students,
                create classes, and view reports.
              </p>
              <Button className="w-full" asChild>
                <Link href="/login">
                  Login to Portal
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Get Started</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600">
                New to the platform? Complete your school setup, add your first
                students, and configure your classes.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/onboarding">
                  Complete Setup
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* School Info */}
        {school.address || school.phoneNumber || school.email ? (
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {school.address && (
                  <div>
                    <h5 className="mb-1 text-gray-900">Address</h5>
                    <p className="text-gray-600">{school.address}</p>
                  </div>
                )}
                {school.phoneNumber && (
                  <div>
                    <h5 className="mb-1 text-gray-900">Phone</h5>
                    <p className="text-gray-600">{school.phoneNumber}</p>
                  </div>
                )}
                {school.email && (
                  <div>
                    <h5 className="mb-1 text-gray-900">Email</h5>
                    <p className="text-gray-600">{school.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Powered by Databayt - School Management Platform</p>
          <p className="muted mt-1">
            Created on{" "}
            {school.createdAt
              ? new Date(school.createdAt).toLocaleDateString()
              : "Recently"}
          </p>
        </div>
      </div>
    </div>
  )
}
