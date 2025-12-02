/**
 * Student Directory Component
 * Browse and search all student profiles
 */

'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Search, ListFilter, User, Mail, Phone, MapPin, GraduationCap, Calendar, LayoutGrid, List, ChevronRight, BookOpen, Trophy, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { format } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

interface StudentDirectoryContentProps {
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
}

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  avatar?: string
  grade: string
  class: string
  section: string
  rollNumber: string
  guardianName: string
  guardianPhone: string
  academicPerformance: 'excellent' | 'good' | 'average' | 'needs-improvement'
  attendance: number
  gpa: number
  trend: 'up' | 'down' | 'stable'
  status: 'active' | 'inactive' | 'suspended' | 'graduated'
  joinDate: Date
  achievements: number
  activities: string[]
}

// Mock data
const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@school.edu',
    studentId: 'STU2022001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    grade: 'Grade 10',
    class: '10A',
    section: 'Science',
    rollNumber: '10A-15',
    guardianName: 'Robert Johnson',
    guardianPhone: '+1 234 567 8901',
    academicPerformance: 'excellent',
    attendance: 95,
    gpa: 3.8,
    trend: 'up',
    status: 'active',
    joinDate: new Date('2022-09-01'),
    achievements: 12,
    activities: ['Basketball', 'Science Club', 'Debate Team']
  },
  {
    id: '2',
    name: 'Emma Wilson',
    email: 'emma.wilson@school.edu',
    studentId: 'STU2021003',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    grade: 'Grade 11',
    class: '11B',
    section: 'Commerce',
    rollNumber: '11B-08',
    guardianName: 'Sarah Wilson',
    guardianPhone: '+1 234 567 8902',
    academicPerformance: 'good',
    attendance: 88,
    gpa: 3.4,
    trend: 'stable',
    status: 'active',
    joinDate: new Date('2021-09-01'),
    achievements: 8,
    activities: ['Art Club', 'Music Band']
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael.chen@school.edu',
    studentId: 'STU2020005',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    grade: 'Grade 12',
    class: '12A',
    section: 'Science',
    rollNumber: '12A-03',
    guardianName: 'David Chen',
    guardianPhone: '+1 234 567 8903',
    academicPerformance: 'excellent',
    attendance: 98,
    gpa: 3.9,
    trend: 'up',
    status: 'active',
    joinDate: new Date('2020-09-01'),
    achievements: 15,
    activities: ['Chess Club', 'Math Olympics', 'Student Council']
  },
  {
    id: '4',
    name: 'Sophia Brown',
    email: 'sophia.brown@school.edu',
    studentId: 'STU2022007',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
    grade: 'Grade 9',
    class: '9C',
    section: 'Arts',
    rollNumber: '9C-21',
    guardianName: 'Jennifer Brown',
    guardianPhone: '+1 234 567 8904',
    academicPerformance: 'average',
    attendance: 82,
    gpa: 3.0,
    trend: 'down',
    status: 'active',
    joinDate: new Date('2022-09-01'),
    achievements: 5,
    activities: ['Drama Club', 'Photography']
  },
  {
    id: '5',
    name: 'James Davis',
    email: 'james.davis@school.edu',
    studentId: 'STU2019002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    grade: 'Grade 12',
    class: '12B',
    section: 'Commerce',
    rollNumber: '12B-11',
    guardianName: 'Mark Davis',
    guardianPhone: '+1 234 567 8905',
    academicPerformance: 'good',
    attendance: 91,
    gpa: 3.5,
    trend: 'stable',
    status: 'active',
    joinDate: new Date('2019-09-01'),
    achievements: 10,
    activities: ['Football', 'Business Club', 'Volunteer Group']
  },
  {
    id: '6',
    name: 'Olivia Martinez',
    email: 'olivia.martinez@school.edu',
    studentId: 'STU2021009',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    grade: 'Grade 11',
    class: '11A',
    section: 'Science',
    rollNumber: '11A-17',
    guardianName: 'Carlos Martinez',
    guardianPhone: '+1 234 567 8906',
    academicPerformance: 'excellent',
    attendance: 96,
    gpa: 3.85,
    trend: 'up',
    status: 'active',
    joinDate: new Date('2021-09-01'),
    achievements: 14,
    activities: ['Robotics Club', 'Environmental Club', 'Tennis']
  }
]

