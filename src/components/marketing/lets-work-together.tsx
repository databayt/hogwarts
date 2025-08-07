import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GitHub, Discord } from "@/components/atom/icons"
import Link from "next/link"

export default function LetsWorkTogether() {
  return (
   
  
      <section className="">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">Let&apos;s Work Together</h2>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 ">
          <div className="flex-1">
            <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mb-4 ">
            Ready to revolutionize your educational institution with advanced automation? Experience streamlined operations and enhanced learning outcomes for students and educators.
            </p>
            <div className="flex gap-4 mt-4 items-center">
              <Link 
                href="https://github.com/abdout/databayt" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <GitHub width={30} height={30} />
              </Link>
              <Link 
                href="https://discord.gg/uPa4gGG62c" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Discord width={35} height={35} />
              </Link>
            </div>
          </div>
          <div className="flex-1 pt-1">
            <form className="space-y-4">
              <Input
                placeholder="Email address"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                required
                aria-label="Email"
              />
              <Textarea
                placeholder="What educational processes would you like to automate?"
                required
                className="min-h-[70px] resize-none"
                aria-label="Educational automation needs"
              />
              <div className="flex gap-2">

                <Button type="submit" className="w-fit px-8">
                  Submit
                </Button>
                <Button type="submit" variant="ghost" className="w-fit px-4">
                  Live chat
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
   
  )
}
