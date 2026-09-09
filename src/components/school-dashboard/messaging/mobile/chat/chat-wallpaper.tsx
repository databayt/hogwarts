import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
  className?: string
}

/**
 * WhatsApp-style chat wallpaper. Served from this app's own `public/`, because
 * the CloudFront origin this used to point at answers HTTP 403.
 */
const WA_CHAT_BG = "/icons/whatsapp/wp-wa-chat-bg.svg"

export function ChatWallpaper({ children, className }: Props) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col bg-[#F5F2EB] dark:bg-[#0B141A]",
        className
      )}
      style={{
        backgroundImage: `url('${WA_CHAT_BG}')`,
        backgroundRepeat: "repeat",
        backgroundSize: "412px auto",
      }}
    >
      {children}
    </div>
  )
}
