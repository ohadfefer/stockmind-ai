"use client"

import { useState } from "react"
import { Newspaper } from "lucide-react"

interface NewsImageProps {
  src: string | null | undefined
}

export function NewsImage({ src }: NewsImageProps) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) {
    return (
      <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Newspaper className="size-6 text-muted-foreground" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className="size-20 shrink-0 rounded-lg object-cover"
      onError={() => setBroken(true)}
    />
  )
}
