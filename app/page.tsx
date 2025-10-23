"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/auth"
import { AIChatInput } from "@/components/ai-chat-input"
import type { UploadedFile } from "@/types"

export default function Home() {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const user = getUser()
    if (user) {
      router.replace("/chat")
    } else {
      router.replace("/login")
    }
  }, [router])

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
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

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current?.start()
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isRecording])

  const handleStartRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true)
      recognitionRef.current.start()
    } else {
      console.error("Speech recognition not supported in this browser")
    }
  }

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(false)
      recognitionRef.current.stop()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle submission logic here
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (uploadedFiles) {
      const newFiles = Array.from(uploadedFiles).map((file) => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      }))
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStopGeneration = () => {
    setIsStreaming(false)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      ) : (
        <div className="flex flex-col h-screen bg-background">
          <div className="flex-1 overflow-y-auto px-4 py-6"></div>

          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
            <div className="max-w-4xl mx-auto">
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
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onStopGeneration={handleStopGeneration}
                fileInputRef={fileInputRef}
                imageInputRef={imageInputRef}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
