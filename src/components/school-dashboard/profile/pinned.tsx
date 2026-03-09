"use client"

import { useMemo, useState } from "react"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OcticonGrabber, OcticonRepo } from "@/components/atom/icons"

import type { PinnedItem, ProfileRole } from "./types"

interface PinnedItemsProps {
  role: ProfileRole
  data: Record<string, unknown>
}

function getPinnedItemsForRole(role: ProfileRole): PinnedItem[] {
  switch (role) {
    case "student":
      return [
        {
          id: "1",
          title: "Advanced Mathematics",
          description: "Calculus, Linear Algebra, and Statistics coursework",
          category: "mathematics",
          categoryColor: "",
          stats: [
            { label: "Grade", value: "A" },
            { label: "Progress", value: "85%" },
          ],
          isPrivate: false,
        },
        {
          id: "2",
          title: "Science Fair Project",
          description: "Renewable Energy: Solar Panel Efficiency Analysis",
          category: "science",
          categoryColor: "",
          stats: [
            { label: "Status", value: "1st Place" },
            { label: "Year", value: "2024" },
          ],
          isPrivate: false,
        },
        {
          id: "3",
          title: "English Literature",
          description: "Analysis of Modern Literature and Creative Writing",
          category: "english",
          categoryColor: "",
          stats: [
            { label: "Grade", value: "A-" },
            { label: "Essays", value: "12" },
          ],
          isPrivate: false,
        },
        {
          id: "4",
          title: "History Research Paper",
          description: "The Impact of Industrial Revolution on Modern Society",
          category: "history",
          categoryColor: "",
          stats: [
            { label: "Pages", value: "24" },
            { label: "Grade", value: "A+" },
          ],
          isPrivate: false,
        },
        {
          id: "5",
          title: "Art Portfolio",
          description: "Collection of digital and traditional artwork",
          category: "art",
          categoryColor: "",
          stats: [
            { label: "Pieces", value: "15" },
            { label: "Exhibitions", value: "2" },
          ],
          isPrivate: true,
        },
        {
          id: "6",
          title: "Coding Projects",
          description: "Web development and programming assignments",
          category: "project",
          categoryColor: "",
          stats: [
            { label: "Projects", value: "8" },
            { label: "Languages", value: "3" },
          ],
          isPrivate: false,
        },
      ]
    case "teacher":
      return [
        {
          id: "1",
          title: "Advanced Calculus - Grade 12",
          description: "Differential equations and integration techniques",
          category: "mathematics",
          categoryColor: "",
          stats: [
            { label: "Students", value: 32 },
            { label: "Avg Grade", value: "B+" },
          ],
          isPrivate: false,
        },
        {
          id: "2",
          title: "Algebra II - Grade 10",
          description: "Polynomial functions and complex numbers",
          category: "mathematics",
          categoryColor: "",
          stats: [
            { label: "Students", value: 28 },
            { label: "Avg Grade", value: "A-" },
          ],
          isPrivate: false,
        },
        {
          id: "3",
          title: "Statistics - Grade 11",
          description: "Probability theory and data analysis",
          category: "mathematics",
          categoryColor: "",
          stats: [
            { label: "Students", value: 25 },
            { label: "Avg Grade", value: "B" },
          ],
          isPrivate: false,
        },
        {
          id: "4",
          title: "Math Competition Team",
          description: "Preparing students for regional mathematics olympiad",
          category: "project",
          categoryColor: "",
          stats: [
            { label: "Members", value: 12 },
            { label: "Medals", value: 5 },
          ],
          isPrivate: false,
        },
      ]
    case "parent":
      return [
        {
          id: "1",
          title: "Emma's Progress",
          description: "Grade 10 - Overall academic performance tracking",
          category: "project",
          categoryColor: "",
          stats: [
            { label: "GPA", value: "3.9" },
            { label: "Subjects", value: 8 },
          ],
          isPrivate: true,
        },
        {
          id: "2",
          title: "Liam's Progress",
          description: "Grade 8 - Academic and extracurricular activities",
          category: "project",
          categoryColor: "",
          stats: [
            { label: "GPA", value: "3.7" },
            { label: "Clubs", value: 3 },
          ],
          isPrivate: true,
        },
        {
          id: "3",
          title: "Sophia's Progress",
          description: "Grade 6 - Foundation level excellence",
          category: "project",
          categoryColor: "",
          stats: [
            { label: "GPA", value: "4.0" },
            { label: "Awards", value: 2 },
          ],
          isPrivate: true,
        },
        {
          id: "4",
          title: "School Events",
          description: "Upcoming parent-teacher conferences and activities",
          category: "default",
          categoryColor: "",
          stats: [
            { label: "Upcoming", value: 5 },
            { label: "Attended", value: 12 },
          ],
          isPrivate: false,
        },
      ]
    case "staff":
      return [
        {
          id: "1",
          title: "Student Enrollment System",
          description: "Managing new student registrations and documentation",
          category: "project",
          categoryColor: "",
          stats: [
            { label: "Processed", value: 156 },
            { label: "Pending", value: 8 },
          ],
          isPrivate: false,
        },
        {
          id: "2",
          title: "Financial Records",
          description: "Fee collection and expense tracking",
          category: "default",
          categoryColor: "",
          stats: [
            { label: "Collected", value: "98%" },
            { label: "Outstanding", value: 12 },
          ],
          isPrivate: true,
        },
        {
          id: "3",
          title: "Event Planning",
          description: "Coordinating school events and ceremonies",
          category: "project",
          categoryColor: "",
          stats: [
            { label: "Events", value: 8 },
            { label: "This Month", value: 2 },
          ],
          isPrivate: false,
        },
        {
          id: "4",
          title: "Facility Management",
          description: "Maintenance schedules and resource allocation",
          category: "default",
          categoryColor: "",
          stats: [
            { label: "Tasks", value: 24 },
            { label: "Completed", value: "92%" },
          ],
          isPrivate: false,
        },
      ]
    default:
      return []
  }
}

