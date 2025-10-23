"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Send, ArrowLeft, Sparkles, ImageIcon, Mic, X } from "lucide-react"
import { getUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import { getSupabase } from "@/lib/supabase-client"

interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string | null
  message_type: "text" | "image" | "voice"
  media_url: string | null
  is_ai: boolean
  created_at: string
}

interface FriendInfo {
  id: string
  username: string
  friend_code: string
  is_online: boolean
  is_typing: boolean
}

export default function FriendChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const friendId = searchParams.get("friendId")
  const { t } = useLanguage()
  const supabase = getSupabase()

  const [user, setUser] = useState(getUser())
  const [friend, setFriend] = useState<FriendInfo | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user || !friendId) {
      router.push("/login")
      return
    }

    loadFriendInfo()
    loadMessages()
    updateOnlineStatus(true)

    const messagesChannel = supabase
      .channel("direct_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id}))`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DirectMessage])
        },
      )
      .subscribe()

    const statusChannel = supabase
      .channel("user_status_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_status",
          filter: `user_id.eq.${friendId}`,
        },
        (payload) => {
          const status = payload.new as { is_online: boolean; is_typing_to: string | null }
          setFriend((prev) =>
            prev
              ? {
                  ...prev,
                  is_online: status.is_online,
                  is_typing: status.is_typing_to === user.id,
                }
              : null,
          )
        },
      )
      .subscribe()

    return () => {
      updateOnlineStatus(false)
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(statusChannel)
    }
  }, [user, friendId, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadFriendInfo = async () => {
    if (!friendId) return

    const { data: friendData } = await supabase
      .from("users")
      .select("id, username, friend_code")
      .eq("id", friendId)
      .single()

    const { data: statusData } = await supabase
      .from("user_status")
      .select("is_online, is_typing_to")
      .eq("user_id", friendId)
      .single()

    if (friendData) {
      setFriend({
        id: friendData.id,
        username: friendData.username,
        friend_code: friendData.friend_code,
        is_online: statusData?.is_online || false,
        is_typing: statusData?.is_typing_to === user?.id,
      })
    }
  }

  const loadMessages = async () => {
    if (!user || !friendId) return

    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`,
      )
      .order("created_at", { ascending: true })

    setMessages(data || [])
  }

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return
    await supabase.from("user_status").upsert({
      user_id: user.id,
      is_online: isOnline,
      last_seen: new Date().toISOString(),
    })
  }

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user || !friendId) return
    await supabase.from("user_status").upsert({
      user_id: user.id,
      is_typing_to: isTyping ? friendId : null,
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)

    updateTypingStatus(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false)
    }, 2000)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadFile = async (file: File, type: "image" | "voice"): Promise<string | null> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${user?.id}_${Date.now()}.${fileExt}`
    const filePath = `${type}s/${fileName}`

    const { error: uploadError } = await supabase.storage.from("chat-media").upload(filePath, file)

    if (uploadError) {
      console.error("[v0] Upload error:", uploadError)
      return null
    }

    const { data } = supabase.storage.from("chat-media").getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        const file = new File([blob], "voice.webm", { type: "audio/webm" })

        const mediaUrl = await uploadFile(file, "voice")

        if (mediaUrl && user && friendId) {
          await supabase.from("direct_messages").insert({
            sender_id: user.id,
            receiver_id: friendId,
            content: "[Message vocal]",
            message_type: "voice",
            media_url: mediaUrl,
            is_ai: false,
          })
        }

        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error("[v0] Error accessing microphone:", error)
      alert("Impossible d'accéder au microphone")
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && !imagePreview) || !user || !friendId) return

    updateTypingStatus(false)

    if (imagePreview && imageFile) {
      const mediaUrl = await uploadFile(imageFile, "image")

      if (mediaUrl) {
        await supabase.from("direct_messages").insert({
          sender_id: user.id,
          receiver_id: friendId,
          content: input.trim() || "[Image]",
          message_type: "image",
          media_url: mediaUrl,
          is_ai: false,
        })
      }

      setInput("")
      setImageFile(null)
      setImagePreview(null)
      return
    }

    if (input.trim().startsWith("/ai ")) {
      const aiPrompt = input.trim().substring(4)
      setLoading(true)

      await supabase.from("direct_messages").insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: input,
        message_type: "text",
        is_ai: false,
      })

      setInput("")

      const startTime = Date.now()

      try {
        const response = await fetch("/api/groq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: aiPrompt }],
            model: "llama-3.3-70b-versatile",
          }),
        })

        if (!response.ok) throw new Error("Groq API error")

        const data = await response.json()
        const responseTime = Date.now() - startTime
        const aiContent = `${data.content}\n\n⏱️ ${t("respondedIn")} ${(responseTime / 1000).toFixed(2)}s`

        await supabase.from("direct_messages").insert({
          sender_id: user.id,
          receiver_id: friendId,
          content: aiContent,
          message_type: "text",
          is_ai: true,
        })
      } catch (error) {
        console.error("[v0] AI error:", error)
        await supabase.from("direct_messages").insert({
          sender_id: user.id,
          receiver_id: friendId,
          content: t("errorOccurred"),
          message_type: "text",
          is_ai: true,
        })
      }

      setLoading(false)
    } else {
      await supabase.from("direct_messages").insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: input,
        message_type: "text",
        is_ai: false,
      })

      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!friend) return null

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/friends")} className="flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            {friend.username[0].toUpperCase()}
            {friend.is_online && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{friend.username}</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {friend.is_typing ? t("typing") : friend.is_online ? t("online") : t("offline")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-muted-foreground">{t("noMessages")}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 sm:max-w-[70%] sm:px-4 sm:py-3 ${
                    msg.is_ai
                      ? "border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                      : msg.sender_id === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                  }`}
                >
                  {msg.is_ai && (
                    <div className="mb-1 flex items-center gap-1 text-xs text-purple-400">
                      <Sparkles className="h-3 w-3" />
                      <span>AI (Groq)</span>
                    </div>
                  )}
                  {msg.message_type === "image" && msg.media_url && (
                    <img src={msg.media_url || "/placeholder.svg"} alt="Shared" className="mb-2 max-h-60 rounded-lg" />
                  )}
                  {msg.message_type === "voice" && msg.media_url && (
                    <audio controls className="mb-2 w-full max-w-xs">
                      <source src={msg.media_url} type="audio/webm" />
                    </audio>
                  )}
                  {msg.content && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed sm:text-base">{msg.content}</p>
                  )}
                  <p className="mt-1 text-xs opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card p-3 sm:p-4">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-xs text-muted-foreground">{t("useAiCommand")}</p>

          {imagePreview && (
            <div className="relative mb-2 inline-block">
              <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-h-32 rounded-lg border" />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
                onClick={() => {
                  setImageFile(null)
                  setImagePreview(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={loading || isRecording}
              className="flex-shrink-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>

            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={loading}
              className="flex-shrink-0"
            >
              <Mic className="h-4 w-4" />
            </Button>

            <Input
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t("typeMessage")}
              disabled={loading || isRecording}
              className="flex-1 text-sm sm:text-base"
            />
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !imagePreview) || loading || isRecording}
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
