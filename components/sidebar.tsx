"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  MessageSquare,
  Zap,
  Sparkles,
  Compass,
  LayoutDashboard,
  History,
  User,
  Settings,
  Menu,
  ChevronLeft,
  Users,
  LogOut,
  Book,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useState, useEffect } from "react"
import { getUser, logout } from "@/lib/auth"
import { useLanguage } from "@/components/language-provider"
import { AdminBadge } from "@/components/admin-badge"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState(getUser())

  const isLoginPage = pathname === "/login"

  const navigation = [
    { name: t("openRouter"), href: "/chat", icon: MessageSquare },
    { name: t("aiChat"), href: "/aichat", icon: Zap },
    { name: t("vercelV0"), href: "/vercel", icon: Sparkles },
    { name: t("cdzNavig"), href: "/cdznavig", icon: Compass },
    { name: t("friends"), href: "/friends", icon: Users },
    { name: t("adminDashboard"), href: "/admin", icon: Shield, adminOnly: true },
    { name: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("history"), href: "/history", icon: History },
    { name: t("profile"), href: "/profile", icon: User },
    { name: t("docs" as any), href: "/docs", icon: Book },
    { name: t("settings"), href: "/settings", icon: Settings },
  ]

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setIsOpen(false)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sidebar-state", { detail: { isOpen, isMobile } }))
    }
  }, [isOpen, isMobile])

  useEffect(() => {
    setUser(getUser())
  }, [pathname])

  const filteredNavigation = navigation.filter((item) => {
    if (item.adminOnly) {
      return user?.isAdmin === true
    }
    return true
  })

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (isLoginPage || !user) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={isOpen}
        aria-controls="sidebar-navigation"
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border shadow-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {isOpen ? (
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      <aside
        id="sidebar-navigation"
        role="navigation"
        aria-label="Navigation principale"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-2xl transition-all duration-300 ease-in-out",
          isOpen ? "w-64 translate-x-0" : "-translate-x-full lg:w-16 xl:w-20 lg:translate-x-0",
        )}
      >
        <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 border-b border-border/50 px-4 sm:px-6">
          <div
            className="rounded-lg sm:rounded-xl bg-primary/10 p-1.5 sm:p-2 ring-1 ring-primary/20"
            aria-hidden="true"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          {isOpen && (
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">CDZAi</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{t("aiAssistant")}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 sm:py-4" aria-label="Menu de navigation">
          <ul className="space-y-0.5 sm:space-y-1" role="list">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      !isOpen && "justify-center",
                    )}
                    title={!isOpen ? item.name : undefined}
                  >
                    <Icon
                      className={cn("h-4 w-4 sm:h-5 sm:w-5 transition-transform", !isActive && "group-hover:scale-110")}
                      aria-hidden="true"
                    />
                    {isOpen && (
                      <>
                        <span className="truncate">{item.name}</span>
                        {isActive && (
                          <div
                            className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
                            aria-hidden="true"
                          />
                        )}
                      </>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {isOpen && (
          <div className="border-t border-border/50 p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div
              className="rounded-lg sm:rounded-xl bg-accent/30 p-2.5 sm:p-3 ring-1 ring-border/50"
              role="region"
              aria-label="Informations utilisateur"
            >
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user?.isGuest ? "Mode Invité" : user?.username || user?.email}
                </p>
                {user?.isAdmin && <AdminBadge size="sm" />}
              </div>
              <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground truncate">
                {user?.isGuest ? "Session temporaire" : user?.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              aria-label="Se déconnecter de votre compte"
              className="w-full flex items-center gap-2 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-destructive/20"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              <span>Déconnexion</span>
            </button>

            <div className="rounded-lg sm:rounded-xl bg-accent/30 p-2.5 sm:p-3 text-center ring-1 ring-border/50">
              <p className="text-[10px] sm:text-xs font-semibold text-foreground">
                {t("createdBy")} <span className="text-primary">Chems</span>
              </p>
              <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground font-mono">
                {t("version")} 14.0.0
              </p>
            </div>
          </div>
        )}
      </aside>

      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Fermer le menu"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsOpen(false)
            }
          }}
        />
      )}
    </>
  )
}
