import type { AIModel, Message, UploadedFile } from "@/types"

// OpenRouter API configuration with user-provided keys
const API_KEYS: Record<AIModel, string> = {
  llama: "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",
  deepseek: "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",
  "deepseek-r1": "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",
  "deepseek-r1-chimera": "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",
  gemini: "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",
  "gpt-4": "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",
  grok: "", // Groq uses its own API, not OpenRouter
}

const MODEL_MAP: Record<AIModel, string> = {
  llama: "meta-llama/llama-4-maverick-17b-128e-instruct:free",
  deepseek: "deepseek/deepseek-chat-v3.1:free",
  "deepseek-r1": "deepseek/deepseek-r1-0528:free",
  "deepseek-r1-chimera": "tngtech/deepseek-r1t2-chimera:free",
  gemini: "google/gemini-2.0-flash-exp:free",
  "gpt-4": "openai/gpt-4o-mini",
  grok: "x-ai/grok-beta", // Groq's Llama model
}

const IMAGE_SUPPORTED_MODELS: AIModel[] = ["gemini", "gpt-4"]

let currentAbortController: AbortController | null = null

export function stopGeneration() {
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }
}

export async function sendMessage(
  messages: Message[],
  model: AIModel,
  files?: UploadedFile[],
  imageUrl?: string,
): Promise<{ content: string; responseTime: number; stream?: ReadableStream }> {
  const startTime = Date.now()

  currentAbortController = new AbortController()

  try {
    if (model === "grok") {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: currentAbortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Groq API error:", errorData)
        throw new Error(errorData.error || "Erreur lors de la communication avec Groq")
      }

      const responseTime = Date.now() - startTime

      return {
        content: "",
        responseTime,
        stream: response.body || undefined,
      }
    }

    const apiKey = API_KEYS[model]
    const modelName = MODEL_MAP[model]

    // Build conversation history with proper image format
    let conversationMessages = messages.map((m) => {
      if (m.role === "user" && imageUrl && IMAGE_SUPPORTED_MODELS.includes(model)) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        }
      }
      return {
        role: m.role,
        content: m.content,
      }
    })

    if (model === "llama" && conversationMessages.length > 2) {
      conversationMessages = conversationMessages.slice(-2)
    }

    const lastMessage = conversationMessages[conversationMessages.length - 1]
    const supportsImages = IMAGE_SUPPORTED_MODELS.includes(model)

    if (files && files.length > 0) {
      const fileContext = files
        .map((f) => {
          if (f.type.startsWith("image/")) {
            return `Image: ${f.name}\nBase64: ${f.content}`
          }
          return `File: ${f.name}\nContent: ${f.content.substring(0, 1000)}...`
        })
        .join("\n\n")

      if (typeof lastMessage.content === "string") {
        lastMessage.content += `\n\n${fileContext}`
      }
    }

    if (imageUrl && !supportsImages) {
      throw new Error(
        `Le modèle ${model} ne supporte pas l'analyse d'images. Utilisez Gemini ou GPT-4 pour analyser des images.`,
      )
    }

    if (model !== "llama" && typeof lastMessage.content === "string") {
      lastMessage.content += "\n\nSuggère 2-3 questions de suivi pertinentes à la fin de ta réponse."
    }

    console.log("[v0] Sending request to OpenRouter with model:", modelName)

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "CDZAi",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: conversationMessages,
        stream: true,
      }),
      signal: currentAbortController.signal,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] API error response:", errorData)

      if (response.status === 404 && errorData.error?.message?.includes("data policy")) {
        throw new Error(
          "Erreur de configuration OpenRouter: Vos clés API ont une politique de rétention de données incompatible avec les modèles gratuits. Veuillez configurer vos paramètres sur https://openrouter.ai/settings/privacy",
        )
      }

      if (response.status === 429) {
        const errorMessage = errorData.error?.message || ""
        const metadata = errorData.error?.metadata?.headers || {}

        // Check if it's a free model daily limit
        if (errorMessage.includes("free-models-per-day")) {
          const resetTime = metadata["X-RateLimit-Reset"]
          let resetMessage = ""

          if (resetTime) {
            const resetDate = new Date(Number.parseInt(resetTime))
            const now = new Date()
            const hoursUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60))

            if (hoursUntilReset > 0) {
              resetMessage = ` La limite sera réinitialisée dans ${hoursUntilReset} heure${hoursUntilReset > 1 ? "s" : ""}.`
            }
          }

          throw new Error(
            `Limite quotidienne atteinte pour les modèles gratuits (50 requêtes/jour).${resetMessage}\n\nOptions:\n• Essayez un autre modèle (DeepSeek R1 Chimera, Gemini, ou GPT-4o Mini)\n• Ajoutez des crédits sur OpenRouter pour débloquer 1000 requêtes gratuites/jour\n• Réessayez demain`,
          )
        }

        // Generic rate limit error
        throw new Error(
          "Ce modèle est temporairement limité par le fournisseur. Essayez DeepSeek R1 Chimera ou un autre modèle, ou réessayez dans quelques instants.",
        )
      }

      if (response.status === 403 && errorData.error?.metadata?.reasons) {
        throw new Error(
          `Le modèle a bloqué votre message pour des raisons de modération. Essayez de reformuler votre question ou utilisez un autre modèle.`,
        )
      }

      if (response.status === 403) {
        throw new Error("Accès refusé. Vérifiez votre clé API ou essayez un autre modèle.")
      }

      throw new Error(errorData.error?.message || "Erreur lors de la communication avec l'API")
    }

    const responseTime = Date.now() - startTime

    return {
      content: "",
      responseTime,
      stream: response.body || undefined,
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Génération arrêtée par l'utilisateur")
    }
    console.error("[v0] AI Error:", error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error("Une erreur inattendue s'est produite")
  } finally {
    currentAbortController = null
  }
}

export function getModelStatus(model: AIModel): { working: boolean; message: string } {
  return { working: true, message: "Opérationnel" }
}

export function getAvailableModels(): { id: AIModel; name: string; description: string }[] {
  return [
    { id: "grok", name: "Groq Llama 3.3 70B", description: "Ultra rapide et puissant" }, // Added Groq as first option
    { id: "deepseek-r1-chimera", name: "DeepSeek R1T2 Chimera", description: "Nouveau - Gratuit et rapide" },
    { id: "deepseek-r1", name: "DeepSeek R1", description: "Raisonnement avancé" },
    { id: "deepseek", name: "DeepSeek Chat v3.1", description: "Stable et rapide" },
    { id: "gemini", name: "Gemini 2.0 Flash", description: "Analyse d'images" },
    { id: "llama", name: "Llama 4 Maverick", description: "Conversations courtes" },
    { id: "gpt-4", name: "GPT-4o Mini", description: "Analyse multimodale" },
    { id: "grok", name: "Grok Beta", description: "Conversations naturelles" },
  ]
}
