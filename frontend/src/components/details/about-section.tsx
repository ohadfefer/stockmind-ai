"use client"

import { useState } from "react"
import clsx from "clsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronUp } from "lucide-react"

interface AboutSectionProps {
  companyName: string
  description: string
}

export function AboutSection({ companyName, description }: AboutSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">About</CardTitle>
          <ChevronUp
            className={clsx(
              "size-5 text-muted-foreground transition-transform",
              !isOpen && "rotate-180"
            )}
          />
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </CardContent>
      )}
    </Card>
  )
}
