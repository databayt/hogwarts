"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Calendar, 
  BookOpen,
  GraduationCap,
  Clock,
  Settings,
  Plus,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface School {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  timezone?: string;
  planType?: string;
  maxStudents?: number;
  maxTeachers?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TenantDashboardProps {
  school: School;
  subdomain: string;
}

export default function TenantDashboard({ school, subdomain }: TenantDashboardProps) {
  const getPlanBadge = (planType?: string) => {
    if (!planType) return null;
    
    const planColors = {
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={planColors[planType as keyof typeof planColors] || 'bg-gray-100 text-gray-800'}>
        {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
      </Badge>
    );
  };

  const quickActions = [
    {
      title: 'Add Student',
      description: 'Register a new student',
      icon: Users,
      href: '/students/new',
      color: 'bg-blue-500'
    },
    {
      title: 'Create Class',
      description: 'Set up a new class',
      icon: BookOpen,
      href: '/classes/new',
      color: 'bg-green-500'
    },
    {
      title: 'Schedule Lesson',
      description: 'Plan a new lesson',
      icon: Calendar,
      href: '/lessons/new',
      color: 'bg-purple-500'
    },
    {
      title: 'View Attendance',
      description: 'Check student attendance',
      icon: GraduationCap,
      href: '/attendance',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{school.name}</h1>
                <p className="text-sm text-gray-500">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back to {school.name}
          </h2>
          <p className="text-gray-600">
            Manage your school operations, students, and classes from your dashboard.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                of {school.maxStudents || '∞'} max
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                of {school.maxTeachers || '∞'} max
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Classes running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timezone</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{school.timezone || 'UTC'}</div>
              <p className="text-xs text-muted-foreground">
                School timezone
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                  <Button size="sm" className="w-full" asChild>
                    <Link href={action.href}>
                      <Plus className="w-4 h-4 mr-2" />
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500 py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No recent activity</p>
                <p className="text-sm">Start by adding students and creating classes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* School Info */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">School Name</label>
                  <p className="text-gray-900">{school.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subdomain</label>
                  <p className="text-gray-900">{subdomain}.databayt.org</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Plan</label>
                  <div className="mt-1">
                    {getPlanBadge(school.planType)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {school.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{school.email}</p>
                  </div>
                )}
                {school.phoneNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{school.phoneNumber}</p>
                  </div>
                )}
                {school.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{school.address}</p>
                  </div>
                )}
                {!school.email && !school.phoneNumber && !school.address && (
                  <p className="text-gray-500 text-sm">No contact information added yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link href="/students">
                <Users className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Students</div>
                  <div className="text-sm text-gray-500">Manage student records</div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </Button>

            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link href="/teachers">
                <BookOpen className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Teachers</div>
                  <div className="text-sm text-gray-500">Manage teacher accounts</div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </Button>

            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link href="/classes">
                <GraduationCap className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Classes</div>
                  <div className="text-sm text-gray-500">Manage class schedules</div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
