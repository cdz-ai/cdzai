"use client"

import { createBrowserClient } from "@/lib/supabase/client"
import type { User } from "@/types"

const ADMIN_EMAILS = [
  "chemsdine.kachid02@gmail.com",
  "chemsdine.kachid@gmail.com",
  "chemsdine.kachid5@gmail.com",
  "chemskachid993@gmail.com",
]

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

function generateUserCode(isAdmin: boolean): string {
  if (isAdmin) {
    // Generate 4-digit admin code starting with 000X
    return `000${Math.floor(1 + Math.random() * 9)}`
  }
  // Generate 5-digit user code
  return Math.floor(10000 + Math.random() * 90000).toString()
}

export async function signUpWithEmail(email: string, password: string, username: string) {
  const supabase = createBrowserClient()

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        username,
      },
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error("Failed to create user")

  const isAdmin = isAdminEmail(email)
  const userCode = generateUserCode(isAdmin)

  // Create user profile in database
  const { error: profileError } = await supabase.from("users").insert({
    id: authData.user.id,
    email,
    username: isAdmin ? "cdz" : username,
    user_code: userCode,
    is_admin: isAdmin,
    created_at: new Date().toISOString(),
    is_online: true,
  })

  if (profileError) throw profileError

  return authData.user
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Update online status
  if (data.user) {
    await supabase.from("users").update({ is_online: true, last_seen: new Date().toISOString() }).eq("id", data.user.id)
  }

  return data.user
}

export async function signOut() {
  const supabase = createBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Update online status before signing out
    await supabase.from("users").update({ is_online: false, last_seen: new Date().toISOString() }).eq("id", user.id)
  }

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createBrowserClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  // Get user profile from database
  const { data: profile, error } = await supabase.from("users").select("*").eq("id", authUser.id).single()

  if (error || !profile) return null

  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    userId: profile.user_code,
    isAdmin: profile.is_admin,
    createdAt: new Date(profile.created_at),
    avatarUrl: profile.avatar_url,
    certified: false, // TODO: Add certified field to database
    showBadge: true,
    credits: 1000, // TODO: Add credits field to database
  }
}
