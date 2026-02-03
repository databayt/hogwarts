"use client"

import { ArrowRight, MessageSquare, Plus, Search, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  type: "no-conversations" | "no-messages" | "no-active"
  locale?: "ar" | "en"
  onNewConversation?: () => void
  className?: string
}

export function EmptyState({
  type,
  locale = "en",
  onNewConversation,
  className,
}: EmptyStateProps) {
  const isRTL = locale === "ar"

  if (type === "no-conversations") {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center px-6 py-12",
          "text-center",
          className
        )}
      >
        {/* Animated illustration */}
        <div className="relative mb-8">
          {/* Background circles - animated */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="bg-primary/5 h-32 w-32 animate-ping rounded-full"
              style={{ animationDuration: "3s" }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/10 h-24 w-24 animate-pulse rounded-full" />
          </div>

          {/* Main icon */}
          <div className="from-primary/20 to-primary/5 relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br">
            <MessageSquare className="text-primary h-10 w-10" />
          </div>

          {/* Floating decorative elements */}
          <div
            className="bg-chart-2 absolute -top-2 -right-2 h-4 w-4 animate-bounce rounded-full"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="bg-chart-3 absolute -bottom-1 -left-3 h-3 w-3 animate-bounce rounded-full"
            style={{ animationDelay: "1s" }}
          />
        </div>

        {/* Content */}
        <h3 className="text-foreground mb-2 text-xl font-semibold">
          {locale === "ar" ? "مرحباً بك في الرسائل" : "Welcome to Messages"}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-xs">
          {locale === "ar"
            ? "ابدأ محادثة مع زملائك ومعلميك. ابق على اتصال مع مجتمعك المدرسي."
            : "Start a conversation with your colleagues and teachers. Stay connected with your school community."}
        </p>

        {/* CTA Button */}
        {onNewConversation && (
          <Button
            onClick={onNewConversation}
            size="lg"
            className="gap-2 shadow-lg transition-all hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            {locale === "ar" ? "محادثة جديدة" : "New Conversation"}
          </Button>
        )}

        {/* Quick tips */}
        <div className="mt-8 grid w-full max-w-sm gap-3">
          <QuickTip
            icon={<Users className="h-4 w-4" />}
            text={
              locale === "ar"
                ? "أنشئ مجموعة لفصلك أو فريقك"
                : "Create a group for your class or team"
            }
            locale={locale}
          />
          <QuickTip
            icon={<MessageSquare className="h-4 w-4" />}
            text={
              locale === "ar"
                ? "أرسل رسالة مباشرة إلى أي مستخدم"
                : "Send a direct message to any user"
            }
            locale={locale}
          />
        </div>
      </div>
    )
  }

  if (type === "no-messages") {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center px-6 py-12",
          "text-center",
          className
        )}
      >
        {/* Animated illustration */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-muted/50 h-20 w-20 animate-pulse rounded-full" />
          </div>
          <div className="from-muted to-background border-border relative flex h-16 w-16 items-center justify-center rounded-full border bg-gradient-to-br">
            <MessageSquare className="text-muted-foreground h-8 w-8" />
          </div>
        </div>

        <h3 className="text-foreground mb-2 text-lg font-semibold">
          {locale === "ar" ? "لا توجد رسائل بعد" : "No messages yet"}
        </h3>
        <p className="text-muted-foreground max-w-xs text-sm">
          {locale === "ar"
            ? "ابدأ المحادثة بإرسال رسالة. يمكنك إرفاق صور ومستندات أيضاً!"
            : "Start the conversation by sending a message. You can attach photos and documents too!"}
        </p>

        {/* Animated typing indicator preview */}
        <div className="mt-6 flex gap-1">
          <div
            className="bg-primary/60 h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="bg-primary/60 h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="bg-primary/60 h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    )
  }

  if (type === "no-active") {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center px-6 py-12",
          "from-muted/20 to-background bg-gradient-to-b text-center",
          className
        )}
      >
        {/* Animated illustration */}
        <div className="relative mb-8">
          {/* Chat bubbles illustration */}
          <div className="relative flex items-end gap-2">
            <div className="bg-muted h-12 w-20 animate-pulse rounded-2xl rounded-bl-md" />
            <div
              className="bg-primary/30 h-10 w-16 animate-pulse rounded-2xl rounded-br-md"
              style={{ animationDelay: "0.5s" }}
            />
          </div>
          <div
            className={cn(
              "absolute -top-3 flex items-end gap-2",
              isRTL ? "-right-4" : "-left-4"
            )}
          >
            <div
              className="bg-muted/50 h-8 w-14 animate-pulse rounded-2xl rounded-bl-md"
              style={{ animationDelay: "1s" }}
            />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-foreground mb-2 text-lg font-semibold">
          {locale === "ar" ? "اختر محادثة" : "Select a Conversation"}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-xs text-sm">
          {locale === "ar"
            ? "اختر محادثة من القائمة أو ابدأ محادثة جديدة للتواصل."
            : "Choose a conversation from the list or start a new one to connect."}
        </p>

        {/* CTA */}
        {onNewConversation && (
          <Button
            variant="outline"
            onClick={onNewConversation}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {locale === "ar" ? "محادثة جديدة" : "New Conversation"}
          </Button>
        )}
      </div>
    )
  }

  return null
}

function QuickTip({
  icon,
  text,
  locale,
}: {
  icon: React.ReactNode
  text: string
  locale: "ar" | "en"
}) {
  return (
    <div
      className={cn(
        "bg-muted/50 flex items-center gap-3 rounded-lg p-3",
        "text-muted-foreground text-sm"
      )}
    >
      <div className="bg-background border-border flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
        {icon}
      </div>
      <span className="flex-1 text-left">{text}</span>
      <ArrowRight className="h-4 w-4 flex-shrink-0" />
    </div>
  )
}

export function ConversationListEmpty({
  locale = "en",
  onNewConversation,
}: {
  locale?: "ar" | "en"
  onNewConversation?: () => void
}) {
  return (
    <EmptyState
      type="no-conversations"
      locale={locale}
      onNewConversation={onNewConversation}
    />
  )
}

export function ChatEmpty({ locale = "en" }: { locale?: "ar" | "en" }) {
  return <EmptyState type="no-messages" locale={locale} />
}

export function NoActiveConversation({
  locale = "en",
  onNewConversation,
}: {
  locale?: "ar" | "en"
  onNewConversation?: () => void
}) {
  return (
    <EmptyState
      type="no-active"
      locale={locale}
      onNewConversation={onNewConversation}
    />
  )
}
