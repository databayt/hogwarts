"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  CircleAlert,
  Clock,
  Copy,
  EllipsisVertical,
  MapPin,
  Move,
  PencilLine,
  Repeat,
  Trash,
  User,
} from "lucide-react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { TouchBackend } from "react-dnd-touch-backend"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { DAYS_OF_WEEK, GRID_SETTINGS } from "./config"
import {
  ClassroomInfo,
  DragDropEvent,
  DragItem,
  Period,
  SubjectInfo,
  TeacherInfo,
  TimetableDictionary,
  TimetableSlot,
} from "./types"
import {
  detectConflicts,
  formatPeriodTime,
  getDayName,
  getSlotDisplayInfo,
  getSubjectColor,
} from "./utils"

interface TimetableGridEnhancedProps {
  slots: TimetableSlot[]
  periods: Period[]
  workingDays: number[]
  teachers: TeacherInfo[]
  subjects: SubjectInfo[]
  classrooms: ClassroomInfo[]
  viewType: "class" | "teacher" | "room" | "student"
  viewId: string
  editable?: boolean
  showConflicts?: boolean
  colorScheme?: "subject" | "teacher" | "room" | "custom"
  onSlotClick?: (slot: TimetableSlot) => void
  onSlotEdit?: (slot: TimetableSlot) => void
  onSlotDelete?: (slotId: string) => void
  onSlotMove?: (event: DragDropEvent) => void
  onSlotCopy?: (
    slot: TimetableSlot,
    targetPosition: { day: number; period: string }
  ) => void
  onEmptyCellClick?: (day: number, periodId: string) => void
  dictionary?: TimetableDictionary
}

