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
import { Progress } from '@/components/ui/progress'
import {
  Server,
  Database,
  HardDrive,
  Activity,
  FileText,
  Download,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Zap,
  Clock,
  Cpu,
  MemoryStick,
  Wifi,
  Archive,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function SystemContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Mock system health data (in production, this would come from real monitoring)
  const systemHealth = {
    database: {
      status: 'healthy' as const,
      connections: 12,
      responseTime: 45, // ms
      size: 256 * 1024 * 1024, // 256 MB
    },
    cache: {
      status: 'healthy' as const,
      hitRate: 92,
      memory: 128 * 1024 * 1024, // 128 MB
      keys: 1543,
    },
    storage: {
      status: 'healthy' as const,
      used: 2.5 * 1024 * 1024 * 1024, // 2.5 GB
      total: 10 * 1024 * 1024 * 1024, // 10 GB
    },
    api: {
      status: 'healthy' as const,
      requestsPerMinute: 245,
      errorRate: 0.3,
      uptime: 99.9,
    },
    cpu: {
      usage: 35,
      cores: 4,
    },
    memory: {
      used: 3.2 * 1024 * 1024 * 1024, // 3.2 GB
      total: 8 * 1024 * 1024 * 1024, // 8 GB
    }
  }

  // Get audit log stats
  let totalLogs = 0
  let todayLogs = 0
  let criticalEvents = 0

  if (schoolId) {
    try {
      // In production, these would come from actual audit log table
      totalLogs = 15432
      todayLogs = 234
      criticalEvents = 3
    } catch (error) {
      console.error('Error fetching system data:', error)
    }
  }

  const d = dictionary?.admin

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'degraded': return 'text-yellow-500'
      case 'down': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'down': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.navigation?.system || 'System'}
        className="text-start max-w-none"
      />

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            {getStatusIcon(systemHealth.database.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.database.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.database.connections} active connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache</CardTitle>
            {getStatusIcon(systemHealth.cache.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.cache.hitRate}%</div>
            <p className="text-xs text-muted-foreground">
              Hit rate ({systemHealth.cache.keys} keys)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API</CardTitle>
            {getStatusIcon(systemHealth.api.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.api.uptime}%</div>
            <p className="text-xs text-muted-foreground">
              Uptime ({systemHealth.api.requestsPerMinute} req/min)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            {getStatusIcon(systemHealth.storage.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((systemHealth.storage.used / systemHealth.storage.total) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(systemHealth.storage.used)} used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
          <CardDescription>
            Current system resource utilization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {systemHealth.cpu.usage}% ({systemHealth.cpu.cores} cores)
              </span>
            </div>
            <Progress value={systemHealth.cpu.usage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatBytes(systemHealth.memory.used)} / {formatBytes(systemHealth.memory.total)}
              </span>
            </div>
            <Progress
              value={(systemHealth.memory.used / systemHealth.memory.total) * 100}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Storage Usage</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatBytes(systemHealth.storage.used)} / {formatBytes(systemHealth.storage.total)}
              </span>
            </div>
            <Progress
              value={(systemHealth.storage.used / systemHealth.storage.total) * 100}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Database Size</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatBytes(systemHealth.database.size)}
              </span>
            </div>
            <Progress
              value={(systemHealth.database.size / (1024 * 1024 * 1024)) * 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Management Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Audit Logs */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Audit Logs
            </CardTitle>
            <CardDescription>
              System activity tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View and search through system audit logs, user activities, and security events.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/${lang}/admin/system/audit`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Audit Logs
                </Link>
              </Button>
              <div className="text-xs space-y-1 mt-2">
                <p><span className="font-medium">Total:</span> {totalLogs.toLocaleString()} logs</p>
                <p><span className="font-medium">Today:</span> {todayLogs} events</p>
                {criticalEvents > 0 && (
                  <p className="text-red-600">
                    <span className="font-medium">Critical:</span> {criticalEvents} events
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backups */}
        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-blue-500" />
              Backups
            </CardTitle>
            <CardDescription>
              Data backup management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create, schedule, and restore database backups. Manage backup retention policies.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/system/backups`}>
                  <Archive className="mr-2 h-4 w-4" />
                  Manage Backups
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${lang}/admin/system/backups/create`}>
                  Create Backup
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cache Management */}
        <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              Cache Management
            </CardTitle>
            <CardDescription>
              Cache control and optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Monitor cache performance, clear specific cache keys, or flush entire cache.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/system/cache`}>
                  <Zap className="mr-2 h-4 w-4" />
                  Manage Cache
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Health Monitoring
            </CardTitle>
            <CardDescription>
              Real-time system monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Monitor system health, performance metrics, and set up alerts for critical issues.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/system/health`}>
                  <Activity className="mr-2 h-4 w-4" />
                  Health Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Tools */}
        <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-500" />
              Database Tools
            </CardTitle>
            <CardDescription>
              Database maintenance utilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Optimize tables, analyze query performance, and manage database connections.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/system/database`}>
                  <Database className="mr-2 h-4 w-4" />
                  Database Tools
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card className="border-red-500/20 hover:border-red-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              System Logs
            </CardTitle>
            <CardDescription>
              Application and error logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View application logs, error logs, and debug information for troubleshooting.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/system/logs`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View System Logs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Tasks</CardTitle>
          <CardDescription>
            Routine system maintenance operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="justify-start">
              <RefreshCw className="mr-2 h-4 w-4" />
              Restart Services
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
            <Button variant="outline" className="justify-start">
              <Trash2 className="mr-2 h-4 w-4" />
              Clean Temporary Files
            </Button>
            <Button variant="outline" className="justify-start">
              <Clock className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}