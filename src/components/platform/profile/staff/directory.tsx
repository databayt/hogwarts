/**
 * Staff Directory Component
 * Browse and search all staff profiles
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Search, ListFilter, User, Mail, Phone, MapPin, Briefcase, Calendar, LayoutGrid, List, ChevronRight, Building } from "lucide-react"
import { format } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

interface StaffDirectoryContentProps {
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
}

interface StaffMember {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  department: string
  designation: string
  role: 'ADMIN' | 'ACCOUNTANT' | 'STAFF'
  employeeId: string
  joiningDate: Date
  status: 'active' | 'inactive' | 'leave'
  location?: string
  isOnline?: boolean
}

// Mock data
const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'Michael Anderson',
    email: 'michael.anderson@school.edu',
    phone: '+1 234 567 8905',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    department: 'Finance & Administration',
    designation: 'Senior Administrative Officer',
    role: 'ACCOUNTANT',
    employeeId: 'EMP2016003',
    joiningDate: new Date('2016-03-15'),
    status: 'active',
    location: 'Admin Building, Room 204',
    isOnline: true
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@school.edu',
    phone: '+1 234 567 8906',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    department: 'Human Resources',
    designation: 'HR Manager',
    role: 'ADMIN',
    employeeId: 'EMP2018007',
    joiningDate: new Date('2018-07-20'),
    status: 'active',
    location: 'HR Office, Room 305',
    isOnline: true
  },
  {
    id: '3',
    name: 'David Wilson',
    email: 'david.wilson@school.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    department: 'Operations',
    designation: 'Operations Coordinator',
    role: 'STAFF',
    employeeId: 'EMP2020012',
    joiningDate: new Date('2020-01-10'),
    status: 'leave',
    location: 'Operations Center',
    isOnline: false
  },
  {
    id: '4',
    name: 'Emily Chen',
    email: 'emily.chen@school.edu',
    phone: '+1 234 567 8907',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    department: 'Finance & Administration',
    designation: 'Financial Analyst',
    role: 'ACCOUNTANT',
    employeeId: 'EMP2019009',
    joiningDate: new Date('2019-09-01'),
    status: 'active',
    location: 'Admin Building, Room 206',
    isOnline: false
  },
  {
    id: '5',
    name: 'Robert Brown',
    email: 'robert.brown@school.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    department: 'IT Services',
    designation: 'IT Support Specialist',
    role: 'STAFF',
    employeeId: 'EMP2021015',
    joiningDate: new Date('2021-02-15'),
    status: 'active',
    location: 'IT Department',
    isOnline: true
  },
  {
    id: '6',
    name: 'Lisa Martinez',
    email: 'lisa.martinez@school.edu',
    phone: '+1 234 567 8908',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    department: 'Administration',
    designation: 'Executive Assistant',
    role: 'ADMIN',
    employeeId: 'EMP2017005',
    joiningDate: new Date('2017-05-10'),
    status: 'active',
    location: 'Main Office',
    isOnline: true
  }
]

// ============================================================================
// Component
// ============================================================================

export function StaffDirectoryContent({
  dictionary,
  lang = 'en'
}: StaffDirectoryContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(mockStaff.map(s => s.department))
    return Array.from(depts).sort()
  }, [])

  // Filter staff based on search and filters
  const filteredStaff = useMemo(() => {
    return mockStaff.filter(staff => {
      const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDepartment = departmentFilter === 'all' || staff.department === departmentFilter
      const matchesRole = roleFilter === 'all' || staff.role === roleFilter
      const matchesStatus = statusFilter === 'all' || staff.status === statusFilter
      return matchesSearch && matchesDepartment && matchesRole && matchesStatus
    })
  }, [searchQuery, departmentFilter, roleFilter, statusFilter])

  const getStatusColor = (status: StaffMember['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-600'
      case 'inactive':
        return 'bg-gray-50 text-gray-600'
      case 'leave':
        return 'bg-yellow-50 text-yellow-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  const getRoleBadgeColor = (role: StaffMember['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-600'
      case 'ACCOUNTANT':
        return 'bg-blue-50 text-blue-600'
      case 'STAFF':
        return 'bg-gray-50 text-gray-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staff Directory</h1>
          <p className="text-muted-foreground mt-1">
            Browse and connect with staff members
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
              placeholder="Search by name, email, designation, or employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
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
                <SelectItem value="leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredStaff.length} staff members found</span>
            {(searchQuery || departmentFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setDepartmentFilter('all')
                  setRoleFilter('all')
                  setStatusFilter('all')
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map(staff => (
            <Card key={staff.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={staff.avatar} alt={staff.name} />
                      <AvatarFallback>
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{staff.name}</h3>
                      <p className="text-sm text-muted-foreground">{staff.employeeId}</p>
                    </div>
                  </div>
                  {staff.isOnline && (
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{staff.designation}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{staff.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{staff.email}</span>
                  </div>
                  {staff.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{staff.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={cn(getRoleBadgeColor(staff.role))}>
                      {staff.role.toLowerCase()}
                    </Badge>
                    <Badge className={cn(getStatusColor(staff.status))}>
                      {staff.status}
                    </Badge>
                  </div>
                  <Link href={`/profile/staff/${staff.id}`}>
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
                  <th className="text-left p-4">Staff Member</th>
                  <th className="text-left p-4 hidden md:table-cell">Department</th>
                  <th className="text-left p-4 hidden lg:table-cell">Role</th>
                  <th className="text-left p-4 hidden lg:table-cell">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(staff => (
                  <tr key={staff.id} className="border-b hover:bg-accent/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={staff.avatar} alt={staff.name} />
                          <AvatarFallback>
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{staff.name}</span>
                            {staff.isOnline && (
                              <div className="h-2 w-2 bg-green-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{staff.designation}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{staff.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm">{staff.department}</span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <Badge className={cn(getRoleBadgeColor(staff.role))}>
                        {staff.role.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <Badge className={cn(getStatusColor(staff.status))}>
                        {staff.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Link href={`/profile/staff/${staff.id}`}>
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