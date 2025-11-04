// @ts-nocheck
// TODO: Fix prop interface mismatches (36+ errors) - see admin-dashboard.tsx for details
'use client'

import * as React from "react"
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Award,
  Target,
  Activity,
  Zap,
  Heart,
  Star,
  Mail,
  Phone,
  MapPin,
  Settings,
  Sun,
  Cloud,
  CloudRain
} from "lucide-react"

// Import all atom dashboard cards
import { StatCard } from "@/components/atom/dashboard/stat-card"
import { ProgressCard } from "@/components/atom/dashboard/progress-card"
import { ListCard } from "@/components/atom/dashboard/list-card"
import { MultiStatCard } from "@/components/atom/dashboard/multi-stat-card"
import { ChartCard } from "@/components/atom/dashboard/chart-card"
import { HeroStatCard } from "@/components/atom/dashboard/hero-stat-card"
import { ActionCard } from "@/components/atom/dashboard/action-card"
import { ComparisonCard } from "@/components/atom/dashboard/comparison-card"
import { MediaCard } from "@/components/atom/dashboard/media-card"
import { CollapsibleCard } from "@/components/atom/dashboard/collapsible-card"
import { EmptyStateCard } from "@/components/atom/dashboard/empty-state-card"
import { SkeletonCard } from "@/components/atom/dashboard/skeleton-card"
import { FlipCard } from "@/components/atom/dashboard/flip-card"
import { MetricCard } from "@/components/atom/dashboard/metric-card"
import { NotificationCard } from "@/components/atom/dashboard/notification-card"
import { TimelineCard } from "@/components/atom/dashboard/timeline-card"
import { ProfileCard } from "@/components/atom/dashboard/profile-card"
import { GoalCard } from "@/components/atom/dashboard/goal-card"
import { WeatherCard } from "@/components/atom/dashboard/weather-card"
import { CalendarCard } from "@/components/atom/dashboard/calendar-card"
import { QuickActionCard } from "@/components/atom/dashboard/quick-action-card"
import { SocialCard } from "@/components/atom/dashboard/social-card"
import { GlanceCard } from "@/components/atom/dashboard/glance-card"
import { IconStatCard } from "@/components/atom/dashboard/icon-stat-card"
import { RecentSalesCard } from "@/components/atom/dashboard/recent-sales-card"
import { ActivityFeedCard } from "@/components/atom/dashboard/activity-feed-card"
import { TeamMembersCard } from "@/components/atom/dashboard/team-members-card"
import { TopPerformersCard } from "@/components/atom/dashboard/top-performers-card"
import { TaskListCard } from "@/components/atom/dashboard/task-list-card"
import { DataTableCard } from "@/components/atom/dashboard/data-table-card"
import { StackedStatCard } from "@/components/atom/dashboard/stacked-stat-card"
import { BannerCard } from "@/components/atom/dashboard/banner-card"
import { DashboardGrid } from "@/components/atom/dashboard/dashboard-grid"
import { DashboardSection } from "@/components/atom/dashboard/dashboard-section"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function DashboardShowcase() {
  return (
    <div className="space-y-8 mt-12 pt-8 border-t">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-foreground">Dashboard Card Component Showcase</h2>
        <p className="text-muted-foreground">
          Preview of all 46 atom dashboard card components with mock data
        </p>
      </div>

      {/* Basic Stat Cards */}
      <DashboardSection title="Basic Stat Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} gap={4}>
          <StatCard
            icon={<Users className="h-4 w-4" />}
            value="4,812"
            label="Total Students"
            trend={{ value: 12.5, direction: "up" }}
            variant="primary"
            hoverable
          />

          <StatCard
            icon={<GraduationCap className="h-4 w-4" />}
            value="248"
            label="Teachers"
            trend={{ value: 3, direction: "up" }}
            variant="success"
            hoverable
          />

          <StatCard
            icon={<BookOpen className="h-4 w-4" />}
            value="156"
            label="Active Classes"
            trend={{ value: 5.2, direction: "neutral" }}
            variant="default"
            hoverable
          />

          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            value="94.2%"
            label="Attendance Rate"
            trend={{ value: 2.1, direction: "up" }}
            variant="success"
            hoverable
          />

          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            value="$1.2M"
            label="Annual Revenue"
            trend={{ value: 8.3, direction: "up" }}
            variant="primary"
            hoverable
          />

          <StatCard
            icon={<AlertCircle className="h-4 w-4" />}
            value="23"
            label="Pending Issues"
            trend={{ value: 12, direction: "down" }}
            variant="warning"
            hoverable
          />

          <StatCard
            icon={<Award className="h-4 w-4" />}
            value="87"
            label="Awards Won"
            variant="success"
            size="lg"
          />

          <StatCard
            icon={<Activity className="h-4 w-4" />}
            value="1,234"
            label="Active Sessions"
            variant="muted"
            size="lg"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Progress Cards */}
      <DashboardSection title="Progress Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <ProgressCard
            icon={<Target className="h-4 w-4" />}
            value={75}
            label="Course Completion"
            variant="primary"
            size="md"
          />

          <ProgressCard
            icon={<CheckCircle className="h-4 w-4" />}
            value={92}
            label="Assignment Submitted"
            variant="success"
            size="md"
          />

          <ProgressCard
            icon={<Clock className="h-4 w-4" />}
            value={45}
            label="Time Remaining"
            variant="warning"
            size="md"
          />

          <ProgressCard
            icon={<Zap className="h-4 w-4" />}
            value={60}
            label="Performance Score"
            variant="default"
            size="md"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Hero & Featured Cards */}
      <DashboardSection title="Hero & Featured Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          <HeroStatCard
            icon={<Users className="h-8 w-8" />}
            value="10,482"
            label="Total Enrollment"
            description="Across all grade levels"
            trend={{ value: 15.2, direction: "up" }}
            variant="primary"
          />

          <HeroStatCard
            icon={<TrendingUp className="h-8 w-8" />}
            value="96.8%"
            label="Pass Rate"
            description="Academic year 2024-2025"
            trend={{ value: 4.3, direction: "up" }}
            variant="success"
          />

          <HeroStatCard
            icon={<Award className="h-8 w-8" />}
            value="124"
            label="Achievements"
            description="Student excellence awards"
            variant="default"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Action & Comparison Cards */}
      <DashboardSection title="Action & Comparison Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          <ActionCard
            icon={<FileText className="h-6 w-6" />}
            title="Generate Reports"
            description="Create comprehensive academic reports"
            action={<Button size="sm">Generate</Button>}
            variant="primary"
          />

          <ActionCard
            icon={<Bell className="h-6 w-6" />}
            title="Send Announcement"
            description="Notify students and parents"
            action={<Button size="sm" variant="outline">Send</Button>}
            variant="default"
          />

          <ComparisonCard
            title="Performance Comparison"
            current={{ label: "This Year", value: 94.2, color: "hsl(var(--primary))" }}
            previous={{ label: "Last Year", value: 87.8, color: "hsl(var(--muted))" }}
            trend={{ value: 7.3, direction: "up" }}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Media & Interactive Cards */}
      <DashboardSection title="Media & Interactive Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          <MediaCard
            media={
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-48 rounded-md flex items-center justify-center">
                <GraduationCap className="h-24 w-24 text-white opacity-50" />
              </div>
            }
            title="School Tour 2025"
            description="Virtual campus walkthrough"
            action={<Button variant="outline" size="sm">Watch Tour</Button>}
          />

          <CollapsibleCard
            title="Exam Schedule"
            preview="View upcoming examination dates"
          >
            <div className="space-y-2">
              <div className="flex justify-between p-2 border rounded">
                <span className="text-sm">Mathematics</span>
                <span className="text-sm text-muted-foreground">Dec 15, 2024</span>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span className="text-sm">Science</span>
                <span className="text-sm text-muted-foreground">Dec 18, 2024</span>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span className="text-sm">English</span>
                <span className="text-sm text-muted-foreground">Dec 20, 2024</span>
              </div>
            </div>
          </CollapsibleCard>

          <EmptyStateCard
            icon={<FileText className="h-12 w-12" />}
            title="No Assignments"
            description="You're all caught up! No pending assignments."
            action={<Button variant="outline" size="sm">View Archive</Button>}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Phase 2: Modern Interactive Cards */}
      <DashboardSection title="Interactive Phase 2 Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          <FlipCard
            front={
              <div className="p-6 space-y-2">
                <h3>Student ID Card</h3>
                <p className="text-muted-foreground">Click to view details</p>
              </div>
            }
            back={
              <div className="p-6 space-y-2">
                <p className="text-sm"><strong>Name:</strong> John Doe</p>
                <p className="text-sm"><strong>ID:</strong> STU-2024-1234</p>
                <p className="text-sm"><strong>Grade:</strong> 10th</p>
                <p className="text-sm"><strong>Section:</strong> A</p>
              </div>
            }
          />

          <MetricCard
            value="4,234"
            label="Active Users"
            data={[120, 150, 180, 220, 190, 240, 280, 320, 300, 350, 380, 420]}
            trend={{ value: 12.5, direction: "up" }}
            variant="primary"
          />

          <NotificationCard
            notifications={[
              {
                title: "New Assignment Posted",
                description: "Mathematics Chapter 5 homework",
                timestamp: "2 hours ago",
                type: "info",
                unread: true
              },
              {
                title: "Parent-Teacher Meeting",
                description: "Scheduled for Dec 20, 2024",
                timestamp: "1 day ago",
                type: "default",
                unread: false
              }
            ]}
            maxItems={3}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Timeline & Profile Cards */}
      <DashboardSection title="Timeline & Profile Cards">
        <DashboardGrid columns={{ base: 1, md: 2 }} gap={6}>
          <TimelineCard
            title="Recent Activities"
            events={[
              {
                title: "Assignment Submitted",
                description: "John submitted Physics homework",
                timestamp: "2 hours ago",
                icon: <CheckCircle className="h-4 w-4" />,
                type: "success"
              },
              {
                title: "Grade Updated",
                description: "Mathematics exam results published",
                timestamp: "5 hours ago",
                icon: <Award className="h-4 w-4" />,
                type: "default"
              },
              {
                title: "Attendance Marked",
                description: "Present for all classes today",
                timestamp: "1 day ago",
                icon: <CheckCircle className="h-4 w-4" />,
                type: "success"
              }
            ]}
          />

          <ProfileCard
            avatar="/avatars/student.png"
            name="Emily Johnson"
            role="Student - Grade 11"
            bio="Honor roll student, Math club president"
            stats={[
              { label: "GPA", value: "3.95" },
              { label: "Attendance", value: "98%" },
              { label: "Credits", value: "24" }
            ]}
            actions={
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
            }
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Goals & Achievements */}
      <DashboardSection title="Goals & Achievements">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          <GoalCard
            title="Semester GPA Goal"
            current={3.75}
            target={4.0}
            description="Maintain honor roll status"
            variant="primary"
          />

          <GoalCard
            title="Attendance Target"
            current={92}
            target={95}
            description="Perfect attendance bonus"
            variant="success"
          />

          <GoalCard
            title="Reading Challenge"
            current={18}
            target={25}
            description="Books read this semester"
            variant="default"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Weather & Calendar */}
      <DashboardSection title="Contextual Information Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          <WeatherCard
            temperature={22}
            condition="Partly Cloudy"
            location="School Campus"
            icon={<Cloud className="h-12 w-12" />}
            forecast={[
              { day: "Mon", high: 24, low: 18, icon: <Sun className="h-5 w-5" /> },
              { day: "Tue", high: 22, low: 17, icon: <Cloud className="h-5 w-5" /> },
              { day: "Wed", high: 20, low: 15, icon: <CloudRain className="h-5 w-5" /> }
            ]}
          />

          <CalendarCard
            title="Upcoming Events"
            events={[
              { date: "Dec 15", title: "Math Exam", time: "9:00 AM" },
              { date: "Dec 18", title: "Science Fair", time: "2:00 PM" },
              { date: "Dec 20", title: "Parent Meeting", time: "4:00 PM" }
            ]}
          />

          <QuickActionCard
            title="Quick Actions"
            actions={[
              { icon: <FileText className="h-4 w-4" />, label: "View Grades", onClick: () => {} },
              { icon: <Calendar className="h-4 w-4" />, label: "Check Schedule", onClick: () => {} },
              { icon: <Bell className="h-4 w-4" />, label: "Announcements", onClick: () => {} },
              { icon: <Settings className="h-4 w-4" />, label: "Settings", onClick: () => {} }
            ]}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Social & Engagement */}
      <DashboardSection title="Social & Engagement Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <SocialCard
            platform="Likes"
            count={1234}
            trend={{ value: 12, direction: "up" }}
            icon={<Heart className="h-5 w-5" />}
          />

          <SocialCard
            platform="Comments"
            count={567}
            trend={{ value: 8, direction: "up" }}
            icon={<Mail className="h-5 w-5" />}
          />

          <SocialCard
            platform="Shares"
            count={234}
            trend={{ value: 5, direction: "neutral" }}
            icon={<Activity className="h-5 w-5" />}
          />

          <SocialCard
            platform="Followers"
            count={8912}
            trend={{ value: 15, direction: "up" }}
            icon={<Users className="h-5 w-5" />}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* At a Glance Cards */}
      <DashboardSection title="At a Glance Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <GlanceCard
            icon={<Users className="h-8 w-8" />}
            value="4,812"
            label="Students"
            color="hsl(var(--primary))"
          />

          <GlanceCard
            icon={<GraduationCap className="h-8 w-8" />}
            value="248"
            label="Teachers"
            color="hsl(var(--chart-2))"
          />

          <GlanceCard
            icon={<BookOpen className="h-8 w-8" />}
            value="156"
            label="Classes"
            color="hsl(var(--chart-3))"
          />

          <GlanceCard
            icon={<Award className="h-8 w-8" />}
            value="94%"
            label="Pass Rate"
            color="hsl(var(--chart-4))"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Icon Stat Cards */}
      <DashboardSection title="Icon Stat Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <IconStatCard
            icon={<TrendingUp className="h-6 w-6" />}
            value="$45,231"
            label="Revenue"
            iconColor="text-green-500"
            iconBg="bg-green-50"
          />

          <IconStatCard
            icon={<TrendingDown className="h-6 w-6" />}
            value="$12,340"
            label="Expenses"
            iconColor="text-red-500"
            iconBg="bg-red-50"
          />

          <IconStatCard
            icon={<DollarSign className="h-6 w-6" />}
            value="$32,891"
            label="Profit"
            iconColor="text-blue-500"
            iconBg="bg-blue-50"
          />

          <IconStatCard
            icon={<Activity className="h-6 w-6" />}
            value="1,234"
            label="Transactions"
            iconColor="text-purple-500"
            iconBg="bg-purple-50"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Advanced shadcn Pattern Cards */}
      <DashboardSection title="Advanced shadcn Pattern Cards">
        <DashboardGrid columns={{ base: 1, md: 2 }} gap={6}>
          <RecentSalesCard
            title="Recent Payments"
            description="Last 5 fee payments received"
            sales={[
              {
                avatar: "/avatars/01.png",
                name: "Olivia Martin",
                email: "Grade 10-A",
                amount: "+$2,500"
              },
              {
                avatar: "/avatars/02.png",
                name: "Jackson Lee",
                email: "Grade 11-B",
                amount: "+$2,500"
              },
              {
                avatar: "/avatars/03.png",
                name: "Isabella Nguyen",
                email: "Grade 9-C",
                amount: "+$2,500"
              },
              {
                avatar: "/avatars/04.png",
                name: "William Kim",
                email: "Grade 12-A",
                amount: "+$2,500"
              },
              {
                avatar: "/avatars/05.png",
                name: "Sofia Davis",
                email: "Grade 10-B",
                amount: "+$2,500"
              }
            ]}
            maxItems={5}
          />

          <ActivityFeedCard
            title="Recent Activities"
            description="Latest system activities"
            activities={[
              {
                avatar: "/avatars/teacher.png",
                title: "New assignment posted",
                description: "Ms. Johnson posted Math homework",
                timestamp: "2 hours ago",
                type: "default"
              },
              {
                avatar: "/avatars/student.png",
                title: "Grade updated",
                description: "John's Physics exam graded",
                timestamp: "5 hours ago",
                type: "success"
              },
              {
                title: "System maintenance",
                description: "Scheduled downtime completed",
                timestamp: "1 day ago",
                type: "default",
                icon: <Settings className="h-4 w-4" />
              },
              {
                title: "New announcement",
                description: "Holiday schedule published",
                timestamp: "2 days ago",
                type: "default",
                icon: <Bell className="h-4 w-4" />
              }
            ]}
            maxItems={4}
            showAvatars={true}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Team & Performance Cards */}
      <DashboardSection title="Team & Performance Cards">
        <DashboardGrid columns={{ base: 1, md: 2 }} gap={6}>
          <TeamMembersCard
            title="Faculty Members"
            description="Active teaching staff"
            members={[
              {
                avatar: "/avatars/teacher1.png",
                name: "Dr. Sarah Johnson",
                role: "Mathematics Department Head",
                status: "active"
              },
              {
                avatar: "/avatars/teacher2.png",
                name: "Prof. Michael Chen",
                role: "Science Teacher",
                status: "active"
              },
              {
                avatar: "/avatars/teacher3.png",
                name: "Ms. Emily Brown",
                role: "English Teacher",
                status: "active"
              },
              {
                avatar: "/avatars/teacher4.png",
                name: "Mr. David Wilson",
                role: "Physical Education",
                status: "away"
              }
            ]}
            maxItems={4}
          />

          <TopPerformersCard
            title="Top Students"
            description="Highest academic achievers"
            performers={[
              {
                rank: 1,
                avatar: "/avatars/student1.png",
                name: "Emma Thompson",
                score: 98.5,
                badge: <Badge variant="default">🥇 1st</Badge>
              },
              {
                rank: 2,
                avatar: "/avatars/student2.png",
                name: "Liam Anderson",
                score: 97.2,
                badge: <Badge variant="secondary">🥈 2nd</Badge>
              },
              {
                rank: 3,
                avatar: "/avatars/student3.png",
                name: "Sophia Martinez",
                score: 96.8,
                badge: <Badge variant="secondary">🥉 3rd</Badge>
              },
              {
                rank: 4,
                avatar: "/avatars/student4.png",
                name: "Noah Davis",
                score: 95.5
              }
            ]}
            maxItems={4}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Task Management Cards */}
      <DashboardSection title="Task Management Cards">
        <DashboardGrid columns={{ base: 1, md: 2 }} gap={6}>
          <TaskListCard
            title="Today's Tasks"
            description="Pending assignments and activities"
            tasks={[
              {
                title: "Grade Math Exams",
                completed: true,
                priority: "high",
                dueDate: "2024-12-10"
              },
              {
                title: "Prepare Science Lesson",
                completed: false,
                priority: "high",
                dueDate: "2024-12-11"
              },
              {
                title: "Parent Meeting",
                completed: false,
                priority: "medium",
                dueDate: "2024-12-12"
              },
              {
                title: "Update Course Materials",
                completed: false,
                priority: "low",
                dueDate: "2024-12-15"
              }
            ]}
            maxItems={4}
          />

          <MultiStatCard
            title="Performance Metrics"
            stats={[
              { value: "94.2%", label: "Pass Rate", trend: { value: 2.1, direction: "up" } },
              { value: "3.85", label: "Avg GPA", trend: { value: 0.15, direction: "up" } },
              { value: "96.8%", label: "Attendance", trend: { value: 1.2, direction: "up" } },
              { value: "87%", label: "Satisfaction", trend: { value: 3, direction: "neutral" } }
            ]}
            columns={2}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* List & Stacked Cards */}
      <DashboardSection title="List & Stacked Cards">
        <DashboardGrid columns={{ base: 1, md: 2 }} gap={6}>
          <ListCard
            title="Quick Links"
            items={[
              {
                icon: <FileText className="h-4 w-4" />,
                title: "Academic Reports",
                subtitle: "View detailed reports",
                trailing: <Badge variant="outline">12 new</Badge>
              },
              {
                icon: <Calendar className="h-4 w-4" />,
                title: "Event Calendar",
                subtitle: "Upcoming school events",
                trailing: <Badge variant="outline">5 events</Badge>
              },
              {
                icon: <Users className="h-4 w-4" />,
                title: "Student Directory",
                subtitle: "Browse all students",
                trailing: <Badge variant="outline">4,812</Badge>
              },
              {
                icon: <Bell className="h-4 w-4" />,
                title: "Announcements",
                subtitle: "Important updates",
                trailing: <Badge variant="default">3 unread</Badge>
              }
            ]}
            maxItems={4}
          />

          <StackedStatCard
            title="Enrollment by Grade"
            stats={[
              { label: "Grade 9", value: 1245, color: "hsl(var(--chart-1))" },
              { label: "Grade 10", value: 1189, color: "hsl(var(--chart-2))" },
              { label: "Grade 11", value: 1098, color: "hsl(var(--chart-3))" },
              { label: "Grade 12", value: 1280, color: "hsl(var(--chart-4))" }
            ]}
            total={4812}
            showPercentages
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Banner & Special Cards */}
      <DashboardSection title="Banner & Special Cards">
        <div className="space-y-4">
          <BannerCard
            title="🎉 Academic Year 2024-2025 Enrollment Open"
            description="Register now for the upcoming academic year. Early bird discount available until December 31st."
            action={<Button>Enroll Now</Button>}
            variant="primary"
          />

          <BannerCard
            title="🔔 Important: Parent-Teacher Conference"
            description="Schedule your meeting slots for the upcoming conference on December 20-22, 2024."
            action={<Button variant="outline">Schedule Meeting</Button>}
            variant="warning"
          />

          <BannerCard
            title="✅ System Maintenance Complete"
            description="All systems are now operational. Thank you for your patience."
            variant="success"
          />
        </div>
      </DashboardSection>

      {/* Loading State Demo */}
      <DashboardSection title="Loading State Cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={5} />
        </DashboardGrid>
      </DashboardSection>
    </div>
  )
}
