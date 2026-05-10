"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, CloudUpload, ListPlus } from "lucide-react"

export default function ConnectManualPage() {
  const router = useRouter()

  return (
    <div className="w-full max-w-4xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
        <span className="text-muted-foreground">Manual Upload</span>
      </div>

      <h1 className="text-2xl font-bold text-foreground">Manually Add Investments</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Upload Investment Account File</h2>

          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
              <CloudUpload className="size-5" />
            </span>
            <p className="text-sm text-foreground">
              Drag and drop or{" "}
              <button type="button" className="text-primary underline-offset-4 hover:underline">
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              Supported file formats: CSV, JPEG, JPG, PNG, PDF
            </p>
            <button type="button" className="text-xs text-foreground underline-offset-4 hover:underline">
              Download CSV Template
            </button>
          </div>

          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center rounded-lg bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground"
          >
            Continue
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Build from Scratch</h2>

          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
              <ListPlus className="size-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">Manually add your investments</p>
            <p className="text-xs text-muted-foreground">Type in tickers and shares manually</p>
          </div>

          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center rounded-lg bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
