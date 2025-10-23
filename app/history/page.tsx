"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, MessageSquare, Trash2 } from "lucide-react"
import { getUser } from "@/lib/auth"
import { getChatSessions } from "@/lib/storage"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { useLanguage } from "@/components/language-provider"
import type { ChatSession } from "@/types"

export default function HistoryPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const [user, setUser] = useState(getUser())
  const [sessions, setSessions] = useState<ChatSession[]>([])

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)

    if (currentUser) {
      const allSessions = getChatSessions()
      const userSessions = allSessions.filter((s) => s.userId === currentUser.id)
      userSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setSessions(userSessions)
    }
  }, [])

  const openSession = (sessionId: string) => {
    router.push(`/chat?session=${sessionId}`)
  }

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const allSessions = getChatSessions()
    const filtered = allSessions.filter((s) => s.id !== sessionId)
    localStorage.setItem("chatSessions", JSON.stringify(filtered))
    setSessions(sessions.filter((s) => s.id !== sessionId))
  }

  const getThemeColor = () => {
    const colors = {
      green: "from-green-500 to-green-600",
      blue: "from-blue-500 to-blue-600",
      pink: "from-pink-500 to-pink-600",
      turquoise: "from-cyan-500 to-teal-600",
      gray: "from-gray-500 to-gray-600",
    }
    return colors[theme]
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
          <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-foreground">{t("history")}</h1>

          {sessions.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-center text-sm sm:text-base text-muted-foreground">{t("noMessages")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  onClick={() => openSession(session.id)}
                  className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm sm:text-base">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`rounded-full bg-gradient-to-br ${getThemeColor()} p-2 flex-shrink-0`}>
                          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <span className="text-foreground truncate">
                          {t("chat")} - {session.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs sm:text-sm font-normal text-muted-foreground whitespace-nowrap">
                          {new Date(session.createdAt).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                          aria-label="Delete session"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {session.messages.length} {t("messages")}
                    </p>
                    {session.messages.length > 0 && (
                      <p className="mt-2 truncate text-xs sm:text-sm text-card-foreground">
                        {session.messages.find((m) => m.role === "user")?.content || ""}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
