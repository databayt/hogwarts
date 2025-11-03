"use client"

import * as React from "react"
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Target,
  Award,
  Calendar,
  Clock,
  Bell,
  MessageSquare,
  ThumbsUp,
  Star,
  MapPin,
  Cloud,
  Sun,
  Moon,
  Zap,
  Heart,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Info,
  Mail,
  Phone,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"

import {
  // Enhanced Cards (5)
  StatCard,
  ProgressCard,
  ListCard,
  MultiStatCard,
  ChartCard,
  // New Variants (7)
  HeroStatCard,
  ActionCard,
  ComparisonCard,
  MediaCard,
  CollapsibleCard,
  EmptyStateCard,
  SkeletonCard,
  // Modern 2025 Patterns (12)
  FlipCard,
  MetricCard,
  NotificationCard,
  TimelineCard,
  ProfileCard,
  GoalCard,
  WeatherCard,
  CalendarCard,
  QuickActionCard,
  SocialCard,
  GlanceCard,
  IconStatCard,
  // shadcn Dashboard Patterns (8)
  RecentSalesCard,
  ActivityFeedCard,
  TeamMembersCard,
  TopPerformersCard,
  TaskListCard,
  DataTableCard,
  StackedStatCard,
  BannerCard,
  // Layout Components
  DashboardShell,
  DashboardSection,
  DashboardGrid,
} from "@/components/atom/dashboard"

