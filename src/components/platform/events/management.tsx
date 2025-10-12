"use client";

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { format, addDays, isPast, isFuture, isToday, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import {
  Calendar, MapPin, Users, Clock, DollarSign, Ticket, Share2,
  Edit, Trash2, Copy, Eye, EyeOff, Send, Download, Upload,
  Plus, Filter, Search, ChevronLeft, ChevronRight, MoreVertical,
  Star, Bell, CheckCircle, XCircle, AlertCircle, Image as ImageIcon,
  Video, Music, Trophy, Briefcase, GraduationCap, Heart, Flag
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'academic' | 'sports' | 'cultural' | 'workshop' | 'meeting' | 'holiday' | 'examination' | 'other';
  category: 'mandatory' | 'optional' | 'invitation-only';
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  location: {
    venue: string;
    address?: string;
    capacity?: number;
    virtualLink?: string;
  };
  organizers: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  }[];
  attendees: {
    targetAudience: ('students' | 'teachers' | 'parents' | 'staff' | 'public')[];
    registered: number;
    capacity?: number;
    waitlist?: number;
  };
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  visibility: 'public' | 'private' | 'restricted';
  registration: {
    required: boolean;
    deadline?: Date;
    fee?: number;
    paymentRequired?: boolean;
  };
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  tags?: string[];
  featured: boolean;
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate: Date;
    exceptions?: Date[];
  };
}

interface Registration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: 'student' | 'teacher' | 'parent' | 'staff' | 'guest';
  registrationDate: Date;
  status: 'confirmed' | 'pending' | 'waitlisted' | 'cancelled';
  paymentStatus?: 'paid' | 'pending' | 'failed';
  ticketNumber?: string;
  checkInTime?: Date;
  feedback?: string;
  rating?: number;
}

interface EventManagementProps {
  events: Event[];
  registrations: Registration[];
  currentUser: {
    id: string;
    name: string;
    role: string;
    permissions: {
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canManageRegistrations: boolean;
    };
  };
  onCreateEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  onUpdateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onRegister: (eventId: string, userData: any) => Promise<void>;
  onCancelRegistration: (registrationId: string) => Promise<void>;
  onCheckIn?: (registrationId: string) => Promise<void>;
  onExportRegistrations?: (eventId: string) => void;
}

const eventTypeIcons = {
  academic: GraduationCap,
  sports: Trophy,
  cultural: Music,
  workshop: Briefcase,
  meeting: Users,
  holiday: Flag,
  examination: Edit,
  other: Calendar,
};

