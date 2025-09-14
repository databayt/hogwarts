'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function UserRolesTable() {
  const roles = [
    {
      role: "DEVELOPER",
      description: "Platform administrator",
      access: "All schools",
      useCase: "System maintenance, cross-tenant operations"
    },
    {
      role: "ADMIN",
      description: "School administrator",
      access: "Single school",
      useCase: "School management, user oversight"
    },
    {
      role: "TEACHER",
      description: "Teaching staff",
      access: "Single school",
      useCase: "Class management, grading, attendance"
    },
    {
      role: "STUDENT",
      description: "Enrolled students",
      access: "Single school",
      useCase: "Learning management, assignment submission"
    },
    {
      role: "GUARDIAN",
      description: "Student parents/guardians",
      access: "Single school",
      useCase: "Monitor child's progress, communication"
    },
    {
      role: "ACCOUNTANT",
      description: "Finance staff",
      access: "Single school",
      useCase: "Billing, financial reporting"
    },
    {
      role: "STAFF",
      description: "General school staff",
      access: "Single school",
      useCase: "Administrative support"
    },
    {
      role: "USER",
      description: "Default role",
      access: "Single school",
      useCase: "Base level access"
    }
  ]

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Role</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>School Access</TableHead>
          <TableHead>Typical Use Case</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow key={role.role}>
            <TableCell className="font-medium">{role.role}</TableCell>
            <TableCell>{role.description}</TableCell>
            <TableCell>{role.access}</TableCell>
            <TableCell>{role.useCase}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
