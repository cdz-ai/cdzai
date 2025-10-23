"use client"

import type React from "react"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { Toaster } from "sonner"
import { Sidebar } from "@/components/sidebar"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const isLoginPage = pathname === "/login"

  useEffect(() => {
    const handleSidebarState = (event: CustomEvent) => {
      setSidebarOpen(event.detail.isOpen)
      setIsMobile(event.detail.isMobile)
    }

    window.addEventListener("sidebar-state" as any, handleSidebarState)
    return () => window.removeEventListener("sidebar-state" as any, handleSidebarState)
  }, [])

  return (
    <>
      <LanguageProvider>
        <ThemeProvider>
          <Sidebar />
          <div
            className={cn(
              "min-h-screen transition-all duration-300 ease-in-out",
              !isLoginPage && sidebarOpen && !isMobile ? "lg:pl-64" : "lg:pl-0",
            )}
          >
            {children}
          </div>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </LanguageProvider>
      <Analytics />
    </>
  )
}
