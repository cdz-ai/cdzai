import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { messages, model = "llama-3.3-70b-versatile" } = await request.json()

    const apiKey = process.env.API_KEY_GROQ_API_KEY || process.env.GROQ_API_KEY

    if (!apiKey) {
      console.error("[v0] Groq API key not found in environment variables")
      return NextResponse.json(
        {
          error: {
            message:
              "Groq API key not configured. Please add API_KEY_GROQ_API_KEY or GROQ_API_KEY to your environment variables.",
            code: 401,
          },
        },
        { status: 401 },
      )
    }

    console.log("[v0] Making request to Groq API with model:", model)

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Groq API error response:", errorData)
      return NextResponse.json(
        { error: errorData.error || { message: "Failed to get AI response", code: response.status } },
        { status: response.status },
      )
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Groq API error:", error)
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Failed to get AI response", code: 500 } },
      { status: 500 },
    )
  }
}
