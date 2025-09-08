"use client"

import { ArrowRight, Building2, Layers, LayoutPanelLeft, Users, CreditCard, Globe, Settings, School, Calendar, BookOpenCheck, ClipboardList, Presentation, BarChart3, Megaphone } from "lucide-react"
import type { ComponentType, SVGProps } from "react"

type Node = { id: string; label: string; icon?: ComponentType<SVGProps<SVGSVGElement>> }
type Edge = { from: string; to: string; note?: string }

export function FlowChart({
  nodes,
  edges,
  title = "Flow",
  large = false,
  showIcons = true,
}: {
  nodes: Node[]
  edges: Edge[]
  title?: string
  large?: boolean
  showIcons?: boolean
}) {
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]))
  return (
    <div className={`rounded-md border ${large ? "p-6" : "p-4"}`}>
      <div className={`mb-4 ${large ? "lead" : "muted"}`}>{title}</div>
      <div className={`flex flex-col ${large ? "gap-4" : "gap-3"}`}>
        {edges.map((e, i) => {
          const FromIcon = nodeById[e.from]?.icon ?? LayoutPanelLeft
          const ToIcon = nodeById[e.to]?.icon ?? Layers
          return (
            <div key={`${e.from}-${e.to}-${i}`} className="flex items-center gap-3">
              <div className={`flex items-center ${showIcons ? "gap-2" : "gap-1"} rounded-md border ${large ? "p-2" : "px-2 py-1"}`}>
                {showIcons ? <FromIcon className={`${large ? "h-6 w-6" : "h-4 w-4"}`} /> : null}
                <span>{nodeById[e.from]?.label ?? e.from}</span>
              </div>
              <ArrowRight className={`${large ? "h-6 w-6" : "h-4 w-4"} text-muted-foreground`} />
              {e.note && <span className={`${large ? "text-xs" : "text-[10px]"} text-muted-foreground`}>{e.note}</span>}
              <div className={`flex items-center ${showIcons ? "gap-2" : "gap-1"} rounded-md border ${large ? "p-2" : "px-2 py-1"}`}>
                {showIcons ? <ToIcon className={`${large ? "h-6 w-6" : "h-4 w-4"}`} /> : null}
                <span>{nodeById[e.to]?.label ?? e.to}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Preset used by docs
export function ProvisioningFlow() {
  const nodes: Node[] = [
    { id: "visitor", label: "Visitor", icon: Users },
    { id: "marketing", label: "Marketing Site", icon: LayoutPanelLeft },
    { id: "choose", label: "Choose Plan" },
    { id: "checkout", label: "Checkout / Provision", icon: CreditCard },
    { id: "school", label: "Create School + Domain", icon: Building2 },
    { id: "landing", label: "School Landing" },
    { id: "core", label: "Core App", icon: Layers },
    { id: "dash", label: "Dashboards" },
  ]
  const edges: Edge[] = [
    { from: "visitor", to: "marketing" },
    { from: "marketing", to: "choose" },
    { from: "choose", to: "checkout", note: "Trial / Basic / Pro" },
    { from: "checkout", to: "school" },
    { from: "school", to: "landing" },
    { from: "landing", to: "core" },
    { from: "core", to: "dash", note: "Admin/Teacher/Parent/Student" },
  ]
  return <FlowChart nodes={nodes} edges={edges} title="End-to-end Flow" large />
}

export function FullProcessFlow() {
  const nodes: Node[] = [
    { id: "visitor", label: "Visitor", icon: Users },
    { id: "marketing", label: "Marketing", icon: LayoutPanelLeft },
    { id: "pricing", label: "Pricing" },
    { id: "login", label: "Login/Signup" },
    { id: "checkout", label: "Checkout", icon: CreditCard },
    { id: "provision", label: "Provision School", icon: School },
    { id: "domain", label: "Domain & SSL", icon: Globe },
    { id: "onboarding", label: "Admin Onboarding", icon: Settings },
    { id: "years", label: "Years/Terms/Periods", icon: Calendar },
    { id: "subjects", label: "Departments/Subjects", icon: BookOpenCheck },
    { id: "users", label: "Teachers/Students", icon: Users },
    { id: "classes", label: "Classes", icon: Layers },
    { id: "attendance", label: "Attendance", icon: ClipboardList },
    { id: "assignments", label: "Assignments", icon: Presentation },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "announce", label: "Announcements", icon: Megaphone },
  ]
  const edges: Edge[] = [
    { from: "visitor", to: "marketing" },
    { from: "marketing", to: "pricing" },
    { from: "pricing", to: "login" },
    { from: "login", to: "checkout" },
    { from: "checkout", to: "provision" },
    { from: "provision", to: "domain" },
    { from: "domain", to: "onboarding" },
    { from: "onboarding", to: "years" },
    { from: "years", to: "subjects" },
    { from: "subjects", to: "users" },
    { from: "users", to: "classes" },
    { from: "classes", to: "attendance" },
    { from: "attendance", to: "assignments" },
    { from: "assignments", to: "reports" },
    { from: "reports", to: "announce" },
  ]
  return <FlowChart nodes={nodes} edges={edges} title="Full Process Flow" large />
}

export function CompactOneFlow() {
  const nodes: Node[] = [
    { id: "visitor", label: "Visitor" },
    { id: "marketing", label: "Marketing" },
    { id: "pricing", label: "Pricing" },
    { id: "signup", label: "Signup/Login" },
    { id: "checkout", label: "Checkout" },
    { id: "provision", label: "Provision School" },
    { id: "domain", label: "Domain & SSL" },
    { id: "onboarding", label: "Admin Onboarding" },
    { id: "setup", label: "Setup: Years, Subjects, Users" },
    { id: "classes", label: "Create Classes" },
    { id: "ops", label: "Daily Ops" },
  ]
  const edges: Edge[] = [
    { from: "visitor", to: "marketing" },
    { from: "marketing", to: "pricing" },
    { from: "pricing", to: "signup" },
    { from: "signup", to: "checkout" },
    { from: "checkout", to: "provision" },
    { from: "provision", to: "domain" },
    { from: "domain", to: "onboarding" },
    { from: "onboarding", to: "setup" },
    { from: "setup", to: "classes" },
    { from: "classes", to: "ops" },
  ]
  return <FlowChart nodes={nodes} edges={edges} title="End-to-end User Flow" large={false} showIcons={false} />
}


