"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function MarkdownRenderer({ content }: { content: string }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { theme } = useTheme()

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const themeColors = {
    gray: "text-gray-400",
    green: "text-green-400",
    blue: "text-blue-400",
    pink: "text-pink-400",
    turquoise: "text-cyan-400",
  }

  const themeColor = themeColors[theme]

  return (
    <ReactMarkdown
      className="prose prose-invert max-w-none"
      components={{
        a({ node, href, children, ...props }: any) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 underline underline-offset-2 transition-all duration-200 hover:scale-105",
                themeColor,
                "hover:opacity-80",
              )}
              {...props}
            >
              <ExternalLink className="h-3.5 w-3.5 inline flex-shrink-0" />
              {children}
            </a>
          )
        },

        img({ node, src, alt, ...props }: any) {
          return (
            <div className="my-4 rounded-xl overflow-hidden border border-border shadow-lg">
              <img
                src={src || "/placeholder.svg"}
                alt={alt || "Image"}
                className="w-full h-auto object-contain max-h-96 bg-card"
                loading="lazy"
                {...props}
              />
              {alt && (
                <p className="text-xs text-muted-foreground text-center py-2 px-3 bg-card/50 backdrop-blur-sm">{alt}</p>
              )}
            </div>
          )
        },

        table({ children }) {
          return (
            <div className="my-6 overflow-x-auto rounded-xl border border-border shadow-lg">
              <table className="w-full min-w-full border-collapse bg-card/50 backdrop-blur-sm text-sm sm:text-base">
                {children}
              </table>
            </div>
          )
        },
        thead({ children }) {
          return <thead className="bg-accent/50 border-b-2 border-border">{children}</thead>
        },
        tbody({ children }) {
          return <tbody className="divide-y divide-border/50">{children}</tbody>
        },
        tr({ children }) {
          return <tr className="transition-colors hover:bg-accent/30">{children}</tr>
        },
        th({ children }) {
          return (
            <th className={cn("px-3 py-3 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold", themeColor)}>
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-foreground whitespace-normal break-words">
              {children}
            </td>
          )
        },

        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "")
          const code = String(children).replace(/\n$/, "")

          if (!inline && match) {
            return (
              <div className="relative my-4 rounded-xl border border-border bg-card overflow-hidden shadow-lg">
                <div className="flex items-center justify-between border-b border-border bg-accent/30 px-4 py-2">
                  <span className={cn("text-xs font-medium", themeColor)}>{match[1]}</span>
                  <button
                    onClick={() => copyCode(code)}
                    className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1 text-xs text-foreground transition-colors hover:bg-accent/80"
                  >
                    {copiedCode === code ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copier
                      </>
                    )}
                  </button>
                </div>
                <pre className="!m-0 !bg-card/50 !p-4 overflow-x-auto">
                  <code className="!text-sm text-foreground font-mono">{code}</code>
                </pre>
              </div>
            )
          }

          return (
            <code className={cn("rounded bg-accent px-1.5 py-0.5 text-sm font-mono", themeColor)} {...props}>
              {children}
            </code>
          )
        },

        strong({ children }) {
          return <strong className={cn("font-bold", themeColor)}>{children}</strong>
        },
        em({ children }) {
          return <em className="italic text-foreground/80">{children}</em>
        },
        p({ children }) {
          return <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>
        },
        ul({ children }) {
          return <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground/90">{children}</ul>
        },
        ol({ children }) {
          return <ol className="mb-4 ml-6 list-decimal space-y-2 text-foreground/90">{children}</ol>
        },
        h1({ children }) {
          return <h1 className={cn("mb-4 text-3xl font-bold", themeColor)}>{children}</h1>
        },
        h2({ children }) {
          return <h2 className={cn("mb-3 text-2xl font-bold", themeColor)}>{children}</h2>
        },
        h3({ children }) {
          return <h3 className={cn("mb-2 text-xl font-bold", themeColor)}>{children}</h3>
        },
        blockquote({ children }) {
          return (
            <blockquote className={cn("border-l-4 pl-4 italic my-4 text-foreground/80", `border-${theme}-500`)}>
              {children}
            </blockquote>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
