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
        <LogoutButton
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "px-4 text-xs cursor-pointer bg-muted"
          )}
        >
          Logout
        </LogoutButton>
      ) : (
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "px-4 text-xs bg-muted"
          )}
        >
          Login
        </Link>
      )}
      <ModeSwitcher />
    </div>
  );
}