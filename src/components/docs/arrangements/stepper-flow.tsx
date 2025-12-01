"use client"

type Step = {
  title: string
  detail?: string
}

export function StepperFlow({
  steps,
  title = "End‑to‑end User Flow",
  compact = true,
}: {
  steps: Step[]
  title?: string
  compact?: boolean
}) {
  const sizeClass = compact ? "text-sm" : "text-base"
  const circleSize = compact ? "h-6 w-6" : "h-8 w-8"
  return (
    <div className="rounded-md border p-6">
      <div className="mb-4 text-lg font-medium">{title}</div>
      <ol className="relative">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start">
            <div className="flex flex-col items-center me-3">
              <div className={`flex items-center justify-center rounded-full border ${circleSize} font-medium`}>{i + 1}</div>
              {i < steps.length - 1 && (
                <div className="w-px grow bg-border my-1" />
              )}
            </div>
            <div className="pb-4">
              <div className={`font-medium ${sizeClass}`}>{s.title}</div>
              {s.detail && (
                <div className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>{s.detail}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function DefaultStepperFlow() {
  const steps: Step[] = [
    { title: "Visit Marketing Site", detail: "Read features, pricing, and docs" },
    { title: "Choose Plan", detail: "Trial, Basic, Pro" },
    { title: "Signup / Login" },
    { title: "Checkout", detail: "Payment or start trial" },
    { title: "Provision School", detail: "Create school record and limits" },
    { title: "Set Domain", detail: "Subdomain and optional custom domain" },
    { title: "Admin Onboarding", detail: "Branding, logo, colors" },
    { title: "Academic Setup", detail: "Years, terms, periods" },
    { title: "Curriculum Setup", detail: "Departments and subjects" },
    { title: "People Setup", detail: "Teachers, students, guardians" },
    { title: "Operate", detail: "Classes, attendance, assignments, reports" },
  ]
  return <StepperFlow steps={steps} />
}


