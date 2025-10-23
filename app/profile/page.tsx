"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { UserIcon, Mail, Calendar, LogOut, Hash, Coins, Camera, Save } from "lucide-react"
import { getUser, logout, updateUser } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { AdminBadge } from "@/components/admin-badge"
import { CertifiedBadge } from "@/components/certified-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(getUser())
  const { t } = useLanguage()
  const { toast } = useToast()
  const [profileImage, setProfileImage] = useState<string>("")
  const [showBadge, setShowBadge] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const savedImage = localStorage.getItem(`profile_image_${user.id}`)
    if (savedImage) {
      setProfileImage(savedImage)
    }

    setShowBadge(user.showBadge !== false)
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("error") || "Erreur",
        description: t("imageTooLarge") || "Image trop grande (max 5MB)",
        variant: "destructive",
      })
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("error") || "Erreur",
        description: t("invalidImageType") || "Type de fichier invalide",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setProfileImage(base64String)
      setHasChanges(true)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveChanges = () => {
    if (!user) return

    localStorage.setItem(`profile_image_${user.id}`, profileImage)
    updateUser(user.id, {
      profileImage: profileImage,
      showBadge: showBadge,
    })
    setUser(getUser())
    setHasChanges(false)

    toast({
      title: t("success") || "Succès",
      description: t("changesSaved") || "Vos modifications ont été enregistrées",
    })
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-4 sm:p-6 md:p-8">
          <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold">{t("profileTitle")}</h1>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span>{t("accountInfo")}</span>
                <div className="flex items-center gap-2">
                  {user.isAdmin && <AdminBadge />}
                  {user.certified && user.showBadge && <CertifiedBadge />}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4 pb-4 border-b border-border">
                <div className="relative group">
                  <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl">
                    {profileImage ? (
                      <img
                        src={profileImage || "/placeholder.svg"}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {t("clickToUploadImage") || "Cliquez sur l'icône pour changer votre photo"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{t("username")}</p>
                  <p className="font-medium truncate">{user.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{t("email")}</p>
                  <p className="font-medium truncate">{user.email}</p>
                </div>
              </div>

              {user.userId && (
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">{t("yourId")}</p>
                    <code className="rounded-lg bg-muted px-3 py-1 text-base sm:text-lg font-bold text-primary">
                      {user.userId}
                    </code>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{t("totalCredits")}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min((user.credits || 0) / 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-primary">{user.credits || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{t("memberSince")}</p>
                  <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {user.certified && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <CertifiedBadge size="md" showTooltip={false} />
                    <div>
                      <Label htmlFor="show-badge" className="text-sm font-medium">
                        {t("showCertifiedBadge") || "Afficher le badge certifié"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("badgeVisibleEverywhere") || "Visible sur votre profil et dans les conversations"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="show-badge"
                    checked={showBadge}
                    onCheckedChange={(checked) => {
                      setShowBadge(checked)
                      setHasChanges(true)
                    }}
                  />
                </div>
              )}

              {hasChanges && (
                <Button onClick={handleSaveChanges} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  {t("saveChanges") || "Enregistrer les modifications"}
                </Button>
              )}

              <Button onClick={handleLogout} variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                {t("signOut")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
