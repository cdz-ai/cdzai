// Multi-provider AI library for AiChat page
// Supports Groq, OpenAI, Mistral AI, and AIMLAPI

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const AIMLAPI_KEY = process.env.AIMLAPI_KEY!;

export type MultiAIProvider = "groq" | "openai" | "mistral" | "aimlapi"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export async function sendMultiAIMessage(
  messages: Message[],
  provider: MultiAIProvider,
  model?: string,
): Promise<{ stream: ReadableStream; responseTime: number }> {
  const startTime = Date.now()

  console.log(`[v0] Sending message to ${provider}...`)

  try {
    let response: Response

    switch (provider) {
      case "groq":
        response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model || "llama-3.3-70b-versatile",
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4096,
          }),
        })
        break

      case "openai":
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4096,
          }),
        })
        break

      case "mistral":
        response = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${MISTRAL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model || "mistral-small-latest",
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4096,
          }),
        })
        break

      case "aimlapi":
        response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIMLAPI_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model || "google/gemma-2-9b-it",
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4096,
          }),
        })
        break

      default:
        throw new Error(`Unknown provider: ${provider}`)
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`[v0] ${provider} API error:`, errorData)

      if (response.status === 401) {
        throw new Error(`Clé API ${provider} invalide ou expirée`)
      } else if (response.status === 429) {
        throw new Error(`Limite de taux atteinte pour ${provider}. Essayez un autre modèle.`)
      } else if (response.status === 403) {
        throw new Error(`Accès refusé pour ${provider}. Vérifiez votre clé API ou complétez la vérification.`)
      } else {
        throw new Error(`Erreur ${provider}: ${errorData.error?.message || response.statusText}`)
      }
    }

    const responseTime = Date.now() - startTime

    if (!response.body) {
      throw new Error("Pas de corps de réponse")
    }

    return {
      stream: response.body,
      responseTime,
    }
  } catch (error) {
    console.error(`[v0] Error with ${provider}:`, error)
    throw error
  }
}

export const PROVIDER_MODELS = {
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
    { value: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill Llama 70B" },
    { value: "qwen/qwen3-32b", label: "Qwen 3 32B" },
    { value: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B" },
  ],
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ],
  mistral: [
    { value: "mistral-small-latest", label: "Mistral Small Latest" },
    { value: "mistral-tiny-latest", label: "Mistral Tiny Latest" },
    { value: "open-mistral-7b", label: "Open Mistral 7B" },
  ],
  aimlapi: [
    { value: "google/gemma-2-9b-it", label: "Gemma 2 9B IT" },
    { value: "google/gemma-3n-e4b-it", label: "Gemma 3N E4B IT" },
    { value: "meta-llama/Llama-3.2-3B-Instruct-Turbo", label: "Llama 3.2 3B Turbo" },
  ],
}
