"use client"

import { useMemo } from "react"

import type { ConversationDTO } from "@/components/school-dashboard/messaging/types"

import { IosListRow } from "../ios-list-row"
import { IosSectionHeading, IosTabEmpty, IosTabPage } from "../ios-tab-page"

type Props = {
  title: string
  /** The school, which is the one community every room belongs to. */
  schoolName: string
  conversations: ConversationDTO[]
  currentUserId: string
  onOpen: (conversationId: string) => void
  labels: {
    rooms: string
    emptyTitle: string
    emptyBody: string
    members: string
    groupFallback: string
  }
}

/**
 * WhatsApp's Communities: a parent community with its topic rooms beneath.
 *
 * A school already is that community, and its rooms are the conversations that
 * are not 1:1 — the class groups, the department channels, the study groups.
 * So this page needs no data of its own; it is the conversation list the shell
 * already holds, read a different way.
 */
export function CommunitiesView({
  title,
  schoolName,
  conversations,
  currentUserId,
  onOpen,
  labels,
}: Props) {
  const rooms = useMemo(
    () =>
      conversations
        .filter((c) => c.type !== "direct" && !c.isArchived)
        .sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        ),
    [conversations]
  )

  return (
    <IosTabPage title={title}>
      {rooms.length === 0 ? (
        <IosTabEmpty title={labels.emptyTitle} body={labels.emptyBody} />
      ) : (
        <>
          <IosListRow
            title={schoolName}
            subtitle={labels.members.replace(
              "{count}",
              String(countMembers(rooms, currentUserId))
            )}
            avatarIcon="ic-wa-tab-communities-fill-32"
            avatarVariant="group"
          />

          <IosSectionHeading>{labels.rooms}</IosSectionHeading>

          {rooms.map((room) => (
            <IosListRow
              key={room.id}
              title={room.title || labels.groupFallback}
              subtitle={labels.members.replace(
                "{count}",
                String(room.participants?.length ?? 0)
              )}
              avatarUrl={room.avatar}
              avatarIcon="ic-wa-group-16"
              avatarVariant="group"
              onClick={() => onOpen(room.id)}
            />
          ))}
        </>
      )}
    </IosTabPage>
  )
}

/** Everyone the reader shares a room with, counted once. */
function countMembers(rooms: ConversationDTO[], currentUserId: string): number {
  const ids = new Set<string>([currentUserId])
  for (const room of rooms) {
    for (const p of room.participants ?? []) ids.add(p.userId)
  }
  return ids.size
}
