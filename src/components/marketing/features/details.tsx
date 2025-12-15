import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default function FeatureDetails(props: Props) {
  return <div>Feature Details</div>
}
