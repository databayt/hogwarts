import React from 'react'
import { MainNav } from './main-nav'
import { marketingConfig } from "./config"
import { auth } from "@/auth"
import { RightActions } from './right-actions'

interface School {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  timezone?: string;
  planType?: string;
  maxStudents?: number;
  maxTeachers?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SiteHeaderProps {
  school: School;
  locale: string;
}

export default async function SiteHeader({ school, locale }: SiteHeaderProps) {
  const session = await auth();
    return (
      <header className="full-bleed sticky top-0 z-40 border-b border-dashed border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="inner-contained">
          <div className="flex h-14 items-center justify-between">
            {/* Left side - Logo and Nav */}
            <MainNav items={marketingConfig.mainNav} school={school} locale={locale} />

            {/* Right side - Login/Logout and Theme toggle */}
            <RightActions isAuthenticated={!!session?.user} locale={locale} />
          </div>
        </div>
      </header>
    );
  }
  