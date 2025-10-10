import React from 'react'
import { MainNav } from './main-nav'
import { marketingConfig } from "./config"
import { auth } from "@/auth"
import { RightActions } from './right-actions'

export default async function SiteHeader() {
  const session = await auth();
    return (
      <header className="full-bleed sticky top-0 z-80 border-b border-dashed border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="inner-contained">
          <div className="flex h-14 items-center justify-between">
            {/* Left side - Logo and Nav */}
            <MainNav items={marketingConfig.mainNav} />
            
            {/* Right side - Login/Logout and Theme toggle */}
            <RightActions isAuthenticated={!!session?.user} />
          </div>
        </div>
      </header>
    );
  }
  