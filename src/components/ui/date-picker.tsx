"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: string // Expected format: YYYY-MM-DD
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  fromYear?: number
  toYear?: number
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
}

export function DatePicker({
  date,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  fromYear = 1900,
  toYear = new Date().getFullYear() + 20,
  side = "bottom",
  align = "start",
}: DatePickerProps) {
  // Parse the date string safely
  const selectedDate = React.useMemo(() => {
    if (!date) return undefined
    const parsed = parseISO(date)
    return isValid(parsed) ? parsed : undefined
  }, [date])

  const handleSelect = (selected: Date | undefined) => {
    if (onChange) {
      if (selected && isValid(selected)) {
        // Format back to YYYY-MM-DD string to maintain compatibility with existing logic
        onChange(format(selected, "yyyy-MM-dd"))
      } else {
        onChange("")
      }
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal bg-background/50 border-primary/20 hover:bg-primary/5 hover:border-primary/30 transition-all h-10",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary/70" />
            {selectedDate ? (
              format(selectedDate, "PPP")
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 border-primary/20 shadow-xl"
          side={side}
          align={align}
          sideOffset={4}
          collisionPadding={16}
          avoidCollisions
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
            fromYear={fromYear}
            toYear={toYear}
            captionLayout="dropdown"
            className="rounded-md border-0"
          />
        </PopoverContent>
      </Popover>
      {date && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
          onClick={() => handleSelect(undefined)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
