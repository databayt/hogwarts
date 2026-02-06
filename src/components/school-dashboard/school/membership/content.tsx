import Link from "next/link"
import {
  Ban,
  CircleAlert,
  CircleCheck,
  Clock,
  Download,
  Key,
  Mail,
  Shield,
  Upload,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function MembershipContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Get membership stats
  let totalUsers = 0
  let activeUsers = 0
  let inactiveUsers = 0
  let pendingVerification = 0
  const roleDistribution: Record<string, number> = {}
  let recentUsers: any[] = []
  let blockedUsers = 0
  let usersWithTwoFactor = 0

  if (schoolId) {
    try {
      const [
        users,
        activeCount,
        pendingCount,
        blockedCount,
        twoFactorCount,
        recent,
      ] = await Promise.all([
        db.user
          .findMany({
            where: { schoolId },
            select: { role: true, emailVerified: true },
          })
          .catch(() => []),
        db.user
          .count({
            where: {
              schoolId,
              emailVerified: { not: null },
            },
          })
          .catch(() => 0),
        db.user
          .count({
            where: {
              schoolId,
              emailVerified: null,
            },
          })
          .catch(() => 0),
        // Blocked users count - using placeholder since no isActive field
        Promise.resolve(0),
        db.user
          .count({
            where: {
              schoolId,
              isTwoFactorEnabled: true,
            },
          })
          .catch(() => 0),
        db.user
          .findMany({
            where: { schoolId },
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              createdAt: true,
              emailVerified: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          })
          .catch(() => []),
      ])

      totalUsers = users.length
      activeUsers = activeCount
      inactiveUsers = blockedCount
      pendingVerification = pendingCount
      blockedUsers = blockedCount
      usersWithTwoFactor = twoFactorCount
      recentUsers = recent

      // Calculate role distribution
      for (const user of users) {
        roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1
      }
    } catch (error) {
      console.error("Error fetching membership data:", error)
    }
  }

  const d = dictionary?.admin

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsers.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeUsers.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">Verified and active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Verification
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingVerification.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              Awaiting email verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
            <Ban className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blockedUsers.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">Inactive accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Distribution</CardTitle>
          <CardDescription>Breakdown of users by role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(roleDistribution).map(([role, count]) => {
              const percentage =
                totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : "0"

              return (
                <div key={role} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{role}</span>
                    <span className="text-muted-foreground text-sm">
                      {count}
                    </span>
                  </div>
                  <div className="bg-secondary h-2 rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">{percentage}%</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Management Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Management */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-primary h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>View and manage all users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Browse, search, filter, and manage all user accounts in the
              system.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/${lang}/admin/membership/users`}>
                  <Users className="me-2 h-4 w-4" />
                  View All Users
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${lang}/admin/membership/users/new`}>
                  <UserPlus className="me-2 h-4 w-4" />
                  Add New User
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Role Management */}
        <Card className="border-blue-500/20 transition-colors hover:border-blue-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Roles & Permissions
            </CardTitle>
            <CardDescription>Manage user roles and access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Configure roles, assign permissions, and manage access control for
              different user types.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/membership/roles`}>
                  <Shield className="me-2 h-4 w-4" />
                  Manage Roles
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${lang}/admin/membership/permissions`}>
                  View Permissions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Import/Export */}
        <Card className="border-green-500/20 transition-colors hover:border-green-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-500" />
              Bulk Operations
            </CardTitle>
            <CardDescription>Import and export users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Import users from CSV/Excel files or export existing user data for
              backup or migration.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/membership/import`}>
                  <Upload className="me-2 h-4 w-4" />
                  Import Users
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${lang}/admin/membership/export`}>
                  <Download className="me-2 h-4 w-4" />
                  Export Users
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="border-purple-500/20 transition-colors hover:border-purple-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-purple-500" />
              Account Settings
            </CardTitle>
            <CardDescription>User account configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Configure password policies, session settings, and account
              security requirements.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/membership/settings`}>
                  <UserCog className="me-2 h-4 w-4" />
                  Account Settings
                </Link>
              </Button>
              <div className="mt-2 space-y-1 text-xs">
                <p>
                  <span className="font-medium">2FA Users:</span>{" "}
                  {usersWithTwoFactor}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Verification */}
        <Card className="border-orange-500/20 transition-colors hover:border-orange-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              Email Management
            </CardTitle>
            <CardDescription>Verification and communication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Manage email verification, resend verification emails, and handle
              email-related issues.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/membership/email`}>
                  <Mail className="me-2 h-4 w-4" />
                  Email Settings
                </Link>
              </Button>
              <div className="mt-2 space-y-1 text-xs">
                <p>
                  <span className="font-medium">Pending:</span>{" "}
                  {pendingVerification} users
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Management */}
        <Card className="border-red-500/20 transition-colors hover:border-red-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-red-500" />
              Password Management
            </CardTitle>
            <CardDescription>Reset and recovery options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Reset user passwords, manage password policies, and handle account
              recovery requests.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/membership/passwords`}>
                  <Key className="me-2 h-4 w-4" />
                  Password Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent User Registrations</CardTitle>
          <CardDescription>Latest users added to the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Users className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.username || user.email || "No Username"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="bg-secondary rounded-full px-2 py-1 text-xs">
                      {user.role}
                    </span>
                    {user.emailVerified ? (
                      <CircleCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <CircleAlert className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link href={`/${lang}/admin/membership/users`}>
                  View All Users
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">
              No users found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
