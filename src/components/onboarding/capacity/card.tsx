// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { DoorOpen, Laptop, UserCheck, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CapacityCardProps {
  teachers: number
  sectionsPerGrade: number
  studentsPerSection: number
  gradeCount: number
  className?: string
}

export function CapacityCard({
  teachers,
  sectionsPerGrade,
  studentsPerSection,
  gradeCount,
  className,
}: CapacityCardProps) {
  const totalClassrooms = gradeCount * sectionsPerGrade
  const totalStudents = totalClassrooms * studentsPerSection

  const capacityItems = [
    {
      label: "Students",
      value: totalStudents,
      icon: Users,
      color: "text-chart-1",
    },
    {
      label: "Teachers",
      value: teachers,
      icon: UserCheck,
      color: "text-chart-2",
    },
    {
      label: "Classrooms",
      value: totalClassrooms,
      icon: DoorOpen,
      color: "text-chart-1",
    },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Laptop className="h-5 w-5" />
          School Capacity Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {capacityItems.map((item) => (
            <div
              key={item.label}
              className="bg-muted/50 flex items-center gap-3 rounded-lg p-3"
            >
              <div className={`bg-background rounded-lg p-2 ${item.color}`}>
                <item.icon size={20} />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{item.label}</p>
                <p className="text-lg font-semibold">
                  {item.value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-accent/50 mt-4 rounded-lg p-3">
          <p className="text-muted-foreground text-sm">
            {gradeCount} grades × {sectionsPerGrade} sections ×{" "}
            {studentsPerSection} students per section
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