export function DashboardCardsShowcase() {
  return (
    <DashboardShell>
      {/* Enhanced Cards Section (5 cards) */}
      <DashboardSection title="Enhanced Cards" description="5 original cards with size, loading, and onClick features">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }}>
          <StatCard
            value="2,543"
            label="Total Students"
            icon={<Users className="size-4" />}
            trend={{ value: 12.5, direction: "up" }}
            variant="primary"
          />

          <ProgressCard
            value={75}
            label="Course Completion"
            variant="success"
            size="md"
          />

          <ListCard
            title="Recent Activities"
            items={[
              { icon: <Activity className="size-4" />, title: "Student enrolled", subtitle: "2 minutes ago" },
              { icon: <CheckCircle2 className="size-4" />, title: "Assignment submitted", subtitle: "15 minutes ago" },
              { icon: <Bell className="size-4" />, title: "New announcement", subtitle: "1 hour ago" },
            ]}
          />

          <MultiStatCard
            stats={[
              { value: "1,234", label: "Active Users", trend: { value: 5.2, direction: "up" } },
              { value: "567", label: "New This Week", trend: { value: 8.1, direction: "up" } },
              { value: "89%", label: "Satisfaction", trend: { value: 2.3, direction: "up" } },
            ]}
          />

          <ChartCard
            title="Revenue Growth"
            chart={
              <div className="h-48 flex items-end gap-1">
                {[30, 40, 35, 50, 49, 60, 70, 91, 85, 95, 100, 110].map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/20 rounded-t transition-all hover:bg-primary/40"
                    style={{ height: `${value}%` }}
                  />
                ))}
              </div>
            }
          />
        </DashboardGrid>
      </DashboardSection>

      {/* New Variants Section (7 cards) */}
      <DashboardSection title="New Variants" description="7 specialized card types">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }}>
          <HeroStatCard
            value="$45,231"
            label="Total Revenue"
            icon={<DollarSign className="size-6" />}
            trend={{ value: 20.1, direction: "up" }}
            variant="success"
          />

          <ActionCard
            title="Create New Course"
            description="Start building your next amazing course"
            icon={<BookOpen className="size-5" />}
            action={
              <Button onClick={() => console.log("Create course clicked")}>
                Get Started
              </Button>
            }
          />

          <ComparisonCard
            title="Performance Metrics"
            metrics={[
              { label: "Current Month", value: "$12,345", variant: "success" },
              { label: "Last Month", value: "$10,234", variant: "default" },
              { label: "Difference", value: "+20.6%", variant: "primary" },
            ]}
          />

          <MediaCard
            media={
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <Activity className="size-12 text-white" />
              </div>
            }
            title="Featured Course"
            subtitle="Advanced React Patterns"
            trailing={<span className="font-semibold">$99</span>}
          />

          <CollapsibleCard
            title="Course Modules"
            defaultExpanded={true}
          >
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                <span>Introduction to React</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                <span>State Management</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-4 text-gray-400" />
                <span>Advanced Patterns</span>
              </li>
            </ul>
          </CollapsibleCard>

          <EmptyStateCard
            icon={<Users className="size-12" />}
            title="No Students Yet"
            description="Start by inviting students to your course"
            actionText="Invite Students"
            onAction={() => console.log("Invite clicked")}
          />

          <SkeletonCard layout="stat" />
        </DashboardGrid>
      </DashboardSection>

      {/* Modern 2025 Patterns Section (12 cards) */}
      <DashboardSection title="Modern 2025 Patterns" description="12 interactive and engaging card designs">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }}>
          <FlipCard
            front={
              <div className="flex h-full flex-col items-center justify-center gap-2">
                <DollarSign className="size-8 text-primary" />
                <div className="text-3xl font-bold">$45,231</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            }
            back={
              <div className="flex h-full flex-col justify-center space-y-3 p-4">
                <h4 className="font-semibold">Revenue Breakdown</h4>
                <div className="flex justify-between">
                  <span className="text-sm">Subscriptions</span>
                  <span className="text-sm font-medium">$30,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">One-time</span>
                  <span className="text-sm font-medium">$15,231</span>
                </div>
              </div>
            }
          />

          <MetricCard
            value="12,345"
            label="Active Students"
            data={[30, 40, 35, 50, 49, 60, 70, 91]}
            trend={{ value: 15.3, direction: "up" }}
            variant="primary"
          />

          <NotificationCard
            title="New Assignment"
            message="Math homework is due tomorrow"
            type="warning"
            onDismiss={() => console.log("Dismissed")}
          />

          <div className="space-y-2">
            <TimelineCard
              title="Course Created"
              timestamp="2024-01-15"
              icon={<BookOpen className="size-4" />}
            />
            <TimelineCard
              title="First Student Enrolled"
              timestamp="2024-01-16"
              icon={<Users className="size-4" />}
            />
            <TimelineCard
              title="Assignment Posted"
              timestamp="2024-01-17"
              icon={<CheckCircle2 className="size-4" />}
              showConnector={false}
            />
          </div>

          <ProfileCard
            name="John Doe"
            role="Senior Teacher"
            avatar={
              <div className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                JD
              </div>
            }
            info="john.doe@hogwarts.edu"
          />

          <GoalCard
            title="Course Completion"
            current={750}
            target={1000}
            unit="students"
          />

          <WeatherCard
            icon={<Cloud className="size-8" />}
            temperature="24°C"
            location="New York"
            condition="Partly Cloudy"
            stats={[
              { label: "Humidity", value: "65%" },
              { label: "Wind", value: "12 km/h" },
            ]}
          />

          <CalendarCard
            title="Team Meeting"
            date="2024-01-20"
            time="10:00 AM - 11:00 AM"
            location="Conference Room A"
            description="Monthly team sync and planning session"
          />

          <QuickActionCard
            actions={[
              { icon: <Users className="size-4" />, label: "Add Student", onClick: () => {} },
              { icon: <BookOpen className="size-4" />, label: "New Course", onClick: () => {} },
              { icon: <Bell className="size-4" />, label: "Send Notice", onClick: () => {} },
              { icon: <Settings className="size-4" />, label: "Settings", onClick: () => {} },
            ]}
          />

          <SocialCard
            title="Social Engagement"
            metrics={[
              { type: "followers", value: "12.5K", trend: { value: 5.2, isPositive: true } },
              { type: "likes", value: 1234 },
              { type: "shares", value: 567 },
              { type: "comments", value: 89 },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <GlanceCard
              icon={<Users className="size-4" />}
              label="Students"
              value="2,543"
              variant="primary"
            />
            <GlanceCard
              icon={<BookOpen className="size-4" />}
              label="Courses"
              value="48"
              variant="success"
            />
            <GlanceCard
              icon={<Award className="size-4" />}
              label="Certificates"
              value="1,234"
              variant="warning"
            />
            <GlanceCard
              icon={<Star className="size-4" />}
              label="Rating"
              value="4.8"
              variant="danger"
            />
          </div>

          <IconStatCard
            icon={<TrendingUp className="size-6" />}
            value="94.5%"
            label="Success Rate"
            trend={{ value: 3.2, direction: "up" }}
            variant="success"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* shadcn Dashboard Patterns Section (8 cards) */}
      <DashboardSection title="shadcn Dashboard Patterns" description="8 advanced dashboard card patterns">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }}>
          <RecentSalesCard
            sales={[
              { name: "John Smith", email: "john@example.com", amount: "$1,999" },
              { name: "Emma Wilson", email: "emma@example.com", amount: "$1,499" },
              { name: "Michael Brown", email: "michael@example.com", amount: "$999" },
              { name: "Sarah Davis", email: "sarah@example.com", amount: "$799" },
            ]}
          />

          <ActivityFeedCard
            title="Recent Activity"
            activities={[
              { title: "John Doe", description: "Completed Math Assignment", timestamp: "2 min ago", type: "success" },
              { title: "Jane Smith", description: "Enrolled in Physics Course", timestamp: "15 min ago", type: "default" },
              { title: "Bob Johnson", description: "Submitted Final Project", timestamp: "1 hour ago", type: "default" },
            ]}
          />

          <TeamMembersCard
            members={[
              { name: "Alice Cooper", role: "Math Teacher", avatar: "/placeholder.jpg", status: "online" },
              { name: "Bob Wilson", role: "Science Teacher", avatar: "/placeholder.jpg", status: "offline" },
              { name: "Carol Martinez", role: "English Teacher", avatar: "/placeholder.jpg", status: "online" },
            ]}
          />

          <TopPerformersCard
            performers={[
              { rank: 1, name: "Emma Watson", score: 98, change: "+2" },
              { rank: 2, name: "Daniel Radcliffe", score: 96, change: "0" },
              { rank: 3, name: "Rupert Grint", score: 94, change: "-1" },
            ]}
          />

          <TaskListCard
            tasks={[
              { id: "1", title: "Review assignments", completed: true, dueDate: "Today" },
              { id: "2", title: "Prepare lecture notes", completed: false, dueDate: "Tomorrow" },
              { id: "3", title: "Grade exams", completed: false, dueDate: "Jan 25" },
            ]}
            onToggle={(id) => console.log("Toggle task:", id)}
          />

          <DataTableCard
            title="Student Performance"
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Score", accessor: "score" },
              { header: "Grade", accessor: "grade" },
            ]}
            data={[
              { name: "Alice", score: 95, grade: "A" },
              { name: "Bob", score: 88, grade: "B+" },
              { name: "Charlie", score: 92, grade: "A-" },
            ]}
          />

          <StackedStatCard
            title="Overall Statistics"
            stats={[
              { label: "Total Students", value: "2,543", icon: <Users className="size-4" /> },
              { label: "Active Courses", value: "48", icon: <BookOpen className="size-4" /> },
              { label: "Avg. Rating", value: "4.8", icon: <Star className="size-4" /> },
              { label: "Completion", value: "87%", icon: <Target className="size-4" /> },
            ]}
          />

          <BannerCard
            variant="success"
            icon={<CheckCircle2 className="size-6" />}
            title="Success!"
            description="All students have completed the course requirements"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Loading States Demo */}
      <DashboardSection title="Loading States" description="Skeleton loading examples">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 4 }}>
          <SkeletonCard layout="stat" />
          <SkeletonCard layout="list" />
          <SkeletonCard layout="chart" />
          <SkeletonCard layout="progress" />
        </DashboardGrid>
      </DashboardSection>

      {/* Interactive States Demo */}
      <DashboardSection title="Interactive States" description="Hoverable and clickable cards">
        <DashboardGrid columns={{ base: 1, md: 2, lg: 3 }}>
          <StatCard
            value="Click Me!"
            label="Clickable Card"
            icon={<Zap className="size-4" />}
            hoverable
            onClick={() => alert("Card clicked!")}
          />

          <MetricCard
            value="Hover Me!"
            label="Hoverable Card"
            data={[30, 40, 35, 50, 49, 60, 70, 91]}
            onClick={() => alert("Metric card clicked!")}
          />

          <ActionCard
            title="Action Required"
            description="Click the button to perform an action"
            icon={<AlertCircle className="size-5" />}
            action={
              <Button onClick={() => alert("Action button clicked!")}>
                Take Action
              </Button>
            }
            variant="warning"
          />
        </DashboardGrid>
      </DashboardSection>
    </DashboardShell>
  )
}
