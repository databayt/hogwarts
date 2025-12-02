/**
 * Staff Reports Tab Component
 * Displays generated reports, analytics, and documentation
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { StaffProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { FileText, Download, Eye, Share2, Calendar, Clock, TrendingUp, ListFilter, Search, ChevronRight, FileSpreadsheet, FileCheck, CircleAlert, CircleCheckBig, CircleX, RefreshCw, Archive, Trash2, Send } from "lucide-react"
import { PieChart, BarChart3 } from "lucide-react"
import { format } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

interface ReportsTabProps {
  profile: any // Cast to any to support mock data properties
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  isOwner?: boolean
}

interface Report {
  id: string
  title: string
  type: 'financial' | 'attendance' | 'performance' | 'compliance' | 'custom'
  category: string
  status: 'draft' | 'processing' | 'completed' | 'failed' | 'archived'
  format: 'pdf' | 'excel' | 'csv' | 'json'
  size: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  department: string
  tags: string[]
  downloads: number
  shares: number
  lastViewed?: Date
  processingTime?: number
  error?: string
  recipients?: string[]
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  lastRun?: Date
  nextRun?: Date
  isActive: boolean
  parameters: {
    [key: string]: any
  }
}

interface ReportSchedule {
  id: string
  reportId: string
  reportName: string
  frequency: string
  nextRun: Date
  lastRun?: Date
  status: 'active' | 'paused' | 'completed'
  recipients: string[]
}

// Mock data
const mockReports: Report[] = [
  {
    id: '1',
    title: 'Monthly Financial Report - March 2024',
    type: 'financial',
    category: 'Finance',
    status: 'completed',
    format: 'pdf',
    size: '2.4 MB',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdBy: 'Michael Anderson',
    department: 'Finance & Administration',
    tags: ['monthly', 'finance', 'board-meeting'],
    downloads: 12,
    shares: 5,
    lastViewed: new Date(Date.now() - 3 * 60 * 60 * 1000),
    processingTime: 45,
    recipients: ['board@school.edu', 'principal@school.edu']
  },
  {
    id: '2',
    title: 'Staff Attendance Summary - Q1 2024',
    type: 'attendance',
    category: 'HR',
    status: 'completed',
    format: 'excel',
    size: '856 KB',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdBy: 'Michael Anderson',
    department: 'Human Resources',
    tags: ['quarterly', 'attendance', 'staff'],
    downloads: 8,
    shares: 3,
    processingTime: 23
  },
  {
    id: '3',
    title: 'Budget Compliance Report - February 2024',
    type: 'compliance',
    category: 'Compliance',
    status: 'processing',
    format: 'pdf',
    size: '-',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(),
    createdBy: 'Michael Anderson',
    department: 'Finance & Administration',
    tags: ['compliance', 'budget', 'monthly'],
    downloads: 0,
    shares: 0,
    processingTime: 15
  },
  {
    id: '4',
    title: 'Department Performance Analysis',
    type: 'performance',
    category: 'Analytics',
    status: 'failed',
    format: 'pdf',
    size: '-',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: 'Michael Anderson',
    department: 'Administration',
    tags: ['performance', 'departments'],
    downloads: 0,
    shares: 0,
    error: 'Insufficient data for Q3 metrics'
  }
]

const mockTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Monthly Financial Summary',
    description: 'Comprehensive financial overview including revenue, expenses, and budget variance',
    type: 'financial',
    frequency: 'monthly',
    lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    isActive: true,
    parameters: {
      includeBudget: true,
      includeForecasts: true,
      departments: ['all']
    }
  },
  {
    id: '2',
    name: 'Staff Attendance Report',
    description: 'Weekly attendance summary for all staff members',
    type: 'attendance',
    frequency: 'weekly',
    lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isActive: true,
    parameters: {
      includeLeave: true,
      includeOvertime: true
    }
  },
  {
    id: '3',
    name: 'Quarterly Compliance Check',
    description: 'Regulatory compliance verification across all departments',
    type: 'compliance',
    frequency: 'quarterly',
    isActive: false,
    parameters: {
      regulations: ['FERPA', 'State Education Code'],
      auditLevel: 'detailed'
    }
  }
]

const mockSchedules: ReportSchedule[] = [
  {
    id: '1',
    reportId: '1',
    reportName: 'Monthly Financial Summary',
    frequency: 'Every month on the 5th',
    nextRun: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'active',
    recipients: ['board@school.edu', 'finance@school.edu']
  },
  {
    id: '2',
    reportId: '2',
    reportName: 'Weekly Attendance Report',
    frequency: 'Every Friday at 5:00 PM',
    nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    lastRun: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    status: 'active',
    recipients: ['hr@school.edu', 'principal@school.edu']
  }
]

// ============================================================================
// Component
// ============================================================================

export function ReportsTab({
  profile,
  dictionary,
  lang = 'en',
  isOwner = false
}: ReportsTabProps) {
  const [activeTab, setActiveTab] = useState('generated')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Filter reports
  const filteredReports = mockReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === 'all' || report.type === filterType
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'processing':
        return 'text-blue-600 bg-blue-50'
      case 'draft':
        return 'text-gray-600 bg-gray-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'archived':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getFormatIcon = (format: Report['format']) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />
      case 'excel':
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />
      case 'json':
        return <FileCheck className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'completed':
        return <CircleCheckBig className="h-4 w-4" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'failed':
        return <CircleX className="h-4 w-4" />
      case 'archived':
        return <Archive className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.workMetrics?.reportsGenerated || 48}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockTemplates.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockTemplates.length} total templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scheduled Reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSchedules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Next run in 3 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processing Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32s</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average generation time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generated">Generated Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="generated" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report History</CardTitle>
                {isOwner && (
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Reports List */}
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex gap-4 flex-1">
                      <div className="mt-1">
                        {getFormatIcon(report.format)}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{report.title}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{report.category}</span>
                              <span>•</span>
                              <span>{format(report.createdAt, 'MMM dd, yyyy')}</span>
                              {report.processingTime && (
                                <>
                                  <span>•</span>
                                  <span>{report.processingTime}s</span>
                                </>
                              )}
                              {report.size !== '-' && (
                                <>
                                  <span>•</span>
                                  <span>{report.size}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn(getStatusColor(report.status))}>
                              {getStatusIcon(report.status)}
                              <span className="ml-1">{report.status}</span>
                            </Badge>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {report.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Error Message */}
                        {report.error && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 text-red-600 rounded text-sm">
                            <CircleAlert className="h-4 w-4 flex-shrink-0" />
                            <span>{report.error}</span>
                          </div>
                        )}

                        {/* Actions and Stats */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {report.downloads > 0 && (
                              <span className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                {report.downloads}
                              </span>
                            )}
                            {report.shares > 0 && (
                              <span className="flex items-center gap-1">
                                <Share2 className="h-3 w-3" />
                                {report.shares}
                              </span>
                            )}
                            {report.lastViewed && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Viewed {format(report.lastViewed, 'h:mm a')}
                              </span>
                            )}
                          </div>
                          {report.status === 'completed' && (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Share2 className="h-4 w-4" />
                              </Button>
                              {isOwner && (
                                <Button size="sm" variant="ghost">
                                  <Archive className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report Templates</CardTitle>
                {isOwner && (
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                )}
              </div>
              <CardDescription>
                Reusable templates for generating reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium flex items-center gap-2">
                        {template.name}
                        {template.isActive ? (
                          <Badge className="bg-green-50 text-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.frequency}
                        </span>
                        {template.lastRun && (
                          <span>Last run: {format(template.lastRun, 'MMM dd, yyyy')}</span>
                        )}
                        {template.nextRun && (
                          <span>Next run: {format(template.nextRun, 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm">
                          Run Now
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Automated report generation schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        {schedule.reportName}
                        <Badge className={cn(
                          schedule.status === 'active'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-50 text-gray-600'
                        )}>
                          {schedule.status}
                        </Badge>
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {schedule.frequency}
                        </span>
                        <span>Next: {format(schedule.nextRun, 'MMM dd, h:mm a')}</span>
                        {schedule.lastRun && (
                          <span>Last: {format(schedule.lastRun, 'MMM dd, h:mm a')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Send className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Recipients: {schedule.recipients.join(', ')}
                        </span>
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost">
                          {schedule.status === 'active' ? 'Pause' : 'Resume'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}