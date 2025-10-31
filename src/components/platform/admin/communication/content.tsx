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
  MessageSquare,
  Bell,
  Mail,
  Megaphone,
  Send,
  FileText,
  Calendar,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function CommunicationContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()
  const d = dictionary?.admin

  let totalAnnouncements = 0
  let activeAnnouncements = 0

  if (schoolId) {
    try {
      ;[totalAnnouncements, activeAnnouncements] = await Promise.all([
        db.announcement.count({ where: { schoolId } }).catch(() => 0),
        db.announcement.count({
          where: {
            schoolId,
            published: true
          }
        }).catch(() => 0),
      ])
    } catch (error) {
      console.error('Error fetching communication data:', error)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.navigation?.communication || 'Communication'}
        className="text-start max-w-none"
      />

      {/* Communication Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnnouncements}</div>
            <p className="text-xs text-muted-foreground">{activeAnnouncements} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Templates</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Configured templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Communication Tools */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Announcements */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Announcements
            </CardTitle>
            <CardDescription>System-wide announcements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create and manage announcements for students, teachers, and parents.
            </p>
            <Button asChild>
              <Link href={`/${lang}/admin/communication/announcements`}>
                Manage Announcements
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Email Templates */}
        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Email Templates
            </CardTitle>
            <CardDescription>Customizable email templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Design and manage email templates for various system notifications.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/communication/templates`}>
                Manage Templates
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Broadcast Messages */}
        <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-500" />
              Broadcast Messages
            </CardTitle>
            <CardDescription>Mass messaging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Send bulk emails or notifications to specific user groups.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/communication/broadcast`}>
                Send Broadcast
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure notification rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Set up notification preferences and delivery channels.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/communication/notifications`}>
                Configure Notifications
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}