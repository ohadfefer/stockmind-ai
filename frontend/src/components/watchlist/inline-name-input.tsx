"use client"

import { useState, useRef, useEffect } from "react"
import { Check, X } from "lucide-react"

interface InlineNameInputProps {
  placeholder?: string
  onSave: (name: string) => void
  onCancel: () => void
}

export function InlineNameInput({ placeholder = "Watchlist name", onSave, onCancel }: InlineNameInputProps) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && value.trim()) {
      onSave(value.trim())
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  return (
    <div className="flex items-center gap-1 px-1.5 py-1.5">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-7 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        onClick={onCancel}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="size-4" />
        <span className="sr-only">Cancel</span>
      </button>
      <button
        onClick={() => value.trim() && onSave(value.trim())}
        disabled={!value.trim()}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
      >
        <Check className="size-4" />
        <span className="sr-only">Save</span>
      </button>
    </div>
  )
}
