import type { Metadata } from "next"
import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import ClientLayout from "./client-layout"

const _geist = Geist({ subsets: ["latin"], display: "swap" })
const _geistMono = Geist_Mono({ subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  title: "CDZAi - Assistant IA Nouvelle Génération",
  description:
    "CDZAi est une plateforme d'intelligence artificielle avancée offrant des conversations intelligentes, génération d'images, analyse de données et bien plus encore.",
  keywords: ["IA", "Intelligence Artificielle", "Chatbot", "AI Assistant", "CDZAi", "OpenRouter", "DeepSeek"],
  authors: [{ name: "Chems" }],
  creator: "Chems",
  publisher: "CDZAi",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://cdzai.com",
    title: "CDZAi - Assistant IA Nouvelle Génération",
    description: "Plateforme d'intelligence artificielle avancée pour conversations intelligentes et créativité",
    siteName: "CDZAi",
  },
  twitter: {
    card: "summary_large_image",
    title: "CDZAi - Assistant IA Nouvelle Génération",
    description: "Plateforme d'intelligence artificielle avancée",
    creator: "@cdzai",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#8b5cf6" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`font-sans antialiased ${_geist.variable} ${_geistMono.variable}`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
