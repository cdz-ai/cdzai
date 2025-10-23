"use client"

import type { User } from "@/types"

const USERS_KEY = "cdzai_users"
const CURRENT_USER_KEY = "cdzai_current_user"
const SESSION_EXPIRY_KEY = "cdzai_session_expiry"

const ADMIN_EMAILS = [
  "chemsdine.kachid02@gmail.com",
  "chemsdine.kachid@gmail.com",
  "chemsdine.kachid5@gmail.com",
  "chemskachid993@gmail.com",
]

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

function generateUserId(): string {
  return Math.floor(10000 + Math.random() * 90000).toString()
}

function isSessionValid(): boolean {
  if (typeof window === "undefined") return false
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY)
  if (!expiry) return false
  return new Date().getTime() < Number.parseInt(expiry)
}

function setSessionExpiry(rememberMe: boolean) {
  const now = new Date().getTime()
  const expiryTime = rememberMe ? now + 30 * 24 * 60 * 60 * 1000 : now + 24 * 60 * 60 * 1000
  localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString())
}

export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const users = localStorage.getItem(USERS_KEY)
  return users ? JSON.parse(users) : []
}

export function saveUser(user: User, setCurrent = true) {
  const users = getUsers()
  const existingIndex = users.findIndex((u) => u.id === user.id)

  if (!user.userId) {
    user.userId = generateUserId()
  }

  if (user.credits === undefined) {
    user.credits = 1000
  }

  if (user.certified === undefined) {
    user.certified = false
  }

  if (user.showBadge === undefined) {
    user.showBadge = true
  }

  if (existingIndex >= 0) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users))

  if (setCurrent) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  }
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null

  if (!isSessionValid()) {
    localStorage.removeItem(CURRENT_USER_KEY)
    localStorage.removeItem(SESSION_EXPIRY_KEY)
    return null
  }

  const user = localStorage.getItem(CURRENT_USER_KEY)
  return user ? JSON.parse(user) : null
}

export async function login(email: string, password: string, rememberMe = false): Promise<User> {
  const users = getUsers()
  const user = users.find((u) => u.email === email)

  if (!user) {
    throw new Error("Utilisateur non trouvé")
  }

  if (!user.userId) {
    user.userId = generateUserId()
    saveUser(user, false)
  }

  user.password = password

  setSessionExpiry(rememberMe)

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  return user
}

export async function register(email: string, password: string, username: string, rememberMe = false): Promise<User> {
  const users = getUsers()

  if (users.some((u) => u.email === email)) {
    throw new Error("Cet email existe déjà")
  }

  const isAdmin = isAdminEmail(email)

  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    password, // Store password
    username: isAdmin ? "cdz" : username,
    createdAt: new Date(),
    isAdmin: isAdmin,
    userId: generateUserId(),
    credits: isAdmin ? 999999 : 1000,
    certified: false, // Initialize certified field
    showBadge: true, // Initialize showBadge field
  }

  saveUser(newUser)

  setSessionExpiry(rememberMe)

  return newUser
}

export const signup = register

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY)
  localStorage.removeItem(SESSION_EXPIRY_KEY)
}

export function deleteUser(userId: string) {
  const users = getUsers()
  const filteredUsers = users.filter((u) => u.id !== userId)
  localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers))
}

export function updateUser(userId: string, updates: Partial<User>) {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex >= 0) {
    users[userIndex] = { ...users[userIndex], ...updates }
    localStorage.setItem(USERS_KEY, JSON.stringify(users))

    const currentUser = getUser()
    if (currentUser?.id === userId) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[userIndex]))
    }
  }
}

export function createGuestUser(): User {
  const guestUser: User = {
    id: `guest_${Math.random().toString(36).substr(2, 9)}`,
    email: "guest@cdzai.com",
    username: "Invité",
    createdAt: new Date(),
    isAdmin: false,
    isGuest: true,
    userId: generateUserId(),
    credits: 500,
    certified: false,
    showBadge: true,
  }
  return guestUser
}

export function loginAsGuest(): User {
  const guestUser = createGuestUser()
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(guestUser))
  return guestUser
}
