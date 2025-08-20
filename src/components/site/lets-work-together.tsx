import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Icon } from '@iconify/react'

export default function LetsWorkTogether() {
  return (
   
  
      <div className="py-20">
        <h2 className="font-bold pb-2">Join the Community</h2>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 ">
          <div className="flex-1">
            <p>
            Ready to transform education with innovative learning solutions? Experience personalized programs and enhanced achievement.
            </p>
            <div className="flex gap-4 pt-4 items-center ">
              <a href="tel:+966557721603" aria-label="Call us">
                <Icon icon="mdi:phone" width="30" height="30" />
              </a>
              <a href="https://wa.me/966557721603" target="_blank" rel="noopener noreferrer" aria-label="Contact on WhatsApp">
                <Icon icon="ri:whatsapp-fill" width="30" height="30" />
              </a>
              <a href="https://www.linkedin.com/company/databayt-automation" target="_blank" rel="noopener noreferrer" aria-label="Visit our LinkedIn">
                <Icon icon="mdi:linkedin" width="30" height="30" />
              </a>
              <Icon icon="mdi:twitter" width="30" height="30" />
            </div>
          </div>
          <div className="flex-1 pt-1">
            <form className="">
              <Input
                placeholder="Email address"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                required
                aria-label="Email"
              />
              <div className="pt-4">
              <Textarea
                placeholder="Tell us about your educational needs or questions..."
                required
                className="min-h-[70px] resize-none"
                aria-label="Educational inquiry"
              />
              </div>
              <div className="flex gap-2 pt-4">

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
      </div>
   
  )
}
