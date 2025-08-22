"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Calendar, 
  Globe, 
  ArrowRight,
  GraduationCap,
  BookOpen,
  Clock
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

interface TenantWelcomeProps {
  school: School;
  subdomain: string;
}

export default function TenantWelcome({ school, subdomain }: TenantWelcomeProps) {
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

  const getStatusBadge = (isActive?: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        Active
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800">
        Pending
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
                <p className="text-sm text-gray-500">{subdomain}.databayt.org</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to {school.name}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your comprehensive school management portal is ready. Access student records, 
            manage classes, track attendance, and more all in one place.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{school.maxStudents || 'Unlimited'}</div>
              <p className="text-xs text-muted-foreground">
                Maximum student capacity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{school.maxTeachers || 'Unlimited'}</div>
              <p className="text-xs text-muted-foreground">
                Maximum teacher capacity
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

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Access Your Portal</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Log in to access your school's dashboard, manage students, 
                create classes, and view reports.
              </p>
              <Button className="w-full" asChild>
                <Link href="/login">
                  Login to Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Get Started</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                New to the platform? Complete your school setup, 
                add your first students, and configure your classes.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/onboarding">
                  Complete Setup
                  <ArrowRight className="w-4 h-4 ml-2" />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {school.address && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Address</h4>
                    <p className="text-gray-600">{school.address}</p>
                  </div>
                )}
                {school.phoneNumber && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Phone</h4>
                    <p className="text-gray-600">{school.phoneNumber}</p>
                  </div>
                )}
                {school.email && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Email</h4>
                    <p className="text-gray-600">{school.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Powered by Databayt - School Management Platform</p>
          <p className="text-sm mt-1">
            Created on {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'Recently'}
          </p>
        </div>
      </div>
    </div>
  );
}