const eventTypeColors = {
  academic: 'bg-blue-100 text-blue-800',
  sports: 'bg-green-100 text-green-800',
  cultural: 'bg-purple-100 text-purple-800',
  workshop: 'bg-yellow-100 text-yellow-800',
  meeting: 'bg-gray-100 text-gray-800',
  holiday: 'bg-red-100 text-red-800',
  examination: 'bg-orange-100 text-orange-800',
  other: 'bg-indigo-100 text-indigo-800',
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function EventManagement({
  events,
  registrations,
  currentUser,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onRegister,
  onCancelRegistration,
  onCheckIn,
  onExportRegistrations,
}: EventManagementProps) {
  const [selectedView, setSelectedView] = useState<'calendar' | 'list' | 'cards'>('cards');
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past' | 'my-events'>('upcoming');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Tab filter
    if (selectedTab === 'upcoming') {
      filtered = filtered.filter(e => isFuture(e.startDate) || isToday(e.startDate));
    } else if (selectedTab === 'past') {
      filtered = filtered.filter(e => isPast(e.endDate) && !isToday(e.endDate));
    } else if (selectedTab === 'my-events') {
      const myRegistrations = registrations
        .filter(r => r.userId === currentUser.id)
        .map(r => r.eventId);
      filtered = filtered.filter(e =>
        e.organizers.some(o => o.id === currentUser.id) ||
        myRegistrations.includes(e.id)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(e => e.type === selectedType);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.location.venue.toLowerCase().includes(query) ||
        e.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by date
    return filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.startDate.getTime() - b.startDate.getTime();
    });
  }, [events, registrations, currentUser.id, selectedTab, selectedType, searchQuery]);

  // Calendar days for calendar view
  const calendarDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });

    // Add padding for start of week
    const startDay = start.getDay();
    const paddingDays = [];
    for (let i = 0; i < startDay; i++) {
      paddingDays.push(null);
    }

    return [...paddingDays, ...days];
  }, [selectedMonth]);

  // Group events by date for calendar view
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, Event[]>();

    filteredEvents.forEach(event => {
      let currentDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (!grouped.has(dateStr)) {
          grouped.set(dateStr, []);
        }
        grouped.get(dateStr)?.push(event);
        currentDate = addDays(currentDate, 1);
      }
    });

    return grouped;
  }, [filteredEvents]);

  // Statistics
  const stats = useMemo(() => {
    const upcoming = events.filter(e => isFuture(e.startDate)).length;
    const thisMonth = events.filter(e =>
      isSameMonth(e.startDate, new Date())
    ).length;
    const totalRegistrations = registrations.filter(r =>
      r.status === 'confirmed'
    ).length;
    const myEvents = registrations.filter(r =>
      r.userId === currentUser.id && r.status === 'confirmed'
    ).length;

    return { upcoming, thisMonth, totalRegistrations, myEvents };
  }, [events, registrations, currentUser.id]);

  // Get user registration for an event
  const getUserRegistration = useCallback((eventId: string) => {
    return registrations.find(r =>
      r.eventId === eventId &&
      r.userId === currentUser.id &&
      r.status !== 'cancelled'
    );
  }, [registrations, currentUser.id]);

  const handleRegister = async (event: Event) => {
    try {
      await onRegister(event.id, {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: `${currentUser.id}@school.edu`,
        userType: currentUser.role.toLowerCase(),
      });
      toast.success('Successfully registered for event');
      setRegistrationDialogOpen(false);
    } catch (error) {
      toast.error('Failed to register for event');
    }
  };

  const handleCancelRegistration = async (event: Event) => {
    const registration = getUserRegistration(event.id);
    if (!registration) return;

    try {
      await onCancelRegistration(registration.id);
      toast.success('Registration cancelled');
    } catch (error) {
      toast.error('Failed to cancel registration');
    }
  };

  const getDaysUntilEvent = (date: Date) => {
    const days = differenceInDays(date, new Date());
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Past';
    return `In ${days} days`;
  };

  const EventCard = ({ event }: { event: Event }) => {
    const Icon = eventTypeIcons[event.type];
    const registration = getUserRegistration(event.id);
    const isRegistered = !!registration;
    const isFull = event.attendees.capacity &&
      event.attendees.registered >= event.attendees.capacity;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                eventTypeColors[event.type]
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription className="mt-1">
                  {format(event.startDate, 'MMM dd, yyyy')} at {event.startTime}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {event.featured && (
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              )}
              <Badge variant="outline" className={statusColors[event.status]}>
                {event.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{event.location.venue}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                {event.attendees.registered}
                {event.attendees.capacity && ` / ${event.attendees.capacity}`}
              </span>
            </div>
          </div>

          {event.registration.required && (
            <div className="flex items-center justify-between text-sm">
              {event.registration.fee && event.registration.fee > 0 ? (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-medium">${event.registration.fee}</span>
                </div>
              ) : (
                <Badge variant="secondary">Free</Badge>
              )}
              {event.registration.deadline && (
                <span className="text-xs text-muted-foreground">
                  Registration closes {format(event.registration.deadline, 'MMM dd')}
                </span>
              )}
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {event.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{event.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-3">
          <div className="flex items-center justify-between w-full">
            <Badge variant="outline" className="text-xs">
              {getDaysUntilEvent(event.startDate)}
            </Badge>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEvent(event);
                  setDetailsDialogOpen(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {event.registration.required && (
                isRegistered ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCancelRegistration(event)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Registered
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={isFull || isPast(event.registration.deadline || event.startDate)}
                    onClick={() => {
                      setSelectedEvent(event);
                      setRegistrationDialogOpen(true);
                    }}
                  >
                    <Ticket className="h-4 w-4 mr-1" />
                    {isFull ? 'Full' : 'Register'}
                  </Button>
                )
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Management</CardTitle>
              <CardDescription>School events, activities, and programs</CardDescription>
            </div>
            {currentUser.permissions.canCreate && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myEvents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Options */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.keys(eventTypeIcons).map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1">
          <Button
            variant={selectedView === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('cards')}
          >
            Cards
          </Button>
          <Button
            variant={selectedView === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('list')}
          >
            List
          </Button>
          <Button
            variant={selectedView === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('calendar')}
          >
            Calendar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {selectedView === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {selectedView === 'list' && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredEvents.map(event => {
                    const Icon = eventTypeIcons[event.type];
                    const registration = getUserRegistration(event.id);

                    return (
                      <div key={event.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", eventTypeColors[event.type])}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{format(event.startDate, 'MMM dd, yyyy')}</span>
                                <span>{event.startTime}</span>
                                <span>{event.location.venue}</span>
                                <Badge variant="outline" className="text-xs">
                                  {event.attendees.registered}
                                  {event.attendees.capacity && ` / ${event.attendees.capacity}`}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {registration && (
                              <Badge variant="secondary">Registered</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEvent(event);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedView === 'calendar' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{format(selectedMonth, 'MMMM yyyy')}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonth(prev => addDays(prev, -30))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonth(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonth(prev => addDays(prev, 30))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-px bg-muted">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-background p-2 text-center text-sm font-medium">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="bg-background p-2 min-h-[80px]" />;
                    }

                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate.get(dateStr) || [];

                    return (
                      <div
                        key={day.toString()}
                        className={cn(
                          "bg-background p-2 min-h-[80px] border",
                          isToday(day) && "bg-primary/5",
                          !isSameMonth(day, selectedMonth) && "opacity-50"
                        )}
                      >
                        <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event, idx) => {
                            const Icon = eventTypeIcons[event.type];
                            return (
                              <div
                                key={`${event.id}-${idx}`}
                                className={cn(
                                  "text-[10px] p-1 rounded flex items-center gap-1 cursor-pointer",
                                  eventTypeColors[event.type]
                                )}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setDetailsDialogOpen(true);
                                }}
                              >
                                <Icon className="h-2.5 w-2.5" />
                                <span className="truncate">{event.title}</span>
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[10px] text-muted-foreground text-center">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent && format(selectedEvent.startDate, 'MMMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Badge variant="outline" className={cn("mt-1", eventTypeColors[selectedEvent.type])}>
                    {selectedEvent.type}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant="outline" className={cn("mt-1", statusColors[selectedEvent.status])}>
                    {selectedEvent.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date & Time</Label>
                  <div className="text-sm mt-1">
                    <p>{format(selectedEvent.startDate, 'MMMM dd, yyyy')}</p>
                    <p className="text-muted-foreground">
                      {selectedEvent.startTime} - {selectedEvent.endTime}
                    </p>
                  </div>
                </div>
                <div>
                  <Label>Location</Label>
                  <div className="text-sm mt-1">
                    <p>{selectedEvent.location.venue}</p>
                    {selectedEvent.location.address && (
                      <p className="text-muted-foreground">{selectedEvent.location.address}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>Attendance</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">
                      {selectedEvent.attendees.registered} registered
                    </span>
                    {selectedEvent.attendees.capacity && (
                      <span className="text-sm text-muted-foreground">
                        Capacity: {selectedEvent.attendees.capacity}
                      </span>
                    )}
                  </div>
                  {selectedEvent.attendees.capacity && (
                    <Progress
                      value={(selectedEvent.attendees.registered / selectedEvent.attendees.capacity) * 100}
                      className="h-2"
                    />
                  )}
                </div>
              </div>

              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEvent.tags.map(tag => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedEvent?.registration.required && (
              <Button onClick={() => {
                setDetailsDialogOpen(false);
                setRegistrationDialogOpen(true);
              }}>
                Register Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}