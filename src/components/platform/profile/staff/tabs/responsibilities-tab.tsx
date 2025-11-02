/**
 * Staff Profile Responsibilities Tab
 * Role details, departmental duties, and committee work
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Briefcase,
  Shield,
  Users,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  FileText,
  Building,
  Award,
  TrendingUp,
  Calendar,
  BarChart3,
  ListChecks
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { StaffProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface ResponsibilitiesTabProps {
  profile: StaffProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  className?: string
}

interface DepartmentGoal {
  id: string
  title: string
  description: string
  progress: number
  deadline: Date
  status: 'on-track' | 'at-risk' | 'completed' | 'delayed'
  assignedTasks: number
  completedTasks: number
}

interface Committee {
  id: string
  name: string
  role: 'member' | 'secretary' | 'chair'
  meetingFrequency: string
  nextMeeting?: Date
  responsibilities: string[]
  activeProjects: number
}

interface Project {
  id: string
  name: string
  description: string
  startDate: Date
  endDate?: Date
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold'
  progress: number
  team: string[]
  role: string
}

interface ProcessOwnership {
  id: string
  processName: string
  category: 'financial' | 'administrative' | 'operational' | 'compliance'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  lastCompleted?: Date
  nextDue?: Date
  documentation?: string
  compliance: number
}

// ============================================================================
// Mock Data
// ============================================================================

const mockDepartmentGoals: DepartmentGoal[] = [
  {
    id: 'goal-1',
    title: 'Reduce Budget Variance to <5%',
    description: 'Improve budget forecasting accuracy and reduce variance between projected and actual expenses',
    progress: 75,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    status: 'on-track',
    assignedTasks: 12,
    completedTasks: 9
  },
  {
    id: 'goal-2',
    title: 'Digitize 100% of Financial Records',
    description: 'Complete transition from paper-based to digital financial record keeping system',
    progress: 60,
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    status: 'on-track',
    assignedTasks: 20,
    completedTasks: 12
  },
  {
    id: 'goal-3',
    title: 'Implement New Payroll System',
    description: 'Deploy and train staff on new automated payroll processing system',
    progress: 40,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    status: 'at-risk',
    assignedTasks: 15,
    completedTasks: 6
  }
]

const mockCommittees: Committee[] = [
  {
    id: 'comm-1',
    name: 'Finance Committee',
    role: 'member',
    meetingFrequency: 'Monthly',
    nextMeeting: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    responsibilities: [
      'Review monthly financial statements',
      'Approve budget allocations',
      'Monitor expense trends',
      'Provide financial recommendations'
    ],
    activeProjects: 3
  },
  {
    id: 'comm-2',
    name: 'Budget Planning Committee',
    role: 'secretary',
    meetingFrequency: 'Quarterly',
    nextMeeting: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    responsibilities: [
      'Document meeting minutes',
      'Track action items',
      'Prepare budget proposals',
      'Coordinate with department heads'
    ],
    activeProjects: 2
  },
  {
    id: 'comm-3',
    name: 'IT Committee',
    role: 'member',
    meetingFrequency: 'Bi-monthly',
    nextMeeting: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    responsibilities: [
      'Evaluate technology needs',
      'Review IT budget requests',
      'Support system implementations'
    ],
    activeProjects: 1
  }
]

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Financial System Upgrade',
    description: 'Upgrading the school financial management system to cloud-based solution',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    status: 'in-progress',
    progress: 45,
    team: ['Michael Anderson', 'Sarah Wilson', 'John Davis'],
    role: 'Project Lead'
  },
  {
    id: 'proj-2',
    name: 'Annual Budget Planning',
    description: 'Preparation of next academic year budget',
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'in-progress',
    progress: 30,
    team: ['Michael Anderson', 'Finance Team'],
    role: 'Coordinator'
  }
]

const mockProcesses: ProcessOwnership[] = [
  {
    id: 'proc-1',
    processName: 'Monthly Payroll Processing',
    category: 'financial',
    frequency: 'monthly',
    lastCompleted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    nextDue: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    documentation: 'Payroll Processing Manual v2.1',
    compliance: 100
  },
  {
    id: 'proc-2',
    processName: 'Expense Report Approval',
    category: 'financial',
    frequency: 'weekly',
    lastCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    nextDue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    compliance: 95
  },
  {
    id: 'proc-3',
    processName: 'Budget Variance Analysis',
    category: 'financial',
    frequency: 'monthly',
    lastCompleted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    nextDue: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    compliance: 98
  },
  {
    id: 'proc-4',
    processName: 'Vendor Invoice Processing',
    category: 'administrative',
    frequency: 'daily',
    lastCompleted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    nextDue: new Date(Date.now()),
    compliance: 100
  }
]

// ============================================================================
// Component
// ============================================================================

export function ResponsibilitiesTab({
  profile,
  dictionary,
  lang = 'en',
  className
}: ResponsibilitiesTabProps) {
  const [selectedView, setSelectedView] = useState<'primary' | 'committees' | 'projects' | 'processes'>('primary')

  const { responsibilities, staffInfo } = profile

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'on-track': return 'text-green-500'
      case 'in-progress': return 'text-blue-500'
      case 'at-risk': return 'text-yellow-500'
      case 'delayed': return 'text-red-500'
      case 'on-hold': return 'text-gray-500'
      default: return ''
    }
  }

  const getCategoryIcon = (category: ProcessOwnership['category']) => {
    switch (category) {
      case 'financial': return <TrendingUp className="h-4 w-4" />
      case 'administrative': return <FileText className="h-4 w-4" />
      case 'operational': return <Shield className="h-4 w-4" />
      case 'compliance': return <CheckCircle className="h-4 w-4" />
      default: return <Briefcase className="h-4 w-4" />
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Role Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Role Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Position</p>
              <p className="font-semibold">{staffInfo.designation}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-semibold">{staffInfo.department}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reports To</p>
              <p className="font-semibold">{staffInfo.reportingTo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role Type</p>
              <Badge variant="secondary">{staffInfo.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different responsibility views */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="primary">Primary Duties</TabsTrigger>
          <TabsTrigger value="committees">Committees</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
        </TabsList>

        <TabsContent value="primary" className="space-y-4">
          {/* Primary Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Primary Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {responsibilities.primary.map((resp, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p className="text-sm flex-1">{resp}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Secondary Responsibilities */}
          {responsibilities.secondary && responsibilities.secondary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Secondary Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {responsibilities.secondary.map((resp, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                    <p className="text-sm flex-1">{resp}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Department Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Department Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockDepartmentGoals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{goal.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                    </div>
                    <Badge
                      variant={goal.status === 'completed' ? 'default' : goal.status === 'at-risk' ? 'destructive' : 'secondary'}
                      className={cn("text-xs", getStatusColor(goal.status))}
                    >
                      {goal.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{goal.completedTasks}/{goal.assignedTasks} tasks completed</span>
                      <span>Due: {format(goal.deadline, 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="committees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Committee Memberships
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockCommittees.map((committee) => (
                <div key={committee.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{committee.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {committee.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Meets {committee.meetingFrequency}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {committee.activeProjects} active projects
                    </Badge>
                  </div>

                  {committee.nextMeeting && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">
                        Next meeting: {format(committee.nextMeeting, 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-2">Responsibilities</p>
                    <div className="space-y-1">
                      {committee.responsibilities.map((resp, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5" />
                          <p className="text-sm text-muted-foreground">{resp}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Active Projects
                </span>
                <Badge variant="secondary">
                  {mockProjects.filter(p => p.status === 'in-progress').length} active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockProjects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{project.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {project.role}
                        </Badge>
                        <Badge
                          variant={project.status === 'completed' ? 'default' : 'secondary'}
                          className={cn("text-xs", getStatusColor(project.status))}
                        >
                          {project.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{project.progress}%</p>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                  </div>

                  <Progress value={project.progress} className="h-2 mb-3" />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Start: {format(project.startDate, 'MMM dd, yyyy')}</span>
                    {project.endDate && (
                      <span>End: {format(project.endDate, 'MMM dd, yyyy')}</span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Team Members</p>
                    <div className="flex flex-wrap gap-1">
                      {project.team.map((member, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Process Ownership
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockProcesses.map((process) => (
                <div key={process.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg bg-muted",
                        process.category === 'financial' && "text-green-500",
                        process.category === 'administrative' && "text-blue-500",
                        process.category === 'operational' && "text-purple-500",
                        process.category === 'compliance' && "text-orange-500"
                      )}>
                        {getCategoryIcon(process.category)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{process.processName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {process.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {process.frequency}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{process.compliance}%</p>
                      <p className="text-xs text-muted-foreground">Compliance</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Last Completed</p>
                      <p className="font-medium">
                        {process.lastCompleted
                          ? format(process.lastCompleted, 'MMM dd, yyyy')
                          : 'Not yet completed'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Due</p>
                      <p className="font-medium">
                        {process.nextDue
                          ? format(process.nextDue, 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {process.documentation && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Documentation</span>
                        <Button variant="ghost" size="sm" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          {process.documentation}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}