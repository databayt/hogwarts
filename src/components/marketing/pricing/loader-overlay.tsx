'use client'

import { useState } from 'react'
import { Loading } from '@/components/atom/loading'

export default function PricingLoaderOverlay() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return <Loading onComplete={() => setIsVisible(false)} />
}


