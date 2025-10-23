"use client"

import type { ChatSession, UserSettings } from "@/types"

export function saveChatSession(session: ChatSession) {
  const sessions = getChatSessions()
  const index = sessions.findIndex((s) => s.id === session.id)

  if (index >= 0) {
    sessions[index] = session
  } else {
    sessions.push(session)
  }

  localStorage.setItem("chatSessions", JSON.stringify(sessions))
}

export function getChatSessions(): ChatSession[] {
  if (typeof window === "undefined") return []

  const sessionsStr = localStorage.getItem("chatSessions")
  if (!sessionsStr) return []

  try {
    return JSON.parse(sessionsStr)
  } catch {
    return []
  }
}

export function getChatSession(sessionId: string): ChatSession | null {
  const sessions = getChatSessions()
  return sessions.find((s) => s.id === sessionId) || null
}

export function getUserSettings(): UserSettings {
  if (typeof window === "undefined") {
    return { theme: "green", colorMode: "dark" }
  }

  const settingsStr = localStorage.getItem("userSettings")
  if (!settingsStr) {
    return { theme: "green", colorMode: "dark" }
  }

  try {
    return JSON.parse(settingsStr)
  } catch {
    return { theme: "green", colorMode: "dark" }
  }
}

export function saveUserSettings(settings: UserSettings) {
  localStorage.setItem("userSettings", JSON.stringify(settings))
}
