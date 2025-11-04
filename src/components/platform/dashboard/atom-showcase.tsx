"use client"

import {
  DashboardShell,
  DashboardSection,
  DashboardGrid,
  StatCard,
  ProgressCard,
  ListCard,
  MultiStatCard,
  ChartCard,
  HeroStatCard,
  ActionCard,
  ComparisonCard,
  MediaCard,
  EmptyStateCard,
  FlipCard,
  MetricCard,
  NotificationCard,
  TimelineCard,
  ProfileCard,
  GoalCard,
  QuickActionCard,
  GlanceCard,
  IconStatCard,
  RecentSalesCard,
  ActivityFeedCard,
  TeamMembersCard,
  TopPerformersCard,
  TaskListCard,
  StackedStatCard,
  BannerCard,
  CollapsibleCard
} from "@/components/atom/dashboard"
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Calendar,
  CheckCircle,
  UserPlus,
  Plus,
  Upload,
  Share,
  Download,
  FileText,
  Clock,
  DollarSign,
  Award,
  Target,
  Zap,
  Sun,
  Bell,
  MessageSquare,
  Heart,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function DashboardAtomShowcase() {
  return (
    <DashboardShell spacing="default" maxWidth="full">
      {/* Banner Card */}
      <BannerCard
        variant="info"
        title="🎨 Dashboard Atom Components Showcase"
        description="Explore 32 reusable dashboard card components with semantic tokens, RTL support, and full accessibility."
        dismissible={false}
      />

      {/* Hero Section - Large KPIs */}
      <DashboardSection
        title="Hero Cards"
        description="Large prominent metrics for dashboard heroes"
      >
        <DashboardGrid columns={{ base: 1, md: 2, lg: 4 }}>
          <HeroStatCard
            icon={<Users className="h-12 w-12" />}
            value="4,812"
            label="Total Students"
            subtitle="Across all grade levels"
            trend={{ value: 12, direction: "up" }}
            variant="primary"
          />
          <HeroStatCard
            icon={<GraduationCap className="h-12 w-12" />}
            value="248"
            label="Teachers"
            subtitle="Active faculty members"
            trend={{ value: 5, direction: "up" }}
            variant="success"
          />
          <HeroStatCard
            icon={<BookOpen className="h-12 w-12" />}
            value="156"
            label="Active Classes"
            subtitle="This semester"
            variant="default"
          />
          <HeroStatCard
            icon={<Award className="h-12 w-12" />}
            value="94%"
            label="Attendance Rate"
            subtitle="This month"
            trend={{ value: 2, direction: "up" }}
            variant="success"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Standard Stat Cards */}
      <DashboardSection
        title="Stat Cards"
        description="Standard single metric displays with trends"
      >
        <DashboardGrid columns={{ base: 1, md: 2, lg: 4 }}>
          <StatCard
            icon={<Users />}
            value="1,234"
            label="Active Users"
            trend={{ value: 12, direction: "up" }}
            variant="primary"
            size="md"
          />
          <StatCard
            icon={<TrendingUp />}
            value="$45,678"
            label="Revenue"
            trend={{ value: 23, direction: "up" }}
            variant="success"
            size="md"
          />
          <StatCard
            icon={<Calendar />}
            value="23"
            label="Events This Week"
            variant="default"
            size="md"
          />
          <StatCard
            icon={<Clock />}
            value="89"
            label="Pending Tasks"
            trend={{ value: 5, direction: "down" }}
            variant="warning"
            size="md"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Glance Cards - Compact */}
      <DashboardSection
        title="Glance Cards"
        description="Minimal quick-glance metrics"
      >
        <DashboardGrid columns={{ base: 2, md: 4, lg: 6 }}>
          <GlanceCard
            icon={<Users className="h-4 w-4" />}
            label="Online"
            value={234}
            variant="primary"
          />
          <GlanceCard
            icon={<Bell className="h-4 w-4" />}
            label="Alerts"
            value={12}
            variant="warning"
          />
          <GlanceCard
            icon={<CheckCircle className="h-4 w-4" />}
            label="Completed"
            value={456}
            variant="success"
          />
          <GlanceCard
            icon={<Target className="h-4 w-4" />}
            label="Goals"
            value={8}
            variant="default"
          />
          <GlanceCard
            icon={<Zap className="h-4 w-4" />}
            label="Active"
            value={92}
            unit="%"
            variant="primary"
          />
          <GlanceCard
            icon={<Award className="h-4 w-4" />}
            label="Points"
            value="2.4K"
            variant="success"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Progress & Goal Cards */}
      <DashboardSection
        title="Progress & Goals"
        description="Progress tracking and goal completion"
      >
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }}>
          <ProgressCard
            icon={<CheckCircle />}
            label="Course Completion"
            value={75}
            max={100}
            variant="success"
            size="md"
          />
          <ProgressCard
            icon={<Target />}
            label="Enrollment Goal"
            value={4812}
            max={5000}
            variant="primary"
            size="md"
          />
          <GoalCard
            title="Revenue Target"
            current={45678}
            target={60000}
            unit="USD"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Metric Cards with Sparklines */}
      <DashboardSection
        title="Metric Cards"
        description="Statistics with inline trend visualizations"
      >
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }}>
          <MetricCard
            value="$45,678"
            label="Total Revenue"
            data={[120, 150, 170, 130, 190, 210, 230]}
            trend={{ value: 23, direction: "up" }}
            variant="success"
            size="md"
          />
          <MetricCard
            value="1,234"
            label="New Students"
            data={[50, 60, 55, 70, 65, 80, 75]}
            trend={{ value: 12, direction: "up" }}
            variant="primary"
            size="md"
          />
          <MetricCard
            value="94%"
            label="Success Rate"
            data={[85, 88, 90, 87, 92, 94, 94]}
            trend={{ value: 5, direction: "up" }}
            variant="success"
            size="md"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Multi-Stat & Stacked Cards */}
      <DashboardSection
        title="Multi-Stat Cards"
        description="Multiple metrics in one card"
      >
        <DashboardGrid columns={{ base: 1, md: 2 }}>
          <MultiStatCard
            title="Class Overview"
            stats={[
              { value: 28, label: "Total Students", trend: { value: 2, direction: "up" } },
              { value: "94%", label: "Attendance" },
              { value: 12, label: "Pending Assignments" }
            ]}
            columns={3}
            size="md"
          />
          <StackedStatCard
            title="Quick Stats"
            stats={[
              {
                label: "Total Revenue",
                value: "$45,678",
                icon: <DollarSign className="h-4 w-4" />,
                trend: { value: 12, direction: "up" },
                variant: "success"
              },
              {
                label: "Active Users",
                value: 1234,
                icon: <Users className="h-4 w-4" />,
                trend: { value: 5, direction: "up" },
                variant: "primary"
              },
              {
                label: "Pending Tasks",
                value: 23,
                unit: "items",
                icon: <Clock className="h-4 w-4" />,
                variant: "warning"
              }
            ]}
            showDividers={true}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Comparison Cards */}
      <DashboardSection
        title="Comparison Cards"
        description="Compare metrics across periods"
      >
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }}>
          <ComparisonCard
            title="Student Attendance"
            metrics={[
              { label: "This Week", value: 94, variant: "success" },
              { label: "Last Week", value: 89, variant: "default" }
            ]}
            change={{ value: 5, direction: "up" }}
          />
          <ComparisonCard
            title="Exam Performance"
            metrics={[
              { label: "Current Semester", value: 87, variant: "success" },
              { label: "Previous Semester", value: 82, variant: "default" }
            ]}
            change={{ value: 5, direction: "up" }}
          />
          <ComparisonCard
            title="Teacher Workload"
            metrics={[
              { label: "This Month", value: 78, variant: "warning" },
              { label: "Last Month", value: 85, variant: "default" }
            ]}
            change={{ value: 7, direction: "down" }}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Icon Stat Cards */}
      <DashboardSection
        title="Icon-First Cards"
        description="Centered icon-first statistics"
      >
        <DashboardGrid columns={{ base: 1, md: 2, lg: 4 }}>
          <IconStatCard
            icon={<TrendingUp className="h-8 w-8" />}
            value="87.5%"
            label="Success Rate"
            badge={<Badge variant="outline">Live</Badge>}
            variant="success"
          />
          <IconStatCard
            icon={<Users className="h-8 w-8" />}
            value="4,812"
            label="Students"
            variant="primary"
          />
          <IconStatCard
            icon={<Award className="h-8 w-8" />}
            value="156"
            label="Awards"
            variant="default"
          />
          <IconStatCard
            icon={<Target className="h-8 w-8" />}
            value="92%"
            label="Goals Met"
            variant="success"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* List Cards */}
      <DashboardSection
        title="List Cards"
        description="Activity feeds and item lists"
      >
        <DashboardGrid columns={{ base: 1, md: 2 }}>
          <ListCard
            title="Recent Activity"
            items={[
              {
                icon: <UserPlus />,
                title: "New student enrolled",
                subtitle: "2 minutes ago",
                trailing: <Badge variant="outline">New</Badge>
              },
              {
                icon: <FileText />,
                title: "Exam paper submitted",
                subtitle: "15 minutes ago",
                trailing: <Badge variant="outline">Pending</Badge>
              },
              {
                icon: <CheckCircle />,
                title: "Assignment graded",
                subtitle: "1 hour ago",
                trailing: <Badge variant="outline">Complete</Badge>
              }
            ]}
            action={<Button variant="ghost" size="sm">View All</Button>}
            maxItems={5}
          />

          <ActivityFeedCard
            title="System Activity"
            description="Latest system updates"
            activities={[
              {
                title: "John Doe",
                description: "Created a new exam paper",
                timestamp: "2 hours ago",
                type: "success"
              },
              {
                title: "System",
                description: "Backup completed successfully",
                timestamp: "5 hours ago",
                type: "success",
                icon: <CheckCircle className="h-4 w-4" />
              },
              {
                title: "Jane Smith",
                description: "Updated course materials",
                timestamp: "1 day ago",
                type: "success"
              }
            ]}
            maxItems={5}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Timeline Cards */}
      <DashboardSection
        title="Timeline Cards"
        description="Event timelines and activity logs"
      >
        <div className="space-y-0">
          <TimelineCard
            icon={<CheckCircle className="h-5 w-5 text-chart-2" />}
            title="Assignment Submitted"
            description="John Doe submitted Math Homework #5"
            timestamp="2 hours ago"
            showConnector={true}
          />
          <TimelineCard
            icon={<FileText className="h-5 w-5 text-chart-1" />}
            title="Exam Created"
            description="Created Final Exam for Physics 101"
            timestamp="5 hours ago"
            showConnector={true}
          />
          <TimelineCard
            icon={<Award className="h-5 w-5 text-chart-3" />}
            title="Achievement Unlocked"
            description="Student earned Perfect Attendance badge"
            timestamp="1 day ago"
            showConnector={false}
          />
        </div>
      </DashboardSection>

      {/* Profile & Team Cards */}
      <DashboardSection
        title="Profile & Team Cards"
        description="User profiles and team members"
      >
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }}>
          <ProfileCard
            avatar={<Avatar><AvatarFallback>SJ</AvatarFallback></Avatar>}
            name="Sarah Johnson"
            role="Mathematics Teacher"
            info="sarah.j@school.edu"
            actions={
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Message</Button>
                <Button size="sm">Profile</Button>
              </div>
            }
          />

          <MediaCard
            media={<Avatar><AvatarFallback>JD</AvatarFallback></Avatar>}
            title="John Doe"
            subtitle="Science Teacher"
            trailing={<Badge>Active</Badge>}
          />

          <MediaCard
            media={<Avatar><AvatarFallback>EM</AvatarFallback></Avatar>}
            title="Emily Martinez"
            subtitle="Principal"
            trailing={<Badge>Admin</Badge>}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Team Members Card */}
      <DashboardSection title="Team Members">
        <TeamMembersCard
          title="Faculty Team"
          description="8 members online"
          members={[
            {
              name: "Sarah Johnson",
              role: "Mathematics Teacher",
              status: "online",
              badge: <Badge variant="outline">Lead</Badge>
            },
            {
              name: "John Smith",
              role: "Science Teacher",
              status: "busy"
            },
            {
              name: "Emily Davis",
              role: "English Teacher",
              status: "online"
            }
          ]}
          maxItems={10}
          showStatus={true}
        />
      </DashboardSection>

      {/* Top Performers */}
      <DashboardSection title="Rankings & Performance">
        <DashboardGrid columns={{ base: 1, lg: 2 }}>
          <TopPerformersCard
            title="Top Students"
            description="This month's leaders"
            performers={[
              {
                rank: 1,
                name: "Sarah Johnson",
                subtitle: "Grade 10A",
                value: 98,
                unit: "%",
                progress: 98
              },
              {
                rank: 2,
                name: "John Smith",
                subtitle: "Grade 10B",
                value: 95,
                unit: "%",
                progress: 95
              },
              {
                rank: 3,
                name: "Emily Davis",
                subtitle: "Grade 10A",
                value: 93,
                unit: "%",
                progress: 93
              }
            ]}
            showProgress={true}
            showMedals={true}
            maxItems={5}
          />

          <RecentSalesCard
            title="Recent Payments"
            description="Latest fee payments"
            sales={[
              {
                name: "Olivia Martin",
                email: "olivia.martin@email.com",
                amount: "+$1,999.00"
              },
              {
                name: "Jackson Lee",
                email: "jackson.lee@email.com",
                amount: "+$599.00",
                badge: <Badge variant="outline">New</Badge>
              },
              {
                name: "Isabella Wilson",
                email: "isabella.w@email.com",
                amount: "+$299.00"
              }
            ]}
            maxItems={5}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Task List */}
      <DashboardSection title="Task Management">
        <TaskListCard
          title="Today's Tasks"
          description="5 of 8 completed"
          tasks={[
            {
              id: "1",
              title: "Review exam papers",
              description: "Grade Math exam for Class 10A",
              completed: false,
              dueDate: "Today",
              priority: "high"
            },
            {
              id: "2",
              title: "Prepare lesson plan",
              completed: true,
              priority: "medium"
            },
            {
              id: "3",
              title: "Update attendance records",
              completed: false,
              priority: "medium"
            }
          ]}
          onToggle={(id) => console.log("Toggle task:", id)}
          showProgress={true}
        />
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection
        title="Action Cards"
        description="Call-to-action and quick actions"
      >
        <DashboardGrid columns={{ base: 1, md: 2 }}>
          <ActionCard
            icon={<FileText />}
            title="Create Your First Exam"
            description="Generate exam papers with AI in minutes"
            action={<Button>Get Started</Button>}
            variant="primary"
          />

          <QuickActionCard
            title="Quick Actions"
            actions={[
              {
                icon: <Plus className="h-5 w-5" />,
                label: "Create New",
                onClick: () => console.log("Create")
              },
              {
                icon: <Upload className="h-5 w-5" />,
                label: "Upload",
                onClick: () => console.log("Upload")
              },
              {
                icon: <Share className="h-5 w-5" />,
                label: "Share",
                onClick: () => console.log("Share")
              },
              {
                icon: <Download className="h-5 w-5" />,
                label: "Export",
                onClick: () => console.log("Export")
              }
            ]}
            columns={2}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Notifications */}
      <DashboardSection
        title="Notifications"
        description="Alert cards with different severity levels"
      >
        <div className="space-y-4">
          <NotificationCard
            type="success"
            title="Exam Published Successfully"
            message="Your exam is now available to students"
            dismissible
            onDismiss={() => console.log("dismissed")}
          />
          <NotificationCard
            type="info"
            title="System Update Available"
            message="A new version is ready to install"
            dismissible
          />
          <NotificationCard
            type="warning"
            title="Low Storage Warning"
            message="You have used 85% of your storage quota"
            dismissible
          />
        </div>
      </DashboardSection>

      {/* Empty State */}
      <DashboardSection title="Empty States">
        <EmptyStateCard
          icon={<FileText className="h-12 w-12" />}
          title="No Exams Yet"
          description="Create your first exam to get started with the platform"
          action={<Button>Create Exam</Button>}
        />
      </DashboardSection>

      {/* Interactive Cards */}
      <DashboardSection
        title="Interactive Cards"
        description="Collapsible and flip cards"
      >
        <DashboardGrid columns={{ base: 1, md: 2 }}>
          <CollapsibleCard
            title="Recent Activity Details"
            summary={<p className="muted">Click to expand and view 12 activities</p>}
            defaultOpen={false}
          >
            <div className="space-y-2 p-4">
              <p>Activity item 1</p>
              <p>Activity item 2</p>
              <p>Activity item 3</p>
            </div>
          </CollapsibleCard>

          <FlipCard
            front={
              <div className="space-y-2 text-center p-8">
                <Sun className="h-12 w-12 mx-auto text-chart-3" />
                <h3>Front Side</h3>
                <p className="muted">Hover or click to flip</p>
              </div>
            }
            back={
              <div className="space-y-2 text-center p-8">
                <Award className="h-12 w-12 mx-auto text-chart-2" />
                <h3>Back Side</h3>
                <p className="muted">Additional details here</p>
              </div>
            }
            clickToFlip={true}
            size="lg"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Footer Banner */}
      <BannerCard
        variant="success"
        title="✨ All Components Built with Semantic Tokens"
        description="100% theme support • RTL/LTR ready • WCAG AA accessible • TypeScript strict mode"
        dismissible={false}
      />
    </DashboardShell>
  )
}
