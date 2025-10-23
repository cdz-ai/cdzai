"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Zap, Plus } from "lucide-react"
import { getUser } from "@/lib/auth"
import { sendMultiAIMessage, PROVIDER_MODELS, type MultiAIProvider } from "@/lib/multi-ai"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { AIChatInput } from "@/components/ai-chat-input"
import { useLanguage } from "@/components/language-provider"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function AIChatPage() {
  const router = useRouter()
  const [user, setUser] = useState(getUser())
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<MultiAIProvider>("groq")
  const [model, setModel] = useState("llama-3.3-70b-versatile")
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { theme } = useTheme()
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  useEffect(() => {
    const defaultModel = PROVIDER_MODELS[provider][0].value
    setModel(defaultModel)
  }, [provider])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    setIsStreaming(true)
    setStreamingContent("")

    abortControllerRef.current = new AbortController()

    try {
      const { stream } = await sendMultiAIMessage(
        [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        provider,
        model,
      )

      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""

      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          reader.cancel()
          break
        }

        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullContent += content
                setStreamingContent(fullContent)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setIsStreaming(false)
      setStreamingContent("")

      const assistantMessage: Message = {
        role: "assistant",
        content: fullContent || t("generationStopped"),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error:", error)
      setIsStreaming(false)
      setStreamingContent("")
      setLoading(false)

      const errorMessage: Message = {
        role: "assistant",
        content: `${t("error")}: ${error instanceof Error ? error.message : t("errorOccurred")}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsStreaming(false)
    setLoading(false)

    if (streamingContent) {
      const assistantMessage: Message = {
        role: "assistant",
        content: streamingContent + "\n\n" + t("generationStopped"),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent("")
    }
  }

  const startNewChat = () => {
    setMessages([])
    setInput("")
    setFiles([])
    setImageUrl("")
  }

  const handleStartRecording = () => {
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
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
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <div className={cn("rounded-lg bg-gradient-to-br p-2", getThemeColor())}>
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{t("aiChatMultiProvider")}</h1>
            <p className="text-xs text-muted-foreground">Groq • OpenAI • Mistral • AIMLAPI</p>
          </div>
          <button
            onClick={startNewChat}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
            title={t("newChat")}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("new")}</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-8">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 py-12">
                <div className="max-w-2xl text-center">
                  <div className="flex justify-center">
                    <div className={cn("rounded-full bg-gradient-to-br p-6 opacity-20", getThemeColor())}>
                      <Zap className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <div className="mt-6">
                    <h2 className="text-3xl font-bold text-foreground">{t("aiChatMultiProvider")}</h2>
                    <p className="mt-3 text-lg text-muted-foreground">{t("chooseProviderStart")}</p>
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
                      <div className="max-w-[85%] rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-lg">
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                    ) : (
                      <div className="max-w-[85%] rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <MarkdownRenderer content={message.content} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && streamingContent && (
                  <div className="flex justify-start animate-in fade-in">
                    <div className="max-w-[85%] rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={streamingContent} />
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex gap-1">
                          <div
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                        <span>{t("generatingInProgress")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {loading && !isStreaming && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-primary"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-primary"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-primary"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{t("connecting")}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Select value={provider} onValueChange={(value) => setProvider(value as MultiAIProvider)}>
                <SelectTrigger className="w-36 border-border bg-card text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="mistral">Mistral</SelectItem>
                  <SelectItem value="aimlapi">AIMLAPI</SelectItem>
                </SelectContent>
              </Select>

              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-56 border-border bg-card text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_MODELS[provider].map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <AIChatInput
              input={input}
              setInput={setInput}
              loading={loading}
              isStreaming={isStreaming}
              isRecording={isRecording}
              files={files}
              imageUrl={imageUrl}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onSubmit={handleSubmit}
              onStopGeneration={handleStopGeneration}
              onFileUpload={(e) => {
                // TODO: Implement file upload
              }}
              onImageUpload={(e) => {
                // TODO: Implement image upload
              }}
              fileInputRef={fileInputRef}
              imageInputRef={imageInputRef}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
