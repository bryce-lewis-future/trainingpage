import { Dumbbell } from 'lucide-react'
import type { Exercise } from '@/data/exercises'
import { getBestSet, getMostRecentSet } from '@/lib/history'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatCard({ label, weight, reps, unit, date }: {
  label: string
  weight: number | null
  reps: number | null
  unit: string
  date: string | null
}) {
  const hasData = weight != null && reps != null
  return (
    <div className="rounded-xl bg-foreground/5 p-3 flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {hasData ? (
        <>
          <span className="text-sm font-semibold text-foreground">
            {weight} {unit} × {reps} reps
          </span>
          {date && <span className="text-[11px] text-muted-foreground">{formatDate(date)}</span>}
        </>
      ) : (
        <span className="text-sm font-semibold text-muted-foreground">—</span>
      )}
    </div>
  )
}

export function ExerciseSidebar({ exercise }: { exercise: Exercise | null }) {
  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <Dumbbell className="size-6 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">Select an exercise to see details</p>
      </div>
    )
  }

  const best = getBestSet(exercise.id)
  const recent = getMostRecentSet(exercise.id)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">Exercise</p>
        <p className="text-sm font-semibold text-foreground leading-snug">{exercise.name}</p>
      </div>
      <div className="flex flex-col gap-2">
        <StatCard
          label="Best Set"
          weight={best?.weight ?? null}
          reps={best?.reps ?? null}
          unit={best?.weightUnit ?? 'lbs'}
          date={best?.date ?? null}
        />
        <StatCard
          label="Most Recent"
          weight={recent?.weight ?? null}
          reps={recent?.reps ?? null}
          unit={recent?.weightUnit ?? 'lbs'}
          date={recent?.date ?? null}
        />
      </div>
    </div>
  )
}
