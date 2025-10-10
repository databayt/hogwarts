import Link from "next/link"
import { features } from "./config"
import PageHeader from "@/components/atom/page-header"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AllFeatures() {
  return (
    <div>
        <div className="flex flex-col items-center space-y-8 mt-8">
        <PageHeader title="Features" />
        
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="Search features..."
            className="w-full pl-10"
          />
        </div>
        </div>
    
    <div className="grid grid-cols-1 gap-4 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {features.map((feature) => (
        <Link
          key={feature.id}
          href="#"
          className="relative overflow-hidden rounded-lg border bg-background p-2 hover:border-primary transition-[border-color] duration-200 text-foreground hover:text-foreground"
        >
          <div className="flex h-[180px] flex-col justify-between rounded-sm p-6">
            {/* <div className="w-fit  p-2"> */}
            <div className="text-foreground">
              {feature.icon}
            </div>
            {/* </div> */}
            <div className="space-y-2">
              <h4 className="text-foreground">
                {feature.title}
              </h4>
              <small className="muted font-light">
                {feature.description}
              </small>
            </div>
          </div>
        </Link>
      ))}
    </div>
    </div>
  )
}
