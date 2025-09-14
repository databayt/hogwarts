'use client';

import { ModeSwitcher } from './mode-switcher'
import { LogoutButton } from '@/components/auth/logout-button'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/internationalization/language-switcher'
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface RightActionsProps {
  isAuthenticated: boolean;
  dictionary?: Dictionary;
}

export function RightActions({ isAuthenticated, dictionary }: RightActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <LogoutButton
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "px-4 muted cursor-pointer bg-muted"
          )}
        >
          {dictionary?.auth?.signOut || 'Logout'}
        </LogoutButton>
      ) : (
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "px-4 muted bg-muted"
          )}
        >
          {dictionary?.auth?.signIn || 'Login'}
        </Link>
      )}
      <LanguageSwitcher variant="dropdown" />
      <ModeSwitcher />
    </div>
  );
}