// ============================================================================
// Component
// ============================================================================

export function StudentDirectoryContent({
  dictionary,
  lang = 'en'
}: StudentDirectoryContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [performanceFilter, setPerformanceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get unique values for filters
  const grades = useMemo(() => {
    const gradeSet = new Set(mockStudents.map(s => s.grade))
    return Array.from(gradeSet).sort()
  }, [])

  const classes = useMemo(() => {
    const classSet = new Set(mockStudents.map(s => s.class))
    return Array.from(classSet).sort()
  }, [])

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return mockStudents.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter
      const matchesClass = classFilter === 'all' || student.class === classFilter
      const matchesPerformance = performanceFilter === 'all' || student.academicPerformance === performanceFilter
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter
      return matchesSearch && matchesGrade && matchesClass && matchesPerformance && matchesStatus
    })
  }, [searchQuery, gradeFilter, classFilter, performanceFilter, statusFilter])

  const getPerformanceColor = (performance: Student['academicPerformance']) => {
    switch (performance) {
      case 'excellent':
        return 'bg-green-50 text-green-600'
      case 'good':
        return 'bg-blue-50 text-blue-600'
      case 'average':
        return 'bg-yellow-50 text-yellow-600'
      case 'needs-improvement':
        return 'bg-red-50 text-red-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-600'
      case 'inactive':
        return 'bg-gray-50 text-gray-600'
      case 'suspended':
        return 'bg-red-50 text-red-600'
      case 'graduated':
        return 'bg-purple-50 text-purple-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  const getTrendIcon = (trend: Student['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return <Minus className="h-3 w-3 text-gray-600" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Student Directory</h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage student profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, student ID, or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="needs-improvement">Needs Improvement</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredStudents.length} students found</span>
            {(searchQuery || gradeFilter !== 'all' || classFilter !== 'all' || performanceFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setGradeFilter('all')
                  setClassFilter('all')
                  setPerformanceFilter('all')
                  setStatusFilter('all')
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback>
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">{student.studentId}</p>
                    </div>
                  </div>
                  {getTrendIcon(student.trend)}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Class</span>
                    <span className="font-medium">{student.class} - {student.section}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Roll No</span>
                    <span className="font-medium">{student.rollNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">GPA</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{student.gpa.toFixed(2)}</span>
                      <Badge className={cn(getPerformanceColor(student.academicPerformance))}>
                        {student.academicPerformance.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Attendance</span>
                      <span className="font-medium">{student.attendance}%</span>
                    </div>
                    <Progress value={student.attendance} className="h-2" />
                  </div>
                </div>

                {/* Activities & Achievements */}
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    <span>{student.achievements}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{student.activities.length} activities</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={cn(getStatusColor(student.status))}>
                    {student.status}
                  </Badge>
                  <Link href={`/profile/${student.id}`}>
                    <Button size="sm" variant="ghost">
                      View
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Student</th>
                  <th className="text-left p-4 hidden md:table-cell">Class</th>
                  <th className="text-left p-4 hidden lg:table-cell">GPA</th>
                  <th className="text-left p-4 hidden lg:table-cell">Attendance</th>
                  <th className="text-left p-4 hidden xl:table-cell">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="border-b hover:bg-accent/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{student.name}</span>
                            {getTrendIcon(student.trend)}
                          </div>
                          <p className="text-sm text-muted-foreground">{student.studentId}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {student.class} - {student.section}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div>
                        <span className="text-sm">{student.class} - {student.section}</span>
                        <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{student.gpa.toFixed(2)}</span>
                        <Badge className={cn(getPerformanceColor(student.academicPerformance), 'text-xs')}>
                          {student.academicPerformance === 'needs-improvement' ? 'Needs Imp.' : student.academicPerformance}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="space-y-1">
                        <span className="text-sm">{student.attendance}%</span>
                        <Progress value={student.attendance} className="h-1.5 w-20" />
                      </div>
                    </td>
                    <td className="p-4 hidden xl:table-cell">
                      <Badge className={cn(getStatusColor(student.status))}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Link href={`/profile/students/${student.id}`}>
                        <Button size="sm" variant="ghost">
                          View Profile
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}