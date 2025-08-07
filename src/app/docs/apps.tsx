import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import { appsData } from "./contant"

const LinkButton = ({ href, type, children }: { href: string; type: "repository" | "preview"; children: React.ReactNode }) => {
  const Repository = () => (
    <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path fill="currentColor" d="M3 2.75A2.75 2.75 0 0 1 5.75 0h14.5a.75.75 0 0 1 .75.75v20.5a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1 0-1.5h5.25v-4H6A1.5 1.5 0 0 0 4.5 18v.75c0 .716.43 1.334 1.05 1.605a.75.75 0 0 1-.6 1.374A3.25 3.25 0 0 1 3 18.75ZM19.5 1.5H5.75c-.69 0-1.25.56-1.25 1.25v12.651A3 3 0 0 1 6 15h13.5Z"/>
      <path fill="currentColor" d="M7 18.25a.25.25 0 0 1 .25-.25h5a.25.25 0 0 1 .25.25v5.01a.25.25 0 0 1-.397.201l-2.206-1.604a.25.25 0 0 0-.294 0L7.397 23.46a.25.25 0 0 1-.397-.2z"/>
    </svg>
  )
  
  const Preview = () => (
    <ArrowUpRight className="w-3 h-3 ml-1" />
  )
  
  return (
    <Button variant="ghost" size="sm" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
        {type === "repository" && (
          <span className="mr-1 inline-flex">
            <Repository />
          </span>
        )}
        {children}
        {type === "preview" && <Preview />}
      </a>
    </Button>
  )
}

export default function ActiveApps() {
  return (
    <div>
      <h4>Active apps</h4>
      <div className="grid grid-cols-1 my-6 mr-8">
        {appsData.map((app, index) => (
          <div key={app.name}>
            <div className="flex gap-2 py-4">
              <div className="font-mono text-sm text-muted-foreground min-w-[20px]">{index + 1}.</div>
              <div className="font-medium min-w-[120px]">{app.name}</div>
              <div className="hidden md:block text-sm text-muted-foreground min-w-[140px]">{app.description}</div>
              {/* <LinkButton href={app.repositoryUrl} type="repository">Repo</LinkButton> */}
              <div className="ml-auto">
                <LinkButton href={app.previewUrl} type="preview">Live&nbsp;preview</LinkButton>
              </div>
            </div>
            {index < appsData.length - 1 && (
              <hr className="border-t border-border" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
