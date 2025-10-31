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
  Link2,
  Mail,
  CreditCard,
  Webhook,
  Globe,
  Shield,
  CheckCircle,
  AlertCircle,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function IntegrationContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()
  const d = dictionary?.admin

  // Mock integration status
  const integrations = {
    oauth: {
      google: { enabled: true, accounts: 234 },
      facebook: { enabled: true, accounts: 156 },
    },
    email: { provider: 'resend', status: 'active' },
    payment: { provider: 'stripe', status: 'active' },
    webhooks: 5,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.navigation?.integration || 'Integration'}
        description={d?.cards?.integration?.description || 'Third-party service connections'}
        className="text-start max-w-none"
      />

      {/* Integration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* OAuth Providers */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              OAuth Providers
            </CardTitle>
            <CardDescription>Social login configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Google</span>
                {integrations.oauth.google.enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Facebook</span>
                {integrations.oauth.facebook.enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href={`/${lang}/admin/integration/oauth`}>
                <Settings className="mr-2 h-4 w-4" />
                Configure OAuth
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Email Service */}
        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Email Service
            </CardTitle>
            <CardDescription>Email delivery configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Provider:</span> {integrations.email.provider}
              </p>
              <p className="text-sm">
                <span className="font-medium">Status:</span>{' '}
                <span className="text-green-600">{integrations.email.status}</span>
              </p>
            </div>
            <Button asChild variant="secondary" className="w-full">
              <Link href={`/${lang}/admin/integration/email`}>
                <Mail className="mr-2 h-4 w-4" />
                Configure Email
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Payment Gateway */}
        <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              Payment Gateway
            </CardTitle>
            <CardDescription>Payment processing setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Provider:</span> {integrations.payment.provider}
              </p>
              <p className="text-sm">
                <span className="font-medium">Status:</span>{' '}
                <span className="text-green-600">{integrations.payment.status}</span>
              </p>
            </div>
            <Button asChild variant="secondary" className="w-full">
              <Link href={`/${lang}/admin/integration/payment`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Configure Payment
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-purple-500" />
              Webhooks
            </CardTitle>
            <CardDescription>Event notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <span className="font-medium">Active Webhooks:</span> {integrations.webhooks}
            </p>
            <Button asChild variant="secondary" className="w-full">
              <Link href={`/${lang}/admin/integration/webhooks`}>
                <Webhook className="mr-2 h-4 w-4" />
                Manage Webhooks
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}