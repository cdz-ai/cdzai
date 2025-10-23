"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Book, Sparkles, Users, Calendar, Zap, Globe, Mic, MessageSquare, Shield } from "lucide-react"
import { getUser } from "@/lib/auth"
import { useLanguage } from "@/components/language-provider"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminBadge } from "@/components/admin-badge"
import { cn } from "@/lib/utils"
import { ReviewsSection } from "@/components/reviews-section"

export default function DocsPage() {
  const router = useRouter()
  const [user, setUser] = useState(getUser())
  const { t } = useLanguage()
  const [admins, setAdmins] = useState<any[]>([])

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)

    if (!currentUser) {
      router.push("/login")
    }

    // Load admin users
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
    const adminUsers = allUsers.filter((u: any) => u.isAdmin)
    setAdmins(adminUsers)
  }, [router])

  if (!user) return null

  const features = [
    {
      icon: Zap,
      title: t("multipleAiModels" as any),
      description: t("multipleAiModelsDesc" as any),
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Mic,
      title: t("voiceRecognition" as any),
      description: t("voiceRecognitionDesc" as any),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Globe,
      title: t("multiLanguage" as any),
      description: t("multiLanguageDesc" as any),
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: MessageSquare,
      title: t("friendsGroups" as any),
      description: t("friendsGroupsDesc" as any),
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: Shield,
      title: t("adminTools" as any),
      description: t("adminToolsDesc" as any),
      color: "from-purple-500 to-indigo-500",
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-3 sm:p-4 md:p-6 lg:p-8">
          {/* Hero Section with 3D Animation */}
          <div className="relative mb-8 sm:mb-12 overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 sm:p-8 md:p-12">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/2 h-full w-full animate-spin-slow">
                <div className="h-full w-full bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl" />
              </div>
              <div className="absolute -bottom-1/2 -left-1/2 h-full w-full animate-spin-slow-reverse">
                <div className="h-full w-full bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Book className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary animate-pulse" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {t("docsTitle" as any)}
                </h1>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl">
                {t("docsSubtitle" as any)}
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              {t("features" as any)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="group border-border bg-card hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div
                      className={cn("inline-flex p-2 sm:p-3 rounded-xl bg-gradient-to-br mb-3 sm:mb-4", feature.color)}
                    >
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Getting Started */}
          <Card className="mb-8 sm:mb-12 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-foreground">
                {t("gettingStarted" as any)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {[
                  t("gettingStartedStep1" as any),
                  t("gettingStartedStep2" as any),
                  t("gettingStartedStep3" as any),
                  t("gettingStartedStep4" as any),
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-accent/50">
                    <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm">
                      {index + 1}
                    </div>
                    <p className="text-sm sm:text-base text-foreground pt-0.5 sm:pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Development Journey */}
          <Card className="mb-8 sm:mb-12 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                {t("developmentJourney" as any)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-semibold">{t("createdOn" as any)}:</span>
                  <span>{t("october15" as any)}</span>
                </div>
                <p className="text-sm sm:text-base text-foreground leading-relaxed">
                  {t("developmentJourneyText" as any)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Team */}
          <Card className="mb-8 sm:mb-12 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                {t("adminsTeam" as any)}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("adminsTeamDescription" as any)}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border bg-accent/50 hover:bg-accent transition-all hover:scale-105"
                  >
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-base sm:text-lg">
                      {admin.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm sm:text-base text-foreground">{admin.username}</p>
                        <AdminBadge />
                      </div>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <ReviewsSection pageId="docs" />

          {/* Footer */}
          <div className="border-t border-border pt-6 sm:pt-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Created by <span className="font-semibold text-foreground">Chems</span> • Version 1.0.0
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-slow-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 25s linear infinite;
        }
      `}</style>
    </div>
  )
}
