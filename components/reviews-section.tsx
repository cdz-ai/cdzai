"use client"

import { useState, useEffect } from "react"
import { Star, Send, ThumbsUp, MessageCircle, Trash2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUser } from "@/lib/auth"
import { CertifiedBadge } from "@/components/certified-badge"
import { cn } from "@/lib/utils"

interface Reply {
  id: string
  username: string
  content: string
  timestamp: Date
  isAdmin: boolean
  certified: boolean
  showBadge: boolean
}

interface Review {
  id: string
  rating: number
  comment: string
  timestamp: Date
  username: string
  userId: string
  isAdmin: boolean
  certified: boolean
  showBadge: boolean
  likes: number
  likedBy: string[]
  replies: Reply[]
}

interface ReviewsSectionProps {
  pageId?: string
}

export function ReviewsSection({ pageId = "default" }: ReviewsSectionProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [reviews, setReviews] = useState<Review[]>([])
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const currentUser = getUser()

  useEffect(() => {
    const stored = localStorage.getItem(`reviews_${pageId}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      setReviews(
        parsed.map((r: Review) => ({
          ...r,
          timestamp: new Date(r.timestamp),
          replies:
            r.replies?.map((reply: Reply) => ({
              ...reply,
              timestamp: new Date(reply.timestamp),
            })) || [],
        })),
      )
    }
  }, [pageId])

  useEffect(() => {
    if (reviews.length > 0) {
      localStorage.setItem(`reviews_${pageId}`, JSON.stringify(reviews))
    }
  }, [reviews, pageId])

  const handleSubmit = () => {
    if (rating === 0 || !comment.trim() || !currentUser) return

    const newReview: Review = {
      id: Math.random().toString(36).substr(2, 9),
      rating,
      comment: comment.trim(),
      timestamp: new Date(),
      username: currentUser.username,
      userId: currentUser.id,
      isAdmin: currentUser.isAdmin || false,
      certified: currentUser.certified || false,
      showBadge: currentUser.showBadge !== false,
      likes: 0,
      likedBy: [],
      replies: [],
    }

    setReviews([newReview, ...reviews])
    setRating(0)
    setComment("")
  }

  const handleLike = (reviewId: string) => {
    if (!currentUser) return

    setReviews(
      reviews.map((review) => {
        if (review.id === reviewId) {
          const hasLiked = review.likedBy.includes(currentUser.id)
          return {
            ...review,
            likes: hasLiked ? review.likes - 1 : review.likes + 1,
            likedBy: hasLiked
              ? review.likedBy.filter((id) => id !== currentUser.id)
              : [...review.likedBy, currentUser.id],
          }
        }
        return review
      }),
    )
  }

  const handleReply = (reviewId: string) => {
    if (!replyContent.trim() || !currentUser) return

    const newReply: Reply = {
      id: Math.random().toString(36).substr(2, 9),
      username: currentUser.username,
      content: replyContent.trim(),
      timestamp: new Date(),
      isAdmin: currentUser.isAdmin || false,
      certified: currentUser.certified || false,
      showBadge: currentUser.showBadge !== false,
    }

    setReviews(
      reviews.map((review) => {
        if (review.id === reviewId) {
          return {
            ...review,
            replies: [...review.replies, newReply],
          }
        }
        return review
      }),
    )

    setReplyContent("")
    setReplyingTo(null)
  }

  const handleDelete = (reviewId: string) => {
    if (!currentUser?.isAdmin) return
    if (confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) {
      setReviews(reviews.filter((review) => review.id !== reviewId))
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Donnez votre avis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Votre note</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-none text-muted-foreground",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Votre commentaire</p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience..."
            className="min-h-[100px] resize-none"
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">{comment.length}/1000</p>
        </div>

        <Button onClick={handleSubmit} disabled={rating === 0 || !comment.trim()} className="w-full gap-2">
          <Send className="h-4 w-4" />
          Envoyer
        </Button>

        {reviews.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Avis des utilisateurs ({reviews.length})</h3>
            <div className="max-h-[400px] space-y-4 overflow-y-auto pr-2 reviews-scrollbar">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm flex items-center gap-1.5">
                        {review.username}
                        {review.isAdmin && <Shield className="h-4 w-4 text-primary" fill="currentColor" />}
                        {review.certified && review.showBadge && <CertifiedBadge size="sm" />}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4 transition-colors",
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-none text-muted-foreground",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {review.timestamp.toLocaleDateString("fr-FR")}
                      </span>
                      {currentUser?.isAdmin && (
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>

                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <button
                      onClick={() => handleLike(review.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-sm transition-all duration-200",
                        review.likedBy.includes(currentUser?.id || "")
                          ? "text-primary font-medium scale-105"
                          : "text-muted-foreground hover:text-foreground hover:scale-105",
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{review.likes}</span>
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{review.replies.length}</span>
                    </button>
                  </div>

                  {review.replies.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                      {review.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-muted/50 rounded-lg p-3 space-y-1 hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium flex items-center gap-1">
                              {reply.username}
                              {reply.isAdmin && <Shield className="h-3 w-3 text-primary" fill="currentColor" />}
                              {reply.certified && reply.showBadge && <CertifiedBadge size="sm" />}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.timestamp).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                          <p className="text-xs text-foreground">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {replyingTo === review.id && (
                    <div className="space-y-2 pl-4 animate-in slide-in-from-top-2 duration-300">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Écrivez votre réponse..."
                        className="min-h-[60px] resize-none text-sm"
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleReply(review.id)} disabled={!replyContent.trim()}>
                          Répondre
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
