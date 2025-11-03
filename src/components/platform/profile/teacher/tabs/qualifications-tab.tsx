/**
 * Teacher Profile Qualifications Tab
 * Educational background, certifications, and professional development
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  MapPin,
  Download,
  ChevronRight,
  Plus,
  Edit,
  ExternalLink,
  Shield,
  Star,
  Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { TeacherProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface QualificationsTabProps {
  profile: TeacherProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  isOwner?: boolean
  className?: string
}

interface Certification {
  id: string
  name: string
  issuer: string
  issueDate: Date
  expiryDate?: Date
  credentialId?: string
  url?: string
  type: 'professional' | 'technical' | 'teaching' | 'language'
  status: 'active' | 'expired' | 'pending'
}

interface Training {
  id: string
  title: string
  provider: string
  completedDate: Date
  hours: number
  type: 'workshop' | 'course' | 'seminar' | 'conference'
  credits?: number
  certificate?: boolean
}

interface Award {
  id: string
  title: string
  issuer: string
  year: number
  description?: string
  category: 'teaching' | 'research' | 'service' | 'leadership'
}

// ============================================================================
// Mock Data
// ============================================================================

const mockCertifications: Certification[] = [
  {
    id: 'cert-1',
    name: 'Certified Computer Science Educator',
    issuer: 'International Society for Technology in Education',
    issueDate: new Date('2022-06-15'),
    expiryDate: new Date('2025-06-15'),
    credentialId: 'ISTE-2022-12345',
    url: 'https://verify.iste.org/12345',
    type: 'teaching',
    status: 'active'
  },
  {
    id: 'cert-2',
    name: 'AWS Certified Solutions Architect',
    issuer: 'Amazon Web Services',
    issueDate: new Date('2023-03-10'),
    expiryDate: new Date('2026-03-10'),
    credentialId: 'AWS-SAA-67890',
    url: 'https://aws.amazon.com/verification',
    type: 'technical',
    status: 'active'
  },
  {
    id: 'cert-3',
    name: 'Microsoft Certified: Azure Developer',
    issuer: 'Microsoft',
    issueDate: new Date('2022-11-20'),
    expiryDate: new Date('2024-11-20'),
    credentialId: 'MS-AZ204-11111',
    type: 'technical',
    status: 'active'
  },
  {
    id: 'cert-4',
    name: 'Google Cloud Professional',
    issuer: 'Google',
    issueDate: new Date('2021-09-01'),
    expiryDate: new Date('2023-09-01'),
    type: 'technical',
    status: 'expired'
  }
]

const mockTraining: Training[] = [
  {
    id: 'train-1',
    title: 'Advanced Machine Learning Techniques',
    provider: 'Stanford Online',
    completedDate: new Date('2024-01-15'),
    hours: 40,
    type: 'course',
    credits: 3,
    certificate: true
  },
  {
    id: 'train-2',
    title: 'Innovative Teaching Methods Workshop',
    provider: 'Harvard Graduate School of Education',
    completedDate: new Date('2023-08-20'),
    hours: 16,
    type: 'workshop',
    certificate: true
  },
  {
    id: 'train-3',
    title: 'AI in Education Conference 2024',
    provider: 'EdTech Global',
    completedDate: new Date('2024-02-10'),
    hours: 24,
    type: 'conference'
  }
]

const mockAwards: Award[] = [
  {
    id: 'award-1',
    title: 'Excellence in Teaching Award',
    issuer: 'Hogwarts School',
    year: 2023,
    description: 'Recognized for outstanding contribution to student learning and innovative teaching methods',
    category: 'teaching'
  },
  {
    id: 'award-2',
    title: 'Best Research Paper Award',
    issuer: 'IEEE Education Society',
    year: 2022,
    description: 'For paper on "Machine Learning in Adaptive Education Systems"',
    category: 'research'
  },
  {
    id: 'award-3',
    title: 'Community Service Excellence',
    issuer: 'City Education Board',
    year: 2021,
    description: 'Leading STEM outreach programs for underprivileged students',
    category: 'service'
  }
]

// ============================================================================
// Component
// ============================================================================

export function QualificationsTab({
  profile,
  dictionary,
  lang = 'en',
  isOwner = false,
  className
}: QualificationsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'education' | 'certifications' | 'training' | 'awards'>('all')

  const { teacher } = profile
  const qualifications = teacher.qualifications || []
  const experience = teacher.experience || []

  // Calculate professional development hours
  const totalTrainingHours = mockTraining.reduce((sum, t) => sum + t.hours, 0)
  const currentYearHours = mockTraining
    .filter(t => t.completedDate.getFullYear() === new Date().getFullYear())
    .reduce((sum, t) => sum + t.hours, 0)

  // Count active certifications
  const activeCertifications = mockCertifications.filter(c => c.status === 'active').length
  const expiringCertifications = mockCertifications.filter(c => {
    if (!c.expiryDate || c.status !== 'active') return false
    const monthsUntilExpiry = (c.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
    return monthsUntilExpiry <= 3
  }).length

  const getCertificationTypeIcon = (type: Certification['type']) => {
    switch (type) {
      case 'professional': return <Shield className="h-3 w-3" />
      case 'technical': return <BookOpen className="h-3 w-3" />
      case 'teaching': return <GraduationCap className="h-3 w-3" />
      case 'language': return <BookOpen className="h-3 w-3" />
      default: return <Award className="h-3 w-3" />
    }
  }

  const getAwardCategoryIcon = (category: Award['category']) => {
    switch (category) {
      case 'teaching': return <GraduationCap className="h-3 w-3" />
      case 'research': return <BookOpen className="h-3 w-3" />
      case 'service': return <Star className="h-3 w-3" />
      case 'leadership': return <Trophy className="h-3 w-3" />
      default: return <Award className="h-3 w-3" />
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <GraduationCap className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{qualifications.length}</p>
                <p className="text-xs text-muted-foreground">Degrees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Award className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCertifications}</p>
                <p className="text-xs text-muted-foreground">Active Certifications</p>
                {expiringCertifications > 0 && (
                  <Badge variant="destructive" className="text-xs mt-1">
                    {expiringCertifications} expiring soon
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BookOpen className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentYearHours}</p>
                <p className="text-xs text-muted-foreground">Training Hours (This Year)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Trophy className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAwards.length}</p>
                <p className="text-xs text-muted-foreground">Awards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All
        </Button>
        <Button
          variant={selectedCategory === 'education' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('education')}
        >
          Education
        </Button>
        <Button
          variant={selectedCategory === 'certifications' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('certifications')}
        >
          Certifications
        </Button>
        <Button
          variant={selectedCategory === 'training' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('training')}
        >
          Training
        </Button>
        <Button
          variant={selectedCategory === 'awards' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('awards')}
        >
          Awards
        </Button>
      </div>

      {/* Educational Background */}
      {(selectedCategory === 'all' || selectedCategory === 'education') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Educational Background
              </span>
              {isOwner && (
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Degree
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {qualifications.map((qual, index) => (
              <div key={qual.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{qual.qualificationType}</h4>
                    <p className="text-sm text-muted-foreground">{qual.institution}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {qual.dateObtained ? new Date(qual.dateObtained).getFullYear() : 'N/A'}
                      </span>
                      {qual.major && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {qual.major}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Professional Experience */}
      {(selectedCategory === 'all' || selectedCategory === 'education') && experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Professional Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {experience.map((exp, index) => (
              <div key={exp.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{exp.position}</h4>
                    <p className="text-sm text-muted-foreground">{exp.institution}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {format(exp.startDate, 'MMM yyyy')} - {exp.endDate ? format(exp.endDate, 'MMM yyyy') : 'Present'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {exp.endDate
                          ? `${Math.floor((exp.endDate.getTime() - exp.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365))} years`
                          : `${Math.floor((Date.now() - exp.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365))} years`
                        }
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-sm mt-2 text-muted-foreground">{exp.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {(selectedCategory === 'all' || selectedCategory === 'certifications') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Professional Certifications
              </span>
              {isOwner && (
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Certification
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockCertifications.map((cert) => (
              <div
                key={cert.id}
                className={cn(
                  'border rounded-lg p-4 hover:bg-muted/50 transition-colors',
                  cert.status === 'expired' && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{cert.name}</h4>
                      {getCertificationTypeIcon(cert.type)}
                      <Badge
                        variant={cert.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {cert.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Issued: {format(cert.issueDate, 'MMM yyyy')}</span>
                      {cert.expiryDate && (
                        <span>Expires: {format(cert.expiryDate, 'MMM yyyy')}</span>
                      )}
                      {cert.credentialId && (
                        <span>ID: {cert.credentialId}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cert.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={cert.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {isOwner && (
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Professional Development */}
      {(selectedCategory === 'all' || selectedCategory === 'training') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Professional Development
              </span>
              <Badge variant="secondary">
                {totalTrainingHours} total hours
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Annual Progress */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Annual Training Goal</span>
                <span className="font-medium">{currentYearHours}/40 hours</span>
              </div>
              <Progress value={(currentYearHours / 40) * 100} className="h-2" />
            </div>

            {/* Training List */}
            {mockTraining.map((training) => (
              <div key={training.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{training.title}</h4>
                      {training.certificate && (
                        <Badge variant="secondary" className="text-xs">
                          Certified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{training.provider}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{format(training.completedDate, 'MMM dd, yyyy')}</span>
                      <span>{training.hours} hours</span>
                      {training.credits && <span>{training.credits} credits</span>}
                      <Badge variant="outline" className="text-xs">
                        {training.type}
                      </Badge>
                    </div>
                  </div>
                  {training.certificate && (
                    <Button variant="ghost" size="sm">
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" className="w-full">
              View All Training
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Awards & Recognition */}
      {(selectedCategory === 'all' || selectedCategory === 'awards') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Awards & Recognition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockAwards.map((award) => (
              <div key={award.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    {getAwardCategoryIcon(award.category)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{award.title}</h4>
                    <p className="text-sm text-muted-foreground">{award.issuer}</p>
                    {award.description && (
                      <p className="text-sm mt-2 text-muted-foreground">{award.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {award.year}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {award.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}