import { useLayoutEffect, useRef } from 'react'
import type { WorkoutItem } from '@/pages/DayView'

interface DurationPanelProps {
  items: WorkoutItem[]
  panelOffsets: Map<string, number>
  containerHeight: number
  setCounts: Map<string, number>
  setCountVersion: number
  defaultSetCount: number
  dayAnchorId?: string
  onUpdateSection: (id: string, estimatedTime: string) => void
  onUpdateExercise: (id: string, estimatedTime: string) => void
}

const ROW_H = 20

function computeMinutes(sets: number): number {
  return sets + Math.max(0, sets - 1) * 2 // 1min/set + 2min rest between
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h${m}m`
}

function computeEstimate(sets: number): string {
  return formatMinutes(computeMinutes(sets))
}

function DurationInput({
  value,
  computed,
  onChange,
}: {
  value: string | undefined
  computed?: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const hasOverride = Boolean(value)

  // contentEditable doesn't re-render from props — sync computed value imperatively before paint
  useLayoutEffect(() => {
    if (!hasOverride && ref.current && ref.current !== document.activeElement) {
      ref.current.textContent = computed || ''
    }
  }, [computed, hasOverride])

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`shrink-0 min-w-[2.5ch] text-right outline-none cursor-text ${hasOverride ? 'text-foreground/70' : 'text-muted-foreground/40'}`}
      onBlur={e => onChange(e.currentTarget.textContent ?? '')}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault()
          ref.current?.blur()
        }
      }}
    >
      {value || computed || ''}
    </span>
  )
}

export function DurationPanel({
  items,
  panelOffsets,
  containerHeight,
  setCounts,
  setCountVersion: _setCountVersion, // consumed only to trigger re-render
  defaultSetCount,
  dayAnchorId,
  onUpdateSection,
  onUpdateExercise,
}: DurationPanelProps) {
  const rows: {
    id: string
    value: string | undefined
    computed?: string
    onChange: (v: string) => void
  }[] = []

  let totalMins = 0

  for (const item of items) {
    if (item.type === 'exercise') {
      const sets = setCounts.get(item.id) ?? defaultSetCount
      totalMins += computeMinutes(sets)
      rows.push({
        id: item.id,
        value: item.estimatedTime,
        computed: computeEstimate(sets),
        onChange: v => onUpdateExercise(item.id, v),
      })
    } else {
      // Sum all children (regardless of collapse) for the section computed total
      const sectionMins = item.children.reduce((sum, child) => {
        return sum + computeMinutes(setCounts.get(child.id) ?? defaultSetCount)
      }, 0)
      totalMins += sectionMins
      rows.push({
        id: item.id,
        value: item.estimatedTime,
        computed: sectionMins > 0 ? formatMinutes(sectionMins) : undefined,
        onChange: v => onUpdateSection(item.id, v),
      })
      if (!item.collapsed) {
        for (const child of item.children) {
          const sets = setCounts.get(child.id) ?? defaultSetCount
          rows.push({
            id: child.id,
            value: child.estimatedTime,
            computed: computeEstimate(sets),
            onChange: v => onUpdateExercise(child.id, v),
          })
        }
      }
    }
  }

  const dayMidY = dayAnchorId ? panelOffsets.get(dayAnchorId) : undefined

  // Collect all visible midY values in top-to-bottom order for connector lines
  const allMidYs: number[] = []
  if (dayMidY !== undefined && totalMins > 0) allMidYs.push(dayMidY)
  for (const { id } of rows) {
    const midY = panelOffsets.get(id)
    if (midY !== undefined) allMidYs.push(midY)
  }

  return (
    <div
      className="w-16 shrink-0 relative text-xs"
      style={{ height: containerHeight || undefined }}
    >
      {/* Connector lines between consecutive rows */}
      {allMidYs.map((midY, i) => {
        if (i === allMidYs.length - 1) return null
        const nextMidY = allMidYs[i + 1]
        const top = Math.round(midY + ROW_H / 2)
        const height = Math.max(0, Math.round(nextMidY - ROW_H / 2) - top)
        if (height <= 0) return null
        return (
          <div
            key={`line-${i}`}
            className="absolute right-3 w-px bg-border"
            style={{ top, height }}
          />
        )
      })}
      {dayMidY !== undefined && totalMins > 0 && (
        <div
          className="absolute inset-x-0 flex items-center justify-end pr-1"
          style={{ top: Math.round(dayMidY - ROW_H / 2), height: ROW_H }}
        >
          <span className="shrink-0 min-w-[2.5ch] text-right text-muted-foreground/40">
            {formatMinutes(totalMins)}
          </span>
        </div>
      )}
      {rows.map(({ id, value, computed, onChange }) => {
        const midY = panelOffsets.get(id)
        if (midY === undefined) return null
        return (
          <div
            key={id}
            className="absolute inset-x-0 flex items-center justify-end pr-1"
            style={{ top: Math.round(midY - ROW_H / 2), height: ROW_H }}
          >
            {value ? (
              // User has a manual override — keep contentEditable so they can edit it
              <DurationInput value={value} computed={computed} onChange={onChange} />
            ) : (
              // Auto-computed — plain span so React updates it normally
              <span className="shrink-0 min-w-[2.5ch] text-right text-muted-foreground/40">
                {computed || ''}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
