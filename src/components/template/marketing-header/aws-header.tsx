"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Bell,
  ChevronDown,
  ExternalLink,
  Globe,
  Grid3X3,
  HelpCircle,
  Info,
  Menu,
  Search,
  Settings,
} from "lucide-react"

import type { Dictionary } from "@/components/internationalization/dictionaries"

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
  pageTitle,
}: AWSHeaderProps) {
  return (
    <div className="w-full">
      {/* Primary Header - Dark Navy */}
      <header className="bg-[#232f3e] text-white">
        <div className="flex h-12 items-center px-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Image
                src="/logo.png"
                alt="Logo"
                width={28}
                height={28}
                className="invert"
              />
            </Link>

            {/* Apps Grid */}
            <button className="rounded p-1.5 transition-colors hover:bg-[#3c4b5e]">
              <Grid3X3 className="h-5 w-5" />
            </button>

            {/* Search Bar */}
            <div className="hidden items-center md:flex">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="h-8 w-64 rounded border border-[#5f6b7a] bg-[#0f1b2a] pr-16 pl-10 text-sm text-white placeholder:text-gray-400 focus:border-[#539fe5] focus:ring-1 focus:ring-[#539fe5] focus:outline-none lg:w-80"
                />
                <kbd className="absolute top-1/2 right-2 -translate-y-1/2 rounded border border-[#5f6b7a] bg-[#232f3e] px-1.5 py-0.5 text-xs text-gray-400">
                  [Option+S]
                </kbd>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="ml-auto flex items-center gap-1">
            {/* Icon Buttons */}
            <button className="hidden rounded p-2 transition-colors hover:bg-[#3c4b5e] sm:block">
              <ExternalLink className="h-4 w-4" />
            </button>
            <button className="rounded p-2 transition-colors hover:bg-[#3c4b5e]">
              <Bell className="h-4 w-4" />
            </button>
            <button className="hidden rounded p-2 transition-colors hover:bg-[#3c4b5e] sm:block">
              <HelpCircle className="h-4 w-4" />
            </button>
            <button className="hidden rounded p-2 transition-colors hover:bg-[#3c4b5e] sm:block">
              <Settings className="h-4 w-4" />
            </button>

            {/* Global/Region Selector */}
            <button className="hidden items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors hover:bg-[#3c4b5e] lg:flex">
              <Globe className="h-4 w-4" />
              <span>Global</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Divider */}
            <div className="mx-2 hidden h-6 w-px bg-[#5f6b7a] lg:block" />

            {/* Account Info */}
            <div className="hidden items-center gap-3 lg:flex">
              <span className="text-xs text-gray-400">
                Account ID: {accountId}
              </span>
              <button className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#3c4b5e]">
                {organizationName}
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Language & Theme Switchers */}
            <div className="ml-2 flex items-center gap-0.5">
              <LangSwitcher />
              <ModeSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Header - Breadcrumb Navigation */}
      {(breadcrumbs || pageTitle) && (
        <nav className="bg-background border-border border-b">
          <div className="flex h-11 items-center px-4">
            {/* Menu Toggle */}
            <button className="hover:bg-accent mr-4 rounded p-1.5 transition-colors">
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex flex-1 items-center gap-2 text-sm">
              {breadcrumbs?.map((crumb, index) => (
                <span key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronDown className="text-muted-foreground h-3 w-3 -rotate-90" />
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
              <button className="hover:bg-accent rounded p-1.5 transition-colors">
                <Info className="text-muted-foreground h-4 w-4" />
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}
