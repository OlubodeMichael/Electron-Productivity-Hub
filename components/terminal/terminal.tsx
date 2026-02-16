"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type Line =
  | { type: "command"; text: string; cwd?: string }
  | { type: "output"; text: string }

const PROMPT = "→ "

function displayCwd(cwd: string): string {
  return cwd.replace(/^\/Users\/[^/]+/, "~")
}

export default function Terminal({ command, cwd }: { command: string; cwd: string }) {
  const [input, setInput] = useState(command)
  const [currentCwd, setCurrentCwd] = useState(cwd)
  const [lines, setLines] = useState<Line[]>([
    { type: "output", text: "Desktop   Documents   Downloads   Projects   Library" },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCurrentCwd(cwd)
  }, [cwd])

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [lines, input, scrollToBottom])

  const runCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim()
      if (trimmed.toLowerCase() === "clear") {
        setLines([])
        return
      }
      setLines((prev) => [...prev, { type: "command", text: trimmed, cwd: currentCwd }])
      if (!trimmed) return

      const lower = trimmed.toLowerCase()
      if (lower === "cd" || lower.startsWith("cd ")) {
        const arg = trimmed.replace(/^cd\s*/i, "").trim()
        if (typeof window !== "undefined" && window.api?.resolvePath) {
          window.api
            .resolvePath(currentCwd, arg)
            .then((newPath) => setCurrentCwd(newPath))
            .catch((err: Error | string) => {
              const msg = typeof err === "string" ? err : err?.message ?? "No such file or directory"
              setLines((prev) => [...prev, { type: "output", text: `cd: ${msg}` }])
            })
        }
        return
      }

      if (typeof window !== "undefined" && window.api?.runCommand) {
        window.api
          .runCommand(trimmed, currentCwd)
          .then((output) => {
            setLines((prev) => [...prev, { type: "output", text: output.trim() || "" }])
          })
          .catch((err: Error | string) => {
            const message = typeof err === "string" ? err : err?.message ?? "Command failed"
            setLines((prev) => [...prev, { type: "output", text: message }])
          })
      } else {
        setLines((prev) => [
          ...prev,
          { type: "output", text: "Command not available (not in Electron)." },
        ])
      }
    },
    [currentCwd]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const cmd = input
      setInput("")
      runCommand(cmd)
    }
  }

  return (
    <div
      className="flex h-full min-h-[280px] flex-col overflow-hidden bg-background font-mono shadow-lg"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex shrink-0 items-center gap-2 bg-(--bg-elevated) px-3 py-2 cursor-n-resize">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-(#ff5f57)" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-(#febc2e)" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-(#28c840)" aria-hidden />
        </div>
        <span className="ml-2 text-[11px] font-medium uppercase tracking-wider text-(--text-muted) ">
          Terminal
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-3 text-[13px] leading-relaxed"
      >
        <div className="space-y-1">
          {lines.map((line, i) => (
            <div key={i}>
              {line.type === "command" ? (
                <p className="text-(--text-secondary)">
                  <span className="text-(--accent)">{PROMPT}</span>{" "}
                  <span className="text-(--text-muted)">
                    {displayCwd(line.cwd ?? currentCwd)}/
                  </span>
                  <span className="text-foreground"> {line.text}</span>
                </p>
              ) : (
                <p className="whitespace-pre-wrap text-(--text-muted)">
                  {line.text}
                </p>
              )}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-0">
            <span className="text-(--accent)">{PROMPT}</span>
            <span className="text-(--text-muted)"> {displayCwd(currentCwd)} ~ % </span>
            
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              aria-label="Terminal input"
              className="min-w-[8ch] flex-1 border-0 bg-transparent p-0 text-foreground outline-none placeholder:text-(--text-muted)"
              style={{ caretColor: "var(--text-primary)" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
