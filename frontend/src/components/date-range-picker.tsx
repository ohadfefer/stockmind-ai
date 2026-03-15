"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface DateRangePickerProps {
  from: Date
  to: Date
  onRangeChange: (from: Date, to: Date) => void
}

export function DateRangePicker({ from, to, onRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>({ from, to })

  const today = new Date()
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
  const canApply = range?.from && range?.to
  const tooOld = range?.from && range.from < oneYearAgo

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) setRange({ from, to })
    }}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 text-sm font-normal">
          <CalendarIcon className="size-4 text-muted-foreground" />
          {formatDate(from)} – {formatDate(to)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          captionLayout="dropdown-years"
          startMonth={new Date(2020, 0)}
          endMonth={today}
          disabled={{ after: today }}
          defaultMonth={to}
        />
        <div className="flex items-center justify-between border-t p-3">
          {tooOld ? (
            <p className="text-xs text-destructive">
              Dates must be within the last year.
            </p>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const now = new Date()
                const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
                setRange({ from: twoDaysAgo, to: now })
                onRangeChange(twoDaysAgo, now)
                setOpen(false)
              }}
            >
              Reset
            </Button>
            <Button
              size="sm"
              disabled={!canApply || !!tooOld}
              onClick={() => {
                if (range?.from && range?.to) {
                  onRangeChange(range.from, range.to)
                  setOpen(false)
                }
              }}
            >
              Filter
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
