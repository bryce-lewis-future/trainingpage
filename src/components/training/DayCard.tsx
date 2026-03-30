import { useRef, useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export type Status = 'not-started' | 'in-progress' | 'complete'

export interface DayCardProps {
  date: string
  title: string
  subtitle: string
  status: Status
  estimatedTime: string
  onTitleChange?: (value: string) => void
  onSubtitleChange?: (value: string) => void
}

export const statusConfig: Record<Status, { label: string; variant: 'secondary' | 'default' | 'outline' }> = {
  'not-started': { label: 'Not Started', variant: 'secondary' },
  'in-progress': { label: 'In Progress', variant: 'default' },
  'complete': { label: 'Complete', variant: 'outline' },
}

export function DayHeader({ date, title, subtitle, estimatedTime, onTitleChange, onSubtitleChange }: DayCardProps) {
  const titleRef = useRef<HTMLSpanElement>(null)
  const subtitleRef = useRef<HTMLSpanElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [titleValue, setTitleValue] = useState(title)
  const [subtitleValue, setSubtitleValue] = useState(subtitle)
  const [subtitleExpanded, setSubtitleExpanded] = useState(false)

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current) }, [])

  const editableClass = 'cursor-text outline-none'

  return (
    <div className="flex flex-col items-start gap-1.5 px-1 text-left">
      <div className="flex w-full items-baseline justify-between gap-2">
        <span
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          className={`text-base font-semibold text-foreground leading-snug ${editableClass}`}
          onBlur={(e) => {
            const val = e.currentTarget.textContent ?? ''
            setTitleValue(val)
            onTitleChange?.(val)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault()
              titleRef.current?.blur()
            }
            if (e.key === 'Tab' && !e.shiftKey) {
              e.preventDefault()
              subtitleRef.current?.focus()
            }
          }}
        >
          {titleValue}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
      </div>
      <div
        className="flex w-full items-baseline justify-between gap-2"
        onMouseEnter={() => { hoverTimer.current = setTimeout(() => setSubtitleExpanded(true), 800) }}
        onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setSubtitleExpanded(false) }}
      >
        <span
          ref={subtitleRef}
          contentEditable
          suppressContentEditableWarning
          className={`min-w-0 text-xs text-muted-foreground ${subtitleExpanded ? 'whitespace-normal' : 'truncate'} ${editableClass}`}
          onBlur={(e) => {
            const val = e.currentTarget.textContent ?? ''
            setSubtitleValue(val)
            onSubtitleChange?.(val)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              subtitleRef.current?.blur()
            }
            if (e.key === 'Tab' && e.shiftKey) {
              e.preventDefault()
              titleRef.current?.focus()
            }
          }}
        >
          {subtitleValue}
        </span>
        <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {estimatedTime}
        </span>
      </div>
    </div>
  )
}

