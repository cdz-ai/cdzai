"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Paperclip, Edit2, Check, X, Plus, ExternalLink } from "lucide-react"
import { getUser } from "@/lib/auth"
import { sendMessage, stopGeneration } from "@/lib/ai"
import { getChatSession, getChatSessions, saveChatSession } from "@/lib/storage"
import { Sidebar } from "@/components/sidebar"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { AIChatInput } from "@/components/ai-chat-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "@/components/theme-provider"
import { useLanguage } from "@/components/language-provider"
import type { AIModel, Message, ChatSession, UploadedFile } from "@/types"
import { toast } from "sonner"

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionIdParam = searchParams.get("session")

  const [user, setUser] = useState(getUser())
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [model, setModel] = useState<AIModel>("groq") // Default to Groq for better performance
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const [sessionId, setSessionId] = useState(() => sessionIdParam || Math.random().toString(36).substr(2, 9))
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [dataPolicyError, setDataPolicyError] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { theme } = useTheme()
  const { t, language } = useLanguage()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  useEffect(() => {
    if (sessionIdParam && user) {
      const session = getChatSession(sessionIdParam)
      if (session && session.userId === user.id) {
        setMessages(session.messages)
        setModel(session.model)
        setSessionId(session.id)
      }
    } else if (user && !sessionIdParam) {
      const sessions = getChatSessions()
      const userSessions = sessions.filter((s) => s.userId === user.id)
      if (userSessions.length > 0 && !user.isGuest) {
        const lastSession = userSessions[userSessions.length - 1]
        setMessages(lastSession.messages)
        setModel(lastSession.model)
      } else if (user.isAdmin) {
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: t("adminWelcome"),
            timestamp: new Date(),
          },
        ])
      }
    }
  }, [user, sessionIdParam, t])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [input])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles) return

    const newFiles: UploadedFile[] = []

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]

      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          newFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            content: base64,
          })
          if (newFiles.length === uploadedFiles.length) {
            setFiles([...files, ...newFiles])
          }
        }
        reader.readAsDataURL(file)
      } else {
        const content = await file.text()
        newFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content,
        })
      }
    }

    if (
      newFiles.length === uploadedFiles.length &&
      !Array.from(uploadedFiles).some((f) => f.type.startsWith("image/"))
    ) {
      setFiles([...files, ...newFiles])
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setImageUrl(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !imageUrl) || loading || !user) return

    setDataPolicyError(false)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input || t("imageDescription"),
      timestamp: new Date(),
      files: files.length > 0 ? files : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    const currentImageUrl = imageUrl
    const currentFiles = [...files]
    const currentModel = model
    setImageUrl("")
    setFiles([])
    setLoading(true)
    setIsStreaming(true)
    setStreamingContent("")

    const modelsToTry: AIModel[] = [currentModel]

    if (currentModel === "llama") {
      modelsToTry.push("deepseek-r1", "deepseek", "gemini")
    } else if (currentModel === "deepseek") {
      modelsToTry.push("deepseek-r1", "gemini", "llama")
    } else if (currentModel === "deepseek-r1") {
      modelsToTry.push("deepseek", "gemini", "llama")
    } else if (currentModel === "gemini") {
      modelsToTry.push("deepseek-r1", "deepseek", "llama")
    } else if (currentModel === "deepseek-r1-chimera") {
      modelsToTry.push("deepseek-r1", "deepseek", "gemini", "llama")
    } else {
      modelsToTry.push("deepseek-r1-chimera", "deepseek-r1", "deepseek", "gemini")
    }

    let lastError: Error | null = null

    for (const tryModel of modelsToTry) {
      try {
        const { stream, responseTime } = await sendMessage(
          [...messages, userMessage],
          tryModel,
          currentFiles,
          currentImageUrl,
        )

        if (stream) {
          const reader = stream.getReader()
          const decoder = new TextDecoder()
          let fullContent = ""

          while (true) {
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

          let mainContent = fullContent
          let followUpQuestions: string[] = []

          if (fullContent.includes("Questions de suivi:")) {
            const parts = fullContent.split("Questions de suivi:")
            mainContent = parts[0].trim()
            const questionsText = parts[1].trim()
            followUpQuestions = questionsText
              .split("\n")
              .filter((q) => q.trim())
              .map((q) => q.replace(/^[-*]\s*/, "").trim())
              .slice(0, 3)
          }

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: mainContent,
            timestamp: new Date(),
            responseTime,
            followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined,
          }

          setMessages((prev) => [...prev, assistantMessage])

          const session: ChatSession = {
            id: sessionId,
            userId: user.id,
            messages: [...messages, userMessage, assistantMessage],
            model: tryModel,
            createdAt: new Date(),
          }
          saveChatSession(session)

          if (tryModel !== currentModel) {
            setModel(tryModel)
          }

          setLoading(false)
          return
        }
      } catch (error) {
        console.error(`[v0] Error with ${tryModel}:`, error)
        lastError = error as Error

        if (lastError.message.includes("politique de rétention de données")) {
          setDataPolicyError(true)
        }

        if (lastError.message.includes("Limite quotidienne atteinte")) {
          setIsStreaming(false)
          setStreamingContent("")
          setLoading(false)

          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: lastError.message,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, errorMessage])
          return
        }

        if (tryModel !== modelsToTry[modelsToTry.length - 1]) {
          console.log(`[v0] Trying fallback model...`)
          continue
        }
      }
    }

    setIsStreaming(false)
    setStreamingContent("")
    setLoading(false)

    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: lastError?.message || t("allModelsUnavailable"),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, errorMessage])
  }

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditedContent(content)
  }

  const handleSaveEdit = (messageId: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, content: editedContent } : msg)))
    setEditingMessageId(null)
    setEditedContent("")
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditedContent("")
  }

  const toggleSources = (messageId: string) => {
    setExpandedSources((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const startVoiceRecording = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error(t("voiceNotSupported"))
      return
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          const recognition = new SpeechRecognition()

          recognition.lang = language === "fr" ? "fr-FR" : language === "ko" ? "ko-KR" : "en-US"
          recognition.continuous = true // Keep listening until manually stopped
          recognition.interimResults = true // Show interim results for better feedback
          recognition.maxAlternatives = 1

          let finalTranscript = ""
          let interimTranscript = ""

          recognition.onstart = () => {
            console.log("[v0] Voice recording started")
            setIsRecording(true)
            toast.success(t("voiceRecordingStarted") || "Recording started... Speak now!")
          }

          recognition.onresult = (event: any) => {
            interimTranscript = ""

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript

              if (event.results[i].isFinal) {
                finalTranscript += transcript + " "
                console.log("[v0] Final transcript:", transcript)
              } else {
                interimTranscript += transcript
                console.log("[v0] Interim transcript:", transcript)
              }
            }

            // Update input with both final and interim results
            const fullTranscript = finalTranscript + interimTranscript
            if (fullTranscript.trim()) {
              setInput(fullTranscript.trim())
            }
          }

          recognition.onerror = (event: any) => {
            console.error("[v0] Speech recognition error:", event.error)

            if (event.error === "no-speech") {
              toast.warning(t("voiceNoSpeech") || "No speech detected yet. Keep speaking...")
              // Don't stop recording, let user continue
              return
            }

            setIsRecording(false)

            if (event.error === "not-allowed" || event.error === "permission-denied") {
              toast.error(
                t("voicePermissionDenied") ||
                  "Microphone permission denied. Please allow microphone access in your browser settings.",
              )
            } else if (event.error === "network") {
              toast.error(t("voiceNetworkError") || "Network error. Please check your connection.")
            } else if (event.error === "aborted") {
              toast.info(t("voiceRecordingStopped") || "Recording stopped")
            } else {
              toast.error(t("voiceError") || `Voice recognition error: ${event.error}. Please try again.`)
            }
          }

          recognition.onend = () => {
            console.log("[v0] Voice recording ended")
            setIsRecording(false)

            // Save the final transcript
            if (finalTranscript.trim()) {
              setInput(finalTranscript.trim())
              toast.success(t("voiceRecordingComplete") || "Recording complete!")
            }
          }

          recognitionRef.current = recognition
          recognition.start()
        } catch (error) {
          console.error("[v0] Failed to start voice recognition:", error)
          toast.error(t("voiceError") || "Failed to start voice recognition")
          setIsRecording(false)
        }
      })
      .catch((error) => {
        console.error("[v0] Microphone permission denied:", error)
        toast.error(
          t("voicePermissionDenied") ||
            "Microphone access denied. Please allow microphone access in your browser settings.",
        )
      })
  }

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        console.log("[v0] Manually stopped voice recording")
      } catch (error) {
        console.error("[v0] Error stopping voice recognition:", error)
        setIsRecording(false)
      }
    }
  }

  const startNewChat = () => {
    setMessages([])
    setInput("")
    setFiles([])
    setImageUrl("")
    setSessionId(Math.random().toString(36).substr(2, 9))
    router.push("/chat")
  }

  const handleStopGeneration = () => {
    console.log("[v0] Stopping generation...")
    stopGeneration()
    setIsStreaming(false)
    setStreamingContent("")
    setLoading(false)

    if (streamingContent) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: streamingContent + "\n\n" + t("generationStopped"),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    }
  }

  const getThemeColor = () => {
    switch (theme) {
      case "green":
        return "from-green-500/90 to-green-600"
      case "blue":
        return "from-blue-500/90 to-blue-600"
      case "pink":
        return "from-pink-500/90 to-pink-600"
      case "turquoise":
        return "from-cyan-500/90 to-cyan-600"
      default:
        return "from-primary/90 to-primary"
    }
  }

  const suggestedPrompts = [t("createImage"), t("analyzeData"), t("helpMeCode"), t("explainConcept")]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <main className="flex flex-1 flex-col overflow-hidden">
          {dataPolicyError && (
            <div className="border-b border-red-500/20 bg-red-500/10 px-3 sm:px-4 py-2 sm:py-3">
              <div className="mx-auto max-w-4xl">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 text-red-500">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L8.586 10l-1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-red-500">{t("dataPolicyErrorTitle")}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-red-400 break-words">{t("dataPolicyErrorMessage")}</p>
                    <a
                      href="https://openrouter.ai/settings/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-red-500 hover:text-red-400 underline"
                    >
                      {t("configureOpenRouter")}
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                  </div>
                  <button
                    onClick={() => setDataPolicyError(false)}
                    className="flex-shrink-0 text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
                  <div className="max-w-2xl text-center">
                    <div className="flex justify-center">
                      <div className={`rounded-full bg-gradient-to-br ${getThemeColor()} p-4 sm:p-5 md:p-6 opacity-20`}>
                        <div className="text-4xl sm:text-5xl md:text-6xl">✦</div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-6">
                      <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-foreground">
                        {t("welcomeTitle")}
                      </h2>
                      <p className="mt-2 sm:mt-3 text-base sm:text-lg text-muted-foreground px-2">
                        {t("welcomeSubtitle")}
                      </p>
                      {user?.isGuest && (
                        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                          {t("guestMode")} -{" "}
                          <button onClick={() => router.push("/login")} className="text-primary hover:underline">
                            {t("signIn")}
                          </button>
                        </p>
                      )}
                    </div>
                    <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
                      {suggestedPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(prompt)}
                          className="rounded-lg sm:rounded-xl border border-border bg-card px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-card-foreground transition-all hover:bg-accent"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${message.role === "user" ? "flex justify-end" : "flex justify-start"}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {message.role === "user" ? (
                        <div
                          className={`group relative max-w-[85%] rounded-2xl bg-gradient-to-br ${getThemeColor()} px-5 py-4 text-white shadow-lg`}
                        >
                          {editingMessageId === message.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full rounded-lg bg-white/10 px-3 py-2 text-white outline-none"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveEdit(message.id)}
                                  className="rounded-lg bg-white/20 p-2 hover:bg-white/30"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="rounded-lg bg-white/20 p-2 hover:bg-white/30"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              <button
                                onClick={() => handleEditMessage(message.id, message.content)}
                                className="absolute right-2 top-2 hidden rounded-lg bg-white/10 p-1.5 hover:bg-white/20 group-hover:block"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {message.files && message.files.length > 0 && (
                            <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
                              {message.files.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs opacity-80">
                                  <Paperclip className="h-3 w-3" />
                                  <span>{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="max-w-[85%] space-y-3">
                          <div className="prose prose-invert max-w-none dark:prose-invert">
                            <MarkdownRenderer content={message.content} />
                          </div>

                          {message.responseTime && (
                            <div className="text-xs text-muted-foreground">
                              {t("respondedIn", { ms: message.responseTime })}
                            </div>
                          )}

                          {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">{t("suggestedQuestions")}</p>
                              <div className="flex flex-wrap gap-2">
                                {message.followUpQuestions.map((question, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setInput(question)}
                                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-card-foreground transition-all hover:bg-accent"
                                  >
                                    {question}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {message.sources && message.sources.length > 0 && (
                            <div className="rounded-lg border border-border bg-card">
                              <button
                                onClick={() => toggleSources(message.id)}
                                className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-card-foreground hover:text-foreground"
                              >
                                <span>{t("sources", { count: message.sources.length })}</span>
                                <span>{expandedSources.has(message.id) ? "▼" : "▶"}</span>
                              </button>
                              {expandedSources.has(message.id) && (
                                <div className="space-y-2 border-t border-border p-4">
                                  {message.sources.map((source, i) => (
                                    <a
                                      key={i}
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent"
                                    >
                                      <div className="font-medium text-foreground">{source.title}</div>
                                      <div className="mt-1 text-xs text-muted-foreground">{source.snippet}</div>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {isStreaming && streamingContent && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4">
                      <div className="max-w-[85%] space-y-3">
                        <div className="prose prose-invert max-w-none dark:prose-invert">
                          <MarkdownRenderer content={streamingContent} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                          <span>{t("aiWriting")}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {loading && !isStreaming && (
                    <div className="flex justify-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
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
                          <span className="ml-2 text-sm text-muted-foreground">{t("aiThinking")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="mx-auto max-w-4xl px-4 py-4 sm:py-6">
              <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
                <Select value={model} onValueChange={(value) => setModel(value as AIModel)}>
                  <SelectTrigger className="w-48 sm:w-60 border-border bg-card text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="groq">{t("modelGroq")}</SelectItem>
                    <SelectItem value="deepseek-r1-chimera">{t("modelDeepSeekChimera")}</SelectItem>
                    <SelectItem value="deepseek-r1">{t("modelDeepSeekR1")}</SelectItem>
                    <SelectItem value="deepseek">{t("modelDeepSeek")}</SelectItem>
                    <SelectItem value="gemini">{t("modelGemini")}</SelectItem>
                    <SelectItem value="llama">{t("modelLlama")}</SelectItem>
                    <SelectItem value="gpt-4">{t("modelGPT4")}</SelectItem>
                  </SelectContent>
                </Select>

                <button
                  onClick={startNewChat}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
                  title={t("newChat")}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("newChat")}</span>
                </button>
              </div>

              {(files.length > 0 || imageUrl) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground truncate max-w-[150px]">{file.name}</span>
                      <button
                        onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {imageUrl && (
                    <div className="relative">
                      <img
                        src={imageUrl || "/placeholder.svg"}
                        alt="Upload preview"
                        className="h-20 w-20 rounded-lg border border-border object-cover"
                      />
                      <button
                        onClick={() => setImageUrl("")}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-foreground hover:bg-accent"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}

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
