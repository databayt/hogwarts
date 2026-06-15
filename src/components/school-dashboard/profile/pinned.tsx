"use client"

import { useMemo, useState, useTransition } from "react"
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
import { X } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OcticonGrabber, OcticonRepo } from "@/components/atom/icons"

import { updatePinnedItems } from "./actions"
import type { ProfilePinnedView } from "./queries"

interface PinnedItemsProps {
  items: ProfilePinnedView[]
  isOwner?: boolean
  dictionary?: Record<string, any>
}

interface PinStat {
  label: string
  value: string | number
}

function statsFromMetadata(meta: Record<string, unknown> | null): PinStat[] {
  if (!meta || !Array.isArray((meta as any).stats)) return []
  return ((meta as any).stats as PinStat[]).slice(0, 3)
}

function PinnedCard({
  item,
  isOwner,
  isOverlay,
  pinnedDict,
  onRemove,
}: {
  item: ProfilePinnedView
  isOwner?: boolean
  isOverlay?: boolean
  pinnedDict?: Record<string, any>
  onRemove?: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !isOwner })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const stats = statsFromMetadata(item.metadata)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-border bg-card relative overflow-hidden rounded-sm border ${
        isDragging ? "z-50 opacity-50" : ""
      } ${isOverlay ? "ring-primary/30 shadow-lg ring-1" : ""}`}
    >
      <CardHeader className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <OcticonRepo className="text-muted-foreground size-4 shrink-0" />
            <CardTitle className="text-primary truncate text-xs font-semibold">
              {item.title}
            </CardTitle>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onRemove?.(item.id)}
                aria-label={pinnedDict?.removePin ?? "Remove"}
                className="text-muted-foreground hover:text-destructive p-0.5"
              >
                <X className="size-3.5" />
              </button>
              <button
                type="button"
                className="cursor-grab touch-none active:cursor-grabbing"
                aria-label={pinnedDict?.reorder ?? "Reorder"}
                {...attributes}
                {...listeners}
              >
                <OcticonGrabber className="text-muted-foreground size-4" />
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-3">
        {item.description && (
          <CardDescription className="text-muted-foreground mb-3 line-clamp-2 text-xs">
            {item.description}
          </CardDescription>
        )}
        {stats.length > 0 && (
          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-current opacity-60" />
                <span>{stat.label}:</span>
                <span className="text-foreground font-medium">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function PinnedItems({
  items: initial,
  isOwner,
  dictionary,
}: PinnedItemsProps) {
  const pinnedDict = dictionary?.overview
  const [items, setItems] = useState<ProfilePinnedView[]>(initial)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const itemIds = useMemo(() => items.map((i) => i.id), [items])
  const activeItem = items.find((i) => i.id === activeId) ?? null

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  function persist(next: ProfilePinnedView[]) {
    startTransition(async () => {
      await updatePinnedItems(
        next.map((i) => ({
          itemType: i.itemType as any,
          itemId: i.itemId,
          title: i.title,
          description: i.description ?? undefined,
          metadata: i.metadata ?? undefined,
          isPublic: i.isPublic,
        }))
      )
    })
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id)
      const newIndex = prev.findIndex((i) => i.id === over.id)
      const next = arrayMove(prev, oldIndex, newIndex)
      persist(next)
      return next
    })
  }

  function handleRemove(id: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id)
      persist(next)
      return next
    })
  }

  if (items.length === 0) {
    if (!isOwner) return null
    return (
      <div className="space-y-2">
        <h2 className="text-foreground text-sm font-medium">
          {pinnedDict?.pinned ?? ""}
        </h2>
        <div className="border-border text-muted-foreground rounded-md border border-dashed p-6 text-center text-xs">
          {pinnedDict?.noPins ?? ""}
        </div>
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
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-sm font-medium">
            {pinnedDict?.pinned ?? ""}
          </h2>
        </div>

        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((item) => (
              <PinnedCard
                key={item.id}
                item={item}
                isOwner={isOwner}
                pinnedDict={pinnedDict}
                onRemove={handleRemove}
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
