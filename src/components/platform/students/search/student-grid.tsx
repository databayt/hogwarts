"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Mail, Calendar, MapPin, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import type { Student } from "../registration/types";

interface StudentGridProps {
  students: Student[];
  onStudentSelect?: (student: Student) => void;
}

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-red-100 text-red-800",
  GRADUATED: "bg-blue-100 text-blue-800",
  TRANSFERRED: "bg-yellow-100 text-yellow-800",
  DROPPED_OUT: "bg-red-700 text-white",
};

export function StudentGrid({ students, onStudentSelect }: StudentGridProps) {
  const getInitials = (student: Student) => {
    return `${student.givenName?.[0] || ""}${student.surname?.[0] || ""}`.toUpperCase();
  };

  const getFullName = (student: Student) => {
    return [student.givenName, student.middleName, student.surname]
      .filter(Boolean)
      .join(" ");
  };

  const getAge = (dateOfBirth?: Date) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {students.map((student) => (
        <Card
          key={student.id}
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onStudentSelect?.(student)}
        >
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.profilePhotoUrl} alt={getFullName(student)} />
                  <AvatarFallback>{getInitials(student)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{getFullName(student)}</h4>
                  <p className="text-xs text-muted-foreground">
                    {student.grNumber || student.studentId || "No ID"}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onStudentSelect?.(student)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Generate Report</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className={statusColors[student.status]}>
                {student.status}
              </Badge>
              {student.studentType && student.studentType !== "REGULAR" && (
                <Badge variant="outline">{student.studentType}</Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {student.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{student.email}</span>
                </div>
              )}
              {student.mobileNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{student.mobileNumber}</span>
                </div>
              )}
              {student.dateOfBirth && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {getAge(student.dateOfBirth)} years • {student.gender}
                  </span>
                </div>
              )}
              {student.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{student.city}, {student.country}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Class</span>
                <span className="font-medium">Grade 10-A</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Enrolled</span>
                <span className="font-medium">
                  {student.enrollmentDate && format(new Date(student.enrollmentDate), "MMM yyyy")}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onStudentSelect?.(student);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}