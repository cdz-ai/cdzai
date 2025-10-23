"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Palette, Moon, Sun, Globe, MessageCircle } from "lucide-react"
import { getUser, getUsers } from "@/lib/auth"
import { useTheme } from "@/components/theme-provider"
import { useLanguage } from "@/components/language-provider"
import type { Language } from "@/lib/translations"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Theme, User } from "@/types"

const themes: { value: Theme; label: string; gradient: string }[] = [
  { value: "gray", label: "gray", gradient: "from-gray-500 to-gray-600" },
  { value: "green", label: "green", gradient: "from-green-500 to-green-600" },
  { value: "blue", label: "blue", gradient: "from-blue-500 to-blue-600" },
  { value: "pink", label: "pink", gradient: "from-pink-500 to-pink-600" },
  { value: "turquoise", label: "turquoise", gradient: "from-cyan-500 to-teal-600" },
]

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "fr", label: "french", flag: "🇫🇷" },
  { value: "en", label: "english", flag: "🇬🇧" },
  { value: "ko", label: "korean", flag: "🇰🇷" },
]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(getUser())
  const { theme, colorMode, setTheme, setColorMode } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [admins, setAdmins] = useState<User[]>([])

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)

    if (!currentUser) {
      router.push("/login")
    }

    const allUsers = getUsers()
    const adminUsers = allUsers
      .filter((u: User) => u.isAdmin)
      .map((u: User) => ({
        ...u,
        email: "••••••••", // Hide admin emails for privacy
        isOnline: Math.random() > 0.5, // Simulate online status
      }))
    setAdmins(adminUsers)
  }, [router])

  if (!user) return null

  const getThemeColor = () => {
    const colors = {
      gray: "from-gray-500 to-gray-600",
      green: "from-green-500 to-green-600",
      blue: "from-blue-500 to-blue-600",
      pink: "from-pink-500 to-pink-600",
      turquoise: "from-cyan-500 to-teal-600",
    }
    return colors[theme]
  }

  const iconColor = {
    gray: "text-gray-500",
    green: "text-green-500",
    blue: "text-blue-500",
    pink: "text-pink-500",
    turquoise: "text-cyan-500",
  }[theme]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1
              className={cn(
                "mb-2 bg-gradient-to-r bg-clip-text text-2xl sm:text-3xl font-bold text-transparent",
                getThemeColor(),
              )}
            >
              {t("settingsTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("settingsSubtitle")}</p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
                  <Palette className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)} />
                  {t("colorTheme")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {themes.map((themeOption) => (
                    <button
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value)}
                      className={cn(
                        "group relative h-20 sm:h-24 overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all",
                        theme === themeOption.value
                          ? "scale-105 border-primary shadow-lg"
                          : "border-border hover:scale-102 hover:border-primary/50",
                      )}
                    >
                      <div className={cn("h-full w-full bg-gradient-to-br", themeOption.gradient)} />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity group-hover:bg-black/30">
                        <span className="text-sm sm:text-base font-medium text-white">
                          {t(themeOption.label as any)}
                        </span>
                      </div>
                      {theme === themeOption.value && (
                        <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white shadow-lg">
                          <span className="text-xs sm:text-sm font-bold text-zinc-900">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
                  {colorMode === "dark" ? (
                    <Moon className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)} />
                  ) : (
                    <Sun className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)} />
                  )}
                  {t("displayMode")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => setColorMode("dark")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all",
                      colorMode === "dark"
                        ? "scale-105 border-primary bg-accent shadow-lg"
                        : "border-border hover:scale-102 hover:border-primary/50 hover:bg-accent/50",
                    )}
                  >
                    <Moon
                      className={cn(
                        "h-6 w-6 sm:h-8 sm:w-8",
                        colorMode === "dark" ? iconColor : "text-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm sm:text-base font-medium",
                        colorMode === "dark" ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {t("dark")}
                    </span>
                  </button>
                  <button
                    onClick={() => setColorMode("light")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all",
                      colorMode === "light"
                        ? "scale-105 border-primary bg-accent shadow-lg"
                        : "border-border hover:scale-102 hover:border-primary/50 hover:bg-accent/50",
                    )}
                  >
                    <Sun
                      className={cn(
                        "h-6 w-6 sm:h-8 sm:w-8",
                        colorMode === "light" ? iconColor : "text-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm sm:text-base font-medium",
                        colorMode === "light" ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {t("light")}
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
                  <Globe className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)} />
                  {t("languagePreference")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {languages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => setLanguage(lang.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 p-2.5 sm:p-3 md:p-4 transition-all",
                        language === lang.value
                          ? "scale-105 border-primary bg-accent shadow-lg"
                          : "border-border hover:scale-102 hover:border-primary/50 hover:bg-accent/50",
                      )}
                    >
                      <span className="text-2xl sm:text-3xl">{lang.flag}</span>
                      <span
                        className={cn(
                          "font-medium text-[10px] sm:text-xs md:text-sm text-center",
                          language === lang.value ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {t(lang.label as any)}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6 sm:mt-8 border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
                  <MessageCircle className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)} />
                  {t("contact")}
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("contactAdminDescription")}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {admins.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t("noAdminsAvailable")}</p>
                  ) : (
                    admins.map((admin) => (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border bg-accent/50 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                              {admin.username.charAt(0).toUpperCase()}
                            </div>
                            <div
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-background",
                                admin.isOnline ? "bg-green-500" : "bg-gray-400",
                              )}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base text-foreground flex items-center gap-2">
                              {admin.username}
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {admin.isOnline ? t("online") : t("offline")}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/friends/chat?userId=${admin.userId}`)}
                          className={cn(
                            "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all",
                            admin.isOnline
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-muted text-muted-foreground cursor-not-allowed",
                          )}
                          disabled={!admin.isOnline}
                        >
                          {t("sendMessageToAdmin")}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 sm:mt-8 border-t border-border pt-4 sm:pt-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Created by <span className="font-semibold text-foreground">Chems</span> • Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
