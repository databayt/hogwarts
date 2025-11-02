/**
 * Parent Directory Component
 * Browse and search all parent/guardian profiles
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
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import {
  Search,
  Filter,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  Grid,
  List,
  ChevronRight,
  Baby,
  Heart,
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

interface ParentDirectoryContentProps {
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
}

interface Parent {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  guardianId: string
  relationship: 'father' | 'mother' | 'guardian' | 'other'
  occupation: string
  children: {
    id: string
    name: string
    grade: string
    class: string
  }[]
  address: string
  emergencyContact: string
  engagementLevel: 'high' | 'medium' | 'low'
  paymentStatus: 'current' | 'pending' | 'overdue'
  lastContact: Date
  meetingsAttended: number
  status: 'active' | 'inactive'
  preferredContact: 'email' | 'phone' | 'both'
  registrationDate: Date
}

// Mock data
const mockParents: Parent[] = [
  {
    id: '1',
    name: 'Robert Johnson',
    email: 'robert.johnson@email.com',
    phone: '+1 234 567 8901',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    guardianId: 'GRD2022001',
    relationship: 'father',
    occupation: 'Software Engineer',
    children: [
      { id: '1', name: 'Alex Johnson', grade: 'Grade 10', class: '10A' },
      { id: '2', name: 'Emma Johnson', grade: 'Grade 8', class: '8B' }
    ],
    address: '123 Oak Street, New York, NY 10001',
    emergencyContact: '+1 234 567 8999',
    engagementLevel: 'high',
    paymentStatus: 'current',
    lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    meetingsAttended: 8,
    status: 'active',
    preferredContact: 'email',
    registrationDate: new Date('2022-08-15')
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@email.com',
    phone: '+1 234 567 8902',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahW',
    guardianId: 'GRD2021003',
    relationship: 'mother',
    occupation: 'Marketing Manager',
    children: [
      { id: '3', name: 'Emma Wilson', grade: 'Grade 11', class: '11B' }
    ],
    address: '456 Maple Avenue, Brooklyn, NY 11201',
    emergencyContact: '+1 234 567 8998',
    engagementLevel: 'high',
    paymentStatus: 'current',
    lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    meetingsAttended: 10,
    status: 'active',
    preferredContact: 'both',
    registrationDate: new Date('2021-09-01')
  },
  {
    id: '3',
    name: 'David Chen',
    email: 'david.chen@email.com',
    phone: '+1 234 567 8903',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidC',
    guardianId: 'GRD2020005',
    relationship: 'father',
    occupation: 'Doctor',
    children: [
      { id: '4', name: 'Michael Chen', grade: 'Grade 12', class: '12A' }
    ],
    address: '789 Pine Street, Manhattan, NY 10002',
    emergencyContact: '+1 234 567 8997',
    engagementLevel: 'medium',
    paymentStatus: 'current',
    lastContact: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    meetingsAttended: 5,
    status: 'active',
    preferredContact: 'phone',
    registrationDate: new Date('2020-09-01')
  },
  {
    id: '4',
    name: 'Jennifer Brown',
    email: 'jennifer.brown@email.com',
    phone: '+1 234 567 8904',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer',
    guardianId: 'GRD2022007',
    relationship: 'mother',
    occupation: 'Teacher',
    children: [
      { id: '5', name: 'Sophia Brown', grade: 'Grade 9', class: '9C' }
    ],
    address: '321 Elm Street, Queens, NY 11354',
    emergencyContact: '+1 234 567 8996',
    engagementLevel: 'medium',
    paymentStatus: 'pending',
    lastContact: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    meetingsAttended: 4,
    status: 'active',
    preferredContact: 'email',
    registrationDate: new Date('2022-09-01')
  },
  {
    id: '5',
    name: 'Mark Davis',
    email: 'mark.davis@email.com',
    phone: '+1 234 567 8905',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark',
    guardianId: 'GRD2019002',
    relationship: 'father',
    occupation: 'Business Owner',
    children: [
      { id: '6', name: 'James Davis', grade: 'Grade 12', class: '12B' }
    ],
    address: '654 Cedar Avenue, Bronx, NY 10451',
    emergencyContact: '+1 234 567 8995',
    engagementLevel: 'low',
    paymentStatus: 'overdue',
    lastContact: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    meetingsAttended: 2,
    status: 'active',
    preferredContact: 'phone',
    registrationDate: new Date('2019-09-01')
  },
  {
    id: '6',
    name: 'Lisa Martinez',
    email: 'lisa.martinez@email.com',
    phone: '+1 234 567 8906',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    guardianId: 'GRD2021009',
    relationship: 'mother',
    occupation: 'Nurse',
    children: [
      { id: '7', name: 'Olivia Martinez', grade: 'Grade 11', class: '11A' }
    ],
    address: '987 Birch Road, Staten Island, NY 10301',
    emergencyContact: '+1 234 567 8994',
    engagementLevel: 'high',
    paymentStatus: 'current',
    lastContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    meetingsAttended: 9,
    status: 'active',
    preferredContact: 'both',
    registrationDate: new Date('2021-09-01')
  }
]

// ============================================================================
// Component
// ============================================================================

export function ParentDirectoryContent({
  dictionary,
  lang = 'en'
}: ParentDirectoryContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [engagementFilter, setEngagementFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [relationshipFilter, setRelationshipFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter parents based on search and filters
  const filteredParents = useMemo(() => {
    return mockParents.filter(parent => {
      const matchesSearch = parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.guardianId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.children.some(child => child.name.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesEngagement = engagementFilter === 'all' || parent.engagementLevel === engagementFilter
      const matchesPayment = paymentFilter === 'all' || parent.paymentStatus === paymentFilter
      const matchesRelationship = relationshipFilter === 'all' || parent.relationship === relationshipFilter
      return matchesSearch && matchesEngagement && matchesPayment && matchesRelationship
    })
  }, [searchQuery, engagementFilter, paymentFilter, relationshipFilter])

  const getEngagementColor = (level: Parent['engagementLevel']) => {
    switch (level) {
      case 'high':
        return 'bg-green-50 text-green-600'
      case 'medium':
        return 'bg-yellow-50 text-yellow-600'
      case 'low':
        return 'bg-red-50 text-red-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  const getPaymentColor = (status: Parent['paymentStatus']) => {
    switch (status) {
      case 'current':
        return 'bg-green-50 text-green-600'
      case 'pending':
        return 'bg-yellow-50 text-yellow-600'
      case 'overdue':
        return 'bg-red-50 text-red-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  const getPaymentIcon = (status: Parent['paymentStatus']) => {
    switch (status) {
      case 'current':
        return <CheckCircle className="h-3 w-3" />
      case 'pending':
        return <AlertCircle className="h-3 w-3" />
      case 'overdue':
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Parent Portal</h1>
          <p className="text-muted-foreground mt-1">
            Browse and connect with parent community
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
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
              placeholder="Search by parent name, email, guardian ID, or child name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Relationships" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relationships</SelectItem>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={engagementFilter} onValueChange={setEngagementFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Engagement Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engagement</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredParents.length} parents found</span>
            {(searchQuery || engagementFilter !== 'all' || paymentFilter !== 'all' || relationshipFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setEngagementFilter('all')
                  setPaymentFilter('all')
                  setRelationshipFilter('all')
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parents Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParents.map(parent => (
            <Card key={parent.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={parent.avatar} alt={parent.name} />
                      <AvatarFallback>
                        {parent.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{parent.name}</h3>
                      <p className="text-sm text-muted-foreground">{parent.guardianId}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground capitalize">{parent.relationship}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{parent.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{parent.phone}</span>
                  </div>
                </div>

                {/* Children */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Baby className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Children ({parent.children.length})</span>
                  </div>
                  <div className="space-y-1">
                    {parent.children.map(child => (
                      <div key={child.id} className="text-sm pl-5">
                        <span className="font-medium">{child.name}</span>
                        <span className="text-muted-foreground"> • {child.class}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Heart className="h-3 w-3 text-muted-foreground" />
                    <Badge className={cn(getEngagementColor(parent.engagementLevel), 'text-xs')}>
                      {parent.engagementLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <Badge className={cn(getPaymentColor(parent.paymentStatus), 'text-xs flex items-center gap-1')}>
                      {getPaymentIcon(parent.paymentStatus)}
                      {parent.paymentStatus}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Last contact: {format(parent.lastContact, 'MMM dd')}
                  </span>
                  <Link href={`/profile/parents/${parent.id}`}>
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
                  <th className="text-left p-4">Parent</th>
                  <th className="text-left p-4 hidden md:table-cell">Children</th>
                  <th className="text-left p-4 hidden lg:table-cell">Engagement</th>
                  <th className="text-left p-4 hidden lg:table-cell">Payment</th>
                  <th className="text-left p-4 hidden xl:table-cell">Contact</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParents.map(parent => (
                  <tr key={parent.id} className="border-b hover:bg-accent/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={parent.avatar} alt={parent.name} />
                          <AvatarFallback>
                            {parent.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{parent.name}</span>
                          <p className="text-sm text-muted-foreground capitalize">{parent.relationship}</p>
                          <p className="text-xs text-muted-foreground">{parent.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="space-y-1">
                        {parent.children.map(child => (
                          <div key={child.id} className="text-sm">
                            <span>{child.name}</span>
                            <p className="text-xs text-muted-foreground">{child.class}</p>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <Badge className={cn(getEngagementColor(parent.engagementLevel))}>
                        {parent.engagementLevel}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {parent.meetingsAttended} meetings
                      </p>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <Badge className={cn(getPaymentColor(parent.paymentStatus), 'flex items-center gap-1 w-fit')}>
                        {getPaymentIcon(parent.paymentStatus)}
                        {parent.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-4 hidden xl:table-cell">
                      <span className="text-sm">{format(parent.lastContact, 'MMM dd, yyyy')}</span>
                    </td>
                    <td className="p-4">
                      <Link href={`/profile/parents/${parent.id}`}>
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