const DraggableSlot: React.FC<{
  slot: TimetableSlot
  displayInfo: ReturnType<typeof getSlotDisplayInfo>
  onEdit?: () => void
  onDelete?: () => void
  editable?: boolean
}> = ({ slot, displayInfo, onEdit, onDelete, editable }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "slot",
      item: { slot },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [slot]
  )

  const ref = useRef<HTMLDivElement>(null)
  drag(ref)

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-full cursor-move rounded-md p-2 transition-all",
        "hover:scale-[1.02] hover:shadow-lg",
        isDragging && "opacity-50",
        displayInfo.isSubstitute && "border-2 border-dashed border-orange-400"
      )}
      style={{
        backgroundColor: `${displayInfo.color}20`,
        borderColor: displayInfo.color,
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      <div className="mb-1 flex items-start justify-between">
        <h6 className="truncate" style={{ color: displayInfo.color }}>
          {displayInfo.subject}
        </h6>
        {editable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <EllipsisVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <PencilLine className="me-2 h-4 w-4" />
                Pencil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="me-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Move className="me-2 h-4 w-4" />
                Move
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash className="me-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="space-y-1">
        <p className="muted flex items-center">
          <User className="me-1 h-3 w-3" />
          <small className="truncate">{displayInfo.teacher}</small>
        </p>
        {slot.classroomId && (
          <p className="muted flex items-center">
            <MapPin className="me-1 h-3 w-3" />
            <small className="truncate">{slot.classroomId}</small>
          </p>
        )}
      </div>

      {displayInfo.isSubstitute && (
        <Badge variant="outline" className="absolute top-1 right-1">
          <small>Sub</small>
        </Badge>
      )}
    </div>
  )
}

const DroppableCell: React.FC<{
  day: number
  periodId: string
  slot?: TimetableSlot | null
  displayInfo?: ReturnType<typeof getSlotDisplayInfo>
  onDrop: (item: DragItem, day: number, periodId: string) => void
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  editable?: boolean
  isBreak?: boolean
}> = ({
  day,
  periodId,
  slot,
  displayInfo,
  onDrop,
  onClick,
  onEdit,
  onDelete,
  editable,
  isBreak,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: "slot",
      drop: (item: DragItem) => onDrop(item, day, periodId),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [day, periodId, onDrop]
  )

  const ref = useRef<HTMLTableCellElement>(null)
  drop(ref)

  if (isBreak) {
    return (
      <td className="bg-muted text-center">
        <p className="muted">Break</p>
      </td>
    )
  }

  return (
    <td
      ref={ref}
      className={cn(
        "relative min-h-[60px] border-r border-b p-1 transition-all",
        "hover:bg-accent/5",
        isOver && canDrop && "bg-primary/10 border-primary",
        !slot && editable && "cursor-pointer"
      )}
      onClick={() => !slot && onClick?.()}
      style={{ minHeight: `${GRID_SETTINGS.CELL_MIN_HEIGHT}px` }}
    >
      {slot && displayInfo ? (
        <DraggableSlot
          slot={slot}
          displayInfo={displayInfo}
          onEdit={onEdit}
          onDelete={onDelete}
          editable={editable}
        />
      ) : (
        <div className="h-full w-full" />
      )}
    </td>
  )
}

export function TimetableGridEnhanced({
  slots,
  periods,
  workingDays,
  teachers,
  subjects,
  classrooms,
  viewType,
  viewId,
  editable = false,
  showConflicts = true,
  colorScheme = "subject",
  onSlotClick,
  onSlotEdit,
  onSlotDelete,
  onSlotMove,
  onSlotCopy,
  onEmptyCellClick,
  dictionary = {},
}: TimetableGridEnhancedProps) {
  const [conflicts, setConflicts] = useState<
    ReturnType<typeof detectConflicts>
  >([])
  const [isMobile, setIsMobile] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(window.innerWidth < GRID_SETTINGS.MOBILE_BREAKPOINT)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (showConflicts) {
      setConflicts(detectConflicts(slots))
    }
  }, [slots, showConflicts])

  const handleDrop = useCallback(
    (item: DragItem, day: number, periodId: string) => {
      if (!onSlotMove) return

      const event: DragDropEvent = {
        source: {
          slot: item.slot,
          position: {
            day: item.slot.dayOfWeek,
            period: parseInt(item.slot.periodId),
          },
        },
        target: {
          position: { day, period: parseInt(periodId) },
          classId: viewType === "class" ? viewId : undefined,
        },
        type: "move",
      }

      onSlotMove(event)
    },
    [onSlotMove, viewType, viewId]
  )

  const handleSlotEdit = useCallback(
    (slot: TimetableSlot) => {
      setSelectedSlot(slot)
      onSlotEdit?.(slot)
    },
    [onSlotEdit]
  )

  const handleSlotDelete = useCallback((slot: TimetableSlot) => {
    setSelectedSlot(slot)
    setShowDeleteDialog(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (selectedSlot) {
      onSlotDelete?.(selectedSlot.id)
      setShowDeleteDialog(false)
      setSelectedSlot(null)
    }
  }, [selectedSlot, onSlotDelete])

  const getSlotForCell = (
    day: number,
    periodId: string
  ): TimetableSlot | null => {
    return (
      slots.find((s) => s.dayOfWeek === day && s.periodId === periodId) || null
    )
  }

  const Backend = isMobile ? TouchBackend : HTML5Backend

  return (
    <DndProvider backend={Backend}>
      <div className="w-full overflow-x-auto">
        {conflicts.length > 0 && showConflicts && (
          <div className="bg-chart-4 border-chart-4 mb-4 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <CircleAlert className="text-chart-4 h-5 w-5" />
              <h6 className="text-foreground">
                {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""}{" "}
                detected
              </h6>
            </div>
          </div>
        )}

        <table className="bg-background w-full border-collapse overflow-hidden rounded-lg shadow-sm">
          <thead>
            <tr className="bg-muted">
              <th
                className="border-r border-b p-3 text-start"
                style={{ width: `${GRID_SETTINGS.TIME_COLUMN_WIDTH}px` }}
              >
                <h6 className="inline-flex items-center">
                  <Clock className="me-2 h-4 w-4" />
                  {dictionary.time || "Time"}
                </h6>
              </th>
              {workingDays.map((day) => (
                <th key={day} className="border-r border-b p-3 text-center">
                  <h6>{getDayName(day, isMobile)}</h6>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id}>
                <td className="bg-muted border-r border-b p-3">
                  <h6>{period.name}</h6>
                  <p className="muted">
                    <small>
                      {formatPeriodTime(period.startTime, period.endTime)}
                    </small>
                  </p>
                </td>
                {workingDays.map((day) => {
                  const slot = getSlotForCell(day, period.id)
                  const displayInfo = slot
                    ? getSlotDisplayInfo(slot, subjects, teachers)
                    : undefined

                  return (
                    <DroppableCell
                      key={`${day}-${period.id}`}
                      day={day}
                      periodId={period.id}
                      slot={slot}
                      displayInfo={displayInfo}
                      onDrop={handleDrop}
                      onClick={() => onEmptyCellClick?.(day, period.id)}
                      onEdit={() => slot && handleSlotEdit(slot)}
                      onDelete={() => slot && handleSlotDelete(slot)}
                      editable={editable}
                      isBreak={period.isBreak}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <h4>Delete Timetable Slot</h4>
            </DialogTitle>
            <DialogDescription>
              <p className="muted">
                Are you sure you want to delete this slot? This action cannot be
                undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndProvider>
  )
}
