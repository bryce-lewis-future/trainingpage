import { cn } from '@/lib/utils'

const DIFFICULTY_LEVELS = ['Easy', 'Moderate', 'Hard', 'Very Hard', 'Extreme'] as const
const DIFFICULTY_COLORS = ['text-emerald-500', 'text-yellow-500', 'text-orange-500', 'text-red-500', 'text-red-700'] as const
const SEGMENT_COLORS = ['bg-emerald-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-red-700'] as const

function getDifficultyLevel(totalSets: number): number {
  if (totalSets <= 8) return 0
  if (totalSets <= 16) return 1
  if (totalSets <= 25) return 2
  if (totalSets <= 35) return 3
  return 4
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-foreground/5 p-3 flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </div>
  )
}

export function DaySidebar({ exerciseCount, totalSets }: { exerciseCount: number; totalSets: number }) {
  const level = getDifficultyLevel(totalSets)
  const label = DIFFICULTY_LEVELS[level]
  const labelColor = DIFFICULTY_COLORS[level]

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Exercises" value={exerciseCount} />
        <StatCard label="Total Sets" value={totalSets} />
      </div>

      {/* Difficulty */}
      <div className="rounded-xl bg-foreground/5 p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Expected Difficulty
          </span>
          <span className={cn('text-xs font-semibold', labelColor)}>{label}</span>
        </div>

        {/* 5-segment bar */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                i <= level ? SEGMENT_COLORS[level] : 'bg-foreground/10'
              )}
            />
          ))}
        </div>

        {/* Sub-metrics */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Volume</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', SEGMENT_COLORS[level])}
                  style={{ width: `${Math.min(100, (totalSets / 40) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right">
                {totalSets} sets
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Intensity</span>
            <span className="text-[11px] text-muted-foreground">RPE not set</span>
          </div>
        </div>
      </div>
    </div>
  )
}
