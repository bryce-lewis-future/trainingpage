import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { Card, CardContent } from '@/components/ui/card'
import { ExerciseSearchPopover } from '@/components/training/ExerciseSearchPopover'
import type { Exercise } from '@/data/exercises'
import { cn } from '@/lib/utils'

export interface SetRow {
  id: string
  weight: string
  reps: string
}

interface ExerciseCardProps {
  exercise: Exercise
  onExerciseChange?: (exercise: Exercise) => void
  onDelete?: () => void
  onCancel?: () => void
  autoOpen?: boolean
  showSets?: boolean
  selectedSetIndex?: number
  onSetCountChange?: (count: number) => void
  onSetAdded?: (newIndex: number) => void
  insertSetCmd?: { afterIndex: number } | null
  deleteSetCmd?: { index: number } | null
  onSetDeleted?: (newIndex: number | null) => void
  defaultSetCount?: number
  className?: string
}

function SetsTable({
  selectedSetIndex,
  onSetCountChange,
  onSetAdded,
  insertSetCmd,
  deleteSetCmd,
  onSetDeleted,
  defaultSetCount,
}: {
  selectedSetIndex?: number
  onSetCountChange?: (count: number) => void
  onSetAdded?: (newIndex: number) => void
  insertSetCmd?: { afterIndex: number } | null
  deleteSetCmd?: { index: number } | null
  onSetDeleted?: (newIndex: number | null) => void
  defaultSetCount?: number
}) {
  const [sets, setSets] = useState<SetRow[]>(() =>
    Array.from({ length: defaultSetCount ?? 1 }, () => ({ id: crypto.randomUUID(), weight: '', reps: '' }))
  )
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | null>(null)
  const displayIndex = selectedSetIndex ?? localSelectedIndex

  useEffect(() => {
    onSetCountChange?.(sets.length)
  }, [sets.length, onSetCountChange])

  useEffect(() => {
    if (selectedSetIndex === undefined) setLocalSelectedIndex(null)
  }, [selectedSetIndex])

  useEffect(() => {
    if (!insertSetCmd) return
    setSets(prev => {
      const insertAt = insertSetCmd.afterIndex + 1
      const next = [...prev]
      next.splice(insertAt, 0, { id: crypto.randomUUID(), weight: '', reps: '' })
      return next
    })
  }, [insertSetCmd])

  useEffect(() => {
    if (!deleteSetCmd) return
    setSets(prev => {
      const next = prev.filter((_, i) => i !== deleteSetCmd.index)
      const newIndex = next.length === 0 ? null : Math.min(deleteSetCmd.index, next.length - 1)
      onSetDeleted?.(newIndex)
      return next
    })
  }, [deleteSetCmd])

  function addSet() {
    setSets(prev => {
      const next = [...prev, { id: crypto.randomUUID(), weight: '', reps: '' }]
      const newIndex = next.length - 1
      setLocalSelectedIndex(newIndex)
      onSetAdded?.(newIndex)
      return next
    })
  }

  function updateSet(id: string, field: keyof Omit<SetRow, 'id'>, value: string) {
    setSets(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  return (
    <div className="mt-2 border-t border-border/50 pt-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground">
            <th className="w-8 pb-1 text-center font-medium">Set</th>
            <th className="pb-1 text-center font-medium">Weight</th>
            <th className="pb-1 text-center font-medium">Reps</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((set, i) => (
            <tr
              key={set.id}
              className={cn(
                'group/row rounded',
                displayIndex === i && 'outline outline-2 outline-offset-[-1px] outline-[var(--sel-ring)]',
              )}
            >
              <td className={cn('py-0.5 text-center', displayIndex === i ? 'text-foreground' : 'text-muted-foreground')}>
                {i + 1}
              </td>
              <td className="py-0.5 px-1">
                <input
                  type="text"
                  value={set.weight}
                  onChange={e => updateSet(set.id, 'weight', e.target.value)}
                  placeholder="—"
                  className="w-full rounded bg-transparent px-1.5 py-0.5 text-center text-foreground placeholder:text-muted-foreground/40 outline-none focus:bg-muted"
                />
              </td>
              <td className="py-0.5 px-1">
                <input
                  type="text"
                  value={set.reps}
                  onChange={e => updateSet(set.id, 'reps', e.target.value)}
                  placeholder="—"
                  className="w-full rounded bg-transparent px-1.5 py-0.5 text-center text-foreground placeholder:text-muted-foreground/40 outline-none focus:bg-muted"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        tabIndex={-1}
        onClick={addSet}
        className="mt-1 flex w-full items-center justify-center gap-1 rounded py-0.5 text-xs text-muted-foreground/60 transition-colors hover:bg-muted hover:text-muted-foreground"
      >
        <Plus className="size-3" />
        Add set
      </button>
    </div>
  )
}

export function ExerciseCard({ exercise, onExerciseChange, onDelete, onCancel, autoOpen, showSets, selectedSetIndex, onSetCountChange, onSetAdded, insertSetCmd, deleteSetCmd, onSetDeleted, defaultSetCount, className }: ExerciseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Card ref={cardRef} className={cn('group/card', className)}>
      <CardContent className="px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <ExerciseSearchPopover
              currentExercise={exercise}
              onSelect={onExerciseChange ?? (() => {})}
              anchorRef={cardRef}
              autoOpen={autoOpen}
              onCancel={onCancel}
            />
          </div>
          <PopoverPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverPrimitive.Trigger
              tabIndex={-1}
              className="shrink-0 flex items-center justify-center size-5 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover/card:opacity-100 transition-[opacity,color] duration-200"
            >
              <MoreHorizontal className="size-3.5" />
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Positioner side="bottom" align="end" sideOffset={6} positionMethod="fixed" collisionPadding={8}>
                <PopoverPrimitive.Popup
                  className={cn(
                    'z-60 w-44 overflow-hidden rounded-xl',
                    'bg-card shadow-xl ring-1 ring-foreground/10',
                    'transition-[opacity,scale] duration-150 ease-out',
                    'data-starting-style:scale-[0.98] data-starting-style:opacity-0',
                    'data-ending-style:scale-[0.98] data-ending-style:opacity-0',
                  )}
                >
                  <ul className="p-1">
                    <li>
                      <button
                        tabIndex={-1}
                        onMouseDown={e => { e.preventDefault(); setMenuOpen(false); onDelete?.() }}
                        className="flex w-full items-center rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-muted hover:text-red-600"
                      >
                        Delete exercise
                      </button>
                    </li>
                  </ul>
                </PopoverPrimitive.Popup>
              </PopoverPrimitive.Positioner>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>
        </div>
        <div
          className="grid transition-[grid-template-rows] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ gridTemplateRows: showSets ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div
              className="transition-opacity duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ opacity: showSets ? 1 : 0 }}
            >
              <SetsTable
                selectedSetIndex={selectedSetIndex}
                onSetCountChange={onSetCountChange}
                onSetAdded={onSetAdded}
                insertSetCmd={insertSetCmd}
                deleteSetCmd={deleteSetCmd}
                onSetDeleted={onSetDeleted}
                defaultSetCount={defaultSetCount}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
