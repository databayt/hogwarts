import { getChildTimetable } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Props {
  studentId: string;
}

const DAYS_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_NAMES: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export async function ChildTimetableView({ studentId }: Props) {
  const { timetable } = await getChildTimetable({ studentId });

  // Group timetable entries by day
  const timetableByDay = DAYS_ORDER.reduce(
    (acc, day) => {
      acc[day] = timetable
        .filter((entry) => entry.dayOfWeek === day)
        .sort((a, b) => {
          const timeA = new Date(a.startTime).getTime();
          const timeB = new Date(b.startTime).getTime();
          return timeA - timeB;
        });
      return acc;
    },
    {} as Record<string, typeof timetable>
  );

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
          <CardDescription>
            {timetable.length > 0
              ? `Showing ${timetable.length} scheduled class${timetable.length !== 1 ? "es" : ""}`
              : "No timetable available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timetable.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No timetable entries found
            </p>
          ) : (
            <div className="space-y-6">
              {DAYS_ORDER.map((day) => {
                const dayEntries = timetableByDay[day];
                if (dayEntries.length === 0) return null;

                return (
                  <div key={day} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{DAY_NAMES[day]}</h3>
                      <Badge variant="outline">{dayEntries.length} classes</Badge>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px]">Period</TableHead>
                            <TableHead className="w-[140px]">Time</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead className="w-[100px]">Room</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayEntries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                {entry.periodName}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {formatTime(entry.startTime)} -{" "}
                                  {formatTime(entry.endTime)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">
                                  {entry.subjectName}
                                </span>
                              </TableCell>
                              <TableCell>{entry.className}</TableCell>
                              <TableCell>{entry.teacherName}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{entry.roomNumber}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
