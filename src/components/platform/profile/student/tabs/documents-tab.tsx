/**
 * Student Profile Documents Tab
 * Document management, uploads, and downloads
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Share2,
  MoreVertical,
  Search,
  Filter,
  FolderOpen,
  File,
  FileImage,
  FileCheck,
  FileClock,
  FileX,
  Shield,
  Calendar,
  HardDrive,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { StudentProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface DocumentsTabProps {
  profile: StudentProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  className?: string
}

interface Document {
  id: string
  name: string
  type: 'transcript' | 'certificate' | 'report' | 'id' | 'medical' | 'photo' | 'other'
  category: 'academic' | 'personal' | 'medical' | 'administrative'
  fileType: string
  size: number
  uploadedDate: Date
  lastModified: Date
  status: 'verified' | 'pending' | 'rejected' | 'expired'
  description?: string
  uploadedBy: string
  expiryDate?: Date
  isRequired: boolean
  canDownload: boolean
  canShare: boolean
}

// ============================================================================
// Mock Data
// ============================================================================

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Academic Transcript Fall 2023',
    type: 'transcript',
    category: 'academic',
    fileType: 'PDF',
    size: 245000,
    uploadedDate: new Date('2024-01-15'),
    lastModified: new Date('2024-01-15'),
    status: 'verified',
    description: 'Official academic transcript for Fall semester 2023',
    uploadedBy: 'Registrar Office',
    isRequired: true,
    canDownload: true,
    canShare: true
  },
  {
    id: '2',
    name: 'Student ID Card',
    type: 'id',
    category: 'personal',
    fileType: 'JPG',
    size: 1024000,
    uploadedDate: new Date('2022-09-01'),
    lastModified: new Date('2022-09-01'),
    status: 'verified',
    uploadedBy: 'Admin',
    expiryDate: new Date('2026-06-01'),
    isRequired: true,
    canDownload: true,
    canShare: false
  },
  {
    id: '3',
    name: 'Medical Certificate',
    type: 'medical',
    category: 'medical',
    fileType: 'PDF',
    size: 180000,
    uploadedDate: new Date('2023-08-20'),
    lastModified: new Date('2023-08-20'),
    status: 'verified',
    description: 'Annual health checkup certificate',
    uploadedBy: 'Health Center',
    expiryDate: new Date('2024-08-20'),
    isRequired: true,
    canDownload: true,
    canShare: false
  },
  {
    id: '4',
    name: 'Python Certificate',
    type: 'certificate',
    category: 'academic',
    fileType: 'PDF',
    size: 520000,
    uploadedDate: new Date('2023-06-15'),
    lastModified: new Date('2023-06-15'),
    status: 'verified',
    description: 'Coursera Python for Data Science Certificate',
    uploadedBy: 'Student',
    isRequired: false,
    canDownload: true,
    canShare: true
  },
  {
    id: '5',
    name: 'Grade Report Spring 2023',
    type: 'report',
    category: 'academic',
    fileType: 'PDF',
    size: 198000,
    uploadedDate: new Date('2023-06-30'),
    lastModified: new Date('2023-06-30'),
    status: 'verified',
    uploadedBy: 'Academic Affairs',
    isRequired: false,
    canDownload: true,
    canShare: true
  },
  {
    id: '6',
    name: 'Profile Photo',
    type: 'photo',
    category: 'personal',
    fileType: 'PNG',
    size: 850000,
    uploadedDate: new Date('2022-09-01'),
    lastModified: new Date('2023-10-15'),
    status: 'verified',
    uploadedBy: 'Student',
    isRequired: true,
    canDownload: true,
    canShare: true
  },
  {
    id: '7',
    name: 'Birth Certificate',
    type: 'other',
    category: 'personal',
    fileType: 'PDF',
    size: 420000,
    uploadedDate: new Date('2022-09-01'),
    lastModified: new Date('2022-09-01'),
    status: 'pending',
    uploadedBy: 'Student',
    isRequired: true,
    canDownload: true,
    canShare: false
  }
]

// ============================================================================
// Utility Functions
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ============================================================================
// Component
// ============================================================================

export function DocumentsTab({
  profile,
  dictionary,
  lang = 'en',
  className
}: DocumentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Filter documents
  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesType = selectedType === 'all' || doc.type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  // Calculate statistics
  const totalSize = mockDocuments.reduce((sum, doc) => sum + doc.size, 0)
  const verifiedCount = mockDocuments.filter(doc => doc.status === 'verified').length
  const pendingCount = mockDocuments.filter(doc => doc.status === 'pending').length
  const requiredCount = mockDocuments.filter(doc => doc.isRequired).length

  // Get document type icon
  const getDocumentIcon = (type: string, fileType: string) => {
    if (fileType === 'JPG' || fileType === 'PNG') return <FileImage className="h-4 w-4" />
    switch (type) {
      case 'transcript':
      case 'certificate':
      case 'report':
        return <FileCheck className="h-4 w-4" />
      case 'medical':
        return <FileClock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'default'
      case 'pending': return 'secondary'
      case 'rejected': return 'destructive'
      case 'expired': return 'outline'
      default: return 'outline'
    }
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'text-blue-500'
      case 'personal': return 'text-green-500'
      case 'medical': return 'text-red-500'
      case 'administrative': return 'text-purple-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Document Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
            <p className="text-2xl font-bold">{mockDocuments.length}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(totalSize)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Verified</p>
            </div>
            <p className="text-2xl font-bold">{verifiedCount}</p>
            <Progress value={(verifiedCount / mockDocuments.length) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileClock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-2xl font-bold">{pendingCount}</p>
            {pendingCount > 0 && (
              <p className="text-xs text-yellow-600">Needs attention</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Required</p>
            </div>
            <p className="text-2xl font-bold">{requiredCount}</p>
            <p className="text-xs text-muted-foreground">Mandatory docs</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Category
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedCategory('academic')}>
                    Academic
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory('personal')}>
                    Personal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory('medical')}>
                    Medical
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory('administrative')}>
                    Administrative
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="default" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {getDocumentIcon(document.type, document.fileType)}
                      </div>
                      <div>
                        <p className="font-medium">{document.name}</p>
                        {document.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {document.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {document.fileType}
                          </Badge>
                          {document.isRequired && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                          {document.expiryDate && (
                            <span className="text-xs text-muted-foreground">
                              Expires: {format(document.expiryDate, 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-sm capitalize', getCategoryColor(document.category))}>
                      {document.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatFileSize(document.size)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{format(document.uploadedDate, 'MMM dd, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">by {document.uploadedBy}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(document.status)}>
                      {document.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {document.canDownload && (
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        )}
                        {document.canShare && (
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Used Storage</span>
                <span>{formatFileSize(totalSize)} / 100 MB</span>
              </div>
              <Progress value={(totalSize / (100 * 1024 * 1024)) * 100} className="h-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>Academic ({mockDocuments.filter(d => d.category === 'academic').length})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Personal ({mockDocuments.filter(d => d.category === 'personal').length})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span>Medical ({mockDocuments.filter(d => d.category === 'medical').length})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span>Admin ({mockDocuments.filter(d => d.category === 'administrative').length})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}