"use client";

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Users, MapPin, Book, Save, Download, Upload, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  timeSlotId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  roomId?: string;
  roomNumber?: string;
  color?: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
  teacherId: string;
  teacherName: string;
}

interface TimetableBuilderProps {
  timeSlots: TimeSlot[];
  subjects: Subject[];
  classId: string;
  className: string;
  initialEntries?: TimetableEntry[];
  onSave: (entries: TimetableEntry[]) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Sunday' },
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];

const defaultTimeSlots: TimeSlot[] = [
  { id: '1', startTime: '08:00', endTime: '08:45', label: 'Period 1' },
  { id: '2', startTime: '08:45', endTime: '09:30', label: 'Period 2' },
  { id: '3', startTime: '09:30', endTime: '10:15', label: 'Period 3' },
  { id: '4', startTime: '10:15', endTime: '10:30', label: 'Break' },
  { id: '5', startTime: '10:30', endTime: '11:15', label: 'Period 4' },
  { id: '6', startTime: '11:15', endTime: '12:00', label: 'Period 5' },
  { id: '7', startTime: '12:00', endTime: '12:45', label: 'Period 6' },
  { id: '8', startTime: '12:45', endTime: '13:30', label: 'Lunch' },
  { id: '9', startTime: '13:30', endTime: '14:15', label: 'Period 7' },
  { id: '10', startTime: '14:15', endTime: '15:00', label: 'Period 8' },
];

const defaultSubjects: Subject[] = [
  { id: '1', name: 'Mathematics', color: 'bg-chart-1', teacherId: 't1', teacherName: 'Mr. Smith' },
  { id: '2', name: 'English', color: 'bg-chart-2', teacherId: 't2', teacherName: 'Ms. Johnson' },
  { id: '3', name: 'Science', color: 'bg-chart-3', teacherId: 't3', teacherName: 'Dr. Brown' },
  { id: '4', name: 'History', color: 'bg-chart-4', teacherId: 't4', teacherName: 'Mr. Wilson' },
  { id: '5', name: 'Art', color: 'bg-chart-5', teacherId: 't5', teacherName: 'Ms. Davis' },
];

// Draggable Subject Card
function DraggableSubject({ subject }: { subject: Subject }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subject.id,
    data: { type: 'subject', subject },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-3 rounded-lg cursor-move transition-colors",
        "hover:shadow-md",
        subject.color,
        "text-white"
      )}
    >
      <div className="font-medium text-sm">{subject.name}</div>
      <div className="text-xs opacity-90">{subject.teacherName}</div>
    </div>
  );
}

