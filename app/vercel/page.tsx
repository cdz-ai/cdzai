"use client"

import type React from "react"
import { AIChatInput } from "@/components/ai-chat-input"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2 } from "lucide-react"
import { getUser } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { useTheme } from "@/components/theme-provider"
import { useLanguage } from "@/components/language-provider"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { UploadedFile } from "@/types"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function VercelPage() {
  const router = useRouter()
  const [user, setUser] = useState(getUser())
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { theme } = useTheme()
  const { t } = useLanguage()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    setIsStreaming(true)
    setStreamingContent("")

    try {
      console.log("[v0] Sending request to v0 API...")

      const response = await fetch("https://api.v0.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer v1:LpPdOxzX0nQnJ3vfcA4PfSsz:kaxBb5oObyhYnlJWCoy4ThhT",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "v0-1.5-md",
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API error:", response.status, errorText)
        throw new Error(`API error: ${response.status} ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim()
              if (data === "[DONE]") continue
              if (!data) continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  fullContent += content
                  setStreamingContent(fullContent)
                }
              } catch (e) {
                console.error("[v0] Failed to parse chunk:", data)
              }
            }
          }
        }
      }

      console.log("[v0] Stream completed, full content length:", fullContent.length)

      setIsStreaming(false)
      setStreamingContent("")

      const assistantMessage: Message = {
        role: "assistant",
        content: fullContent || t("noResponseGenerated"),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[v0] Error:", error)
      setIsStreaming(false)
      setStreamingContent("")
      const errorMessage: Message = {
        role: "assistant",
        content: t("vercelApiError"),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder for file upload
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder for image upload
  }

  const startVoiceRecording = () => {
    // Placeholder for voice recording
  }

  const stopVoiceRecording = () => {
    // Placeholder for voice recording
  }

  const handleStopGeneration = () => {
    setLoading(false)
    setIsStreaming(false)
    setStreamingContent("")

    if (streamingContent) {
      const assistantMessage: Message = {
        role: "assistant",
        content: streamingContent + "\n\n" + t("generationStopped"),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent("")
    }
  }

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

  if (!user) return null

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
            <div className={cn("rounded-lg bg-gradient-to-br p-2", getThemeColor())}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{t("vercelV0Ai")}</h1>
              <p className="text-xs text-muted-foreground">{t("poweredByV0")}</p>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 py-8">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 py-12">
                  <div className="max-w-2xl text-center">
                    <div className="flex justify-center">
                      <div className={cn("rounded-full bg-gradient-to-br p-6 opacity-20", getThemeColor())}>
                        <Sparkles className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div className="mt-6">
                      <h2 className="text-3xl font-bold text-foreground">{t("vercelV0Ai")}</h2>
                      <p className="mt-3 text-lg text-muted-foreground">{t("experimentWithV0Api")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "animate-in fade-in slide-in-from-bottom-4 duration-500",
                        message.role === "user" ? "flex justify-end" : "flex justify-start",
                      )}
                    >
                      {message.role === "user" ? (
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl bg-gradient-to-br px-5 py-4 text-white shadow-lg",
                            getThemeColor(),
                          )}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>
                      ) : (
                        <div className="max-w-[85%]">
                          <Card className="border-border bg-card">
                            <CardContent className="p-4">
                              <div className="prose prose-invert max-w-none dark:prose-invert">
                                <MarkdownRenderer content={message.content} />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  ))}

                  {streamingContent && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4">
                      <div className="max-w-[85%]">
                        <Card className="border-border bg-card">
                          <CardContent className="p-4">
                            <div className="prose prose-invert max-w-none dark:prose-invert">
                              <MarkdownRenderer content={streamingContent} />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {loading && !streamingContent && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">{t("aiThinking")}</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="mx-auto max-w-4xl px-4 py-4">
              <AIChatInput
                input={input}
                setInput={setInput}
                loading={loading}
                isStreaming={isStreaming}
                isRecording={isRecording}
                files={files}
                imageUrl={imageUrl}
                onSubmit={handleSubmit}
                onFileUpload={handleFileUpload}
                onImageUpload={handleImageUpload}
                onStartRecording={startVoiceRecording}
                onStopRecording={stopVoiceRecording}
                onStopGeneration={handleStopGeneration}
                fileInputRef={fileInputRef}
                imageInputRef={imageInputRef}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
