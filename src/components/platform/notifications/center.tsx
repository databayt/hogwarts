"use client";

import * as React from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, formatDistanceToNow, isToday, isYesterday, startOfDay, differenceInDays } from 'date-fns';
import {
  Bell, BellOff, Check, CheckCheck, X, Archive, Star, Trash2,
  MessageSquare, Calendar, DollarSign, Award, AlertTriangle,
  Users, BookOpen, Clock, Filter, Settings, Volume2, VolumeX,
  Info, CheckCircle, XCircle, AlertCircle, Zap, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Notification {
  id: string;
  type: 'message' | 'assignment' | 'grade' | 'attendance' | 'fee' | 'event' | 'announcement' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  content: string;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  archived: boolean;
  sender?: {
    name: string;
    role: string;
    avatar?: string;
  };
  actionUrl?: string;
  actionLabel?: string;
  data?: any; // Additional data specific to notification type
  expiresAt?: Date;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  sound: boolean;
  categories: {
    messages: boolean;
    assignments: boolean;
    grades: boolean;
    attendance: boolean;
    fees: boolean;
    events: boolean;
    announcements: boolean;
    system: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "07:00"
  };
}

interface NotificationCenterProps {
  notifications: Notification[];
  preferences: NotificationPreferences;
  onMarkAsRead: (notificationIds: string[]) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDelete: (notificationIds: string[]) => Promise<void>;
  onArchive: (notificationIds: string[]) => Promise<void>;
  onStar: (notificationId: string) => Promise<void>;
  onUpdatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  onActionClick?: (notification: Notification) => void;
  enableRealTime?: boolean;
}

const typeIcons = {
  message: MessageSquare,
  assignment: BookOpen,
  grade: Award,
  attendance: Users,
  fee: DollarSign,
  event: Calendar,
  announcement: AlertCircle,
  system: Settings,
};

const typeColors = {
  message: 'bg-blue-100 text-blue-800',
  assignment: 'bg-purple-100 text-purple-800',
  grade: 'bg-green-100 text-green-800',
  attendance: 'bg-yellow-100 text-yellow-800',
  fee: 'bg-red-100 text-red-800',
  event: 'bg-indigo-100 text-indigo-800',
  announcement: 'bg-orange-100 text-orange-800',
  system: 'bg-gray-100 text-gray-800',
};

const priorityConfig = {
  low: { color: 'text-gray-500', badge: 'secondary' },
  medium: { color: 'text-blue-500', badge: 'default' },
  high: { color: 'text-orange-500', badge: 'destructive' },
  urgent: { color: 'text-red-500', badge: 'destructive', pulse: true },
};

export function NotificationCenter({
  notifications,
  preferences,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onArchive,
  onStar,
  onUpdatePreferences,
  onActionClick,
  enableRealTime = true,
}: NotificationCenterProps) {
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [bulkActionMode, setBulkActionMode] = useState(false);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Tab filter
    switch (selectedTab) {
      case 'unread':
        filtered = filtered.filter(n => !n.read && !n.archived);
        break;
      case 'starred':
        filtered = filtered.filter(n => n.starred && !n.archived);
        break;
      case 'archived':
        filtered = filtered.filter(n => n.archived);
        break;
      default:
        filtered = filtered.filter(n => !n.archived);
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(n => selectedTypes.includes(n.type));
    }

    // Sort by timestamp (newest first) and priority
    return filtered.sort((a, b) => {
      // Urgent notifications first
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;

      // Then by timestamp
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [notifications, selectedTab, selectedTypes]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};

    filteredNotifications.forEach(notification => {
      const date = startOfDay(notification.timestamp);
      const key = isToday(date) ? 'Today' :
                  isYesterday(date) ? 'Yesterday' :
                  differenceInDays(new Date(), date) < 7 ? format(date, 'EEEE') :
                  format(date, 'MMM dd, yyyy');

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    return groups;
  }, [filteredNotifications]);

  // Statistics
  const stats = useMemo(() => {
    const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
    const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;
    const starredCount = notifications.filter(n => n.starred).length;
    const archivedCount = notifications.filter(n => n.archived).length;

    return { unreadCount, urgentCount, starredCount, archivedCount };
  }, [notifications]);

  // Real-time simulation (would connect to WebSocket in production)
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      // Check for new notifications (mock)
      const hasNew = Math.random() > 0.8;
      if (hasNew) {
        toast.info("New notification received", {
          description: "You have a new message",
          action: {
            label: "View",
            onClick: () => setSelectedTab('unread'),
          },
        });

        // Play sound if enabled
        if (preferences.sound) {
          // Play notification sound
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enableRealTime, preferences.sound]);

  const handleBulkAction = async (action: 'read' | 'archive' | 'delete') => {
    if (selectedNotifications.length === 0) {
      toast.error('No notifications selected');
      return;
    }

    try {
      switch (action) {
        case 'read':
          await onMarkAsRead(selectedNotifications);
          toast.success(`Marked ${selectedNotifications.length} notifications as read`);
          break;
        case 'archive':
          await onArchive(selectedNotifications);
          toast.success(`Archived ${selectedNotifications.length} notifications`);
          break;
        case 'delete':
          await onDelete(selectedNotifications);
          toast.success(`Deleted ${selectedNotifications.length} notifications`);
          break;
      }
      setSelectedNotifications([]);
      setBulkActionMode(false);
    } catch (error) {
      toast.error(`Failed to ${action} notifications`);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await onUpdatePreferences(localPreferences);
      toast.success('Preferences saved');
      setPreferencesOpen(false);
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const Icon = typeIcons[notification.type];
    const isExpired = notification.expiresAt && isPast(notification.expiresAt);

    return (
      <div
        className={cn(
          "group flex items-start gap-3 p-3 rounded-lg transition-colors",
          !notification.read && "bg-muted/50",
          notification.starred && "border-l-4 border-l-yellow-500",
          isExpired && "opacity-60"
        )}
      >
        {bulkActionMode && (
          <Checkbox
            checked={selectedNotifications.includes(notification.id)}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedNotifications(prev => [...prev, notification.id]);
              } else {
                setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
              }
            }}
          />
        )}

        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          typeColors[notification.type]
        )}>
          <Icon className="h-5 w-5" />
          {notification.priority === 'urgent' && priorityConfig.urgent.pulse && (
            <span className="absolute inline-flex h-3 w-3 -top-1 -right-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className={cn(
                "font-medium",
                !notification.read && "font-semibold"
              )}>
                {notification.title}
              </p>
              {notification.sender && (
                <p className="text-xs text-muted-foreground">
                  from {notification.sender.name} • {notification.sender.role}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notification.starred && (
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {notification.content}
          </p>

          {notification.actionUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onActionClick?.(notification)}
              className="mb-2"
            >
              {notification.actionLabel || 'View Details'}
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Badge variant={priorityConfig[notification.priority].badge as any} className="text-xs">
              {notification.priority}
            </Badge>
            {isExpired && (
              <Badge variant="outline" className="text-xs">
                Expired
              </Badge>
            )}
          </div>
        </div>

        {!bulkActionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                •••
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!notification.read && (
                <DropdownMenuItem onClick={() => onMarkAsRead([notification.id])}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onStar(notification.id)}>
                <Star className="h-4 w-4 mr-2" />
                {notification.starred ? 'Unstar' : 'Star'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive([notification.id])}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete([notification.id])}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Notifications</CardTitle>
              {stats.unreadCount > 0 && (
                <Badge variant="destructive">
                  {stats.unreadCount} unread
                </Badge>
              )}
              {stats.urgentCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {stats.urgentCount} urgent
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkActionMode(!bulkActionMode)}
              >
                {bulkActionMode ? 'Cancel' : 'Select'}
              </Button>
              {bulkActionMode && selectedNotifications.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('read')}
                  >
                    Mark as Read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('archive')}
                  >
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                  >
                    Delete
                  </Button>
                </>
              )}
              {!bulkActionMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    disabled={stats.unreadCount === 0}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreferencesOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter by type:</span>
        {Object.entries(typeIcons).map(([type, Icon]) => (
          <Button
            key={type}
            variant={selectedTypes.includes(type) ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (selectedTypes.includes(type)) {
                setSelectedTypes(prev => prev.filter(t => t !== type));
              } else {
                setSelectedTypes(prev => [...prev, type]);
              }
            }}
          >
            <Icon className="h-4 w-4 mr-1" />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
        {selectedTypes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTypes([])}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <Card>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <CardHeader className="pb-3">
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="all">
                All
                {notifications.filter(n => !n.archived).length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {notifications.filter(n => !n.archived).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {stats.unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="starred">
                Starred
                {stats.starredCount > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {stats.starredCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived
                {stats.archivedCount > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {stats.archivedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {Object.keys(groupedNotifications).length > 0 ? (
                <div className="p-4 space-y-4">
                  {Object.entries(groupedNotifications).map(([date, notifications]) => (
                    <div key={date}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">{date}</h3>
                      <div className="space-y-1">
                        {notifications.map(notification => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Tabs>
      </Card>

      {/* Preferences Dialog */}
      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
            <DialogDescription>
              Customize how and when you receive notifications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Delivery Methods */}
            <div>
              <h4 className="font-medium mb-3">Delivery Methods</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email">Email Notifications</Label>
                  <Switch
                    id="email"
                    checked={localPreferences.email}
                    onCheckedChange={(checked) =>
                      setLocalPreferences(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push">Push Notifications</Label>
                  <Switch
                    id="push"
                    checked={localPreferences.push}
                    onCheckedChange={(checked) =>
                      setLocalPreferences(prev => ({ ...prev, push: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms">SMS Notifications</Label>
                  <Switch
                    id="sms"
                    checked={localPreferences.sms}
                    onCheckedChange={(checked) =>
                      setLocalPreferences(prev => ({ ...prev, sms: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound">
                    <div className="flex items-center gap-2">
                      {localPreferences.sound ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                      Sound
                    </div>
                  </Label>
                  <Switch
                    id="sound"
                    checked={localPreferences.sound}
                    onCheckedChange={(checked) =>
                      setLocalPreferences(prev => ({ ...prev, sound: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Categories */}
            <div>
              <h4 className="font-medium mb-3">Notification Categories</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(localPreferences.categories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <Label htmlFor={category} className="text-sm">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Label>
                    <Switch
                      id={category}
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        setLocalPreferences(prev => ({
                          ...prev,
                          categories: { ...prev.categories, [category]: checked }
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Quiet Hours */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Quiet Hours</h4>
                <Switch
                  checked={localPreferences.quietHours.enabled}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, enabled: checked }
                    }))
                  }
                />
              </div>
              {localPreferences.quietHours.enabled && (
                <div className="flex items-center gap-2 text-sm">
                  <span>From</span>
                  <input
                    type="time"
                    value={localPreferences.quietHours.start}
                    onChange={(e) =>
                      setLocalPreferences(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, start: e.target.value }
                      }))
                    }
                    className="border rounded px-2 py-1"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={localPreferences.quietHours.end}
                    onChange={(e) =>
                      setLocalPreferences(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, end: e.target.value }
                      }))
                    }
                    className="border rounded px-2 py-1"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreferencesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}