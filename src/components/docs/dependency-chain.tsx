"use client"

const steps = [
  {
    id: "1",
    label: "Global Catalog",
    desc: "~220 grade-specific US K-12 subjects shared across all schools. No schoolId. CatalogSubject → CatalogBook → CatalogMaterial. Expandable to British, Sudanese, IB curricula.",
  },
  {
    id: "2",
    label: "School Onboarding",
    desc: "Collects school type, country, capacity, schedule preferences. Auto-creates SchoolYear, 2 Terms, SchoolWeekConfig (working days), and Periods (count + duration). Sets language and timezone.",
  },
  {
    id: "3",
    label: "Academic Structure",
    desc: "AcademicLevel → AcademicGrade → AcademicStream. Example: High School → Grade 10 → Science Stream. Derived from school type + country. Grades link to catalog via gradeNumber.",
  },
  {
    id: "4",
    label: "Subject Selection",
    desc: "Bridges CatalogSubject to school Subject per grade. Subject.catalogSubjectId links to LMS content and books. setupCatalogForSchool() auto-populates. Schools can add custom subjects.",
  },
]

const parallel = [
  {
    id: "5a",
    label: "Teacher Assignment",
    desc: "SchoolMember (TEACHER) → Class → Subject. One teacher per class-subject pair. Assigned per term.",
  },
  {
    id: "5b",
    label: "Student Enrollment",
    desc: "Application → Admission → StudentClass bridge. Enrolled per grade + term. Bulk import via CSV supported.",
  },
]

const after = [
  {
    id: "6",
    label: "Classroom Setup",
    desc: "Physical rooms with type (lab, lecture, gym), capacity, and equipment constraints. ClassroomAssignment links class → room per period.",
  },
  {
    id: "7",
    label: "Timetable",
    desc: "TimetableSlot = day × period × class × teacher × room. Conflict detection for teacher, room, and class overlaps. Requires all layers above.",
  },
  {
    id: "8",
    label: "Attendance",
    desc: "AttendanceRecord per student per TimetableSlot. Requires active term + populated timetable. Supports manual entry, QR scan, and bulk mode.",
  },
]

function Node({
  id,
  label,
  desc,
}: {
  id: string
  label: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-14 w-56 shrink-0 items-center rounded border px-4">
        <span className="text-muted-foreground text-xs">{id}.</span>
        <span className="ms-1.5 text-sm font-medium">{label}</span>
      </div>
      <span className="text-muted-foreground pt-1 text-xs leading-relaxed">
        {desc}
      </span>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex justify-center py-0.5" style={{ width: 224 }}>
      <div className="text-muted-foreground text-xs">↓</div>
    </div>
  )
}

export function DependencyChain() {
  return (
    <div className="not-prose my-6">
      {steps.map((s, i) => (
        <div key={s.id}>
          <Node {...s} />
          {i < steps.length - 1 && <Arrow />}
        </div>
      ))}

      <div className="flex justify-center py-0.5" style={{ width: 224 }}>
        <div className="text-muted-foreground text-xs">↙ ↘</div>
      </div>
      <div className="flex gap-4">
        <div className="flex w-56 shrink-0 gap-1">
          {parallel.map((s) => (
            <div
              key={s.id}
              className="flex h-14 flex-1 items-center rounded border px-2"
            >
              <span className="text-muted-foreground text-xs">{s.id}.</span>
              <span className="ms-1 text-xs font-medium">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground space-y-1 pt-1 text-xs leading-relaxed">
          <p>{parallel[0].desc}</p>
          <p>{parallel[1].desc}</p>
        </div>
      </div>
      <div className="flex justify-center py-0.5" style={{ width: 224 }}>
        <div className="text-muted-foreground text-xs">↘ ↙</div>
      </div>

      {after.map((s, i) => (
        <div key={s.id}>
          <Node {...s} />
          {i < after.length - 1 && <Arrow />}
        </div>
      ))}
    </div>
  )
}
