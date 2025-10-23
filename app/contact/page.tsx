"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Send, ArrowLeft, Paperclip, X } from "lucide-react"
import { getUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"

interface SupportTicket {
  id: string
  userId: string
  subject: string
  status: "open" | "in_progress" | "closed"
  messages: SupportMessage[]
  createdAt: Date
}

interface SupportMessage {
  id: string
  senderId: string
  content: string
  isAdmin: boolean
  imageUrl?: string
  timestamp: Date
}

const ADMIN_EMAILS = [
  "chemsdine.kchid02@gmail.com",
  "chemsdine.kachid@gmail.com",
  "chemsdine.kachid5@gmail.com",
  "chemskachid993@gmail.com",
]

export default function ContactPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState(getUser())
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showNewTicket, setShowNewTicket] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const stored = localStorage.getItem(`support_tickets_${user.id}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      setTickets(
        parsed.map((t: SupportTicket) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          messages: t.messages.map((m: SupportMessage) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        })),
      )
    }
  }, [user, router])

  useEffect(() => {
    if (user && tickets.length > 0) {
      localStorage.setItem(`support_tickets_${user.id}`, JSON.stringify(tickets))
    }
  }, [tickets, user])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateTicket = () => {
    if (!user || !subject.trim() || !message.trim()) return

    const newTicket: SupportTicket = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      subject: subject.trim(),
      status: "open",
      messages: [
        {
          id: Math.random().toString(36).substr(2, 9),
          senderId: user.id,
          content: message.trim(),
          isAdmin: false,
          imageUrl: imagePreview || undefined,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
    }

    setTickets([newTicket, ...tickets])
    setSubject("")
    setMessage("")
    setImageFile(null)
    setImagePreview(null)
    setShowNewTicket(false)
    setSelectedTicket(newTicket)
  }

  const handleSendMessage = () => {
    if (!user || !selectedTicket || !message.trim()) return

    const newMessage: SupportMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      content: message.trim(),
      isAdmin: false,
      imageUrl: imagePreview || undefined,
      timestamp: new Date(),
    }

    const updatedTickets = tickets.map((t) =>
      t.id === selectedTicket.id ? { ...t, messages: [...t.messages, newMessage] } : t,
    )

    setTickets(updatedTickets)
    setSelectedTicket({ ...selectedTicket, messages: [...selectedTicket.messages, newMessage] })
    setMessage("")
    setImageFile(null)
    setImagePreview(null)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Support & Contact</h1>
            <p className="mt-2 text-muted-foreground">Contactez notre équipe d'administration</p>
          </div>
          {!showNewTicket && !selectedTicket && (
            <Button onClick={() => setShowNewTicket(true)} className="gap-2">
              <Send className="h-5 w-5" />
              Nouveau ticket
            </Button>
          )}
        </div>

        {/* New ticket form */}
        {showNewTicket && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Créer un ticket de support</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNewTicket(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <CardDescription>Décrivez votre problème ou votre question</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sujet</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Problème de connexion"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème en détail..."
                  className="min-h-[150px]"
                  maxLength={1000}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Image (optionnel)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="ticket-image"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="ticket-image" className="cursor-pointer gap-2">
                      <Paperclip className="h-4 w-4" />
                      Joindre une image
                    </label>
                  </Button>
                  {imagePreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {imagePreview && (
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="mt-2 max-h-40 rounded-lg border"
                  />
                )}
              </div>
              <Button onClick={handleCreateTicket} disabled={!subject.trim() || !message.trim()} className="w-full">
                Envoyer le ticket
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ticket conversation view */}
        {selectedTicket && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedTicket.subject}</CardTitle>
                  <CardDescription>
                    Statut:{" "}
                    <span
                      className={`font-medium ${
                        selectedTicket.status === "open"
                          ? "text-green-500"
                          : selectedTicket.status === "in_progress"
                            ? "text-yellow-500"
                            : "text-gray-500"
                      }`}
                    >
                      {selectedTicket.status === "open"
                        ? "Ouvert"
                        : selectedTicket.status === "in_progress"
                          ? "En cours"
                          : "Fermé"}
                    </span>
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-lg border p-4">
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.isAdmin ? "bg-muted" : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {msg.isAdmin && <p className="mb-1 text-xs font-semibold text-primary">Admin</p>}
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl || "/placeholder.svg"}
                          alt="Attachment"
                          className="mt-2 max-h-40 rounded"
                        />
                      )}
                      <p className="mt-1 text-xs opacity-70">{msg.timestamp.toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTicket.status !== "closed" && (
                <div className="space-y-3">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Votre réponse..."
                    className="min-h-[100px]"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="message-image"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="message-image" className="cursor-pointer gap-2">
                        <Paperclip className="h-4 w-4" />
                        Image
                      </label>
                    </Button>
                    {imagePreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button onClick={handleSendMessage} disabled={!message.trim()} className="ml-auto gap-2">
                      <Send className="h-4 w-4" />
                      Envoyer
                    </Button>
                  </div>
                  {imagePreview && (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-h-32 rounded-lg border"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tickets list */}
        {!showNewTicket && !selectedTicket && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex min-h-[200px] items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    Aucun ticket de support. Créez-en un pour contacter l'équipe.
                  </p>
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    <CardDescription>
                      {ticket.messages.length} message{ticket.messages.length > 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`font-medium ${
                          ticket.status === "open"
                            ? "text-green-500"
                            : ticket.status === "in_progress"
                              ? "text-yellow-500"
                              : "text-gray-500"
                        }`}
                      >
                        {ticket.status === "open" ? "Ouvert" : ticket.status === "in_progress" ? "En cours" : "Fermé"}
                      </span>
                      <span className="text-muted-foreground">{ticket.createdAt.toLocaleDateString("fr-FR")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
