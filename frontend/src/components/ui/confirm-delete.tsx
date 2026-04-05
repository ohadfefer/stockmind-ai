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
    <div
      className={`grid w-[60px] grid-cols-[28px_28px] items-center justify-end gap-1 ml-auto transition-opacity ${
        confirming ? "opacity-100" : className
      }`}
    >
      {confirming ? (
        <>
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
        </>
      ) : (
        <>
          <span />
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
        </>
      )}
    </div>
  )
}
