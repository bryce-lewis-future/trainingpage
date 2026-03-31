import { useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { Card, CardContent } from '@/components/ui/card'
import { ExerciseSearchPopover } from '@/components/training/ExerciseSearchPopover'
import type { Exercise } from '@/data/exercises'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: Exercise
  onExerciseChange?: (exercise: Exercise) => void
  onDelete?: () => void
  onCancel?: () => void
  autoOpen?: boolean
  className?: string
}

export function ExerciseCard({ exercise, onExerciseChange, onDelete, onCancel, autoOpen, className }: ExerciseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Card ref={cardRef} className={cn('group/card', className)}>
      <CardContent className="px-4 pb-4">
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
      </CardContent>
    </Card>
  )
}
