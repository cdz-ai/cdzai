"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Language } from "@/lib/translations"
import { translations } from "@/lib/translations"
import { toast } from "sonner"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations.fr) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "fr" || savedLanguage === "en" || savedLanguage === "ko")) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    const languageNames = {
      fr: "Français 🇫🇷",
      en: "English 🇬🇧",
      ko: "한국어 🇰🇷",
    }

    setLanguageState(lang)
    localStorage.setItem("language", lang)

    // Show success notification
    toast.success(
      lang === "fr"
        ? "Langue changée avec succès"
        : lang === "en"
          ? "Language changed successfully"
          : "언어가 성공적으로 변경되었습니다",
      {
        description:
          lang === "fr"
            ? `La langue a été changée en ${languageNames[lang]}`
            : lang === "en"
              ? `Language has been changed to ${languageNames[lang]}`
              : `언어가 ${languageNames[lang]}(으)로 변경되었습니다`,
        duration: 3000,
      },
    )
  }

  const t = (key: keyof typeof translations.fr): string => {
    return translations[language][key] || translations.fr[key]
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
