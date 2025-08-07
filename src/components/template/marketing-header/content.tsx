import React from 'react'
import { MainNav } from './main-nav'
import { marketingConfig } from './constant'
import { auth } from "@/auth"
import { RightActions } from './right-actions'

export default async function SiteHeader() {
  const session = await auth();
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
            
            {/* Right side - Login/Logout and Theme toggle */}
            <RightActions isAuthenticated={!!session?.user} />
          </div>
        </div>
      </header>
    );
  }
  