// Timetable Cell
function TimetableCell({
  day,
  timeSlot,
  entry,
  onDrop,
  onRemove,
}: {
  day: number;
  timeSlot: TimeSlot;
  entry?: TimetableEntry;
  onDrop: (dayOfWeek: number, timeSlotId: string, subject: Subject) => void;
  onRemove: (entryId: string) => void;
}) {
  const {
    setNodeRef,
    isOver,
  } = useSortable({
    id: `cell-${day}-${timeSlot.id}`,
    data: { type: 'cell', day, timeSlot },
  });

  const isBreak = timeSlot.label.toLowerCase().includes('break') ||
                  timeSlot.label.toLowerCase().includes('lunch');

  if (isBreak) {
    return (
      <div className="p-2 bg-muted text-center text-sm text-muted-foreground">
        {timeSlot.label}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-h-[80px] p-2 border rounded-lg transition-colors",
        isOver && "bg-primary/10 border-primary",
        !entry && "bg-muted"
      )}
    >
      {entry ? (
        <div
          className={cn(
            "h-full p-2 rounded text-white text-sm",
            entry.color || "bg-muted"
          )}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{entry.subjectName}</div>
              <div className="text-xs opacity-90">{entry.teacherName}</div>
              {entry.roomNumber && (
                <div className="text-xs opacity-90 mt-1">
                  <MapPin className="h-3 w-3 inline me-1" />
                  {entry.roomNumber}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-white/20"
              onClick={() => onRemove(entry.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
          Drop subject here
        </div>
      )}
    </div>
  );
}

export function TimetableBuilder({
  timeSlots = defaultTimeSlots,
  subjects = defaultSubjects,
  classId,
  className = "Class",
  initialEntries = [],
  onSave,
}: TimetableBuilderProps) {
  const [entries, setEntries] = useState<Map<string, TimetableEntry>>(
    new Map(initialEntries.map(e => [`${e.dayOfWeek}-${e.timeSlotId}`, e]))
  );
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'subject') {
      setActiveSubject(active.data.current.subject);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveSubject(null);
      return;
    }

    if (active.data.current?.type === 'subject' && over.data.current?.type === 'cell') {
      const subject = active.data.current.subject as Subject;
      const day = over.data.current.day;
      const timeSlot = over.data.current.timeSlot;

      handleAddEntry(day, timeSlot.id, subject);
    }

    setActiveSubject(null);
  };

  const handleAddEntry = (dayOfWeek: number, timeSlotId: string, subject: Subject) => {
    const key = `${dayOfWeek}-${timeSlotId}`;
    const newEntry: TimetableEntry = {
      id: `${Date.now()}-${Math.random()}`,
      dayOfWeek,
      timeSlotId,
      subjectId: subject.id,
      subjectName: subject.name,
      teacherId: subject.teacherId,
      teacherName: subject.teacherName,
      classId,
      className,
      color: subject.color,
    };

    setEntries(prev => new Map(prev).set(key, newEntry));
    toast.success(`Added ${subject.name} to timetable`);
  };

  const handleRemoveEntry = (entryId: string) => {
    setEntries(prev => {
      const newEntries = new Map(prev);
      for (const [key, entry] of newEntries) {
        if (entry.id === entryId) {
          newEntries.delete(key);
          break;
        }
      }
      return newEntries;
    });
    toast.success('Removed from timetable');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entriesArray = Array.from(entries.values());
      await onSave(entriesArray);
      toast.success('Timetable saved successfully');
    } catch (error) {
      toast.error('Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const data = Array.from(entries.values());
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable_${classId}_${Date.now()}.json`;
    a.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as TimetableEntry[];
        const newEntries = new Map(data.map(e => [`${e.dayOfWeek}-${e.timeSlotId}`, e]));
        setEntries(newEntries);
        toast.success('Timetable imported successfully');
      } catch (error) {
        toast.error('Failed to import timetable');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear the entire timetable?')) {
      setEntries(new Map());
      toast.success('Timetable cleared');
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const subjectHours = new Map<string, number>();
    entries.forEach(entry => {
      const current = subjectHours.get(entry.subjectName) || 0;
      subjectHours.set(entry.subjectName, current + 1);
    });

    const totalPeriods = timeSlots.filter(s =>
      !s.label.toLowerCase().includes('break') &&
      !s.label.toLowerCase().includes('lunch')
    ).length * DAYS_OF_WEEK.length;

    const filledPeriods = entries.size;

    return {
      totalPeriods,
      filledPeriods,
      fillRate: ((filledPeriods / totalPeriods) * 100).toFixed(1),
      subjectHours,
    };
  }, [entries, timeSlots]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Visual Timetable Builder</CardTitle>
                <CardDescription>
                  Drag subjects to time slots to create your weekly schedule for {className}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  <Trash2 className="h-4 w-4 me-2" />
                  Clear All
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 me-2" />
                  Export
                </Button>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="import-timetable"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="import-timetable" className="cursor-pointer">
                      <Upload className="h-4 w-4 me-2" />
                      Import
                    </label>
                  </Button>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 me-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          {/* Subject Palette */}
          <div className="col-span-3">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-sm">Subjects</CardTitle>
                <CardDescription className="text-xs">
                  Drag subjects to the timetable
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pe-4">
                  <SortableContext items={subjects.map(s => s.id)} strategy={rectSortingStrategy}>
                    <div className="space-y-2">
                      {subjects.map(subject => (
                        <DraggableSubject key={subject.id} subject={subject} />
                      ))}
                    </div>
                  </SortableContext>
                </ScrollArea>

                {/* Statistics */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="text-sm font-medium">Statistics</div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fill Rate:</span>
                      <span className="font-medium">{stats.fillRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Periods Filled:</span>
                      <span className="font-medium">{stats.filledPeriods}/{stats.totalPeriods}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 pt-2">
                    <div className="font-medium mb-1">Hours per Subject:</div>
                    {Array.from(stats.subjectHours).map(([subject, hours]) => (
                      <div key={subject} className="flex justify-between">
                        <span className="text-muted-foreground">{subject}:</span>
                        <span className="font-medium">{hours} periods</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timetable Grid */}
          <div className="col-span-9">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2 text-xs font-medium">Time</th>
                        {DAYS_OF_WEEK.map(day => (
                          <th key={day.id} className="border p-2 text-xs font-medium">
                            {day.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map(timeSlot => (
                        <tr key={timeSlot.id}>
                          <td className="border p-2 text-xs font-medium bg-muted">
                            <div>{timeSlot.label}</div>
                            <div className="text-muted-foreground">
                              {timeSlot.startTime} - {timeSlot.endTime}
                            </div>
                          </td>
                          {DAYS_OF_WEEK.map(day => (
                            <td key={day.id} className="border p-1">
                              <TimetableCell
                                day={day.id}
                                timeSlot={timeSlot}
                                entry={entries.get(`${day.id}-${timeSlot.id}`)}
                                onDrop={handleAddEntry}
                                onRemove={handleRemoveEntry}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeSubject && (
          <div
            className={cn(
              "p-3 rounded-lg shadow-lg cursor-move",
              activeSubject.color,
              "text-white opacity-90"
            )}
          >
            <div className="font-medium text-sm">{activeSubject.name}</div>
            <div className="text-xs opacity-90">{activeSubject.teacherName}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}