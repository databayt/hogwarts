"use client"

import { format } from "date-fns"
import { Pencil, Plus, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Scholarship {
  id: string
  name: string
  academicYear: string
  coverageType: string
  coverageAmount: any
  currentBeneficiaries: number
  maxBeneficiaries?: number | null
  startDate: Date | string
  endDate: Date | string
  isActive: boolean
}

interface Props {
  scholarships: Scholarship[]
  dictionary?: Dictionary
}

export function ScholarshipsList({ scholarships, dictionary }: Props) {
  const formatCoverage = (type: string, amount: any) => {
    const value = typeof amount === "object" ? amount.toNumber() : amount

    switch (type) {
      case "PERCENTAGE":
        return `${value}%`
      case "FIXED_AMOUNT":
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }).format(value)
      case "FULL":
        return "100%"
      default:
        return value
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Scholarships</CardTitle>
          <CardDescription>
            Manage scholarship programs and beneficiaries
          </CardDescription>
        </div>
        <Button>
          <Plus className="me-2 h-4 w-4" />
          Add Scholarship
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Beneficiaries</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scholarships.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  No scholarships found
                </TableCell>
              </TableRow>
            ) : (
              scholarships.map((scholarship) => (
                <TableRow key={scholarship.id}>
                  <TableCell className="font-medium">
                    {scholarship.name}
                  </TableCell>
                  <TableCell>{scholarship.academicYear}</TableCell>
                  <TableCell>
                    {formatCoverage(
                      scholarship.coverageType,
                      scholarship.coverageAmount
                    )}
                  </TableCell>
                  <TableCell>
                    {scholarship.currentBeneficiaries}
                    {scholarship.maxBeneficiaries &&
                      ` / ${scholarship.maxBeneficiaries}`}
                  </TableCell>
                  <TableCell>
                    {format(new Date(scholarship.startDate), "MMM dd")} -
                    {format(new Date(scholarship.endDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={scholarship.isActive ? "default" : "secondary"}
                    >
                      {scholarship.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
