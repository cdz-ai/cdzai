"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { Paperclip, ImageIcon, Globe, Mic, Square, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModernChatInputProps {
  input: string
  setInput: (value: string) => void
  loading: boolean
  isStreaming: boolean
  isRecording?: boolean
  files?: any[]
  imageUrl?: string
  onSubmit: (e: React.FormEvent) => void
  onStopGeneration?: () => void
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onStartRecording?: () => void
  onStopRecording?: () => void
  fileInputRef?: React.RefObject<HTMLInputElement>
  imageInputRef?: React.RefObject<HTMLInputElement>
  theme?: string
}

export function ModernChatInput({
  input,
  setInput,
  loading,
  isStreaming,
  isRecording = false,
  files = [],
  imageUrl = "",
  onSubmit,
  onStopGeneration,
  onFileUpload,
  onImageUpload,
  onStartRecording,
  onStopRecording,
  fileInputRef,
  imageInputRef,
  theme = "blue",
}: ModernChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = "fr-FR"

        recognitionInstance.onresult = (event: any) => {
          let interimTranscript = ""
          let finalTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " "
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            setInput((prev) => prev + finalTranscript)
          }
        }

        recognitionInstance.onerror = (event: any) => {
          console.error("[v0] Speech recognition error:", event.error)
          if (onStopRecording) onStopRecording()
        }

        setRecognition(recognitionInstance)
        setIsSpeechSupported(true)
        console.log("[v0] Speech recognition initialized successfully")
      } catch (error) {
        console.error("[v0] Failed to initialize speech recognition:", error)
        setIsSpeechSupported(false)
      }
    } else {
      console.log("[v0] Speech recognition not supported in this browser")
      setIsSpeechSupported(false)
    }
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150)
      textareaRef.current.style.height = newHeight + "px"
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !loading) {
        onSubmit(e)
      }
    }
  }

  const toggleVoiceRecording = () => {
    if (!isSpeechSupported || !recognition) {
      console.error("[v0] Speech recognition not available")
      alert("La reconnaissance vocale n'est pas disponible dans votre navigateur. Veuillez utiliser Chrome ou Edge.")
      return
    }

    try {
      if (isRecording) {
        console.log("[v0] Stopping voice recording")
        recognition.stop()
        if (onStopRecording) onStopRecording()
      } else {
        console.log("[v0] Starting voice recording")
        recognition.start()
        if (onStartRecording) onStartRecording()
      }
    } catch (error) {
      console.error("[v0] Error toggling voice recording:", error)
      alert("Erreur lors de l'enregistrement vocal. Veuillez réessayer.")
      if (onStopRecording) onStopRecording()
    }
  }

  return (
    <div className="relative space-y-3">
      <input type="file" ref={fileInputRef} onChange={onFileUpload} className="hidden" multiple />
      <input type="file" ref={imageInputRef} onChange={onImageUpload} accept="image/*" className="hidden" multiple />

      <div className="container_chat_bot">
        <div className="container-chat-options">
          <div className="chat">
            <div className="chat-bot">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Imagine Something...✦˚"
                disabled={loading}
                rows={1}
                className="w-full resize-none bg-transparent px-6 py-4 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
                style={{ minHeight: "60px", maxHeight: "150px" }}
              />
            </div>

            <div className="options">
              <div className="btns-add">
                <button
                  type="button"
                  onClick={() => fileInputRef?.current?.click()}
                  disabled={loading}
                  title="Joindre un fichier"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => imageInputRef?.current?.click()}
                  disabled={loading}
                  title="Joindre une image"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>

                <button type="button" disabled={loading} title="Rechercher sur le web">
                  <Globe className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  disabled={loading || !isSpeechSupported}
                  className={cn(isRecording && "text-red-500 animate-pulse")}
                  title={
                    !isSpeechSupported
                      ? "Reconnaissance vocale non disponible"
                      : isRecording
                        ? "Arrêter l'enregistrement"
                        : "Enregistrement vocal"
                  }
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>

              {isStreaming && onStopGeneration ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105"
                  title="Arrêter la génération"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={onSubmit}
                  disabled={!input.trim() || loading}
                  className="btn-submit"
                  title="Envoyer"
                >
                  <i>
                    <Send className="h-4 w-4" />
                  </i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isRecording && (
        <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </div>
          <span className="text-sm font-medium text-red-500">Enregistrement en cours... Parlez maintenant</span>
        </div>
      )}
    </div>
  )
}
