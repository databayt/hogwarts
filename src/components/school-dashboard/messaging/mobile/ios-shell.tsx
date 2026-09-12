"use client"

import { useMemo, useState } from "react"
import { Bell, LayoutDashboard, MessageSquare, Star, User } from "lucide-react"

import type { ConversationDTO } from "@/components/school-dashboard/messaging/types"

import { IosChatList } from "./ios-chat-list"
import { IosTabbar, type IosTab, type IosTabId } from "./ios-tabbar"
import { CallsView } from "./tabs/calls-view"
import { CommunitiesView } from "./tabs/communities-view"
import { SettingsView } from "./tabs/settings-view"
import { UpdatesView } from "./tabs/updates-view"

type ChatListProps = React.ComponentProps<typeof IosChatList>

export type IosShellLabels = ChatListProps["labels"] & {
  titleUpdates?: string
  titleCalls?: string
  titleCommunities?: string
  titleSettings?: string
  updatesRecent?: string
  updatesEmptyTitle?: string
  updatesEmptyBody?: string
  callsRecent?: string
  callsJoined?: string
  callsMissed?: string
  callsUpcoming?: string
  callsLive?: string
  callsEmptyTitle?: string
  callsEmptyBody?: string
  callsEncrypted?: string
  communitiesRooms?: string
  communitiesEmptyTitle?: string
  communitiesEmptyBody?: string
  communitiesMembers?: string
  settingsDashboard?: string
  settingsProfile?: string
  settingsNotifications?: string
  settingsStarred?: string
  loading?: string
  loadFailed?: string
}

type Props = Omit<ChatListProps, "labels"> & {
  labels?: IosShellLabels
  /** The school this inbox belongs to — the one community on that tab. */
  schoolName?: string
  currentUserName?: string
  currentUserStatus?: string | null
  onOpenUpdate?: (announcementId: string) => void
  onOpenCall?: (sessionId: string) => void
  onOpenDashboard?: () => void
  onOpenProfile?: () => void
  onOpenNotifications?: () => void
  onOpenStarred?: () => void
}

/**
 * The mobile messaging shell: it owns which tab is showing, draws the floating
 * tab bar once, and swaps the body beneath it.
 *
 * The tab bar used to live inside the chat list, which is why every tab but
 * Chats did nothing — there was nowhere else for a body to come from. Chats is
 * now one body among five.
 */
export function IosMobileShell({
  labels,
  schoolName,
  currentUserName,
  currentUserStatus,
  onOpenUpdate,
  onOpenCall,
  onOpenDashboard,
  onOpenProfile,
  onOpenNotifications,
  onOpenStarred,
  ...chatList
}: Props) {
  const [tab, setTab] = useState<IosTabId>("chats")
  const L = labels ?? {}

  const totalUnread = useMemo(
    () => chatList.conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0),
    [chatList.conversations]
  )

  const tabs: IosTab[] = [
    {
      id: "updates",
      label: L.tabUpdates ?? "Updates",
      icon: "ic-wa-tab-updates-32",
      iconActive: "ic-wa-tab-updates-fill-32",
    },
    {
      id: "calls",
      label: L.tabCalls ?? "Calls",
      icon: "ic-wa-tab-calls-32",
      iconActive: "ic-wa-tab-calls-fill-32",
    },
    {
      id: "communities",
      label: L.tabCommunities ?? "Communities",
      icon: "ic-wa-tab-communities-32",
      iconActive: "ic-wa-tab-communities-fill-32",
    },
    {
      id: "chats",
      label: L.tabChats ?? "Chats",
      icon: "ic-wa-tab-chats-32",
      iconActive: "ic-wa-tab-chats-fill-32",
      badge: totalUnread,
    },
    {
      id: "settings",
      label: L.tabSettings ?? "Settings",
      icon: "ic-wa-tab-settings-32",
      iconActive: "ic-wa-tab-settings-fill-32",
    },
  ]

  const locale = chatList.locale ?? "en"

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[color:var(--wa-surface-primary)]">
      <div className="min-h-0 flex-1">
        {tab === "chats" && <IosChatList {...chatList} labels={labels} />}

        {tab === "updates" && (
          <UpdatesView
            title={L.tabUpdates ?? "Updates"}
            locale={locale}
            onOpen={onOpenUpdate}
            labels={{
              recent: L.updatesRecent ?? "Recent updates",
              emptyTitle: L.updatesEmptyTitle ?? "No announcements yet",
              emptyBody:
                L.updatesEmptyBody ??
                "School and class announcements appear here.",
              loading: L.loading ?? "Loading…",
              loadFailed: L.loadFailed ?? "Could not load",
            }}
          />
        )}

        {tab === "calls" && (
          <CallsView
            title={L.tabCalls ?? "Calls"}
            locale={locale}
            onOpen={onOpenCall}
            labels={{
              recent: L.callsRecent ?? "Recent",
              joined: L.callsJoined ?? "Attended",
              missed: L.callsMissed ?? "Missed",
              upcoming: L.callsUpcoming ?? "Upcoming",
              live: L.callsLive ?? "Live now",
              emptyTitle: L.callsEmptyTitle ?? "No calls",
              emptyBody:
                L.callsEmptyBody ?? "Your live classes will appear here.",
              encrypted: L.callsEncrypted ?? "Your live classes are encrypted",
              loadFailed: L.loadFailed ?? "Could not load",
            }}
          />
        )}

        {tab === "communities" && (
          <CommunitiesView
            title={L.tabCommunities ?? "Communities"}
            schoolName={schoolName ?? ""}
            conversations={chatList.conversations}
            currentUserId={chatList.currentUserId}
            onOpen={chatList.onConversationClick}
            labels={{
              rooms: L.communitiesRooms ?? "School rooms",
              emptyTitle:
                L.communitiesEmptyTitle ?? "Stay connected with a community",
              emptyBody:
                L.communitiesEmptyBody ??
                "Any room you are added to will appear here.",
              members: L.communitiesMembers ?? "{count} members",
              groupFallback: L.groupFallbackName ?? "Group",
            }}
          />
        )}

        {tab === "settings" && (
          <SettingsView
            title={L.tabSettings ?? "Settings"}
            name={currentUserName ?? ""}
            status={currentUserStatus}
            avatarUrl={chatList.currentUserImage}
            groups={[
              [
                {
                  id: "profile",
                  label: L.settingsProfile ?? "Profile",
                  icon: <User className="size-[22px]" strokeWidth={1.6} />,
                  onClick: onOpenProfile,
                },
                {
                  id: "starred",
                  label: L.settingsStarred ?? "Starred messages",
                  icon: <Star className="size-[22px]" strokeWidth={1.6} />,
                  onClick: onOpenStarred,
                },
              ],
              [
                {
                  id: "notifications",
                  label: L.settingsNotifications ?? "Notifications",
                  icon: <Bell className="size-[22px]" strokeWidth={1.6} />,
                  onClick: onOpenNotifications,
                },
                {
                  id: "chats",
                  label: L.tabChats ?? "Chats",
                  icon: (
                    <MessageSquare className="size-[22px]" strokeWidth={1.6} />
                  ),
                  onClick: () => setTab("chats"),
                },
              ],
              [
                {
                  id: "dashboard",
                  label: L.settingsDashboard ?? "Dashboard",
                  icon: (
                    <LayoutDashboard
                      className="size-[22px]"
                      strokeWidth={1.6}
                    />
                  ),
                  onClick: onOpenDashboard,
                },
              ],
            ]}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <IosTabbar tabs={tabs} active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
