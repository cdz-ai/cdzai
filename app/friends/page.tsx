"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, UserPlus, MessageCircle, Trash2, Check, X, Clock, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string | null
  receiver_code: string
  status: "pending" | "accepted" | "rejected"
  created_at: string
  sender?: {
    username: string
    user_code: string
  }
}

interface Friendship {
  id: string
  user_id: string
  friend_id: string
  friend?: {
    username: string
    user_code: string
    is_online: boolean
  }
}

interface CurrentUser {
  id: string
  email: string
  username: string
  user_code: string
}

export default function FriendsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [friends, setFriends] = useState<Friendship[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [friendCode, setFriendCode] = useState("")
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (!currentUser) return

    loadFriends()
    loadFriendRequests()

    const friendRequestsChannel = supabase
      .channel("friend_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
        },
        () => {
          loadFriendRequests()
        },
      )
      .subscribe()

    const friendshipsChannel = supabase
      .channel("friendships_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
        },
        () => {
          loadFriends()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(friendRequestsChannel)
      supabase.removeChannel(friendshipsChannel)
    }
  }, [currentUser])

  const loadCurrentUser = async () => {
    try {
      console.log("[v0] Loading current user...")
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("[v0] Auth error:", authError)
        setError("Erreur d'authentification. Veuillez vous reconnecter.")
        router.push("/login")
        return
      }

      if (!authUser) {
        console.log("[v0] No authenticated user found")
        router.push("/login")
        return
      }

      console.log("[v0] Auth user found:", authUser.id)

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (userError) {
        console.error("[v0] Error loading user profile:", userError)
        setError("Erreur lors du chargement du profil utilisateur.")
        setLoading(false)
        return
      }

      if (!userData) {
        console.error("[v0] User profile not found in database")
        setError("Profil utilisateur introuvable. Veuillez vous reconnecter.")
        router.push("/login")
        return
      }

      console.log("[v0] User profile loaded:", userData)
      setCurrentUser(userData)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error in loadCurrentUser:", error)
      setError("Une erreur est survenue. Veuillez réessayer.")
      setLoading(false)
    }
  }

  const loadFriends = async () => {
    if (!currentUser) return

    try {
      console.log("[v0] Loading friends for user:", currentUser.id)

      const { data: friendshipsData, error } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          friend:users!friendships_friend_id_fkey(username, user_code, is_online)
        `)
        .eq("user_id", currentUser.id)

      if (error) {
        console.error("[v0] Error loading friends:", error)
        setError("Erreur lors du chargement des amis.")
        return
      }

      console.log("[v0] Friends loaded:", friendshipsData)
      setFriends(friendshipsData || [])
    } catch (error) {
      console.error("[v0] Error in loadFriends:", error)
      setError("Erreur lors du chargement des amis.")
    }
  }

  const loadFriendRequests = async () => {
    if (!currentUser) return

    try {
      console.log("[v0] Loading friend requests for user:", currentUser.id)

      const { data: sentData, error: sentError } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("sender_id", currentUser.id)
        .order("created_at", { ascending: false })

      if (sentError) {
        console.error("[v0] Error loading sent requests:", sentError)
      } else {
        setSentRequests(sentData || [])
      }

      const { data: receivedData, error: receivedError } = await supabase
        .from("friend_requests")
        .select(`
          *,
          sender:users!friend_requests_sender_id_fkey(username, user_code)
        `)
        .eq("receiver_code", currentUser.user_code)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (receivedError) {
        console.error("[v0] Error loading received requests:", receivedError)
      } else {
        setReceivedRequests(receivedData || [])
      }
    } catch (error) {
      console.error("[v0] Error in loadFriendRequests:", error)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!currentUser || !friendCode || friendCode.length !== 5) return

    try {
      const { data: targetUser, error: findError } = await supabase
        .from("users")
        .select("id, user_code")
        .eq("user_code", friendCode)
        .single()

      if (findError || !targetUser) {
        alert(t("friendCodeNotFound") || "Code ami introuvable")
        return
      }

      if (targetUser.id === currentUser.id) {
        alert(t("cannotAddYourself") || "Vous ne pouvez pas vous ajouter vous-même")
        return
      }

      const { data: existingFriendship } = await supabase
        .from("friendships")
        .select("id")
        .or(
          `and(user_id.eq.${currentUser.id},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${currentUser.id})`,
        )
        .maybeSingle()

      if (existingFriendship) {
        alert(t("alreadyFriends") || "Vous êtes déjà amis")
        return
      }

      const { data: existingRequest } = await supabase
        .from("friend_requests")
        .select("id")
        .eq("sender_id", currentUser.id)
        .eq("receiver_code", friendCode)
        .eq("status", "pending")
        .maybeSingle()

      if (existingRequest) {
        alert(t("requestAlreadySent") || "Demande déjà envoyée")
        return
      }

      const { error: insertError } = await supabase.from("friend_requests").insert({
        sender_id: currentUser.id,
        receiver_id: targetUser.id,
        receiver_code: friendCode,
        status: "pending",
      })

      if (insertError) {
        console.error("[v0] Error sending friend request:", insertError)
        alert(t("errorSendingRequest") || "Erreur lors de l'envoi de la demande")
        return
      }

      setFriendCode("")
      setShowAddFriend(false)
      loadFriendRequests()
      alert(t("requestSent") || "Demande envoyée avec succès!")
    } catch (error) {
      console.error("[v0] Error in handleSendFriendRequest:", error)
      alert(t("errorSendingRequest") || "Erreur lors de l'envoi de la demande")
    }
  }

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!currentUser) return

    try {
      const { error: friendship1Error } = await supabase.from("friendships").insert({
        user_id: currentUser.id,
        friend_id: request.sender_id,
      })

      const { error: friendship2Error } = await supabase.from("friendships").insert({
        user_id: request.sender_id,
        friend_id: currentUser.id,
      })

      if (friendship1Error || friendship2Error) {
        console.error("[v0] Error creating friendship:", friendship1Error || friendship2Error)
        alert("Erreur lors de l'acceptation de la demande")
        return
      }

      await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", request.id)

      loadFriends()
      loadFriendRequests()
      alert("Demande acceptée!")
    } catch (error) {
      console.error("[v0] Error in handleAcceptRequest:", error)
      alert("Erreur lors de l'acceptation de la demande")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await supabase.from("friend_requests").update({ status: "rejected" }).eq("id", requestId)
      loadFriendRequests()
      alert("Demande rejetée")
    } catch (error) {
      console.error("[v0] Error in handleRejectRequest:", error)
      alert("Erreur lors du rejet de la demande")
    }
  }

  const handleRemoveFriend = async (friendship: Friendship) => {
    if (!confirm(t("confirmRemoveFriend") || "Supprimer cet ami ?")) return

    try {
      await supabase.from("friendships").delete().eq("id", friendship.id)
      await supabase.from("friendships").delete().eq("user_id", friendship.friend_id).eq("friend_id", currentUser?.id)

      loadFriends()
      alert("Ami supprimé")
    } catch (error) {
      console.error("[v0] Error in handleRemoveFriend:", error)
      alert("Erreur lors de la suppression de l'ami")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push("/login")} className="mt-4 w-full">
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t("friends") || "Amis"}</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {t("friendsSubtitle") || "Gérez vos amis et demandes"}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("yourId") || "Votre ID"}:</span>
              <code className="rounded-lg bg-muted px-3 py-1 text-base font-bold text-primary sm:text-lg">
                {currentUser.user_code}
              </code>
            </div>
          </div>
          <Button onClick={() => setShowAddFriend(!showAddFriend)} className="gap-2">
            <UserPlus className="h-5 w-5" />
            <span className="hidden sm:inline">{t("addFriend") || "Ajouter un ami"}</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>

        {showAddFriend && (
          <Card>
            <CardHeader>
              <CardTitle>{t("addFriendByCode") || "Ajouter un ami par code"}</CardTitle>
              <CardDescription>{t("enterFriendCode") || "Entrez le code à 5 chiffres de votre ami"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder={t("friendCode5Digits") || "Code à 5 chiffres"}
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                maxLength={5}
                className="text-center text-xl font-bold tracking-widest sm:text-2xl"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleSendFriendRequest} disabled={friendCode.length !== 5} className="gap-2">
                  <Send className="h-4 w-4" />
                  {t("sendRequest") || "Envoyer"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddFriend(false)}>
                  {t("cancel") || "Annuler"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">{t("myFriends") || "Mes amis"}</span>
              <span className="sm:hidden">Amis</span> ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">{t("received") || "Reçues"}</span>
              <span className="sm:hidden">Reçues</span> ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">{t("sent") || "Envoyées"}</span>
              <span className="sm:hidden">Envoyées</span> ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("myFriends") || "Mes amis"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground sm:text-base">
                    {t("noFriends") || "Aucun ami pour le moment"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friendship) => (
                      <div
                        key={friendship.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                              {friendship.friend?.username?.[0]?.toUpperCase() || "?"}
                            </div>
                            {friendship.friend?.is_online && (
                              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground sm:text-base">
                              {friendship.friend?.username || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                              ID: {friendship.friend?.user_code || "00000"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/friends/chat?friendId=${friendship.friend_id}`)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRemoveFriend(friendship)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received">
            <Card>
              <CardHeader>
                <CardTitle>{t("receivedRequests") || "Demandes reçues"}</CardTitle>
              </CardHeader>
              <CardContent>
                {receivedRequests.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground sm:text-base">
                    {t("noReceivedRequests") || "Aucune demande reçue"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {receivedRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground sm:text-base">
                            {request.sender?.username || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            ID: {request.sender?.user_code || "00000"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request)}
                            className="flex-1 gap-1 sm:flex-none"
                          >
                            <Check className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">{t("accept") || "Accepter"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex-1 gap-1 sm:flex-none"
                          >
                            <X className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">{t("reject") || "Refuser"}</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent">
            <Card>
              <CardHeader>
                <CardTitle>{t("sentRequests") || "Demandes envoyées"}</CardTitle>
              </CardHeader>
              <CardContent>
                {sentRequests.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground sm:text-base">
                    {t("noSentRequests") || "Aucune demande envoyée"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sentRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground sm:text-base">
                            {t("to") || "À"}: {request.receiver_code}
                          </p>
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === "accepted"
                              ? "default"
                              : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="gap-1"
                        >
                          {request.status === "pending" && <Clock className="h-3 w-3" />}
                          {request.status === "accepted" && <Check className="h-3 w-3" />}
                          {request.status === "rejected" && <X className="h-3 w-3" />}
                          <span className="text-xs">{t(request.status) || request.status}</span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
