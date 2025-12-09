"use client"

import { cn } from '@/lib/utils'
import Link from 'next/link'
import React, { useState } from 'react'
import { buttonVariants } from '../ui/button'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'
import { env } from '@/env.mjs'
import { AlertTriangle, ExternalLink } from 'lucide-react'

interface HeroProps {
  dictionary?: Dictionary
  lang?: Locale
}

const Hero = ({ dictionary, lang }: HeroProps) => {
  const [selectedOption, setSelectedOption] = useState<string>('outside')

  const heroDict = dictionary?.marketing?.hero || {
    title: "Automate Education,",
    subtitle: "Educational management system streamlining operations for students, educators, and school leaders. Transform your institution's efficiency today.",
    appointment: "Get Started",
    services: "GitHub"
  }

  // Construct demo URL based on environment
  const getDemoUrl = () => {
    if (env.NEXT_PUBLIC_DEMO_URL) {
      return `${env.NEXT_PUBLIC_DEMO_URL}/${lang || 'en'}`
    }
    const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
    const isLocal = rootDomain.includes('localhost')
    const protocol = isLocal ? 'http' : 'https'
    if (isLocal) {
      return `${protocol}://demo.${rootDomain}/${lang || 'en'}`
    }
    const parts = rootDomain.split('.')
    const baseDomain = parts.length >= 2 ? parts.slice(-2).join('.') : rootDomain
    return `${protocol}://demo.${baseDomain}/${lang || 'en'}`
  }

  const options = [
    {
      id: 'compute',
      title: 'Running on school compute service',
      description: 'You plan to use this access key to enable application code running on a school compute service like Virtual Classrooms, Labs, or Remote Learning to access your school resources.'
    },
    {
      id: 'third-party',
      title: 'Third-party service',
      description: 'You plan to use this access key to enable access for a third-party application or service that monitors or manages your school resources.'
    },
    {
      id: 'outside',
      title: 'Application running outside School',
      description: 'You plan to use this access key to authenticate workloads running in your data center or other infrastructure outside of the school that needs to access your school resources.'
    },
    {
      id: 'other',
      title: 'Other',
      description: 'Your use case is not listed here.'
    }
  ]

  return (
    <section id="hero" className="bg-background min-h-[calc(100vh-3rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold text-foreground mb-6">
          Get Started with Hogwarts
        </h1>

        {/* Options Card */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
          {options.map((option, index) => (
            <label
              key={option.id}
              className={cn(
                "flex items-start gap-4 p-4 cursor-pointer transition-colors",
                index !== options.length - 1 && "border-b border-border",
                selectedOption === option.id
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : "hover:bg-accent/50"
              )}
            >
              <div className="pt-0.5">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                    selectedOption === option.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {selectedOption === option.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="radio"
                  name="option"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => setSelectedOption(option.id)}
                  className="sr-only"
                />
                <div className="font-medium text-foreground text-sm mb-1">
                  {option.title}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200 text-sm mb-1">
                Alternative recommended
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Use IAM Roles Anywhere to generate temporary security credentials for non-school workloads accessing school services.{' '}
                <Link
                  href={`/${lang || 'en'}/docs`}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Learn more about providing access for non-school workloads.
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={getDemoUrl()}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "px-6"
            )}
          >
            Cancel
          </Link>
          <Link
            href={`/${lang || 'en'}/onboarding`}
            className={cn(
              buttonVariants({ variant: "default" }),
              "px-6 bg-[#ec7211] hover:bg-[#eb5f07] text-white border-none"
            )}
          >
            Next
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
