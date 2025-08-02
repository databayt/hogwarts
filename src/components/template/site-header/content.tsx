import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import { MainNav } from './main-nav'
import { marketingConfig } from './constant'
import { ModeSwitcher } from './mode-switcher'

export default function SiteHeader() {
    return (
      <header className="sticky top-0 z-40 border-b border-dashed border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)'
      }}>
        <div className="container-responsive">
          <div className="flex h-14 items-center justify-between">
            {/* Left side - Logo and Nav */}
            <MainNav items={marketingConfig.mainNav} />
            
            {/* Right side - Login and Theme toggle */}
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "px-4 text-xs"
                )}
              >
                Login
              </Link>
              <ModeSwitcher />
            </div>
          </div>
        </div>
      </header>
    );
  }
  