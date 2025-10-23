export interface User {
  id: string
  email: string
  username: string
  password?: string // Added password field for admin dashboard
  createdAt: Date
  isAdmin: boolean
  isGuest?: boolean // Add guest flag
  userId?: string // Add 5-digit user ID for friend system
  credits?: number // Add credits system
  isOnline?: boolean // Added online status
  certified?: boolean // Added certified badge fields
  showBadge?: boolean // Added certified badge fields
  profileImage?: string // Added certified badge fields
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  files?: UploadedFile[]
  responseTime?: number // Add response time tracking
  followUpQuestions?: string[] // Add follow-up questions
  sources?: Source[] // Add sources
}

export interface UploadedFile {
  name: string
  type: string
  size: number
  content: string
}

export interface Source {
  title: string
  url: string
  snippet: string
}

export interface ChatSession {
  id: string
  userId: string
  messages: Message[]
  model: AIModel
  createdAt: Date
}

export type AIModel =
  | "deepseek-r1-chimera"
  | "deepseek"
  | "deepseek-r1"
  | "gpt-4"
  | "grok"
  | "groq"
  | "llama"
  | "gemini"

export type Theme = "gray" | "green" | "blue" | "pink" | "turquoise"
export type ColorMode = "dark" | "light"

export interface UserSettings {
  theme: Theme
  colorMode: ColorMode
}

export interface Friend {
  id: string
  userId: string
  friendUserId: string
  friendUsername: string
  friendUserCode: string
  status: "pending" | "accepted" | "blocked"
  createdAt: Date
}

export interface Group {
  id: string
  name: string
  creatorId: string
  memberIds: string[]
  createdAt: Date
  avatar?: string
}

export interface DirectMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  isAI?: boolean // Flag for AI messages triggered by /ai command
}

export interface GroupMessage {
  id: string
  groupId: string
  senderId: string
  content: string
  timestamp: Date
  isAI?: boolean // Flag for AI messages triggered by /ai command
}
