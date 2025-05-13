"use client"

import { useState } from "react"
import Image from "next/image"

interface LogoProps {
  className?: string
  height?: number
  width?: number
}

export function Logo({ className = "", height = 80, width = 200 }: LogoProps) {
  const [logoError, setLogoError] = useState(false)

  if (logoError) {
    return (
      <div
        className={`flex items-center justify-center bg-primary rounded-md p-2 ${className}`}
        style={{ height, width }}
      >
        <h1 className="text-xl font-bold text-black text-center">Retriever&apos;s Essentials</h1>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <Image
        src="/images/retriever-essentials-logo.png"
        alt="Retriever's Essentials Logo"
        fill
        sizes={`${Math.max(width, height)}px`}
        className="object-contain"
        priority
        onError={() => setLogoError(true)}
      />
    </div>
  )
}
