"use client"

import { useState } from "react"
import Sidebar from "@/components/layout/Sidebar"
import Terminal from "@/components/terminal/terminal"
import { useApp } from "@/app/contexts/AppContext"
import { resizeVertical, resizeHorizontal } from "@/utils/resize"

const MIN_TERMINAL_HEIGHT = 200
const MAX_TERMINAL_HEIGHT = 600
const DEFAULT_TERMINAL_HEIGHT = 320

const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 480
const DEFAULT_SIDEBAR_WIDTH = 288

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const {
    folder,
    tree,
    sidebarOpen,
    setSidebarOpen,
    terminalOpen,
    setTerminalOpen,
    handleOpenFolder,
    renderNode,
  } = useApp()
  const [terminalHeight, setTerminalHeight] = useState(DEFAULT_TERMINAL_HEIGHT)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)

  const handleTerminalResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    resizeVertical({
      startY: e.clientY,
      startHeight: terminalHeight,
      minHeight: MIN_TERMINAL_HEIGHT,
      maxHeight: MAX_TERMINAL_HEIGHT,
      onResize: setTerminalHeight,
    })
  }

  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    resizeHorizontal({
      startX: e.clientX,
      startWidth: sidebarWidth,
      minWidth: MIN_SIDEBAR_WIDTH,
      maxWidth: MAX_SIDEBAR_WIDTH,
      onResize: setSidebarWidth,
    })
  }

  return (
    <div className="app-grain flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex flex-1 min-h-0 " onMouseDown={handleSidebarResizeStart}>
        <Sidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          folder={folder}
          tree={tree}
          onOpenFolder={handleOpenFolder}
          onOpenTerminal={() => setTerminalOpen((prev) => !prev)}
          renderNode={renderNode}
          width={sidebarOpen ? sidebarWidth : undefined}
        />

        <main className="flex flex-1 flex-col min-h-0 min-w-0 bg-background">
          <div className="flex flex-1 flex-col min-h-0 overflow-auto">
            {children}
          </div>
          {terminalOpen && (
            <>
                <div 
                className="flex h-full min-h-0 flex-col pt-2"
                onMouseDown={handleTerminalResizeStart}
                style={{
                  height: terminalHeight,
                  minHeight: MIN_TERMINAL_HEIGHT,
                  maxHeight: MAX_TERMINAL_HEIGHT,
                }}
                >
                  <Terminal
                  command=""
                  cwd={folder ?? "~"}
                />
                </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
