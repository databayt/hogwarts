import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface NewsLetterProps {
  dictionary?: Dictionary
}

const NewsLetter = ({ dictionary }: NewsLetterProps) => {
  const newsletterDict = dictionary?.footer?.newsletter || {
    title: "Newsletter",
    emailPlaceholder: "Email address",
    subscribe: "Subscribe",
  }
  return (
    <div className="flex flex-col space-y-4 px-8 md:px-0">
      <h5 className="text-start">{newsletterDict.title}</h5>

      <Input
        type="email"
        placeholder={newsletterDict.emailPlaceholder}
        className="h-9 w-52"
        dir="ltr"
      />
      <Button type="submit" size="sm" className="w-24">
        {newsletterDict.subscribe}
      </Button>
    </div>
  )
}

export default NewsLetter
