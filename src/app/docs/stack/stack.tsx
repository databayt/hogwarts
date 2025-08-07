import {
  NextJS,
  ReactIcon,
  TypeScript,
  TailwindCSS,
  ShadcnUI,
  PlanetScale,
  PrismaIcon,
  ZodIcon,
  ReactHookForm,
  Claude,
  MCPIcon,
  RustIcon,
  PythonIcon,
  GitHub,
  Cursor,
  Authentication,
  Subscription,
  Triangle,
  Framer,
  Git,
  Prettier,
  Figma,
  RIcon
} from "@/components/atom/icons"

const technologies = [
  { name: "Next.js", Icon: NextJS },
  { name: "React", Icon: ReactIcon },
  { name: "TypeScript", Icon: TypeScript },
  { name: "Tailwind CSS", Icon: TailwindCSS },
  { name: "shadcn/ui", Icon: ShadcnUI },
  { name: "PlanetScale", Icon: PlanetScale },
  { name: "Prisma", Icon: PrismaIcon },
  { name: "Zod", Icon: ZodIcon },
  { name: "React Hook Form", Icon: ReactHookForm },
  { name: "Claude", Icon: Claude },
  { name: "MCP", Icon: MCPIcon },
  { name: "Rust", Icon: RustIcon },
  { name: "Python", Icon: PythonIcon },
  { name: "GitHub", Icon: GitHub },
  { name: "Cursor", Icon: Cursor },
  { name: "Authentication", Icon: Authentication },
  { name: "Subscription", Icon: Subscription },
  { name: "Triangle", Icon: Triangle },
  { name: "Framer", Icon: Framer },
  { name: "Git", Icon: Git },
  { name: "Prettier", Icon: Prettier },
  { name: "Figma", Icon: Figma },
  { name: "R", Icon: RIcon }
]

export default function Stack() {
  return (
    <div className="flex flex-wrap items-center gap-4 py-6 my-6 border-t border-border/40">
      {technologies.map(({ name, Icon }) => (
        <div
          key={name}
          className="p-2 "
          title={name}
        >
          <Icon className={`${name === "R" || name === "Prettier" || name === "Subscription" ? "w-10 h-10" : name === "React Hook Form" || name === "shadcn/ui" || name === "Triangle" || name === "Framer" ? "w-11 h-11" : name === "Tailwind CSS" || name === "Prisma" ? "w-13 h-13" : "w-12 h-12"} text-black`} />
        </div>
      ))}
    </div>
  )
}
