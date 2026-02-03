import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default function BlogContent(props: Props) {
  return (
    <div>
      Blog
      <p>Mohamed Ali</p>
      <p>Mohanad Adam</p>
      <p>Mohamed Abdelbasit</p>
      <p>Asmaa Sayed</p>
    </div>
  )
}
