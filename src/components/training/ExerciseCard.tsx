import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ExerciseSearchPopover } from '@/components/training/ExerciseSearchPopover'
import type { Exercise } from '@/data/exercises'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: Exercise
  onExerciseChange?: (exercise: Exercise) => void
  autoOpen?: boolean
  className?: string
}

export function ExerciseCard({ exercise, onExerciseChange, autoOpen, className }: ExerciseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <Card ref={cardRef} className={cn(className)}>
      <CardContent className="px-4 pb-4">
        <ExerciseSearchPopover
          currentExercise={exercise}
          onSelect={onExerciseChange ?? (() => {})}
          anchorRef={cardRef}
          autoOpen={autoOpen}
        />
      </CardContent>
    </Card>
  )
}
