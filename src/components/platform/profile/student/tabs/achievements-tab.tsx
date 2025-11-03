/**
 * Student Profile Achievements Tab
 * Awards, certificates, badges, and accomplishments
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Award,
  Trophy,
  Medal,
  Star,
  Target,
  Zap,
  Shield,
  Crown,
  Download,
  Eye,
  Share2,
  Calendar,
  ExternalLink,
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { StudentProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface AchievementsTabProps {
  profile: StudentProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  className?: string
}

interface Achievement {
  id: string
  title: string
  category: 'academic' | 'sports' | 'cultural' | 'technical' | 'leadership' | 'service'
  type: 'award' | 'certificate' | 'badge' | 'medal' | 'trophy'
  date: Date
  issuer: string
  description: string
  icon: React.ReactNode
  color: string
  verified: boolean
  shareUrl?: string
  certificateUrl?: string
  points?: number
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}

interface SkillBadge {
  id: string
  name: string
  level: number
  maxLevel: number
  icon: React.ReactNode
  color: string
  earnedDate: Date
  nextMilestone: string
  progress: number
}

// ============================================================================
// Mock Data
// ============================================================================

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Dean\'s List Fall 2023',
    category: 'academic',
    type: 'award',
    date: new Date('2024-01-15'),
    issuer: 'Academic Affairs Office',
    description: 'Achieved GPA of 3.85 or higher for the semester',
    icon: <Trophy className="h-4 w-4" />,
    color: 'bg-yellow-500',
    verified: true,
    points: 100,
    rarity: 'epic'
  },
  {
    id: '2',
    title: 'Regional Hackathon Winner',
    category: 'technical',
    type: 'trophy',
    date: new Date('2023-11-20'),
    issuer: 'TechCon 2023',
    description: 'First place in the Regional Student Hackathon',
    icon: <Crown className="h-4 w-4" />,
    color: 'bg-purple-500',
    verified: true,
    certificateUrl: '#',
    shareUrl: '#',
    points: 150,
    rarity: 'legendary'
  },
  {
    id: '3',
    title: 'Perfect Attendance Award',
    category: 'academic',
    type: 'badge',
    date: new Date('2023-12-20'),
    issuer: 'School Administration',
    description: '100% attendance for the entire semester',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-green-500',
    verified: true,
    points: 50,
    rarity: 'rare'
  },
  {
    id: '4',
    title: 'Python Programming Certificate',
    category: 'technical',
    type: 'certificate',
    date: new Date('2023-06-15'),
    issuer: 'Coursera',
    description: 'Completed Python for Data Science professional certificate',
    icon: <Award className="h-4 w-4" />,
    color: 'bg-blue-500',
    verified: true,
    certificateUrl: '#',
    points: 75,
    rarity: 'common'
  },
  {
    id: '5',
    title: 'Student Leadership Award',
    category: 'leadership',
    type: 'medal',
    date: new Date('2023-09-10'),
    issuer: 'Student Council',
    description: 'Outstanding contribution to student governance',
    icon: <Medal className="h-4 w-4" />,
    color: 'bg-orange-500',
    verified: true,
    points: 80,
    rarity: 'rare'
  },
  {
    id: '6',
    title: 'Community Service Star',
    category: 'service',
    type: 'badge',
    date: new Date('2023-08-25'),
    issuer: 'Volunteer Services',
    description: 'Completed 100+ hours of community service',
    icon: <Star className="h-4 w-4" />,
    color: 'bg-pink-500',
    verified: true,
    points: 60,
    rarity: 'rare'
  }
]

const mockSkillBadges: SkillBadge[] = [
  {
    id: '1',
    name: 'Problem Solver',
    level: 3,
    maxLevel: 5,
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-purple-500',
    earnedDate: new Date('2023-10-01'),
    nextMilestone: 'Solve 10 more complex problems',
    progress: 70
  },
  {
    id: '2',
    name: 'Team Player',
    level: 4,
    maxLevel: 5,
    icon: <Users className="h-4 w-4" />,
    color: 'bg-blue-500',
    earnedDate: new Date('2023-09-15'),
    nextMilestone: 'Lead 2 more team projects',
    progress: 85
  },
  {
    id: '3',
    name: 'Code Warrior',
    level: 2,
    maxLevel: 5,
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-green-500',
    earnedDate: new Date('2023-11-01'),
    nextMilestone: 'Complete 5 more coding challenges',
    progress: 40
  }
]

// ============================================================================
// Component
// ============================================================================

export function AchievementsTab({
  profile,
  dictionary,
  lang = 'en',
  className
}: AchievementsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { skillsAndInterests } = profile

  // Filter achievements by category
  const filteredAchievements = selectedCategory === 'all'
    ? mockAchievements
    : mockAchievements.filter(a => a.category === selectedCategory)

  // Calculate statistics
  const totalPoints = mockAchievements.reduce((sum, a) => sum + (a.points || 0), 0)
  const verifiedCount = mockAchievements.filter(a => a.verified).length
  const categories = Array.from(new Set(mockAchievements.map(a => a.category)))

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-blue-500'
      case 'sports': return 'bg-green-500'
      case 'cultural': return 'bg-purple-500'
      case 'technical': return 'bg-orange-500'
      case 'leadership': return 'bg-red-500'
      case 'service': return 'bg-pink-500'
      default: return 'bg-gray-500'
    }
  }

  // Get rarity color
  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500 bg-yellow-500/10'
      case 'epic': return 'text-purple-500 bg-purple-500/10'
      case 'rare': return 'text-blue-500 bg-blue-500/10'
      case 'common': return 'text-gray-500 bg-gray-500/10'
      default: return 'text-gray-500 bg-gray-500/10'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Achievement Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Achievements</p>
            </div>
            <p className="text-2xl font-bold">{mockAchievements.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Verified</p>
            </div>
            <p className="text-2xl font-bold">{verifiedCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
            <p className="text-2xl font-bold">{totalPoints}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Skill Badges</p>
            </div>
            <p className="text-2xl font-bold">{mockSkillBadges.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="badges">Skill Badges</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map((achievement) => (
              <Card key={achievement.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-3 rounded-lg text-white',
                        achievement.color
                      )}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                          </div>
                          {achievement.verified && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {achievement.category}
                          </Badge>
                          {achievement.rarity && (
                            <Badge className={cn('text-xs capitalize', getRarityColor(achievement.rarity))}>
                              {achievement.rarity}
                            </Badge>
                          )}
                          {achievement.points && (
                            <Badge variant="secondary" className="text-xs">
                              +{achievement.points} pts
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(achievement.date, 'MMM dd, yyyy')}
                            </span>
                            <span className="block mt-1">{achievement.issuer}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {achievement.certificateUrl && (
                              <Button variant="ghost" size="sm" className="h-7 px-2">
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            {achievement.shareUrl && (
                              <Button variant="ghost" size="sm" className="h-7 px-2">
                                <Share2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Skill Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockSkillBadges.map((badge) => (
              <Card key={badge.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-3 rounded-lg text-white',
                      badge.color
                    )}>
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{badge.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          Level {badge.level}/{badge.maxLevel}
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: badge.maxLevel }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                'w-2 h-2 rounded-full',
                                i < badge.level ? 'bg-primary' : 'bg-muted'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress to next level</span>
                        <span>{badge.progress}%</span>
                      </div>
                      <Progress value={badge.progress} className="h-2" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {badge.nextMilestone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Earned {format(badge.earnedDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Professional Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {skillsAndInterests.certifications.map((cert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Award className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{cert.name}</p>
                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      </div>
                      {cert.url && (
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
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
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Achievement Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Achievement Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-4">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            {mockAchievements.slice(0, 5).map((achievement, index) => (
              <div key={achievement.id} className="relative flex items-start gap-4">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white z-10',
                  achievement.color
                )}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(achievement.date, 'MMMM dd, yyyy')} • {achievement.issuer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}