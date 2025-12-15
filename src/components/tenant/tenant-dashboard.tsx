"use client"

import React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  GraduationCap,
  Plus,
  Settings,
  Users,
} from "lucide-react"

import { getCurrentTimeInTimezone } from "@/lib/timezone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTimezoneDisplayName } from "@/components/platform/settings/validation"

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

interface TenantDashboardProps {
  school: School
  subdomain: string
}

export default function TenantDashboard({
  school,
  subdomain,
}: TenantDashboardProps) {
  const [currentTime, setCurrentTime] = React.useState("")

  // Update current time in school timezone
  React.useEffect(() => {
    const updateTime = () => {
      const timezone = school.timezone || "Africa/Khartoum"
      setCurrentTime(getCurrentTimeInTimezone(timezone))
    }

    updateTime() // Initial update
    const interval = setInterval(updateTime, 1000) // Update every second

    return () => clearInterval(interval)
  }, [school.timezone])

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

  const quickActions = [
    {
      title: "Add Student",
      description: "Register a new student",
      icon: Users,
      href: "/students/new",
      color: "bg-blue-500",
    },
    {
      title: "Create Class",
      description: "Set up a new class",
      icon: BookOpen,
      href: "/classes/new",
      color: "bg-green-500",
    },
    {
      title: "Schedule Lesson",
      description: "Plan a new lesson",
      icon: Calendar,
      href: "/lessons/new",
      color: "bg-purple-500",
    },
    {
      title: "View Attendance",
      description: "Check student attendance",
      icon: GraduationCap,
      href: "/attendance",
      color: "bg-orange-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Building2 className="text-primary h-6 w-6" />
              </div>
              <div>
                <h4>{school.name}</h4>
                <p className="muted">Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Settings className="me-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="mb-2">Welcome back to {school.name}</h2>
          <p className="text-muted-foreground">
            Manage your school operations, students, and classes from your
            dashboard.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Total Students</CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <h3>0</h3>
              <p className="muted">of {school.maxStudents || "∞"} max</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Total Teachers</CardTitle>
              <BookOpen className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <h3>0</h3>
              <p className="muted">of {school.maxTeachers || "∞"} max</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Active Classes</CardTitle>
              <GraduationCap className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <h3>0</h3>
              <p className="muted">Classes running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Timezone</CardTitle>
              <Clock className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <h3>
                  {getTimezoneDisplayName(school.timezone || "Africa/Khartoum")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Current time: <span className="font-mono">{currentTime}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div
                    className={`h-12 w-12 ${action.color} mb-3 flex items-center justify-center rounded-lg`}
                  >
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{action.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="muted mb-3 text-gray-600">
                    {action.description}
                  </p>
                  <Button size="sm" className="w-full" asChild>
                    <Link href={action.href}>
                      <Plus className="me-2 h-4 w-4" />
                      {action.title}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h3 className="mb-4">Recent Activity</h3>
          <Card>
            <CardContent className="pt-6">
              <div className="text-muted-foreground py-8 text-center">
                <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h5>No recent activity</h5>
                <p className="muted">
                  Start by adding students and creating classes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* School Info */}
        <div className="mb-8">
          <h3 className="mb-4">School Information</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="muted">School Name</label>
                  <p>{school.name}</p>
                </div>
                <div>
                  <label className="muted">Subdomain</label>
                  <p>{subdomain}.databayt.org</p>
                </div>
                <div>
                  <label className="muted">Plan</label>
                  <div className="mt-1">{getPlanBadge(school.planType)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {school.email && (
                  <div>
                    <label className="muted">Email</label>
                    <p>{school.email}</p>
                  </div>
                )}
                {school.phoneNumber && (
                  <div>
                    <label className="muted">Phone</label>
                    <p>{school.phoneNumber}</p>
                  </div>
                )}
                {school.address && (
                  <div>
                    <label className="muted">Address</label>
                    <p>{school.address}</p>
                  </div>
                )}
                {!school.email && !school.phoneNumber && !school.address && (
                  <p className="muted">No contact information added yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mb-8">
          <h3 className="mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/students">
                <Users className="me-3 h-5 w-5" />
                <div className="text-start">
                  <h5>Students</h5>
                  <p className="muted text-gray-500">Manage student records</p>
                </div>
                <ArrowRight className="ms-auto h-4 w-4" />
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/teachers">
                <BookOpen className="me-3 h-5 w-5" />
                <div className="text-start">
                  <h5>Teachers</h5>
                  <p className="muted text-gray-500">Manage teacher accounts</p>
                </div>
                <ArrowRight className="ms-auto h-4 w-4" />
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/classes">
                <GraduationCap className="me-3 h-5 w-5" />
                <div className="text-start">
                  <h5>Classes</h5>
                  <p className="muted text-gray-500">Manage class schedules</p>
                </div>
                <ArrowRight className="ms-auto h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
