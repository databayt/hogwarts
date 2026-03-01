// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getDisplayText } from "@/lib/content-display"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getRoomCapacityOverview } from "./actions"

interface Props {
  lang: Locale
}

export default async function RoomCapacityContent({ lang }: Props) {
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.classrooms?.roomCapacity

  if (!schoolId) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        {dictionary?.school?.classrooms?.missingSchool ||
          "Missing school context"}
      </div>
    )
  }

  const rooms = await getRoomCapacityOverview()

  if (!rooms || rooms.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center">
          {d?.noRooms || "No classrooms found. Create rooms in the Rooms tab."}
        </CardContent>
      </Card>
    )
  }

  // Translate room data
  const translatedRooms = await Promise.all(
    rooms.map(async (r) => ({
      id: r.id,
      roomName: await getDisplayText(
        r.roomName,
        (r.lang as "ar" | "en") || "ar",
        lang,
        schoolId
      ),
      capacity: r.capacity,
      typeName: await getDisplayText(
        r.classroomType.name,
        (r.classroomType.lang as "ar" | "en") || "ar",
        lang,
        schoolId
      ),
      gradeName: r.grade
        ? await getDisplayText(
            r.grade.name,
            (r.grade.lang as "ar" | "en") || "ar",
            lang,
            schoolId
          )
        : null,
      classCount: r._count.classes,
    }))
  )

  // Calculate summary stats
  const totalRooms = translatedRooms.length
  const totalCapacity = translatedRooms.reduce((sum, r) => sum + r.capacity, 0)
  const avgCapacity = Math.round(totalCapacity / totalRooms)
  const roomsWithClasses = translatedRooms.filter(
    (r) => r.classCount > 0
  ).length
  const avgUtilization =
    totalRooms > 0 ? Math.round((roomsWithClasses / totalRooms) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              {d?.totalRooms || "Total Rooms"}
            </p>
            <p className="text-2xl font-semibold">{totalRooms}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              {d?.totalCapacity || "Total Capacity"}
            </p>
            <p className="text-2xl font-semibold">{totalCapacity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              {d?.avgCapacity || "Avg Capacity"}
            </p>
            <p className="text-2xl font-semibold">{avgCapacity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              {d?.avgUtilization || "Avg Utilization"}
            </p>
            <p className="text-2xl font-semibold">{avgUtilization}%</p>
            <Progress value={avgUtilization} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Room Table */}
      <Card>
        <CardHeader>
          <CardTitle>{d?.title || "Room Capacity Overview"}</CardTitle>
          <CardDescription>
            {d?.description ||
              "Physical room utilization and capacity across all classrooms."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{d?.room || "Room"}</TableHead>
                <TableHead>{d?.type || "Type"}</TableHead>
                <TableHead>{d?.grade || "Grade"}</TableHead>
                <TableHead>{d?.capacity || "Capacity"}</TableHead>
                <TableHead>{d?.assigned || "Assigned"}</TableHead>
                <TableHead>{d?.utilization || "Utilization"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {translatedRooms.map((room) => {
                const utilizationPct =
                  room.capacity > 0
                    ? Math.round((room.classCount / room.capacity) * 100)
                    : 0
                return (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">
                      {room.roomName}
                    </TableCell>
                    <TableCell>{room.typeName}</TableCell>
                    <TableCell>
                      {room.gradeName || (
                        <Badge variant="secondary">
                          {dictionary?.school?.classrooms?.shared || "Shared"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>
                      {room.classCount}{" "}
                      {dictionary?.school?.classrooms?.classes || "classes"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(utilizationPct, 100)}
                          className="h-1.5 w-16"
                        />
                        <span className="text-muted-foreground text-xs">
                          {utilizationPct}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
