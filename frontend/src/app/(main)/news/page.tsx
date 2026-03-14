"use client"

import { useState } from "react"
import { NewsFeed } from "@/components/details/news-feed"

const categories = [
  { value: "general", label: "General" },
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Crypto" },
  { value: "merger", label: "Merger" },
] as const

export default function NewsPage() {
  const [category, setCategory] = useState("general")

  return (
    <>
      <div className="flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === cat.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <NewsFeed category={category} />
    </>
  )
}
