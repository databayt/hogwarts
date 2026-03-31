"use client"

import { useMemo } from "react"
import { BarChart3, MessageSquare, Users, Wifi, WifiOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ConnectCard } from "./connect-card"
import { GroupsList } from "./groups-list"
import { MessageComposer } from "./message-composer"
import { TemplatesList } from "./templates-list"
import type {
  WhatsAppGroupDTO,
  WhatsAppMessageDTO,
  WhatsAppSessionDTO,
  WhatsAppStats,
  WhatsAppTemplateDTO,
} from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

interface WhatsAppDashboardClientProps {
  session: WhatsAppSessionDTO | null
  groups: WhatsAppGroupDTO[]
  messages: WhatsAppMessageDTO[]
  templates: WhatsAppTemplateDTO[]
  stats: WhatsAppStats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: any
  locale: string
}

export function WhatsAppDashboardClient({
  session,
  groups,
  messages,
  templates,
  stats,
  dictionary,
  locale,
}: WhatsAppDashboardClientProps) {
  const d: Dict | undefined = useMemo(
    () => dictionary?.school?.whatsapp,
    [dictionary]
  )

  const statsCards = useMemo(
    () => [
      {
        label: d?.stats?.status || "Status",
        value: stats.isConnected
          ? d?.stats?.connected || "Connected"
          : d?.stats?.disconnected || "Disconnected",
        icon: stats.isConnected ? Wifi : WifiOff,
        badge: stats.isConnected,
      },
      {
        label: d?.stats?.totalGroups || "Total Groups",
        value: String(stats.totalGroups),
        icon: Users,
      },
      {
        label: d?.stats?.messagesToday || "Messages Today",
        value: `${stats.todayMessagesSent} / ${stats.dailyLimit}`,
        icon: MessageSquare,
      },
      {
        label: d?.stats?.totalSent || "Total Sent",
        value: String(stats.totalMessagesSent),
        icon: BarChart3,
      },
    ],
    [d, stats]
  )

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.label}
              </CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{card.value}</span>
                {"badge" in card && (
                  <Badge
                    variant={card.badge ? "default" : "secondary"}
                    className={cn(
                      card.badge
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {card.badge
                      ? stats.phoneNumber || d?.stats?.connected || "Connected"
                      : d?.stats?.disconnected || "Disconnected"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="connection">
        <TabsList>
          <TabsTrigger value="connection">
            {d?.tabs?.connection || "Connection"}
          </TabsTrigger>
          <TabsTrigger value="groups">
            {d?.tabs?.groups || "Groups"}
          </TabsTrigger>
          <TabsTrigger value="messages">
            {d?.tabs?.messages || "Messages"}
          </TabsTrigger>
          <TabsTrigger value="templates">
            {d?.tabs?.templates || "Templates"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection">
          <ConnectCard session={session} dictionary={dictionary} />
        </TabsContent>

        <TabsContent value="groups">
          <GroupsList
            groups={groups}
            isConnected={stats.isConnected}
            dictionary={dictionary}
          />
        </TabsContent>

        <TabsContent value="messages">
          <MessageComposer
            groups={groups}
            messages={messages}
            isConnected={stats.isConnected}
            dictionary={dictionary}
          />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesList
            templates={templates}
            dictionary={dictionary}
            locale={locale}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
