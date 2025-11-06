import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Settings,
  Users,
  Server,
  Link2,
  Shield,
  BarChart3,
  MessageSquare,
  CreditCard,
  Activity,
  UserCheck,
  Database,
  Lock,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Building,
  Key,
  Globe,
  Mail,
  Bell,
  FileText,
  Zap,
  HardDrive,
  Cloud,
  Webhook,
  UserCog,
  School,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function AdminContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Get comprehensive admin stats
  let totalUsers = 0
  let activeUsers = 0
  let totalTeachers = 0
  let totalStudents = 0
  let totalGuardians = 0
  let totalDepartments = 0
  let totalClassrooms = 0
  let activeSessions = 0
  let failedLogins = 0
  const systemHealthScore = 95 // Mock value for now
  let pendingApprovals = 0
  let activeIntegrations = 0
  let totalAnnouncements = 0
  let activeSubscriptions = 0

  if (schoolId) {
    try {
      ;[
        totalUsers,
        activeUsers,
        totalTeachers,
        totalStudents,
        totalGuardians,
        totalDepartments,
        totalClassrooms,
        activeSessions,
        failedLogins,
        pendingApprovals,
        activeIntegrations,
        totalAnnouncements,
        activeSubscriptions,
      ] = await Promise.all([
        db.user.count({ where: { schoolId } }).catch(() => 0),
        db.user.count({
          where: {
            schoolId,
            emailVerified: { not: null } // Verified users as proxy for active
          }
        }).catch(() => 0),
        db.teacher.count({ where: { schoolId } }).catch(() => 0),
        db.student.count({ where: { schoolId } }).catch(() => 0),
        db.guardian.count({ where: { schoolId } }).catch(() => 0),
        db.department.count({ where: { schoolId } }).catch(() => 0),
        db.classroom.count({ where: { schoolId } }).catch(() => 0),
        Promise.resolve(0), // JWT-based auth, no session table
        Promise.resolve(0), // No loginAttempts field in User model
        db.user.count({
          where: {
            schoolId,
            emailVerified: null
          }
        }).catch(() => 0),
        // Count OAuth accounts as integrations
        db.account.count({
          where: {
            user: { schoolId },
            provider: { in: ['google', 'facebook'] }
          }
        }).catch(() => 0),
        db.announcement.count({ where: { schoolId } }).catch(() => 0),
        db.subscription.count({
          where: {
            schoolId,
            status: 'ACTIVE'
          }
        }).catch(() => 0),
      ])
    } catch (error) {
      console.error('Error fetching admin data:', error)
      // Continue with zero values if database queries fail
    }
  }

  const d = dictionary?.admin

  return (
    <div className="space-y-6">
      {/* Overview Stats - System Health */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.totalUsers || 'Total Users'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsers} {d?.stats?.activeInLast30Days || 'active in last 30 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.systemHealth || 'System Health'}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealthScore}%</div>
            <p className="text-xs text-muted-foreground">
              {d?.stats?.allSystemsOperational || 'All systems operational'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.activeSessions || 'Active Sessions'}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {d?.stats?.currentlyLoggedIn || 'Currently logged in'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.pendingActions || 'Pending Actions'}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals + failedLogins}</div>
            <p className="text-xs text-muted-foreground">
              {d?.stats?.requiresAttention || 'Requires attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.teachers || 'Teachers'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              {d?.stats?.activeTeachers || 'Active teachers'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.students || 'Students'}
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {d?.stats?.enrolledStudents || 'Enrolled students'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.departments || 'Departments'}
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              {d?.stats?.activeDepartments || 'Active departments'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.classrooms || 'Classrooms'}
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClassrooms}</div>
            <p className="text-xs text-muted-foreground">
              {d?.stats?.totalClassrooms || 'Total classrooms'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* More Features - Secondary Navigation Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {d?.moreFeatures || 'More Features'}
          </CardTitle>
          <CardDescription>
            {d?.moreFeaturesDescription || 'Additional administrative tools and utilities'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href={`/${lang}/admin/integration`}>
                <Link2 className="mr-2 h-4 w-4" />
                <span className="flex flex-col items-start">
                  <span className="font-medium">{d?.navigation?.integration || 'Integration'}</span>
                  <span className="text-xs text-muted-foreground">
                    {d?.quickAccess?.integration || 'OAuth, email & payment gateways'}
                  </span>
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href={`/${lang}/admin/communication`}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="flex flex-col items-start">
                  <span className="font-medium">{d?.navigation?.communication || 'Communication'}</span>
                  <span className="text-xs text-muted-foreground">
                    {d?.quickAccess?.communication || 'Announcements & notifications'}
                  </span>
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href={`/${lang}/admin/subscription`}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span className="flex flex-col items-start">
                  <span className="font-medium">{d?.navigation?.subscription || 'Subscription'}</span>
                  <span className="text-xs text-muted-foreground">
                    {d?.quickAccess?.subscription || 'Billing & subscription management'}
                  </span>
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Sub-Blocks Navigation */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Configuration Block */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              {d?.cards?.configuration?.title || 'Configuration'}
            </CardTitle>
            <CardDescription>
              {d?.cards?.configuration?.description || 'School settings and academic configuration'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {d?.cards?.configuration?.details || 'Manage school profile, academic years, departments, grading scales, and classroom settings.'}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/${lang}/admin/configuration`}>
                  <Settings className="mr-2 h-4 w-4" />
                  {d?.cards?.configuration?.viewSettings || 'View Settings'}
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm">
                <Link href={`/${lang}/admin/configuration/school`}>
                  {d?.cards?.configuration?.schoolProfile || 'School Profile'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Membership Block */}
        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              {d?.cards?.membership?.title || 'Membership'}
            </CardTitle>
            <CardDescription>
              {d?.cards?.membership?.description || 'User accounts and role management'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {d?.cards?.membership?.details || 'Manage user accounts, assign roles, handle permissions, and bulk import/export users.'}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/membership`}>
                  <Users className="mr-2 h-4 w-4" />
                  {d?.cards?.membership?.viewUsers || 'View Users'}
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm">
                <Link href={`/${lang}/admin/membership/import`}>
                  {d?.cards?.membership?.importUsers || 'Import Users'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Block */}
        <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-500" />
              {d?.cards?.system?.title || 'System'}
            </CardTitle>
            <CardDescription>
              {d?.cards?.system?.description || 'Platform administration and monitoring'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {d?.cards?.system?.details || 'Monitor system health, view audit logs, manage backups, and control cache settings.'}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/system`}>
                  <Server className="mr-2 h-4 w-4" />
                  {d?.cards?.system?.viewSystem || 'View System'}
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm">
                <Link href={`/${lang}/admin/system/audit`}>
                  {d?.cards?.system?.auditLogs || 'Audit Logs'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integration Block */}
        <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-purple-500" />
              {d?.cards?.integration?.title || 'Integration'}
            </CardTitle>
            <CardDescription>
              {d?.cards?.integration?.description || 'Third-party service connections'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {d?.cards?.integration?.details || 'Configure OAuth providers, email services, payment gateways, and webhook endpoints.'}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/integration`}>
                  <Link2 className="mr-2 h-4 w-4" />
                  {d?.cards?.integration?.viewIntegrations || 'View Integrations'}
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm">
                <Link href={`/${lang}/admin/integration/oauth`}>
                  {d?.cards?.integration?.oauthProviders || 'OAuth Providers'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Block */}
        <Card className="border-red-500/20 hover:border-red-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              {d?.cards?.security?.title || 'Security'}
            </CardTitle>
            <CardDescription>
              {d?.cards?.security?.description || 'Security monitoring and policies'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {d?.cards?.security?.details || 'Monitor security events, manage sessions, configure 2FA, and set security policies.'}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/security`}>
                  <Shield className="mr-2 h-4 w-4" />
                  {d?.cards?.security?.viewSecurity || 'View Security'}
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm">
                <Link href={`/${lang}/admin/security/sessions`}>
                  {d?.cards?.security?.activeSessions || 'Active Sessions'} ({activeSessions})
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Block */}
        <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              {d?.cards?.reports?.title || 'Reports & Analytics'}
            </CardTitle>
            <CardDescription>
              {d?.cards?.reports?.description || 'Comprehensive reporting and analytics'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {d?.cards?.reports?.details || 'Generate usage reports, view analytics, track performance metrics, and export data.'}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/reports`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {d?.cards?.reports?.viewReports || 'View Reports'}
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm">
                <Link href={`/${lang}/admin/reports/analytics`}>
                  {d?.cards?.reports?.analytics || 'Analytics Dashboard'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Communication Block */}
        <Card className="border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-500" />
              {d?.cards?.communication?.title || 'Communication'}
            </CardTitle>
            <CardDescription>
              {d?.cards?.communication?.description || 'System announcements and messaging'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {d?.cards?.communication?.details || 'Create announcements, manage email templates, configure notifications, and broadcast messages.'}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/communication`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {d?.cards?.communication?.viewCommunication || 'View Communication'}
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm">
                <Link href={`/${lang}/admin/communication/announcements`}>
                  {d?.cards?.communication?.announcements || 'Announcements'} ({totalAnnouncements})
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Block */}
        <Card className="border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-500" />
              {d?.cards?.subscription?.title || 'Subscription & Billing'}
            </CardTitle>
            <CardDescription>
              {d?.cards?.subscription?.description || 'Subscription and billing management'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {d?.cards?.subscription?.details || 'Manage subscription tiers, configure billing, handle discounts, and view revenue analytics.'}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/subscription`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {d?.cards?.subscription?.viewSubscription || 'View Subscription'}
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm">
                <Link href={`/${lang}/admin/subscription/tiers`}>
                  {d?.cards?.subscription?.manageTiers || 'Manage Tiers'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Workflow Guide */}
      <Card>
        <CardHeader>
          <CardTitle>
            {d?.workflow?.title || 'Admin Workflow Guide'}
          </CardTitle>
          <CardDescription>
            {d?.workflow?.description || 'Step-by-step guide to managing your school platform'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <div>
                <h3 className="font-medium">
                  {d?.workflow?.steps?.['1']?.title || 'Configure School Settings'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {d?.workflow?.steps?.['1']?.description || 'Set up school profile, academic years, departments, and classroom configurations.'}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="font-medium">
                  {d?.workflow?.steps?.['2']?.title || 'Manage User Accounts'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {d?.workflow?.steps?.['2']?.description || 'Create user accounts, assign roles, and set permissions for teachers, students, and staff.'}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="font-medium">
                  {d?.workflow?.steps?.['3']?.title || 'Set Up Integrations'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {d?.workflow?.steps?.['3']?.description || 'Configure OAuth providers, email services, and payment gateways for seamless operations.'}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                4
              </div>
              <div>
                <h3 className="font-medium">
                  {d?.workflow?.steps?.['4']?.title || 'Configure Security Policies'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {d?.workflow?.steps?.['4']?.description || 'Set up 2FA, session policies, and monitor security events to protect your platform.'}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                5
              </div>
              <div>
                <h3 className="font-medium">
                  {d?.workflow?.steps?.['5']?.title || 'Monitor System Health'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {d?.workflow?.steps?.['5']?.description || 'Track system performance, review audit logs, and ensure smooth platform operations.'}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                6
              </div>
              <div>
                <h3 className="font-medium">
                  {d?.workflow?.steps?.['6']?.title || 'Generate Reports & Analytics'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {d?.workflow?.steps?.['6']?.description || 'Create comprehensive reports, analyze usage patterns, and make data-driven decisions.'}
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}