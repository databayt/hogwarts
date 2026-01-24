"use client"

import { useCallback, useMemo, useState } from "react"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  ListFilter,
  Search,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import type { Student, StudentSearchParams } from "../registration/types"
import { StudentGrid } from "./student-grid"
import { StudentTable } from "./student-table"

interface StudentSearchProps {
  onStudentSelect?: (student: Student) => void
  onAddStudent?: () => void
  onBulkImport?: () => void
  onExport?: () => void
}

const statusOptions = [
  { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "INACTIVE", label: "Inactive", color: "bg-gray-100 text-gray-800" },
  { value: "SUSPENDED", label: "Suspended", color: "bg-red-100 text-red-800" },
  {
    value: "GRADUATED",
    label: "Graduated",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "TRANSFERRED",
    label: "Transferred",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "DROPPED_OUT",
    label: "Dropped Out",
    color: "bg-red-100 text-red-800",
  },
]

const typeOptions = [
  { value: "REGULAR", label: "Regular" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "INTERNATIONAL", label: "International" },
  { value: "EXCHANGE", label: "Exchange" },
]

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
]

const categoryOptions = [
  { value: "General", label: "General" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
  { value: "OBC", label: "OBC" },
  { value: "EWS", label: "EWS" },
]

export function StudentSearch({
  onStudentSelect,
  onAddStudent,
  onBulkImport,
  onExport,
}: StudentSearchProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // ListFilter states
  const [filters, setFilters] = useState<StudentSearchParams>({
    query: "",
    status: [],
    type: [],
    gender: [],
    category: [],
    yearLevel: [],
    class: [],
    batch: [],
    hasDocuments: undefined,
    hasFeesPending: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  })

  const debouncedQuery = useDebounce(searchQuery, 300)

  // Mock data - in real implementation, fetch from server
  const [students, setStudents] = useState<Student[]>([
    {
      id: "1",
      schoolId: "school1",
      grNumber: "GR20240001",
      givenName: "John",
      surname: "Doe",
      dateOfBirth: new Date("2008-05-15"),
      gender: "Male",
      status: "ACTIVE",
      studentType: "REGULAR",
      enrollmentDate: new Date("2024-01-15"),
      email: "john.doe@student.com",
      mobileNumber: "+966 50 123 4567",
      city: "Riyadh",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      schoolId: "school1",
      grNumber: "GR20240002",
      givenName: "Jane",
      surname: "Smith",
      dateOfBirth: new Date("2008-08-20"),
      gender: "Female",
      status: "ACTIVE",
      studentType: "REGULAR",
      enrollmentDate: new Date("2024-01-15"),
      email: "jane.smith@student.com",
      mobileNumber: "+966 50 987 6543",
      city: "Jeddah",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Add more mock data as needed
  ])

  const clearFilters = () => {
    setFilters({
      query: "",
      status: [],
      type: [],
      gender: [],
      category: [],
      yearLevel: [],
      class: [],
      batch: [],
      hasDocuments: undefined,
      hasFeesPending: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
    setSearchQuery("")
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.status?.length) count += filters.status.length
    if (filters.type?.length) count += filters.type.length
    if (filters.gender?.length) count += filters.gender.length
    if (filters.category?.length) count += filters.category.length
    if (filters.yearLevel?.length) count += filters.yearLevel.length
    if (filters.class?.length) count += filters.class.length
    if (filters.batch?.length) count += filters.batch.length
    if (filters.hasDocuments !== undefined) count++
    if (filters.hasFeesPending !== undefined) count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    return count
  }, [filters])

  const filteredStudents = useMemo(() => {
    let result = [...students]

    // Apply search query
    if (debouncedQuery) {
      result = result.filter((student) => {
        const searchString = debouncedQuery.toLowerCase()
        return (
          student.givenName?.toLowerCase().includes(searchString) ||
          student.surname?.toLowerCase().includes(searchString) ||
          student.grNumber?.toLowerCase().includes(searchString) ||
          student.email?.toLowerCase().includes(searchString) ||
          student.mobileNumber?.includes(searchString)
        )
      })
    }

    // Apply filters
    if (filters.status?.length) {
      result = result.filter((s) => filters.status?.includes(s.status))
    }
    if (filters.type?.length) {
      result = result.filter((s) => filters.type?.includes(s.studentType))
    }
    if (filters.gender?.length) {
      result = result.filter((s) => filters.gender?.includes(s.gender))
    }
    if (filters.category?.length) {
      result = result.filter(
        (s) => s.category && filters.category?.includes(s.category)
      )
    }

    return result
  }, [students, debouncedQuery, filters])

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search by name, GR number, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <ListFilter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px]">
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>
                  ListFilter students by multiple criteria
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status ListFilter */}
                <div className="space-y-3">
                  <Label>Status</Label>
                  <div className="space-y-2">
                    {statusOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={filters.status?.includes(
                            option.value as any
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({
                                ...prev,
                                status: [
                                  ...(prev.status || []),
                                  option.value as any,
                                ],
                              }))
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                status: prev.status?.filter(
                                  (s) => s !== option.value
                                ),
                              }))
                            }
                          }}
                        />
                        <Label className="cursor-pointer font-normal">
                          <Badge variant="secondary" className={option.color}>
                            {option.label}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Type ListFilter */}
                <div className="space-y-3">
                  <Label>Student Type</Label>
                  <div className="space-y-2">
                    {typeOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={filters.type?.includes(option.value as any)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({
                                ...prev,
                                type: [
                                  ...(prev.type || []),
                                  option.value as any,
                                ],
                              }))
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                type: prev.type?.filter(
                                  (t) => t !== option.value
                                ),
                              }))
                            }
                          }}
                        />
                        <Label className="cursor-pointer font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Gender ListFilter */}
                <div className="space-y-3">
                  <Label>Gender</Label>
                  <div className="space-y-2">
                    {genderOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={filters.gender?.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({
                                ...prev,
                                gender: [...(prev.gender || []), option.value],
                              }))
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                gender: prev.gender?.filter(
                                  (g) => g !== option.value
                                ),
                              }))
                            }
                          }}
                        />
                        <Label className="cursor-pointer font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Date Range ListFilter */}
                <div className="space-y-3">
                  <Label>Enrollment Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !filters.dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateFrom
                            ? format(filters.dateFrom, "MMM dd, yyyy")
                            : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateFrom}
                          onSelect={(date) =>
                            setFilters((prev) => ({ ...prev, dateFrom: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !filters.dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateTo
                            ? format(filters.dateTo, "MMM dd, yyyy")
                            : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateTo}
                          onSelect={(date) =>
                            setFilters((prev) => ({ ...prev, dateTo: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Separator />

                {/* Additional Filters */}
                <div className="space-y-3">
                  <Label>Additional Filters</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.hasDocuments === true}
                        onCheckedChange={(checked) => {
                          setFilters((prev) => ({
                            ...prev,
                            hasDocuments: checked ? true : undefined,
                          }))
                        }}
                      />
                      <Label className="cursor-pointer font-normal">
                        Has uploaded documents
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.hasFeesPending === true}
                        onCheckedChange={(checked) => {
                          setFilters((prev) => ({
                            ...prev,
                            hasFeesPending: checked ? true : undefined,
                          }))
                        }}
                      />
                      <Label className="cursor-pointer font-normal">
                        Has pending fees
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                >
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="outline" onClick={onAddStudent}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>

          <Button variant="outline" onClick={onBulkImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>

          <Button variant="outline" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium">
            {filteredStudents.length}{" "}
            {filteredStudents.length === 1 ? "Student" : "Students"} Found
          </h3>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {activeFilterCount}{" "}
                {activeFilterCount === 1 ? "ListFilter" : "Filters"} Applied
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="bg-muted flex gap-1 rounded-lg p-1">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            Table
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            Grid
          </Button>
        </div>
      </div>

      {/* Results Display */}
      {viewMode === "table" ? (
        <StudentTable
          students={filteredStudents}
          onStudentSelect={onStudentSelect}
        />
      ) : (
        <StudentGrid
          students={filteredStudents}
          onStudentSelect={onStudentSelect}
        />
      )}

      {/* No Results */}
      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 font-medium">No Students Found</h3>
            <p className="text-muted-foreground max-w-md text-center text-sm">
              {searchQuery || activeFilterCount > 0
                ? "Try adjusting your search criteria or filters to find what you're looking for."
                : "Start by adding your first student to the system."}
            </p>
            {(searchQuery || activeFilterCount > 0) && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
