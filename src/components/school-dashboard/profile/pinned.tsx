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
import useSWR from "swr"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OcticonGrabber, OcticonRepo } from "@/components/atom/icons"

import { getPinnedItems, updatePinnedItems } from "./actions"
import type { PinnedItem } from "./types"

interface PinnedItemsProps {
  userId?: string
  isOwner?: boolean
  dictionary?: Record<string, any>
}

type PinnedItemType =
  | "COURSE"
  | "SUBJECT"
  | "PROJECT"
  | "ACHIEVEMENT"
  | "CERTIFICATE"
  | "CLASS"
  | "CHILD"
  | "DEPARTMENT"
  | "PUBLICATION"
  | "TASK"

// Subset of the Prisma PinnedItem row we read and re-submit on reorder.
interface RawPinnedItem {
  id: string
  itemType: PinnedItemType
  itemId: string
  title: string
  description: string | null
  metadata: unknown
  isPublic: boolean
}

function toUiItem(row: RawPinnedItem): PinnedItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.itemType.toLowerCase(),
    categoryColor: "",
    stats: [],
    isPrivate: !row.isPublic,
  }
}

function toInput(row: RawPinnedItem) {
  return {
    itemType: row.itemType,
    itemId: row.itemId,
    title: row.title,
    description: row.description ?? undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    isPublic: row.isPublic,
  }
}

function PinnedCard({
  item,
  isOverlay,
  draggable,
  pinnedDict,
}: {
  item: PinnedItem
  isOverlay?: boolean
  draggable?: boolean
  pinnedDict?: Record<string, any>
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
              {item.isPrivate
                ? (pinnedDict?.private ?? "Private")
                : (pinnedDict?.public ?? "Public")}
            </Badge>
          </div>
          {draggable && (
            <button
              className="cursor-grab touch-none active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <OcticonGrabber className="text-muted-foreground size-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-3">
        {item.description && (
          <CardDescription className="text-muted-foreground line-clamp-2 text-xs">
            {item.description}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  )
}

export default function PinnedItems({
  userId,
  isOwner = false,
  dictionary,
}: PinnedItemsProps) {
  const pinnedDict = dictionary?.overview

  const { data: fetched } = useSWR(
    userId ? ["pinned", userId] : null,
    async () => {
      const res = await getPinnedItems(userId)
      return res.success ? (res.data as unknown as RawPinnedItem[]) : []
    },
    { revalidateOnFocus: false }
  )

  // Local reorder override; otherwise the server order is the source of truth.
  const [reordered, setReordered] = useState<RawPinnedItem[] | null>(null)
  const [activeItem, setActiveItem] = useState<PinnedItem | null>(null)

  const rows = useMemo(() => reordered ?? fetched ?? [], [reordered, fetched])
  const uiItems = useMemo(() => rows.map(toUiItem), [rows])
  const itemIds = useMemo(() => rows.map((r) => r.id), [rows])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    const item = uiItems.find((i) => i.id === event.active.id)
    if (item) setActiveItem(item)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveItem(null)
    if (!isOwner || !over || active.id === over.id) return

    const oldIndex = rows.findIndex((i) => i.id === active.id)
    const newIndex = rows.findIndex((i) => i.id === over.id)
    const next = arrayMove(rows, oldIndex, newIndex)
    setReordered(next)
    // Persist the new order (owner only).
    void updatePinnedItems(next.map(toInput))
  }

  // Still loading another user's pins.
  if (userId && fetched === undefined) return null

  // Nothing pinned: honest empty-state for the owner, nothing for visitors.
  if (rows.length === 0) {
    if (!isOwner) return null
    return (
      <div className="space-y-2">
        <h2 className="text-foreground text-sm font-medium">
          {pinnedDict?.pinned ?? "Pinned"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {pinnedDict?.noPinned ?? "No pinned items yet"}
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <h2 className="text-foreground text-sm font-medium">
          {pinnedDict?.pinned ?? "Pinned"}
        </h2>

        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {uiItems.map((item) => (
              <PinnedCard
                key={item.id}
                item={item}
                draggable={isOwner}
                pinnedDict={pinnedDict}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      <DragOverlay>
        {activeItem && (
          <PinnedCard item={activeItem} isOverlay pinnedDict={pinnedDict} />
        )}
      </DragOverlay>
    </DndContext>
  )
}
