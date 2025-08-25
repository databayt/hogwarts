import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const NewsLetter = () => {
  return (
    <div className="flex flex-col space-y-4 px-8 md:px-0">
      <h5 className="font-medium">NewsLetter</h5>
      
        <Input type="email" placeholder="Email address" className="w-52 h-9"/>
        <Button type="submit" size= 'sm' className="w-24 ">Subscribe</Button>
    
    </div>
  )
}

export default NewsLetter
