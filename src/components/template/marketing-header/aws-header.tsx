"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Search,
  Grid3X3,
  Bell,
  HelpCircle,
  Settings,
  Globe,
  ChevronDown,
  Menu,
  Info,
  ExternalLink
} from "lucide-react"
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { LangSwitcher } from "./lang-switcher"
import { ModeSwitcher } from "./mode-switcher"

interface AWSHeaderProps {
  dictionary?: Dictionary
  locale?: string
  accountId?: string
  organizationName?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  pageTitle?: string
}

export function AWSHeader({
  dictionary,
  locale = "en",
  accountId = "4467-3125-8367",
  organizationName = "Hogwarts",
  breadcrumbs,
  pageTitle
}: AWSHeaderProps) {
  return (
    <div className="w-full">
      {/* Primary Header - Dark Navy */}
      <header className="bg-[#232f3e] text-white">
        <div className="flex h-12 items-center px-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="Logo"
                width={28}
                height={28}
                className="invert"
              />
            </Link>

            {/* Apps Grid */}
            <button className="p-1.5 rounded hover:bg-[#3c4b5e] transition-colors">
              <Grid3X3 className="h-5 w-5" />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="h-8 w-64 lg:w-80 rounded bg-[#0f1b2a] border border-[#5f6b7a] pl-10 pr-16 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-[#539fe5] focus:ring-1 focus:ring-[#539fe5]"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs bg-[#232f3e] border border-[#5f6b7a] rounded text-gray-400">
                  [Option+S]
                </kbd>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Icon Buttons */}
            <button className="p-2 rounded hover:bg-[#3c4b5e] transition-colors hidden sm:block">
              <ExternalLink className="h-4 w-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#3c4b5e] transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#3c4b5e] transition-colors hidden sm:block">
              <HelpCircle className="h-4 w-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#3c4b5e] transition-colors hidden sm:block">
              <Settings className="h-4 w-4" />
            </button>

            {/* Global/Region Selector */}
            <button className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded hover:bg-[#3c4b5e] transition-colors text-sm">
              <Globe className="h-4 w-4" />
              <span>Global</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-[#5f6b7a] mx-2 hidden lg:block" />

            {/* Account Info */}
            <div className="hidden lg:flex items-center gap-3">
              <span className="text-xs text-gray-400">Account ID: {accountId}</span>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-[#3c4b5e] transition-colors text-sm font-medium">
                {organizationName}
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Language & Theme Switchers */}
            <div className="flex items-center gap-0.5 ml-2">
              <LangSwitcher />
              <ModeSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Header - Breadcrumb Navigation */}
      {(breadcrumbs || pageTitle) && (
        <nav className="bg-background border-b border-border">
          <div className="flex h-11 items-center px-4">
            {/* Menu Toggle */}
            <button className="p-1.5 rounded hover:bg-accent transition-colors mr-4">
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm flex-1">
              {breadcrumbs?.map((crumb, index) => (
                <span key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronDown className="h-3 w-3 -rotate-90 text-muted-foreground" />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-primary hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                </span>
              ))}
              {pageTitle && !breadcrumbs && (
                <span className="text-foreground font-medium">{pageTitle}</span>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded hover:bg-accent transition-colors">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}
