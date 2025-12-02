/**
 * Teacher Profile Publications Tab
 * Research papers, articles, and academic contributions
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, FileText, Users, Calendar, ExternalLink, Download, Search, ListFilter, Plus, Pencil, ChevronRight, Quote, TrendingUp, Globe, Lock, LockOpen, BookMarked, Newspaper, Video, Presentation, GraduationCap } from "lucide-react"
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { TeacherProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface PublicationsTabProps {
  profile: TeacherProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  isOwner?: boolean
  className?: string
}

type PublicationType = 'journal' | 'conference' | 'book' | 'chapter' | 'thesis' | 'report' | 'article' | 'presentation'
type PublicationStatus = 'published' | 'accepted' | 'submitted' | 'draft'

interface Publication {
  id: string
  title: string
  type: PublicationType
  authors: string[]
  publisher?: string
  journal?: string
  conference?: string
  year: number
  month?: number
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  url?: string
  abstract?: string
  keywords?: string[]
  citations?: number
  downloads?: number
  status: PublicationStatus
  isOpenAccess?: boolean
  impactFactor?: number
  pdfUrl?: string
}

interface ResearchMetrics {
  totalPublications: number
  totalCitations: number
  hIndex: number
  i10Index: number
  citationsPerYear: { year: number; count: number }[]
  topCitedPapers: Publication[]
  collaborators: { name: string; count: number }[]
}

// ============================================================================
// Mock Data
// ============================================================================

const mockPublications: Publication[] = [
  {
    id: 'pub-1',
    title: 'Machine Learning Applications in Adaptive Educational Systems: A Comprehensive Survey',
    type: 'journal',
    authors: ['Sarah Johnson', 'John Smith', 'Emily Chen'],
    journal: 'IEEE Transactions on Learning Technologies',
    publisher: 'IEEE',
    year: 2023,
    month: 6,
    volume: '16',
    issue: '3',
    pages: '234-251',
    doi: '10.1109/TLT.2023.123456',
    url: 'https://doi.org/10.1109/TLT.2023.123456',
    abstract: 'This paper presents a comprehensive survey of machine learning applications in adaptive educational systems...',
    keywords: ['machine learning', 'adaptive learning', 'educational technology', 'artificial intelligence'],
    citations: 45,
    downloads: 1250,
    status: 'published',
    isOpenAccess: true,
    impactFactor: 4.2
  },
  {
    id: 'pub-2',
    title: 'Deep Learning for Student Performance Prediction: A Systematic Literature Review',
    type: 'journal',
    authors: ['Sarah Johnson', 'Michael Brown'],
    journal: 'Computers & Education',
    publisher: 'Elsevier',
    year: 2023,
    month: 3,
    volume: '194',
    pages: '104-118',
    doi: '10.1016/j.compedu.2023.104718',
    citations: 32,
    downloads: 890,
    status: 'published',
    isOpenAccess: false,
    impactFactor: 11.8
  },
  {
    id: 'pub-3',
    title: 'Gamification in Computer Science Education: Impact on Student Engagement and Learning Outcomes',
    type: 'conference',
    authors: ['Sarah Johnson', 'Lisa Wang', 'David Miller'],
    conference: 'ACM SIGCSE Technical Symposium',
    publisher: 'ACM',
    year: 2022,
    month: 10,
    pages: '567-574',
    doi: '10.1145/3478431.3499309',
    url: 'https://dl.acm.org/doi/10.1145/3478431.3499309',
    citations: 28,
    downloads: 650,
    status: 'published',
    isOpenAccess: true
  },
  {
    id: 'pub-4',
    title: 'Practical Machine Learning for Educators',
    type: 'book',
    authors: ['Sarah Johnson'],
    publisher: 'O\'Reilly Media',
    year: 2022,
    month: 8,
    pages: '450',
    url: 'https://www.oreilly.com/library/view/practical-machine-learning',
    citations: 15,
    downloads: 2300,
    status: 'published',
    isOpenAccess: false
  },
  {
    id: 'pub-5',
    title: 'Blockchain Technology in Academic Credential Verification: A Case Study',
    type: 'report',
    authors: ['Sarah Johnson', 'Alex Thompson'],
    publisher: 'EdTech Research Institute',
    year: 2024,
    month: 1,
    citations: 5,
    downloads: 180,
    status: 'published',
    isOpenAccess: true
  },
  {
    id: 'pub-6',
    title: 'Neural Networks for Automated Essay Scoring: Challenges and Opportunities',
    type: 'journal',
    authors: ['Sarah Johnson', 'Robert Chen', 'Maria Garcia'],
    journal: 'AI in Education',
    year: 2024,
    status: 'accepted',
    isOpenAccess: true
  }
]

const mockMetrics: ResearchMetrics = {
  totalPublications: mockPublications.length,
  totalCitations: mockPublications.reduce((sum, p) => sum + (p.citations || 0), 0),
  hIndex: 8,
  i10Index: 5,
  citationsPerYear: [
    { year: 2020, count: 12 },
    { year: 2021, count: 25 },
    { year: 2022, count: 48 },
    { year: 2023, count: 72 },
    { year: 2024, count: 18 }
  ],
  topCitedPapers: mockPublications.filter(p => p.citations && p.citations > 20),
  collaborators: [
    { name: 'John Smith', count: 8 },
    { name: 'Emily Chen', count: 6 },
    { name: 'Michael Brown', count: 5 },
    { name: 'Lisa Wang', count: 4 }
  ]
}

// ============================================================================
// Component
// ============================================================================

export function PublicationsTab({
  profile,
  dictionary,
  lang = 'en',
  isOwner = false,
  className
}: PublicationsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<PublicationType | 'all'>('all')
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  const { professionalInfo } = profile
  const publications = professionalInfo.publications || []

  // Filter publications
  const filteredPublications = mockPublications.filter(pub => {
    const matchesSearch = searchTerm === '' ||
      pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      pub.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = selectedType === 'all' || pub.type === selectedType
    const matchesYear = selectedYear === 'all' || pub.year === selectedYear

    return matchesSearch && matchesType && matchesYear
  })

  // Get unique years for filter
  const years = [...new Set(mockPublications.map(p => p.year))].sort((a, b) => b - a)

  const getPublicationIcon = (type: PublicationType) => {
    switch (type) {
      case 'journal': return <BookOpen className="h-4 w-4" />
      case 'conference': return <Presentation className="h-4 w-4" />
      case 'book': return <BookMarked className="h-4 w-4" />
      case 'chapter': return <FileText className="h-4 w-4" />
      case 'thesis': return <GraduationCap className="h-4 w-4" />
      case 'report': return <Newspaper className="h-4 w-4" />
      case 'article': return <FileText className="h-4 w-4" />
      case 'presentation': return <Video className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatAuthors = (authors: string[], currentAuthor: string = 'Sarah Johnson') => {
    return authors.map((author, index) => (
      <span key={index}>
        {author === currentAuthor ? (
          <strong>{author}</strong>
        ) : (
          author
        )}
        {index < authors.length - 1 && ', '}
      </span>
    ))
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Research Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{mockMetrics.totalPublications}</p>
              <p className="text-xs text-muted-foreground">Publications</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{mockMetrics.totalCitations}</p>
              <p className="text-xs text-muted-foreground">Citations</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{mockMetrics.hIndex}</p>
              <p className="text-xs text-muted-foreground">h-index</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{mockMetrics.i10Index}</p>
              <p className="text-xs text-muted-foreground">i10-index</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {mockPublications.filter(p => p.isOpenAccess).length}
              </p>
              <p className="text-xs text-muted-foreground">Open Access</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Research Publications
            </span>
            {isOwner && (
              <Button size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Add Publication
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search publications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <ListFilter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <select
              className="px-3 py-1 text-sm border rounded-md"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as PublicationType | 'all')}
            >
              <option value="all">All Types</option>
              <option value="journal">Journal Articles</option>
              <option value="conference">Conference Papers</option>
              <option value="book">Books</option>
              <option value="chapter">Book Chapters</option>
              <option value="thesis">Theses</option>
              <option value="report">Reports</option>
              <option value="article">Articles</option>
              <option value="presentation">Presentations</option>
            </select>

            <select
              className="px-3 py-1 text-sm border rounded-md"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Publications List */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="citations">By Citations</TabsTrigger>
          <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredPublications.map((pub) => (
            <Card key={pub.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    {getPublicationIcon(pub.type)}
                  </div>
                  <div className="flex-1">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold hover:text-primary transition-colors">
                          {pub.url ? (
                            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {pub.title}
                            </a>
                          ) : (
                            pub.title
                          )}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {pub.type}
                          </Badge>
                          {pub.status !== 'published' && (
                            <Badge variant="outline" className="text-xs">
                              {pub.status}
                            </Badge>
                          )}
                          {pub.isOpenAccess && (
                            <Badge variant="default" className="text-xs">
                              <LockOpen className="h-3 w-3 mr-1" />
                              Open Access
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {pub.pdfUrl && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        {pub.doi && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        {isOwner && (
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Authors */}
                    <p className="text-sm mt-2">
                      {formatAuthors(pub.authors)}
                    </p>

                    {/* Publication Details */}
                    <p className="text-sm text-muted-foreground mt-1">
                      {pub.journal && `${pub.journal}. `}
                      {pub.conference && `${pub.conference}. `}
                      {pub.publisher && `${pub.publisher}. `}
                      {pub.year}
                      {pub.month && `, ${format(new Date(pub.year, pub.month - 1), 'MMMM')}`}
                      {pub.volume && `, Vol. ${pub.volume}`}
                      {pub.issue && `(${pub.issue})`}
                      {pub.pages && `, pp. ${pub.pages}`}
                    </p>

                    {/* DOI */}
                    {pub.doi && (
                      <p className="text-xs text-muted-foreground mt-1">
                        DOI: {pub.doi}
                      </p>
                    )}

                    {/* Abstract (collapsible) */}
                    {pub.abstract && (
                      <details className="mt-3">
                        <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                          View Abstract
                        </summary>
                        <p className="text-sm mt-2 p-3 bg-muted/50 rounded-lg">
                          {pub.abstract}
                        </p>
                      </details>
                    )}

                    {/* Keywords */}
                    {pub.keywords && pub.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {pub.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Metrics */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      {pub.citations !== undefined && (
                        <span className="flex items-center gap-1">
                          <Quote className="h-3 w-3" />
                          {pub.citations} citations
                        </span>
                      )}
                      {pub.downloads !== undefined && (
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {pub.downloads} downloads
                        </span>
                      )}
                      {pub.impactFactor !== undefined && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          IF: {pub.impactFactor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredPublications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No publications found matching your criteria
            </div>
          )}
        </TabsContent>

        <TabsContent value="citations" className="space-y-4">
          {/* Citation Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Citation Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Citation trend chart would go here */}
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Citations per year (last 5 years)
                </div>
                {mockMetrics.citationsPerYear.map((item) => (
                  <div key={item.year} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-12">{item.year}</span>
                    <div className="flex-1 bg-muted rounded-full h-6 relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(item.count / 100) * 100}%` }}
                      >
                        <span className="text-xs text-primary-foreground font-medium">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Cited Papers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Most Cited Publications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockMetrics.topCitedPapers.map((pub, index) => (
                <div key={pub.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{pub.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pub.year} • {pub.citations} citations
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaborators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Research Collaborators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockMetrics.collaborators.map((collaborator) => (
                  <div key={collaborator.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{collaborator.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {collaborator.count} joint publications
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Network Visualization would go here */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Collaboration Network</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
                Network visualization would appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}