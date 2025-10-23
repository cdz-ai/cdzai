"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Mail, Lock, UserIcon } from "lucide-react"
import { signInWithEmail, signUpWithEmail } from "@/lib/supabase-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isSignup) {
        await signUpWithEmail(email, password, username)
        router.push("/chat")
      } else {
        await signInWithEmail(email, password)
        router.push("/chat")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%),radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.1),transparent_50%)]"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-[80px] sm:blur-[100px] animate-pulse"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-primary/5 rounded-full blur-[80px] sm:blur-[100px] animate-pulse [animation-delay:1s]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[95%] sm:max-w-md z-10">
        <header className="mb-6 sm:mb-8 md:mb-10 text-center">
          <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 px-4 py-3 sm:px-6 sm:py-3 md:px-8 md:py-4 backdrop-blur-md shadow-lg shadow-primary/5">
            <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 sm:p-2.5 shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              CDZAi
            </h1>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
            {isSignup ? "Créer un compte" : "Bon retour"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-balance px-2">
            {isSignup
              ? "Rejoignez la plateforme IA nouvelle génération"
              : "Connectez-vous pour continuer votre expérience"}
          </p>
        </header>

        <main
          className="rounded-2xl sm:rounded-3xl border border-border/50 bg-card/80 backdrop-blur-2xl p-5 sm:p-6 md:p-8 shadow-2xl shadow-black/5"
          role="main"
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-5"
            aria-label={isSignup ? "Formulaire d'inscription" : "Formulaire de connexion"}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" aria-hidden="true" />
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
                className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
              />
            </div>

            {isSignup && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label
                  htmlFor="username"
                  className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-2"
                >
                  <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" aria-hidden="true" />
                  Pseudo
                </Label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Votre pseudo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  aria-required="true"
                  className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-2"
              >
                <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" aria-hidden="true" />
                Mot de passe
              </Label>
              <Input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignup ? "new-password" : "current-password"}
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
                minLength={6}
                className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
              />
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 sm:px-4 py-2.5 sm:py-3 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <p className="text-xs sm:text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    role="status"
                    aria-label="Chargement"
                  />
                  Chargement...
                </span>
              ) : isSignup ? (
                "S'inscrire"
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {!isSignup && (
            <div className="mt-4 text-center">
              <Link
                href="/auth/forgot-password"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          )}

          <div className="mt-4 sm:mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup)
                setError("")
              }}
              className="text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1"
              aria-label={isSignup ? "Aller au formulaire de connexion" : "Aller au formulaire d'inscription"}
            >
              {isSignup ? (
                <>
                  Déjà un compte ? <span className="font-semibold text-primary hover:underline">Se connecter</span>
                </>
              ) : (
                <>
                  Pas encore de compte ? <span className="font-semibold text-primary hover:underline">S'inscrire</span>
                </>
              )}
            </button>
          </div>
        </main>

        <footer className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs text-muted-foreground/70 text-balance px-2">
          En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité
        </footer>
      </div>
    </div>
  )
}
