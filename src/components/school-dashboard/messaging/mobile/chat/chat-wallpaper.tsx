import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
  className?: string
}

/**
 * WhatsApp-style chat wallpaper. Served from this app's own `public/`, because
 * the CloudFront origin this used to point at answers HTTP 403.
 */
export const WA_CHAT_BG = "/icons/whatsapp/wp-wa-chat-bg.svg"
/** The same tile on WhatsApp's dark ground. The light tile paints its own
 *  opaque cream rect, so a dark background colour alone never shows. */
export const WA_CHAT_BG_DARK = "/icons/whatsapp/wp-wa-chat-bg-dark.svg"

export function ChatWallpaper({ children, className }: Props) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col bg-[#F4F0E9] bg-[url(/icons/whatsapp/wp-wa-chat-bg.svg)] bg-[length:432px_auto] bg-repeat",
        "dark:bg-[#0B141A] dark:bg-[url(/icons/whatsapp/wp-wa-chat-bg-dark.svg)]",
        className
      )}
    >
      {children}
    </div>
  )
}
