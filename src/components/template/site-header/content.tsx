import React from 'react'
import { MainNav } from './main-nav'
import { marketingConfig } from './constant'
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
}

export default async function SiteHeader({ school }: SiteHeaderProps) {
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
            <MainNav items={marketingConfig.mainNav} school={school} />
            
            {/* Right side - Login/Logout and Theme toggle */}
            <RightActions isAuthenticated={!!session?.user} />
          </div>
        </div>
      </header>
    );
  }
  