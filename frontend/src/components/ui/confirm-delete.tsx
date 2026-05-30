"use client"

import { useState } from "react"
import { Check, X, Trash2 } from "lucide-react"

interface ConfirmDeleteProps {
  onDelete: () => void | Promise<void>
  confirming?: boolean
  onConfirmingChange?: (confirming: boolean) => void
  className?: string
}

export function ConfirmDelete({
  onDelete,
  confirming: controlledConfirming,
  onConfirmingChange,
  className = "",
}: ConfirmDeleteProps) {
  const [internalConfirming, setInternalConfirming] = useState(false)

  const controlled = controlledConfirming !== undefined
  const confirming = controlled ? controlledConfirming : internalConfirming

  function setConfirming(value: boolean) {
    if (controlled) {
      onConfirmingChange?.(value)
    } else {
      setInternalConfirming(value)
    }
  }

  const buttonClass =
    "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"

  return (
    <div className="relative ml-auto h-7 w-[60px]">
      {/* Trash layer — no transition, so the hover reveal is instant. Keeps the
          hover-reveal className so a non-hovered row that stops confirming never
          flashes the trash icon; it just stays hidden. inert when confirming so
          the hidden trash button leaves the tab order and a11y tree. */}
      <div
        inert={confirming}
        className={`absolute inset-0 flex items-center justify-end ${
          confirming ? "opacity-0" : className
        }`}
      >
        <button
          className={buttonClass}
          onClick={(e) => {
            e.stopPropagation()
            setConfirming(true)
          }}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Remove</span>
        </button>
      </div>

      {/* Confirm layer — cross-fades in over the trash button. inert until
          confirming so the hidden Cancel/Confirm buttons leave the tab order
          and a11y tree. */}
      <div
        inert={!confirming}
        className={`absolute inset-0 flex items-center justify-end gap-1 transition-opacity ${
          confirming ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          className={buttonClass}
          onClick={(e) => {
            e.stopPropagation()
            setConfirming(false)
          }}
        >
          <X className="size-4" />
          <span className="sr-only">Cancel</span>
        </button>
        <button
          className={buttonClass}
          onClick={(e) => {
            e.stopPropagation()
            setConfirming(false)
            onDelete()
          }}
        >
          <Check className="size-4" />
          <span className="sr-only">Confirm remove</span>
        </button>
      </div>
    </div>
  )
}
