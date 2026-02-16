"use client"

import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "primary" | "ghost"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", className = "", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] disabled:opacity-50"
    const variants = {
      primary:
        "bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent-hover)]",
      ghost:
        "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--accent-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]",
    }
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export default Button
