"use client"

import { MessageSquare, Plus, Users, Search, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
      <div className={cn(
        "flex flex-col items-center justify-center h-full px-6 py-12",
        "text-center",
        className
      )}>
        {/* Animated illustration */}
        <div className="relative mb-8">
          {/* Background circles - animated */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-primary/5 animate-ping" style={{ animationDuration: "3s" }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 animate-pulse" />
          </div>

          {/* Main icon */}
          <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>

          {/* Floating decorative elements */}
          <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-chart-2 animate-bounce" style={{ animationDelay: "0.5s" }} />
          <div className="absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-chart-3 animate-bounce" style={{ animationDelay: "1s" }} />
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {locale === "ar" ? "مرحباً بك في الرسائل" : "Welcome to Messages"}
        </h3>
        <p className="text-muted-foreground max-w-xs mb-6">
          {locale === "ar"
            ? "ابدأ محادثة مع زملائك ومعلميك. ابق على اتصال مع مجتمعك المدرسي."
            : "Start a conversation with your colleagues and teachers. Stay connected with your school community."}
        </p>

        {/* CTA Button */}
        {onNewConversation && (
          <Button
            onClick={onNewConversation}
            size="lg"
            className="gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-5 w-5" />
            {locale === "ar" ? "محادثة جديدة" : "New Conversation"}
          </Button>
        )}

        {/* Quick tips */}
        <div className="mt-8 grid gap-3 w-full max-w-sm">
          <QuickTip
            icon={<Users className="h-4 w-4" />}
            text={locale === "ar" ? "أنشئ مجموعة لفصلك أو فريقك" : "Create a group for your class or team"}
            locale={locale}
          />
          <QuickTip
            icon={<MessageSquare className="h-4 w-4" />}
            text={locale === "ar" ? "أرسل رسالة مباشرة إلى أي مستخدم" : "Send a direct message to any user"}
            locale={locale}
          />
        </div>
      </div>
    )
  }

  if (type === "no-messages") {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full px-6 py-12",
        "text-center",
        className
      )}>
        {/* Animated illustration */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-muted/50 animate-pulse" />
          </div>
          <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-muted to-background flex items-center justify-center border border-border">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          {locale === "ar" ? "لا توجد رسائل بعد" : "No messages yet"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {locale === "ar"
            ? "ابدأ المحادثة بإرسال رسالة. يمكنك إرفاق صور ومستندات أيضاً!"
            : "Start the conversation by sending a message. You can attach photos and documents too!"}
        </p>

        {/* Animated typing indicator preview */}
        <div className="mt-6 flex gap-1">
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    )
  }

  if (type === "no-active") {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full px-6 py-12",
        "text-center bg-gradient-to-b from-muted/20 to-background",
        className
      )}>
        {/* Animated illustration */}
        <div className="relative mb-8">
          {/* Chat bubbles illustration */}
          <div className="relative flex items-end gap-2">
            <div className="h-12 w-20 rounded-2xl rounded-bl-md bg-muted animate-pulse" />
            <div className="h-10 w-16 rounded-2xl rounded-br-md bg-primary/30 animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>
          <div className={cn(
            "absolute -top-3 flex items-end gap-2",
            isRTL ? "-right-4" : "-left-4"
          )}>
            <div className="h-8 w-14 rounded-2xl rounded-bl-md bg-muted/50 animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {locale === "ar" ? "اختر محادثة" : "Select a Conversation"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
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

function QuickTip({ icon, text, locale }: { icon: React.ReactNode; text: string; locale: "ar" | "en" }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
      "text-sm text-muted-foreground"
    )}>
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border">
        {icon}
      </div>
      <span className="flex-1 text-left">{text}</span>
      <ArrowRight className="h-4 w-4 flex-shrink-0" />
    </div>
  )
}

export function ConversationListEmpty({ locale = "en", onNewConversation }: { locale?: "ar" | "en"; onNewConversation?: () => void }) {
  return (
    <EmptyState
      type="no-conversations"
      locale={locale}
      onNewConversation={onNewConversation}
    />
  )
}

export function ChatEmpty({ locale = "en" }: { locale?: "ar" | "en" }) {
  return (
    <EmptyState
      type="no-messages"
      locale={locale}
    />
  )
}

export function NoActiveConversation({ locale = "en", onNewConversation }: { locale?: "ar" | "en"; onNewConversation?: () => void }) {
  return (
    <EmptyState
      type="no-active"
      locale={locale}
      onNewConversation={onNewConversation}
    />
  )
}
