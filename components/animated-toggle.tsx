"use client"

import { cn } from "@/lib/utils"

interface AnimatedToggleProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export function AnimatedToggle({ isOpen, onClick, className }: AnimatedToggleProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-300",
        className,
      )}
      aria-label={isOpen ? "Fermer la barre latérale" : "Ouvrir la barre latérale"}
    >
      <div className="relative h-6 w-8">
        {/* Top bar */}
        <div
          className={cn(
            "absolute left-0 right-0 h-1 rounded-full bg-white transition-all duration-350 ease-[cubic-bezier(0.5,-0.35,0.35,1.5)]",
            isOpen ? "bottom-[calc(50%-2px)] rotate-[135deg]" : "bottom-[calc(50%+11px+2px)] rotate-0",
          )}
          style={{
            transitionProperty: isOpen ? "bottom,transform" : "bottom,transform",
            transitionDelay: isOpen ? "0s,350ms" : "350ms,0s",
          }}
        />

        {/* Middle bar */}
        <div
          className={cn(
            "absolute left-0 right-0 top-[calc(50%-2px)] h-1 rounded-full bg-white transition-opacity duration-0",
            isOpen ? "opacity-0" : "opacity-100",
          )}
          style={{
            transitionDelay: isOpen ? "350ms" : "350ms",
          }}
        />

        {/* Bottom bar */}
        <div
          className={cn(
            "absolute left-0 right-0 h-1 rounded-full bg-white transition-all duration-350 ease-[cubic-bezier(0.5,-0.35,0.35,1.5)]",
            isOpen ? "top-[calc(50%-2px)] rotate-[225deg]" : "top-[calc(50%+11px+2px)] rotate-0",
          )}
          style={{
            transitionProperty: isOpen ? "top,transform" : "top,transform",
            transitionDelay: isOpen ? "0s,350ms" : "350ms,0s",
          }}
        />
      </div>
    </button>
  )
}
