"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Search, Zap, Globe, Shield } from "lucide-react"
import { getUser } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useLanguage } from "@/components/language-provider"
import Script from "next/script"

export default function CDZNavigPage() {
  const router = useRouter()
  const [user, setUser] = useState(getUser())
  const { theme } = useTheme()
  const { t } = useLanguage()
  const [isSearchLoaded, setIsSearchLoaded] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  const getThemeGradient = () => {
    const gradients = {
      gray: "from-gray-500 via-gray-600 to-gray-700",
      green: "from-green-500 via-green-600 to-green-700",
      blue: "from-blue-500 via-blue-600 to-blue-700",
      pink: "from-pink-500 via-pink-600 to-pink-700",
      turquoise: "from-cyan-500 via-teal-600 to-cyan-700",
    }
    return gradients[theme]
  }

  if (!user) return null

  return (
    <>
      <Script
        src="https://cse.google.com/cse.js?cx=e619394b77a464bca"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("[v0] Google CSE loaded successfully")
          setIsSearchLoaded(true)
        }}
        onError={(e) => {
          console.error("[v0] Google CSE failed to load:", e)
          setIsSearchLoaded(true)
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <header className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div
                className={cn(
                  "rounded-xl bg-gradient-to-br p-2.5 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-12",
                  getThemeGradient(),
                )}
              >
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground transition-all duration-300 group-hover:text-primary">
                  {t("cdzaiNavigator")}
                </h1>
                <p className="text-xs text-muted-foreground">{t("intelligentAiSearch")}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
            <div className="mb-8 sm:mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div
                className={cn(
                  "mx-auto mb-6 w-fit rounded-full bg-gradient-to-br p-6 opacity-20 animate-pulse",
                  getThemeGradient(),
                )}
              >
                <Search className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                {t("searchWithAi")}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
                {t("searchWithAiDescription")}
              </p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
              <div
                className={cn(
                  "rounded-2xl border-2 backdrop-blur-xl p-4 sm:p-8 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02]",
                  "border-primary/30 bg-white/10",
                )}
              >
                {!isSearchLoaded && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                )}
                <div className={cn("gcse-search", !isSearchLoaded && "hidden")}></div>
              </div>
            </div>

            <div className="mt-12 sm:mt-16 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-400">
              {[
                {
                  icon: Zap,
                  title: t("intelligentSearch"),
                  description: t("intelligentSearchDescription"),
                },
                {
                  icon: Globe,
                  title: t("fastResults"),
                  description: t("fastResultsDescription"),
                },
                {
                  icon: Shield,
                  title: t("modernInterface"),
                  description: t("modernInterfaceDescription"),
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:border-primary/50 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <div className={cn("mb-4 w-fit rounded-lg bg-gradient-to-br p-3", getThemeGradient())}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
