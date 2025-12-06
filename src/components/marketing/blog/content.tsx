import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export default function BlogContent(props: Props) {
  return (
    <div>
        Blog
        <p>Mohamed Abdelbasit</p>
        <p>Asmaa Sayed</p>
    </div>
  )
}