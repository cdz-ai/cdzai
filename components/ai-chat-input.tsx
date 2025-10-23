"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Paperclip, ImageIcon, Folder, Mic, Send, Square } from "lucide-react"
import type { UploadedFile } from "@/types"
import { useLanguage } from "@/components/language-provider"

interface AIChatInputProps {
  input: string
  setInput: (value: string) => void
  loading: boolean
  isStreaming: boolean
  isRecording: boolean
  files: UploadedFile[]
  imageUrl: string
  onSubmit: (e: React.FormEvent) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onStopGeneration: () => void
  fileInputRef: React.RefObject<HTMLInputElement>
  imageInputRef: React.RefObject<HTMLInputElement>
}

export function AIChatInput({
  input,
  setInput,
  loading,
  isStreaming,
  isRecording,
  files,
  imageUrl,
  onSubmit,
  onFileUpload,
  onImageUpload,
  onStartRecording,
  onStopRecording,
  onStopGeneration,
  fileInputRef,
  imageInputRef,
}: AIChatInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [textareaHeight, setTextareaHeight] = useState(56)
  const hasContent = (input?.trim().length || 0) > 0 || (imageUrl?.length || 0) > 0
  const { t } = useLanguage()

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const newHeight = textarea.scrollHeight // No more Math.min limit
      setTextareaHeight(newHeight)
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (hasContent && !loading) {
        onSubmit(e)
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-[1200px] mx-auto">
      <div className="relative flex items-center justify-end w-full z-10">
        {/* Hidden file inputs */}
        <input type="file" ref={fileInputRef} onChange={onFileUpload} multiple className="hidden" />
        <input type="file" ref={imageInputRef} onChange={onImageUpload} accept="image/*" className="hidden" />

        {/* Upload buttons container - shows when not focused and no content */}
        <div
          className={`absolute left-0 flex items-center gap-1 text-muted-foreground z-10 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.05)] ${
            isFocused || hasContent || isRecording
              ? "opacity-0 invisible pointer-events-none -translate-x-5 blur-sm"
              : "opacity-100 visible translate-x-0"
          }`}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:text-foreground transition-all duration-500 hover:scale-110"
            title={t("attachFile")}
            tabIndex={isFocused || hasContent || isRecording ? -1 : 0}
          >
            <Paperclip className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-2 hover:text-foreground transition-all duration-500 hover:scale-110"
            title={t("attachImage")}
            tabIndex={isFocused || hasContent || isRecording ? -1 : 0}
          >
            <ImageIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:text-foreground transition-all duration-500 hover:scale-110"
            title={t("attachFolder")}
            tabIndex={isFocused || hasContent || isRecording ? -1 : 0}
          >
            <Folder className="h-6 w-6" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={t("askAnything")}
          disabled={loading}
          rows={1}
          className={`w-full rounded-[2rem] border-none outline-none bg-muted px-6 py-4 text-lg font-medium text-foreground placeholder:text-muted-foreground transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] disabled:opacity-60 disabled:cursor-not-allowed pl-7 resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent pr-20 ${
            isFocused || hasContent ? "max-w-[1120px] ml-[130px]" : "max-w-[550px] ml-[210px]"
          } ${isRecording ? "opacity-0 invisible pointer-events-none blur-sm scale-95" : "opacity-100 visible scale-100"}`}
          style={{
            height: `${textareaHeight}px`,
            minHeight: "56px",
            transition: "height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />

        {/* Voice recording button */}
        <label
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`absolute flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            hasContent || isStreaming
              ? "opacity-0 invisible scale-0 pointer-events-none"
              : "opacity-100 visible scale-100"
          } ${
            isRecording
              ? "w-[500px] h-[500px] bg-muted shadow-[0_10px_40px_rgba(0,0,60,0.25),inset_0_0_10px_rgba(255,255,255,0.5)] rounded-[3rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
              : "w-10 h-10 p-2 right-1 top-1/2 -translate-y-1/2 z-20"
          }`}
          tabIndex={hasContent || isStreaming ? -1 : 0}
          title={isRecording ? t("stopRecording") : t("voiceRecording")}
        >
          <Mic
            className={`h-6 w-6 absolute transition-all duration-500 ${isRecording ? "opacity-0 scale-0" : "opacity-100 scale-100"}`}
          />

          {isRecording && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[500px] h-[500px] p-[125px] animate-[circle1_5s_ease-in-out_infinite]">
                  {/* Wave effects */}
                  <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 rounded-full border-2 border-white shadow-[0_0_30px_rgba(234,170,255,1)] blur-[5px] -translate-x-1/2 -translate-y-1/2 animate-[wave_1.5s_linear_infinite]" />
                  <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 rounded-full border-2 border-white shadow-[0_0_30px_rgba(234,170,255,1)] blur-[5px] -translate-x-1/2 -translate-y-1/2 animate-[wave_1.5s_linear_infinite] [animation-delay:0.4s]" />

                  {/* Container */}
                  <div className="relative w-full h-full rounded-full bg-[#b6a9f8] overflow-hidden grid place-items-center">
                    {/* Animated circles - scaled proportionally */}
                    <div className="absolute w-[500px] aspect-square rounded-full bg-[#6d67c8] animate-[ai4_5.2s_linear_infinite]" />
                    <div className="absolute w-[333px] aspect-square rounded-full bg-[radial-gradient(50%_50%_at_center,#c979ee,#74bcd6)] animate-[ai1_5.5s_linear_infinite]" />
                    <div className="absolute w-[167px] aspect-square rounded-full bg-[radial-gradient(50%_50%_at_center,#ef788c,#e7e7fb)] animate-[ai2_6s_linear_infinite]" />
                    <div className="absolute w-[250px] aspect-square rounded-full bg-[radial-gradient(50%_50%_at_center,#eb7fc6,transparent)] opacity-60 animate-[ai3_4.8s_linear_infinite]" />

                    {/* Rings */}
                    <div className="absolute inset-0 rounded-full perspective-[11rem] opacity-90">
                      <div className="absolute inset-0 rounded-full border-[6px] border-transparent [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor] bg-[linear-gradient(white,blue,magenta,violet,lightyellow)] [background-clip:border-box] animate-[ring180_10s_ease-in-out_infinite]" />
                      <div className="absolute inset-0 rounded-full border-[6px] border-transparent [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor] bg-[linear-gradient(white,blue,magenta,violet,lightyellow)] [background-clip:border-box] animate-[ring90_10s_ease-in-out_infinite]" />
                    </div>
                  </div>

                  {/* Glass effect - adjusted inset */}
                  <div className="absolute inset-[121px] rounded-full backdrop-blur-[10px] shadow-[0_0_50px_rgba(255,255,255,0.3),0_50px_50px_rgba(0,0,0,0.3),0_0_25px_rgba(255,255,255,1)] bg-[radial-gradient(75px_at_70%_30%,rgba(255,255,255,0.7),transparent)]" />
                </div>
              </div>

              {/* Text overlay */}
              <div className="absolute inset-10 flex flex-col items-center justify-between pointer-events-none">
                <p className="text-2xl font-medium text-transparent bg-[linear-gradient(-40deg,#959595_0%_35%,#e770cd_40%,#ffcef4_50%,#e770cd_60%,#959595_65%_100%)] bg-clip-text [-webkit-background-clip:text] [background-size:900px] animate-[text-light_6s_ease_infinite] whitespace-nowrap">
                  {t("conversationStarted")}
                </p>
                <p className="text-base text-foreground/80 whitespace-nowrap">{t("pressToCancelConversation")}</p>
              </div>
            </>
          )}
        </label>

        {isStreaming && (
          <button
            type="button"
            onClick={onStopGeneration}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-background bg-gradient-to-tr from-red-500 to-red-600 shadow-[inset_0_0_4px_rgba(255,255,255,0.5)] rounded-full cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-[70] hover:shadow-[inset_0_0_6px_rgba(255,255,255,1)] hover:scale-110 active:scale-90 animate-pulse"
            title={t("stopGeneration")}
          >
            <Square className="h-5 w-5 fill-current" />
          </button>
        )}

        <button
          type="submit"
          disabled={!hasContent || loading}
          className={`absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-background bg-gradient-to-tr from-primary to-primary/80 shadow-[inset_0_0_4px_rgba(255,255,255,0.5)] rounded-full cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] disabled:opacity-50 disabled:cursor-not-allowed z-20 ${
            hasContent && !isRecording && !isStreaming
              ? "opacity-100 visible scale-100 hover:shadow-[inset_0_0_6px_rgba(255,255,255,1)] hover:scale-110 active:scale-90"
              : "opacity-0 invisible scale-0 pointer-events-none"
          }`}
          title={t("sendMessage")}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      <style jsx>{`
        @keyframes wave {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
            box-shadow: 0 0 50px rgba(234, 170, 255, 0.9);
          }
          35% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 1;
          }
          70%,
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0;
            box-shadow: 0 0 50px rgba(234, 170, 255, 0.3);
          }
        }

        @keyframes text-light {
          0% {
            background-position: 0px;
          }
          100% {
            background-position: 900px;
          }
        }

        @keyframes ai1 {
          0% {
            transform: rotate(0deg) translate(50%) scale(0.9);
            opacity: 0;
          }
          25% {
            transform: rotate(90deg) translate(50%) scale(1.8);
            opacity: 1;
          }
          50% {
            transform: rotate(180deg) translate(50%) scale(0.7);
            opacity: 0.4;
          }
          75% {
            transform: rotate(270deg) translate(50%) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) translate(50%) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes ai2 {
          0% {
            transform: rotate(90deg) translate(50%) scale(0.5);
          }
          25% {
            transform: rotate(180deg) translate(50%) scale(1.7);
            opacity: 0;
          }
          50% {
            transform: rotate(270deg) translate(50%) scale(1);
            opacity: 0;
          }
          75% {
            transform: rotate(360deg) translate(50%) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: rotate(450deg) translate(50%) scale(0.5);
            opacity: 1;
          }
        }

        @keyframes ai3 {
          0% {
            transform: rotate(180deg) translate(50%) scale(0.8);
            opacity: 0.8;
          }
          25% {
            transform: rotate(270deg) translate(50%) scale(1.5);
          }
          50% {
            transform: rotate(360deg) translate(50%) scale(0.6);
            opacity: 0.4;
          }
          75% {
            transform: rotate(450deg) translate(50%) scale(1.3);
            opacity: 0.7;
          }
          100% {
            transform: rotate(540deg) translate(50%) scale(0.8);
            opacity: 0.8;
          }
        }

        @keyframes ai4 {
          0% {
            transform: rotate(270deg) translate(50%) scale(1);
            opacity: 1;
          }
          25% {
            transform: rotate(360deg) translate(50%) scale(0.7);
          }
          50% {
            transform: rotate(450deg) translate(50%) scale(1.6);
            opacity: 0.5;
          }
          75% {
            transform: rotate(540deg) translate(50%) scale(0.9);
            opacity: 0.8;
          }
          100% {
            transform: rotate(630deg) translate(50%) scale(1);
            opacity: 1;
          }
        }

        @keyframes circle1 {
          0% {
            transform: scale(0.97);
          }
          15% {
            transform: scale(1);
          }
          30% {
            transform: scale(0.98);
          }
          45% {
            transform: scale(1);
          }
          60% {
            transform: scale(0.97);
          }
          85% {
            transform: scale(1);
          }
          100% {
            transform: scale(0.97);
          }
        }

        @keyframes ring180 {
          0% {
            transform: rotateY(180deg) rotateX(180deg) rotateZ(180deg);
          }
          25% {
            transform: rotateY(180deg) rotateX(180deg) rotateZ(180deg);
          }
          50% {
            transform: rotateY(360deg) rotateX(360deg) rotateZ(360deg);
          }
          80% {
            transform: rotateY(360deg) rotateX(360deg) rotateZ(360deg);
          }
          100% {
            transform: rotateY(540deg) rotateX(540deg) rotateZ(540deg);
          }
        }

        @keyframes ring90 {
          0% {
            transform: rotateY(90deg) rotateX(90deg) rotateZ(90deg);
          }
          25% {
            transform: rotateY(90deg) rotateX(90deg) rotateZ(90deg) scale(1.1);
          }
          50% {
            transform: rotateY(270deg) rotateX(270deg) rotateZ(270deg);
          }
          75% {
            transform: rotateY(270deg) rotateX(270deg) rotateZ(270deg);
          }
          100% {
            transform: rotateY(450deg) rotateX(450deg) rotateZ(450deg);
          }
        }
      `}</style>
    </form>
  )
}
