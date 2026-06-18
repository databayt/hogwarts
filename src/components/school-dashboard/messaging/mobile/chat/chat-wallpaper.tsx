import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
  className?: string
}

/**
 * WhatsApp-style chat wallpaper.
 * TODO(cdn): still served from a third-party CloudFront. Re-host on
 * cdn.databayt.org (the desktop list uses cdn.databayt.org/hogwarts/whatsapp-bg.png).
 */
const WA_CHAT_BG =
  "https://d1dlwtcfl0db67.cloudfront.net/wallpapers/wp-wa-chat-bg.svg"

export function ChatWallpaper({ children, className }: Props) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col bg-[#F5F2EB] dark:bg-[#0B141A]",
        className
      )}
      style={{
        backgroundImage: `url('${WA_CHAT_BG}')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      {children}
    </div>
  )
}
