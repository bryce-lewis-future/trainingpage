import { GripVertical } from 'lucide-react'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'

interface DragHandleProps {
  listeners?: DraggableSyntheticListeners
  attributes?: DraggableAttributes
  handleRef?: (el: HTMLButtonElement | null) => void
}

export function DragHandle({ listeners, attributes, handleRef }: DragHandleProps) {
  return (
    <button
      ref={handleRef}
      {...listeners}
      {...attributes}
      tabIndex={-1}
      aria-label="Drag to reorder"
      className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-150
                 cursor-grab active:cursor-grabbing touch-none shrink-0 p-0.5 -ml-1
                 text-muted-foreground/50 hover:text-muted-foreground"
    >
      <GripVertical className="size-4" />
    </button>
  )
}
