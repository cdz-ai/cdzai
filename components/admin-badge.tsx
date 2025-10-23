"use client"

import { Shield } from "lucide-react"

export function AdminBadge() {
  return (
    <div className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg animate-pulse">
      <Shield className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />
      <span className="relative">
        Admin
        <span className="absolute inset-0 animate-ping opacity-75">Admin</span>
      </span>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 opacity-50 blur-md animate-pulse" />
    </div>
  )
}
