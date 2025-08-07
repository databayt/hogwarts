import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import PageHeader from "@/components/atom/page-header"
import AllFeatures from "@/components/marketing/features/content"

export default function FeaturesPage() {
  return (
    <div className="py-8">
      <div className="flex flex-col items-center space-y-8">
        <PageHeader title="Features" />
        
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="Search features..."
            className="w-full pl-10"
          />
        </div>
        
        <AllFeatures />
      </div>
    </div>
  )
}
