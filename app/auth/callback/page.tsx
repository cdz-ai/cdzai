"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient()

      const { error } = await supabase.auth.exchangeCodeForSession(
        new URL(window.location.href).searchParams.get("code") || "",
      )

      if (error) {
        console.error("[v0] Auth callback error:", error)
        router.push("/login?error=auth_failed")
      } else {
        router.push("/chat")
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  )
}
