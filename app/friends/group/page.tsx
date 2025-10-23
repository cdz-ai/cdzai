"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Send, ArrowLeft, Sparkles, Users } from "lucide-react"
import { getUser } from "@/lib/auth"
import { getGroups, getGroupMessages, sendGroupMessage } from "@/lib/social"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import type { GroupMessage, Group } from "@/types"

export default function GroupChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get("groupId")
  const { t } = useLanguage()

  const [user, setUser] = useState(getUser())
  const [group, setGroup] = useState<Group | null>(null)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    if (!groupId) {
      router.push("/friends")
      return
    }

    const groups = getGroups(user.id)
    const foundGroup = groups.find((g) => g.id === groupId)
    if (!foundGroup) {
      router.push("/friends")
      return
    }

    setGroup(foundGroup)
    setMessages(getGroupMessages(groupId))
  }, [user, groupId, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !user || !group) return

    if (input.trim().startsWith("/ai ")) {
      const aiPrompt = input.trim().substring(4)
      setLoading(true)

      const userMsg = sendGroupMessage(group.id, user.id, input, false)
      setMessages((prev) => [...prev, userMsg])
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

        const aiMsg = sendGroupMessage(group.id, "AI", aiContent, true)
        setMessages((prev) => [...prev, aiMsg])
      } catch (error) {
        console.error("[v0] AI error:", error)
        const errorMsg = sendGroupMessage(group.id, "AI", t("errorOccurred"), true)
        setMessages((prev) => [...prev, errorMsg])
      }

      setLoading(false)
    } else {
      const msg = sendGroupMessage(group.id, user.id, input, false)
      setMessages((prev) => [...prev, msg])
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!group) return null

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/friends")} className="flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{group.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {group.memberIds.length} {t("members")}
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
              <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                    msg.isAI
                      ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                      : msg.senderId === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                  }`}
                >
                  {!msg.isAI && msg.senderId !== user?.id && (
                    <p className="mb-1 text-xs font-semibold opacity-70">
                      {msg.senderId === user?.id ? user.username : `User ${msg.senderId.slice(0, 6)}`}
                    </p>
                  )}
                  {!msg.isAI && msg.senderId === user?.id && (
                    <p className="mb-1 text-xs font-semibold opacity-70">{user.username}</p>
                  )}
                  {msg.isAI && (
                    <div className="mb-1 flex items-center gap-1 text-xs text-purple-400">
                      <Sparkles className="h-3 w-3" />
                      <span>AI (Groq)</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{msg.content}</p>
                  <p className="mt-1 text-xs opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</p>
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
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("typeMessage")}
              disabled={loading}
              className="flex-1 text-sm sm:text-base"
            />
            <Button onClick={handleSend} disabled={!input.trim() || loading} className="flex-shrink-0">
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
