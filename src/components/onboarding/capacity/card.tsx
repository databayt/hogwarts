import { Building2, DoorOpen, Laptop, UserCheck, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CapacityCardProps {
  studentCount: number
  teachers: number
  classrooms: number
  facilities: number
  className?: string
}

export function CapacityCard({
  studentCount,
  teachers,
  classrooms,
  facilities,
  className,
}: CapacityCardProps) {
  const capacityItems = [
    {
      label: "Students",
      value: studentCount,
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
      value: classrooms,
      icon: DoorOpen,
      color: "text-chart-1",
    },
    {
      label: "Facilities",
      value: facilities,
      icon: Building2,
      color: "text-chart-3",
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
            Total capacity configured for your school management system
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
