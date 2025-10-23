"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Theme, ColorMode, UserSettings } from "@/types"
import { getUserSettings, saveUserSettings } from "@/lib/storage"

interface ThemeContextType {
  theme: Theme
  colorMode: ColorMode
  setTheme: (theme: Theme) => void
  setColorMode: (mode: ColorMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>({ theme: "gray", colorMode: "dark" })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedSettings = getUserSettings()
    setSettings(savedSettings)
    applyTheme(savedSettings.theme, savedSettings.colorMode)
  }, [])

  const applyTheme = (theme: Theme, mode: ColorMode) => {
    if (typeof window === "undefined") return

    const root = document.documentElement

    if (mode === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }

    // Apply theme colors
    root.setAttribute("data-theme", theme)
  }

  const setTheme = (theme: Theme) => {
    const newSettings = { ...settings, theme }
    setSettings(newSettings)
    saveUserSettings(newSettings)
    applyTheme(theme, settings.colorMode)
  }

  const setColorMode = (colorMode: ColorMode) => {
    const newSettings = { ...settings, colorMode }
    setSettings(newSettings)
    saveUserSettings(newSettings)
    applyTheme(settings.theme, colorMode)
  }

  // Prevent flash of unstyled content
  if (!mounted) {
    return null
  }

  return <ThemeContext.Provider value={{ ...settings, setTheme, setColorMode }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
