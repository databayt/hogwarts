/**
 * Staff Profile Tasks Tab
 * Task management, assignments, and workflow tracking
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SquareCheck, Clock, CircleAlert, Calendar, ListFilter, Search, Plus, ChevronRight, Star, Flag, Users, Paperclip, MessageSquare, EllipsisVertical, TrendingUp, Target, ListTodo, CircleCheck, CircleX, CirclePlay } from "lucide-react"
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns'
import type { StaffProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface TasksTabProps {
  profile: any // Cast to any to support mock data properties
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  isOwner?: boolean
  className?: string
}

type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
type TaskCategory = 'financial' | 'administrative' | 'reporting' | 'compliance' | 'project' | 'other'

interface Task {
  id: string
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  assignedBy: string
  assignedDate: Date
  dueDate: Date
  completedDate?: Date
  estimatedHours: number
  actualHours?: number
  tags: string[]
  attachments?: string[]
  comments?: Comment[]
  checklist?: ChecklistItem[]
  dependencies?: string[]
  isRecurring?: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly'
}

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface Comment {
  id: string
  author: string
  text: string
  date: Date
}

interface TaskMetrics {
  totalTasks: number
  completedToday: number
  dueToday: number
  overdue: number
  averageCompletionTime: number
  completionRate: number
}

// ============================================================================
// Mock Data
// ============================================================================

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Process March Payroll',
    description: 'Complete payroll processing for all staff members including deductions and bonuses',
    category: 'financial',
    priority: 'urgent',
    status: 'in-progress',
    assignedBy: 'Principal Williams',
    assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    estimatedHours: 8,
    actualHours: 3,
    tags: ['payroll', 'monthly', 'critical'],
    checklist: [
      { id: 'c1', text: 'Collect attendance data', completed: true },
      { id: 'c2', text: 'Calculate deductions', completed: true },
      { id: 'c3', text: 'Process bonuses', completed: false },
      { id: 'c4', text: 'Generate pay slips', completed: false },
      { id: 'c5', text: 'Submit to bank', completed: false }
    ],
    isRecurring: true,
    recurringPattern: 'monthly'
  },
  {
    id: 'task-2',
    title: 'Quarterly Budget Report',
    description: 'Prepare comprehensive Q1 budget report with variance analysis',
    category: 'reporting',
    priority: 'high',
    status: 'todo',
    assignedBy: 'Finance Director',
    assignedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    estimatedHours: 12,
    tags: ['quarterly', 'budget', 'report'],
    attachments: ['Q1_Template.xlsx', 'Guidelines.pdf']
  },
  {
    id: 'task-3',
    title: 'Update Vendor Contracts',
    description: 'Review and update contracts for all active vendors',
    category: 'administrative',
    priority: 'medium',
    status: 'review',
    assignedBy: 'Operations Manager',
    assignedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    estimatedHours: 6,
    actualHours: 5,
    tags: ['contracts', 'vendors'],
    comments: [
      {
        id: 'com-1',
        author: 'Sarah Wilson',
        text: 'Please prioritize the catering vendor contract',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]
  },
  {
    id: 'task-4',
    title: 'Expense Report Approval',
    description: 'Review and approve department expense reports',
    category: 'financial',
    priority: 'high',
    status: 'completed',
    assignedBy: 'Principal Williams',
    assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    estimatedHours: 3,
    actualHours: 2.5,
    tags: ['expense', 'approval'],
    isRecurring: true,
    recurringPattern: 'weekly'
  },
  {
    id: 'task-5',
    title: 'Compliance Audit Preparation',
    description: 'Prepare documentation for annual compliance audit',
    category: 'compliance',
    priority: 'medium',
    status: 'todo',
    assignedBy: 'Compliance Officer',
    assignedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    estimatedHours: 20,
    tags: ['audit', 'compliance', 'annual'],
    dependencies: ['task-2', 'task-3']
  }
]

const mockMetrics: TaskMetrics = {
  totalTasks: 45,
  completedToday: 3,
  dueToday: 5,
  overdue: 2,
  averageCompletionTime: 4.5,
  completionRate: 92
}

// ============================================================================
// Component
// ============================================================================

export function TasksTab({
  profile,
  dictionary,
  lang = 'en',
  isOwner = false,
  className
}: TasksTabProps) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all')
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { workMetrics } = profile

  // Filter tasks
  const filteredTasks = mockTasks.filter(task => {
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Group tasks by status
  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return ''
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return <ListTodo className="h-4 w-4" />
      case 'in-progress': return <CirclePlay className="h-4 w-4" />
      case 'review': return <Clock className="h-4 w-4" />
      case 'completed': return <CircleCheck className="h-4 w-4" />
      case 'cancelled': return <CircleX className="h-4 w-4" />
      default: return null
    }
  }

  const getCategoryColor = (category: TaskCategory) => {
    switch (category) {
      case 'financial': return 'bg-green-500/10 text-green-500'
      case 'administrative': return 'bg-blue-500/10 text-blue-500'
      case 'reporting': return 'bg-purple-500/10 text-purple-500'
      case 'compliance': return 'bg-orange-500/10 text-orange-500'
      case 'project': return 'bg-pink-500/10 text-pink-500'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  const calculateProgress = (checklist?: ChecklistItem[]) => {
    if (!checklist || checklist.length === 0) return 0
    const completed = checklist.filter(item => item.completed).length
    return (completed / checklist.length) * 100
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Task Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <SquareCheck className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workMetrics.tasksInProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockMetrics.dueToday}</p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <CircleAlert className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockMetrics.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CircleCheck className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockMetrics.completedToday}</p>
                <p className="text-xs text-muted-foreground">Completed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockMetrics.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="px-3 py-2 text-sm border rounded-md"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>
            <select
              className="px-3 py-2 text-sm border rounded-md"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <Button variant="outline" size="icon">
              <ListFilter className="h-4 w-4" />
            </Button>
            {isOwner && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board View */}
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="kanban">Board View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['todo', 'in-progress', 'review', 'completed'] as const).map((status) => (
              <Card key={status} className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="capitalize">{status.replace('-', ' ')}</span>
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {tasksByStatus[status].length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasksByStatus[status].map((task) => (
                    <div
                      key={task.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm line-clamp-2">{task.title}</p>
                        <Flag className={cn("h-3 w-3", getPriorityColor(task.priority))} />
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className={cn("text-xs", getCategoryColor(task.category))}>
                          {task.category}
                        </Badge>
                        {task.isRecurring && (
                          <Badge variant="outline" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>

                      {task.checklist && (
                        <div className="mb-2">
                          <Progress value={calculateProgress(task.checklist)} className="h-1" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {task.checklist.filter(i => i.completed).length}/{task.checklist.length} completed
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(task.dueDate, 'MMM dd')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.attachments && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              <span>{task.attachments.length}</span>
                            </div>
                          )}
                          {task.comments && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{task.comments.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={task.status === 'completed'}
                          disabled={!isOwner}
                        />
                        <h4 className={cn(
                          "font-semibold",
                          task.status === 'completed' && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h4>
                        <Badge
                          variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}
                          className={cn("text-xs", getPriorityColor(task.priority))}
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          {task.priority}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="secondary" className={cn("text-xs", getCategoryColor(task.category))}>
                          {task.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.status.replace('-', ' ')}
                        </Badge>
                        {task.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {task.assignedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {format(task.dueDate, 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.estimatedHours}h estimated
                        </span>
                        {task.actualHours && (
                          <span className="flex items-center gap-1">
                            <CircleCheck className="h-3 w-3" />
                            {task.actualHours}h actual
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <EllipsisVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Detail Modal (simplified) */}
      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Task Details
              <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedTask.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
              </div>

              {selectedTask.checklist && (
                <div>
                  <p className="text-sm font-medium mb-2">Checklist</p>
                  <div className="space-y-2">
                    {selectedTask.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox checked={item.completed} disabled={!isOwner} />
                        <span className={cn(
                          "text-sm",
                          item.completed && "line-through text-muted-foreground"
                        )}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTask.comments && selectedTask.comments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Comments</p>
                  <div className="space-y-2">
                    {selectedTask.comments.map((comment) => (
                      <div key={comment.id} className="p-2 bg-muted/50 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(comment.date, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}