"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UnreadCountBadgeProps {
  count: number;
  className?: string;
  max?: number;
}

export function UnreadCountBadge({
  count,
  className,
  max = 99,
}: UnreadCountBadgeProps) {
  if (count === 0) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant="destructive"
      className={cn(
        "h-5 min-w-[20px] rounded-full px-1.5 text-xs font-semibold",
        className
      )}
    >
      {displayCount}
    </Badge>
  );
}

/**
 * Server component version that fetches unread count
 */
export async function UnreadCountBadgeServer({
  userId,
  schoolId,
  className,
}: {
  userId: string;
  schoolId: string;
  className?: string;
}) {
  // Import the read tracking function
  const { getUnreadAnnouncementCount } = await import("./read-tracking");

  const count = await getUnreadAnnouncementCount(userId, schoolId);

  return <UnreadCountBadge count={count} className={className} />;
}
