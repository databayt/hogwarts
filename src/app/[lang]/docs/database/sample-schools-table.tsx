'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function SampleSchoolsTable() {
  const schools = [
    {
      name: "Hogwarts",
      domain: "hogwarts.com",
      description: "School of Witchcraft and Wizardry",
      stats: [
        "Complete academic structure",
        "4 houses with qualified professors",
        "1000+ active students",
        "Full magical curriculum"
      ]
    },
    {
      name: "Beauxbatons",
      domain: "beauxbatons.com",
      description: "Academy of Magic",
      stats: [
        "French academic system",
        "6 departments",
        "700+ students",
        "Specialized courses"
      ]
    },
    {
      name: "Durmstrang",
      domain: "durmstrang.com",
      description: "Institute for Magical Learning",
      stats: [
        "Nordic education model",
        "5 faculties",
        "500+ students",
        "Advanced programs"
      ]
    }
  ]

  return (
    <div className="space-y-8">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">School</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schools.map((school) => (
            <TableRow key={school.name}>
              <TableCell className="font-medium">{school.name}</TableCell>
              <TableCell>
                <code className="text-sm">{school.domain}</code>
              </TableCell>
              <TableCell>{school.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="grid grid-cols-3 gap-4">
        {schools.map((school) => (
          <div key={school.name} className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">{school.name}</h4>
            <ul className="space-y-1 text-sm">
              {school.stats.map((stat, index) => (
                <li key={index}>• {stat}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
