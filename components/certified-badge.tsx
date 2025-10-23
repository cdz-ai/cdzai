"use client"

import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CertifiedBadgeProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showTooltip?: boolean
}

export function CertifiedBadge({ className, size = "md", showTooltip = true }: CertifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center group", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
      <CheckCircle2
        className={cn(
          "relative text-white drop-shadow-lg transition-transform group-hover:scale-110",
          sizeClasses[size],
        )}
        fill="currentColor"
      />
      {showTooltip && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          CDZAI Certified
        </span>
      )}
    </div>
  )
}
