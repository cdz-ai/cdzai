"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Users, MessageSquare, TrendingUp, Activity, Bot, Clock, Zap, Trash2, Shield, UserX } from "lucide-react"
import { getUser } from "@/lib/auth"
import { getChatSessions } from "@/lib/storage"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { ReviewsSection } from "@/components/reviews-section"

interface ChartData {
  name: string
  value: number
}

interface UserData {
  id: string
  email: string
  username: string
  createdAt: Date
  isAdmin: boolean
  sessionsCount: number
  messagesCount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const [user, setUser] = useState(getUser())
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeToday: 0,
    avgResponseTime: 0,
    totalSessions: 0,
    aiModelsUsed: 0,
  })
  const [messagesByDay, setMessagesByDay] = useState<ChartData[]>([])
  const [modelUsage, setModelUsage] = useState<ChartData[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [users, setUsers] = useState<UserData[]>([])

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)

    if (!currentUser) {
      router.push("/login")
      return
    }

    if (!currentUser.isAdmin) {
      router.push("/chat")
      return
    }

    const sessions = getChatSessions()
    const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0)

    const userMap = new Map<string, UserData>()
    sessions.forEach((session) => {
      if (!userMap.has(session.userId)) {
        userMap.set(session.userId, {
          id: session.userId,
          email: `user${session.userId.substring(0, 8)}@cdzai.app`,
          username: `User ${session.userId.substring(0, 8)}`,
          createdAt: new Date(session.createdAt),
          isAdmin: false,
          sessionsCount: 0,
          messagesCount: 0,
        })
      }
      const userData = userMap.get(session.userId)!
      userData.sessionsCount++
      userData.messagesCount += session.messages.length
    })

    const usersArray = Array.from(userMap.values()).sort((a, b) => b.messagesCount - a.messagesCount)
    setUsers(usersArray)

    const uniqueUsers = userMap.size
    const modelsUsed = new Set(sessions.map((s) => s.model)).size

    let totalResponseTime = 0
    let responseCount = 0
    sessions.forEach((session) => {
      session.messages.forEach((msg) => {
        if (msg.responseTime) {
          totalResponseTime += msg.responseTime
          responseCount++
        }
      })
    })
    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0

    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    const today = new Date()
    const messagesByDayData: ChartData[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayName = days[date.getDay()]

      const messagesOnDay = sessions
        .filter((session) => {
          const sessionDate = new Date(session.createdAt)
          return sessionDate.toDateString() === date.toDateString()
        })
        .reduce((acc, s) => acc + s.messages.length, 0)

      messagesByDayData.push({ name: dayName, value: messagesOnDay })
    }

    setMessagesByDay(messagesByDayData)

    const modelCounts: Record<string, number> = {}
    sessions.forEach((session) => {
      modelCounts[session.model] = (modelCounts[session.model] || 0) + 1
    })

    const totalSessions = sessions.length || 1
    const modelUsageData: ChartData[] = Object.entries(modelCounts).map(([model, count]) => ({
      name:
        model === "gemini" ? "GPT-5 Nano" : model === "deepseek" ? "DeepSeek" : model === "gpt-4" ? "GPT-4" : "Claude",
      value: Math.round((count / totalSessions) * 100),
    }))

    setModelUsage(modelUsageData)

    const recentSessions = [...sessions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    const activities = recentSessions.map((session) => {
      const timeAgo = getTimeAgo(new Date(session.createdAt))
      return {
        user: session.userId.substring(0, 8) + "...",
        action: `a créé une session avec ${session.model}`,
        time: timeAgo,
        color: ["green", "blue", "pink", "purple"][Math.floor(Math.random() * 4)],
      }
    })

    setRecentActivity(activities)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const activeToday = new Set(sessions.filter((s) => new Date(s.createdAt) >= todayStart).map((s) => s.userId)).size

    setStats({
      totalUsers: uniqueUsers,
      totalMessages,
      activeToday,
      avgResponseTime,
      totalSessions: sessions.length,
      aiModelsUsed: modelsUsed,
    })
  }, [router])

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return t("fewSecondsAgo")
    if (seconds < 3600) return t("minutesAgo").replace("{0}", Math.floor(seconds / 60).toString())
    if (seconds < 86400) return t("hoursAgo").replace("{0}", Math.floor(seconds / 3600).toString())
    return t("daysAgo").replace("{0}", Math.floor(seconds / 86400).toString())
  }

  const getThemeColor = () => {
    const colors = {
      green: "from-green-500 to-green-600",
      blue: "from-blue-500 to-blue-600",
      pink: "from-pink-500 to-pink-600",
      turquoise: "from-cyan-500 to-teal-600",
    }
    return colors[theme]
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm(t("confirmDeleteUser"))) {
      setUsers(users.filter((u) => u.id !== userId))
    }
  }

  const handleToggleAdmin = (userId: string) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u)))
  }

  if (!user?.isAdmin) {
    return null
  }

  const maxMessages = Math.max(...messagesByDay.map((d) => d.value), 1)
  const maxModelUsage = Math.max(...modelUsage.map((d) => d.value), 1)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-4 md:p-8">
          <div className="mb-8">
            <h1
              className={`mb-2 bg-gradient-to-r ${getThemeColor()} bg-clip-text text-3xl font-bold text-transparent md:text-4xl`}
            >
              {t("adminDashboard")}
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">{t("overviewStats")}</p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card className="border-border bg-card transition-all hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">{t("users")}</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground md:text-2xl">{stats.totalUsers}</div>
                <p className="mt-1 text-xs text-muted-foreground">{t("totalRegistered")}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card transition-all hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">{t("messages")}</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground md:text-2xl">{stats.totalMessages}</div>
                <p className="mt-1 text-xs text-muted-foreground">{t("totalSent")}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card transition-all hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">{t("active")}</CardTitle>
                <Activity className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground md:text-2xl">{stats.activeToday}</div>
                <p className="mt-1 text-xs text-muted-foreground">{t("today")}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card transition-all hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">{t("sessions")}</CardTitle>
                <Clock className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground md:text-2xl">{stats.totalSessions}</div>
                <p className="mt-1 text-xs text-muted-foreground">{t("totalCreated")}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card transition-all hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">{t("aiModels")}</CardTitle>
                <Bot className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground md:text-2xl">{stats.aiModelsUsed}</div>
                <p className="mt-1 text-xs text-muted-foreground">{t("used")}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card transition-all hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">{t("response")}</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground md:text-2xl">{stats.avgResponseTime}ms</div>
                <p className="mt-1 text-xs text-muted-foreground">{t("avgTime")}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6 border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground md:text-lg">
                <Users className="h-5 w-5 text-green-500" />
                {t("userManagement")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t("user")}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t("email")}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {t("sessionsCount")}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {t("messagesCount")}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t("status")}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userData) => (
                      <tr key={userData.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-foreground font-medium">{userData.username}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{userData.email}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{userData.sessionsCount}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{userData.messagesCount}</td>
                        <td className="py-3 px-4">
                          {userData.isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              <Shield className="h-3 w-3" />
                              {t("admin")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                              {t("user")}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAdmin(userData.id)}
                              className="h-8 px-3"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {userData.isAdmin ? t("removeAdmin") : t("promote")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(userData.id)}
                              className="h-8 px-3"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {t("delete")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-8">
                    <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{t("noUsersFound")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-foreground md:text-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  {t("messagesByDay")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {messagesByDay.map((day, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-12 text-xs text-muted-foreground md:text-sm">{day.name}</div>
                      <div className="flex-1">
                        <div className="relative h-8 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${getThemeColor()} transition-all duration-500`}
                            style={{ width: `${(day.value / maxMessages) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-xs font-bold text-foreground md:text-sm">{day.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-foreground md:text-lg">
                  <Bot className="h-5 w-5 text-cyan-500" />
                  {t("modelUsage")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {modelUsage.length > 0 ? (
                    modelUsage.map((model, index) => {
                      const colors = [
                        "from-green-500 to-emerald-600",
                        "from-blue-500 to-cyan-600",
                        "from-pink-500 to-rose-600",
                        "from-purple-500 to-violet-600",
                      ]
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-20 text-xs text-muted-foreground md:text-sm">{model.name}</div>
                          <div className="flex-1">
                            <div className="relative h-8 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-500`}
                                style={{ width: `${model.value}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-12 text-right text-xs font-bold text-foreground md:text-sm">
                            {model.value}%
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("noDataAvailable")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground md:text-lg">
                <Activity className="h-5 w-5 text-pink-500" />
                {t("recentActivity")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 border-l-2 border-border pl-4">
                      <div
                        className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full`}
                        style={{
                          backgroundColor:
                            activity.color === "green"
                              ? "#22c55e"
                              : activity.color === "blue"
                                ? "#3b82f6"
                                : activity.color === "pink"
                                  ? "#ec4899"
                                  : "#a855f7",
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-xs text-foreground md:text-sm">
                          <span className="font-semibold">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t("noRecentActivity")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <ReviewsSection />
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("createdBy")} <span className="font-semibold text-foreground">Chems</span> • {t("version")} 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
