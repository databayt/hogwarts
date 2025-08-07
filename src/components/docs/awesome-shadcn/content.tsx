import Link from "next/link"
import { awesomeShadcn } from "./constants"

export default function AwesomeShadcn() {
  return (
    <div className="grid grid-cols-1 gap-6 py-4 sm:grid-cols-2 md:grid-cols-3">
      {awesomeShadcn.map((item) => (
        <Link
          key={item.id}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="relative overflow-hidden rounded-lg border bg-background p-2 hover:border-primary transition-[border-color] duration-200 text-foreground hover:text-foreground"
        >
          <div className="flex h-[180px] flex-col justify-between rounded-sm p-6">
            <div className="text-foreground">
              {item.icon}
            </div>
            <div className="space-y-2">
              <h4 className="text-foreground">
                {item.title}
              </h4>
              <p className="text-sm text-muted-foreground font-light">
                {item.description}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
