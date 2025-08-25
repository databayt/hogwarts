'use client';

import { ModeSwitcher } from './mode-switcher'
import { LogoutButton } from '@/components/auth/logout-button'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface RightActionsProps {
  isAuthenticated: boolean;
}

export function RightActions({ isAuthenticated }: RightActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <Button
          variant="secondary"
          size="sm"
          className="px-4 muted"
          asChild
        >
          <LogoutButton>Logout</LogoutButton>
        </Button>
      ) : (
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "px-4 muted"
          )}
        >
          Login
        </Link>
      )}
      <ModeSwitcher />
    </div>
  );
}