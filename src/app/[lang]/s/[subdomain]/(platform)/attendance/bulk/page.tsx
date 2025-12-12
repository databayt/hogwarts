import { type Locale } from '@/components/internationalization/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, QrCode, Barcode, Upload, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { type Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Bulk Attendance',
    description: 'Take attendance using various methods',
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const methods = [
  {
    id: 'manual',
    icon: Pencil,
    href: 'manual',
    color: 'bg-emerald-100 text-emerald-600',
    recommended: true,
  },
  {
    id: 'qr',
    icon: QrCode,
    href: 'qr-code',
    color: 'bg-purple-100 text-purple-600',
    recommended: false,
  },
  {
    id: 'barcode',
    icon: Barcode,
    href: 'barcode',
    color: 'bg-blue-100 text-blue-600',
    recommended: false,
  },
  {
    id: 'upload',
    icon: Upload,
    href: 'bulk-upload',
    color: 'bg-orange-100 text-orange-600',
    recommended: false,
  },
  {
    id: 'geo',
    icon: MapPin,
    href: 'geo',
    color: 'bg-pink-100 text-pink-600',
    recommended: false,
  },
  {
    id: 'realtime',
    icon: Clock,
    href: 'realtime',
    color: 'bg-cyan-100 text-cyan-600',
    recommended: false,
  },
]

export default async function Page({ params }: Props) {
  const { lang, subdomain } = await params
  const basePath = `/${lang}/s/${subdomain}/attendance`

  // Define method metadata
  const methodMeta = {
    manual: {
      title: 'Manual Entry',
      description: 'Mark attendance manually for a class by selecting students and their status',
    },
    qr: {
      title: 'QR Code',
      description: 'Generate QR codes for students to scan and check-in automatically',
    },
    barcode: {
      title: 'Barcode Scanner',
      description: 'Scan student ID barcodes for quick check-in',
    },
    upload: {
      title: 'Bulk Upload',
      description: 'Import attendance records from CSV or Excel files',
    },
    geo: {
      title: 'Geofence',
      description: 'Automatic check-in when students enter school premises',
    },
    realtime: {
      title: 'Live Tracking',
      description: 'Real-time attendance monitoring and live updates',
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Take Attendance</h2>
        <p className="text-muted-foreground">
          Choose a method to record attendance
        </p>
      </div>

      {/* Method Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((method) => {
          const meta = methodMeta[method.id as keyof typeof methodMeta]
          const Icon = method.icon

          return (
            <Card key={method.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
              {method.recommended && (
                <div className="absolute top-3 right-3">
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${method.color} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{meta.title}</CardTitle>
                <CardDescription className="text-sm">
                  {meta.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`${basePath}/${method.href}`}>
                    Start
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Tips */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Use Manual Entry for small classes or when taking attendance for the first time
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              QR Code is great for large classes - students scan on entry
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Barcode scanning is fastest for schools with ID cards
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Bulk Upload is ideal for importing historical data or external records
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
