"use client"

import Button from "@/components/ui/Button"
import { ArrowLeft, LayoutDashboard } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const MIN_TERMINAL_HEIGHT = 200
const MAX_TERMINAL_HEIGHT = 600
const DEFAULT_TERMINAL_HEIGHT = 320

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {

  }, [])

  return (
    <div className="app-grain flex h-screen min-h-0 flex-col bg-background">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(228, 168, 83, 0.06), transparent 60%)",
        }}
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-(--border) bg-(--bg-surface)/80 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-(--accent-muted)">
            <LayoutDashboard className="h-4 w-4 text-(--accent)" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-[11px] text-(--text-muted)">
              Terminal · Dev Productivity Hub
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="gap-1.5 px-3 py-1.5 text-sm text-(--text-secondary)"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Button>
      </header>

      {/* Main content area - fills space above terminal */}
      <div className="relative z-10 flex flex-1 min-h-0 flex-col p-5">
        <div className="flex flex-1 min-h-0 items-center justify-center rounded-lg border border-(--border) border-dashed bg-(--bg-surface)/50">
          <p className="text-sm text-(--text-muted)">
            Main content area
          </p>
        </div>
      </div>
    </div>
  )
}