function PinnedCard({
  item,
  isOverlay,
}: {
  item: PinnedItem
  isOverlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-border bg-card relative overflow-hidden rounded-sm border ${
        isDragging ? "z-50 opacity-50" : ""
      } ${isOverlay ? "shadow-lg ring-1 ring-[#0969da]/30" : ""}`}
    >
      <CardHeader className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <OcticonRepo className="text-muted-foreground size-4 shrink-0" />
            <CardTitle className="truncate text-xs font-semibold text-[#0969da] hover:underline">
              {item.title}
            </CardTitle>
            <Badge
              variant="outline"
              className="h-4 shrink-0 px-1.5 py-0 text-[10px]"
            >
              {item.isPrivate ? "Private" : "Public"}
            </Badge>
          </div>
          <button
            className="cursor-grab touch-none active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <OcticonGrabber className="text-muted-foreground size-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-3">
        <CardDescription className="text-muted-foreground mb-3 line-clamp-2 min-h-[2lh] text-xs">
          {item.description}
        </CardDescription>
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          {item.stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-current opacity-60" />
              <span>{stat.label}:</span>
              <span className="text-foreground font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function PinnedItems({ role, data }: PinnedItemsProps) {
  const initialItems = getPinnedItemsForRole(role)
  const [items, setItems] = useState(initialItems)
  const [activeItem, setActiveItem] = useState<PinnedItem | null>(null)

  const itemIds = useMemo(() => items.map((i) => i.id), [items])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const item = items.find((i) => i.id === active.id)
    if (item) setActiveItem(item)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveItem(null)
    if (!over || active.id === over.id) return

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id)
      const newIndex = prev.findIndex((i) => i.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  if (items.length === 0) return null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-sm font-medium">Pinned</h2>
          <button className="text-xs text-[#0969da] transition-colors hover:text-[#0969da]/80">
            Customize your pins
          </button>
        </div>

        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((item) => (
              <PinnedCard key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </div>

      <DragOverlay>
        {activeItem && <PinnedCard item={activeItem} isOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
