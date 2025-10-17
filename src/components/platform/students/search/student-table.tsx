"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, FileText, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Student } from "../registration/types";

interface StudentTableProps {
  students: Student[];
  onStudentSelect?: (student: Student) => void;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  enableSelection?: boolean;
}

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-red-100 text-red-800",
  GRADUATED: "bg-blue-100 text-blue-800",
  TRANSFERRED: "bg-yellow-100 text-yellow-800",
  DROPPED_OUT: "bg-red-700 text-white",
};

export function StudentTable({
  students,
  onStudentSelect,
  onEdit,
  onDelete,
  enableSelection = false,
}: StudentTableProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {enableSelection && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedStudents.size === students.length && students.length > 0}
                  indeterminate={selectedStudents.size > 0 && selectedStudents.size < students.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead>Student</TableHead>
            <TableHead>GR Number</TableHead>
            <TableHead>Age/Gender</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enrollment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onStudentSelect?.(student)}
            >
              {enableSelection && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={() => toggleSelectStudent(student.id)}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={student.profilePhotoUrl} alt={getFullName(student)} />
                    <AvatarFallback className="text-xs">{getInitials(student)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{getFullName(student)}</div>
                    {student.studentType && student.studentType !== "REGULAR" && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {student.studentType}
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm">{student.grNumber || student.studentId || "-"}</div>
                {student.admissionNumber && (
                  <div className="text-xs text-muted-foreground">Adm: {student.admissionNumber}</div>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {student.dateOfBirth && (
                    <span>{getAge(student.dateOfBirth)} years</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{student.gender}</div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {student.email && (
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {student.email}
                    </div>
                  )}
                  {student.mobileNumber && (
                    <div className="text-xs text-muted-foreground">{student.mobileNumber}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">Grade 10-A</div>
                <div className="text-xs text-muted-foreground">Science</div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[student.status]}>
                  {student.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {student.enrollmentDate && format(new Date(student.enrollmentDate), "MMM dd, yyyy")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {student.category || "General"}
                </div>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onStudentSelect?.(student)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(student)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Student
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard className="mr-2 h-4 w-4" />
                      View Fees
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="mr-2 h-4 w-4" />
                      View Attendance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDelete?.(student)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Student
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}