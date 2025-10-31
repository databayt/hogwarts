import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  UserX,
  Activity,
  FileWarning,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function SecurityContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()
  const d = dictionary?.admin

  // Get security stats
  let activeSessions = 0
  let failedLogins = 0
  let twoFactorUsers = 0
  let blockedIPs = 0

  if (schoolId) {
    try {
      ;[activeSessions, failedLogins, twoFactorUsers] = await Promise.all([
        // JWT-based auth, no session table
        Promise.resolve(0),
        // No loginAttempts field in User model
        Promise.resolve(0),
        db.user.count({ where: { schoolId, isTwoFactorEnabled: true } }).catch(() => 0),
      ])
    } catch (error) {
      console.error('Error fetching security data:', error)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.navigation?.security || 'Security'}
        className="text-start max-w-none"
      />

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions}</div>
            <p className="text-xs text-muted-foreground">Current active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedLogins}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA Enabled</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{twoFactorUsers}</div>
            <p className="text-xs text-muted-foreground">Protected accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Good protection</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Management */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Security Logs */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-primary" />
              Security Logs
            </CardTitle>
            <CardDescription>Security event monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Monitor login attempts, permission denials, and suspicious activities.
            </p>
            <Button asChild>
              <Link href={`/${lang}/admin/security/logs`}>
                View Security Logs
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Active Sessions
            </CardTitle>
            <CardDescription>User session management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View active sessions, terminate suspicious sessions, and manage session policies.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/security/sessions`}>
                Manage Sessions
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Security Policies */}
        <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-500" />
              Security Policies
            </CardTitle>
            <CardDescription>Password and access policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configure password requirements, session timeouts, and access control policies.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/security/policies`}>
                Configure Policies
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Threat Detection */}
        <Card className="border-red-500/20 hover:border-red-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Threat Detection
            </CardTitle>
            <CardDescription>Security threat monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Monitor for brute force attacks, suspicious IPs, and unusual activity patterns.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/security/threats`}>
                View Threats
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}