import { Icons } from "@/components/atom/icons"

const technologies = [
  { name: "Next.js", Icon: Icons.nextjs },
  { name: "React", Icon: Icons.reactIcon },
  { name: "TypeScript", Icon: Icons.typescript },
  { name: "Tailwind CSS", Icon: Icons.tailwindcss },
  { name: "shadcn/ui", Icon: Icons.shadcnui },
  { name: "PlanetScale", Icon: Icons.planetscale },
  { name: "Prisma", Icon: Icons.prismaIcon },
  { name: "Zod", Icon: Icons.zodIcon },
  { name: "React Hook Form", Icon: Icons.reactHookForm },
  { name: "Claude", Icon: Icons.claude },
  { name: "MCP", Icon: Icons.mcpIcon },
  { name: "Rust", Icon: Icons.rustIcon },
  { name: "Python", Icon: Icons.pythonIcon },
  { name: "GitHub", Icon: Icons.gitHub },
  { name: "Cursor", Icon: Icons.cursor },
  { name: "Authentication", Icon: Icons.authentication },
  { name: "Subscription", Icon: Icons.subscription },
  { name: "Triangle", Icon: Icons.triangle },
  { name: "Framer", Icon: Icons.framer },
  { name: "Git", Icon: Icons.git },
  { name: "Prettier", Icon: Icons.prettier },
  { name: "Figma", Icon: Icons.figma },
  { name: "R", Icon: Icons.logo }
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
