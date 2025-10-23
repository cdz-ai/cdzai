"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, getUsers, updateUser, deleteUser } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Users, Activity, Zap, Shield, Ticket, Check, X, Send, Eye, EyeOff, History, Award } from "lucide-react"
import type { User } from "@/types"
import { getSupabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CertifiedBadge } from "@/components/certified-badge"
import { AdminBadge } from "@/components/admin-badge"

interface SupportTicket {
  id: string
  user_id: string
  user_email: string
  subject: string
  message: string
  image_url: string | null
  status: "pending" | "in_progress" | "resolved" | "rejected"
  assigned_admin_id: string | null
  admin_response: string | null
  created_at: string
  updated_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { t } = useLanguage()
  const { theme } = useTheme()
  const supabase = getSupabase()
  const [currentUser, setCurrentUser] = useState(getUser())
  const [users, setUsers] = useState<User[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [adminResponse, setAdminResponse] = useState("")
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalMessages: 0,
    totalSessions: 0,
  })
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [selectedUserHistory, setSelectedUserHistory] = useState<User | null>(null)

  useEffect(() => {
    const user = getUser()
    setCurrentUser(user)

    if (!user) {
      router.push("/login")
      return
    }

    if (!user.isAdmin) {
      router.push("/chat")
      return
    }

    const allUsers = getUsers()
    setUsers(allUsers)
    setStats({
      totalUsers: allUsers.length,
      activeToday: allUsers.filter((u) => {
        const today = new Date().toDateString()
        return new Date(u.createdAt).toDateString() === today
      }).length,
      totalMessages: 0,
      totalSessions: 0,
    })

    loadTickets()

    const ticketsChannel = supabase
      .channel("support_tickets_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
        },
        () => {
          loadTickets()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ticketsChannel)
    }
  }, [router])

  const loadTickets = async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false })

    setTickets(data || [])
  }

  const handleToggleAdmin = (userId: string, currentStatus: boolean) => {
    updateUser(userId, { isAdmin: !currentStatus })
    setUsers(getUsers())
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm(t("confirmDeleteUser"))) {
      deleteUser(userId)
      setUsers(getUsers())
    }
  }

  const handleUpdateTicketStatus = async (ticketId: string, status: SupportTicket["status"]) => {
    if (!currentUser) return

    await supabase
      .from("support_tickets")
      .update({
        status,
        assigned_admin_id: currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId)

    loadTickets()
  }

  const handleSendResponse = async () => {
    if (!selectedTicket || !adminResponse.trim() || !currentUser) return

    await supabase
      .from("support_tickets")
      .update({
        admin_response: adminResponse,
        status: "resolved",
        assigned_admin_id: currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedTicket.id)

    setAdminResponse("")
    setSelectedTicket(null)
    loadTickets()
  }

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  const getUserHistory = (userId: string) => {
    const history = JSON.parse(localStorage.getItem(`chat_history_${userId}`) || "[]")
    return history
  }

  const handleToggleCertified = (userId: string, currentStatus: boolean) => {
    updateUser(userId, { certified: !currentStatus })
    setUsers(getUsers())
  }

  if (!currentUser?.isAdmin) return null

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

  const pendingTickets = tickets.filter((t) => t.status === "pending")
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress")
  const resolvedTickets = tickets.filter((t) => t.status === "resolved")

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1
              className={cn(
                "mb-2 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent sm:text-3xl",
                getThemeColor(),
              )}
            >
              {t("adminDashboard")}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">{t("overviewStats")}</p>
          </div>

          <div className="mb-6 grid gap-3 sm:mb-8 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("users")}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">{t("totalRegistered")}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("active")}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.activeToday}</div>
                <p className="text-xs text-muted-foreground">{t("today")}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Zap className="h-5 w-5" />
                  {t("sessions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalSessions}</div>
                <p className="text-xs text-muted-foreground">{t("totalCreated")}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6 border-border bg-card sm:mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground sm:text-lg">
                <Ticket className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("supportTickets")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending" className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">{t("pending")}</span>
                    <span className="sm:hidden">En attente</span> ({pendingTickets.length})
                  </TabsTrigger>
                  <TabsTrigger value="in_progress" className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">{t("inProgress")}</span>
                    <span className="sm:hidden">En cours</span> ({inProgressTickets.length})
                  </TabsTrigger>
                  <TabsTrigger value="resolved" className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">{t("resolved")}</span>
                    <span className="sm:hidden">Résolus</span> ({resolvedTickets.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {pendingTickets.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">{t("noTickets")}</p>
                  ) : (
                    pendingTickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border border-border bg-muted p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                            <p className="text-sm text-muted-foreground">{ticket.user_email}</p>
                          </div>
                          <Badge variant="secondary">{ticket.status}</Badge>
                        </div>
                        <p className="mb-3 text-sm text-foreground">{ticket.message}</p>
                        {ticket.image_url && (
                          <img
                            src={ticket.image_url || "/placeholder.svg"}
                            alt="Attachment"
                            className="mb-3 max-h-40 rounded-lg"
                          />
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTicketStatus(ticket.id, "in_progress")}
                            className="gap-1"
                          >
                            <Check className="h-4 w-4" />
                            {t("accept")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateTicketStatus(ticket.id, "rejected")}
                            className="gap-1"
                          >
                            <X className="h-4 w-4" />
                            {t("reject")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTicket(ticket)}
                            className="gap-1"
                          >
                            <Send className="h-4 w-4" />
                            {t("respond")}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="in_progress" className="space-y-4">
                  {inProgressTickets.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">{t("noTickets")}</p>
                  ) : (
                    inProgressTickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border border-border bg-muted p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                            <p className="text-sm text-muted-foreground">{ticket.user_email}</p>
                          </div>
                          <Badge>{ticket.status}</Badge>
                        </div>
                        <p className="mb-3 text-sm text-foreground">{ticket.message}</p>
                        {ticket.image_url && (
                          <img
                            src={ticket.image_url || "/placeholder.svg"}
                            alt="Attachment"
                            className="mb-3 max-h-40 rounded-lg"
                          />
                        )}
                        <Button size="sm" variant="outline" onClick={() => setSelectedTicket(ticket)} className="gap-1">
                          <Send className="h-4 w-4" />
                          {t("respond")}
                        </Button>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="resolved" className="space-y-4">
                  {resolvedTickets.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">{t("noTickets")}</p>
                  ) : (
                    resolvedTickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border border-border bg-muted p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                            <p className="text-sm text-muted-foreground">{ticket.user_email}</p>
                          </div>
                          <Badge variant="default">{ticket.status}</Badge>
                        </div>
                        <p className="mb-2 text-sm text-foreground">{ticket.message}</p>
                        {ticket.admin_response && (
                          <div className="mt-3 rounded-lg bg-primary/10 p-3">
                            <p className="text-sm font-medium text-primary">{t("adminResponse")}:</p>
                            <p className="text-sm text-foreground">{ticket.admin_response}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>

              {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <CardHeader>
                      <CardTitle>{t("respondToTicket")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t("subject")}:</p>
                        <p className="text-foreground">{selectedTicket.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t("message")}:</p>
                        <p className="text-foreground">{selectedTicket.message}</p>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">{t("yourResponse")}:</label>
                        <Textarea
                          value={adminResponse}
                          onChange={(e) => setAdminResponse(e.target.value)}
                          placeholder={t("typeResponse")}
                          rows={5}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSendResponse} disabled={!adminResponse.trim()} className="gap-1">
                          <Send className="h-4 w-4" />
                          {t("sendResponse")}
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                          {t("cancel")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground sm:text-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("userManagement")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">{t("user")}</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">{t("email")}</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">{t("password")}</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">{t("credits")}</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">{t("status")}</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          {t("noUsersFound")}
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="border-b border-border transition-colors hover:bg-muted/50">
                          <td className="py-4 text-sm text-foreground">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
                                {user.username[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{user.username}</span>
                                  {user.isAdmin && <AdminBadge />}
                                  {user.certified && user.showBadge && <CertifiedBadge size="sm" />}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">{user.email}</td>
                          <td className="py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">
                                {showPasswords[user.id] ? user.password : "••••••••"}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(user.id)}
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                {showPasswords[user.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 text-sm font-medium text-foreground">{user.credits || 0}</td>
                          <td className="py-4 text-sm">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                                user.isOnline ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500",
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  user.isOnline ? "bg-green-500" : "bg-gray-500",
                                )}
                              />
                              {user.isOnline ? t("online") : t("offline")}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant={user.certified ? "default" : "outline"}
                                onClick={() => handleToggleCertified(user.id, user.certified || false)}
                                className="gap-1"
                              >
                                <Award className="h-3 w-3" />
                                {user.certified ? "Retirer" : "Certifier"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUserHistory(user)}
                                className="gap-1"
                              >
                                <History className="h-3 w-3" />
                                Historique
                              </Button>
                              <Button
                                size="sm"
                                variant={user.isAdmin ? "destructive" : "secondary"}
                                onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                              >
                                {user.isAdmin ? "Retirer admin" : "Promouvoir"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                                Supprimer
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 lg:hidden">
                {users.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t("noUsersFound")}</p>
                ) : (
                  users.map((user) => (
                    <Card key={user.id} className="border-border bg-muted/50">
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-base font-medium text-primary">
                              {user.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-foreground">{user.username}</span>
                                {user.isAdmin && <AdminBadge />}
                                {user.certified && user.showBadge && <CertifiedBadge size="sm" />}
                              </div>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                              user.isOnline ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500",
                            )}
                          >
                            <span
                              className={cn("h-1.5 w-1.5 rounded-full", user.isOnline ? "bg-green-500" : "bg-gray-500")}
                            />
                            {user.isOnline ? "En ligne" : "Hors ligne"}
                          </span>
                        </div>

                        <div className="mb-3 space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Mot de passe:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">
                                {showPasswords[user.id] ? user.password : "••••••••"}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(user.id)}
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                {showPasswords[user.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Crédits:</span>
                            <span className="font-medium text-foreground">{user.credits || 0}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant={user.certified ? "default" : "outline"}
                            onClick={() => handleToggleCertified(user.id, user.certified || false)}
                            className="gap-1"
                          >
                            <Award className="h-3 w-3" />
                            {user.certified ? "Retirer" : "Certifier"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUserHistory(user)}
                            className="gap-1"
                          >
                            <History className="h-3 w-3" />
                            Historique
                          </Button>
                          <Button
                            size="sm"
                            variant={user.isAdmin ? "destructive" : "secondary"}
                            onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                            className="col-span-2"
                          >
                            {user.isAdmin ? "Retirer admin" : "Promouvoir admin"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.id)}
                            className="col-span-2"
                          >
                            Supprimer l'utilisateur
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {selectedUserHistory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    {t("chatHistory")} - {selectedUserHistory.username}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getUserHistory(selectedUserHistory.id).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">{t("noHistory")}</p>
                    ) : (
                      getUserHistory(selectedUserHistory.id).map((message: any, index: number) => (
                        <div
                          key={index}
                          className={cn(
                            "p-3 rounded-lg",
                            message.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8",
                          )}
                        >
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            {message.role === "user" ? t("user") : t("assistant")}
                          </p>
                          <p className="text-sm text-foreground">{message.content}</p>
                          {message.timestamp && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setSelectedUserHistory(null)} className="mt-4 w-full">
                    {t("close")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
