/**
 * StorageQuota Component
 * Visual storage usage indicator with detailed breakdown
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  HardDrive,
  Database,
  Cloud,
  AlertCircle,
  TrendingUp,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Archive,
  FileIcon,
  Info,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn, formatBytes } from '@/lib/utils';

interface StorageBreakdown {
  category: 'image' | 'video' | 'document' | 'audio' | 'archive' | 'other';
  size: number;
  count: number;
  percentage: number;
}

interface StorageQuotaProps {
  used: number;
  total: number;
  breakdown?: StorageBreakdown[];
  tier?: 'basic' | 'pro' | 'enterprise';
  growthRate?: number; // bytes per day
  onUpgrade?: () => void;
  onManage?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  showBreakdown?: boolean;
  showAlerts?: boolean;
  dictionary?: any;
  className?: string;
}

const categoryConfig = {
  image: {
    icon: ImageIcon,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100 dark:bg-blue-900/20',
    label: 'Images',
  },
  video: {
    icon: Video,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-100 dark:bg-purple-900/20',
    label: 'Videos',
  },
  document: {
    icon: FileText,
    color: 'bg-green-500',
    lightColor: 'bg-green-100 dark:bg-green-900/20',
    label: 'Documents',
  },
  audio: {
    icon: Music,
    color: 'bg-yellow-500',
    lightColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    label: 'Audio',
  },
  archive: {
    icon: Archive,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-100 dark:bg-orange-900/20',
    label: 'Archives',
  },
  other: {
    icon: FileIcon,
    color: 'bg-gray-500',
    lightColor: 'bg-gray-100 dark:bg-gray-900/20',
    label: 'Other',
  },
};

const tierConfig = {
  basic: {
    icon: HardDrive,
    label: 'Basic',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  pro: {
    icon: Database,
    label: 'Pro',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  enterprise: {
    icon: Cloud,
    label: 'Enterprise',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
  },
};

export function StorageQuota({
  used,
  total,
  breakdown = [],
  tier = 'basic',
  growthRate,
  onUpgrade,
  onManage,
  variant = 'default',
  showBreakdown = true,
  showAlerts = true,
  dictionary,
  className,
}: StorageQuotaProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const percentage = Math.round((used / total) * 100);
  const remaining = total - used;
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 95;

  // Calculate days until full based on growth rate
  const daysUntilFull = React.useMemo(() => {
    if (!growthRate || growthRate <= 0) return null;
    const remainingBytes = total - used;
    return Math.floor(remainingBytes / growthRate);
  }, [used, total, growthRate]);

  const TierIcon = tierConfig[tier].icon;

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {dictionary?.storage || 'Storage'}
          </span>
          <span className="font-medium">
            {formatBytes(used)} / {formatBytes(total)}
          </span>
        </div>
        <Progress
          value={percentage}
          className={cn(
            'h-2',
            isOverLimit && 'bg-destructive/20',
            isNearLimit && !isOverLimit && 'bg-warning/20'
          )}
        />
        {isNearLimit && (
          <p className="text-xs text-muted-foreground">
            {percentage}% {dictionary?.used || 'used'}
          </p>
        )}
      </div>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                {dictionary?.storageUsage || 'Storage Usage'}
              </CardTitle>
              <CardDescription>
                {dictionary?.storageDescription || 'Monitor your storage usage and manage files'}
              </CardDescription>
            </div>
            <Badge variant="secondary" className={tierConfig[tier].bgColor}>
              <TierIcon className="h-3 w-3 mr-1" />
              {tierConfig[tier].label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{percentage}%</span>
                <span className="text-sm text-muted-foreground">
                  {dictionary?.used || 'used'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatBytes(used)} / {formatBytes(total)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(remaining)} {dictionary?.available || 'available'}
                </p>
              </div>
            </div>

            <div className="relative">
              <Progress
                value={percentage}
                className={cn(
                  'h-3',
                  isOverLimit && 'bg-destructive/20',
                  isNearLimit && !isOverLimit && 'bg-warning/20'
                )}
              />
              {/* Animated indicator */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                style={{ left: `${percentage}%` }}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              >
                <div className="h-2 w-2 bg-white rounded-full" />
              </motion.div>
            </div>

            {/* Growth prediction */}
            {growthRate && daysUntilFull !== null && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {dictionary?.growthRate || 'Growth rate'}:
                </span>
                <span className="font-medium">
                  {formatBytes(growthRate)} {dictionary?.perDay || 'per day'}
                </span>
                {daysUntilFull > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-muted-foreground">
                      {daysUntilFull} {dictionary?.daysRemaining || 'days remaining'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Alerts */}
          {showAlerts && isNearLimit && (
            <Alert variant={isOverLimit ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {isOverLimit
                  ? dictionary?.storageAlmostFull || 'Storage almost full'
                  : dictionary?.storageNearLimit || 'Storage near limit'}
              </AlertTitle>
              <AlertDescription>
                {isOverLimit
                  ? dictionary?.storageAlmostFullDescription ||
                    'Your storage is almost full. Consider upgrading or deleting old files.'
                  : dictionary?.storageNearLimitDescription ||
                    'You are approaching your storage limit. Consider managing your files.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Breakdown */}
          {showBreakdown && breakdown.length > 0 && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="text-sm font-medium">
                    {dictionary?.storageBreakdown || 'Storage breakdown'}
                  </span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="space-y-3">
                  {breakdown
                    .sort((a, b) => b.size - a.size)
                    .map((item) => {
                      const config = categoryConfig[item.category];
                      const Icon = config.icon;
                      return (
                        <div key={item.category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'p-1.5 rounded',
                                  config.lightColor
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-medium">
                                {config.label}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {item.count} {dictionary?.files || 'files'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatBytes(item.size)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.percentage}%
                              </p>
                            </div>
                          </div>
                          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={cn('h-full', config.color)}
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onManage && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={onManage}
              >
                {dictionary?.manageStorage || 'Manage storage'}
              </Button>
            )}
            {onUpgrade && tier !== 'enterprise' && (
              <Button
                variant="default"
                className="flex-1"
                onClick={onUpgrade}
              >
                <Zap className="h-4 w-4 mr-2" />
                {dictionary?.upgrade || 'Upgrade'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {dictionary?.storage || 'Storage'}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs">
                  <TierIcon className="h-3 w-3 mr-1" />
                  {tierConfig[tier].label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dictionary?.storageTier || 'Storage tier'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {percentage}% {dictionary?.used || 'used'}
            </span>
            <span className="font-medium">
              {formatBytes(used)} / {formatBytes(total)}
            </span>
          </div>
          <Progress
            value={percentage}
            className={cn(
              'h-2',
              isOverLimit && 'bg-destructive/20',
              isNearLimit && !isOverLimit && 'bg-warning/20'
            )}
          />
          <p className="text-xs text-muted-foreground">
            {formatBytes(remaining)} {dictionary?.remaining || 'remaining'}
          </p>
        </div>

        {/* Quick breakdown */}
        {showBreakdown && breakdown.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {breakdown
              .sort((a, b) => b.size - a.size)
              .slice(0, 3)
              .map((item) => {
                const config = categoryConfig[item.category];
                const Icon = config.icon;
                return (
                  <div
                    key={item.category}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">
                      {item.percentage}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {config.label}
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {/* Alert for near limit */}
        {showAlerts && isNearLimit && (
          <Alert className="py-2 px-3">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {isOverLimit
                ? dictionary?.almostFull || 'Storage almost full'
                : dictionary?.nearLimit || 'Approaching storage limit'}
            </AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        {(onManage || onUpgrade) && (
          <div className="flex items-center gap-2">
            {onManage && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onManage}
              >
                {dictionary?.manage || 'Manage'}
              </Button>
            )}
            {onUpgrade && tier !== 'enterprise' && isNearLimit && (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={onUpgrade}
              >
                {dictionary?.upgrade || 'Upgrade'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}