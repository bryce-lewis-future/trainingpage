import historyData from '../../data/client-history.json'

interface HistorySet {
  type: string
  reps: number
  weight: number
  weightUnit: string
  completed: boolean
  timestamp: string
}

interface HistoryExercise {
  exerciseId: string
  sets: HistorySet[]
}

interface HistorySession {
  id: string
  date: string
  title: string
  exercises: HistoryExercise[]
}

export interface SetResult {
  weight: number
  reps: number
  weightUnit: string
  date: string
  sessionTitle: string
}

const sessions = historyData.sessions as HistorySession[]

export function getBestSet(exerciseId: string): SetResult | null {
  let best: SetResult | null = null

  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (ex.exerciseId !== exerciseId) continue
      for (const set of ex.sets) {
        if (set.type !== 'working' || !set.completed || set.weight == null || set.reps == null) continue
        if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
          best = { weight: set.weight, reps: set.reps, weightUnit: set.weightUnit, date: session.date, sessionTitle: session.title }
        }
      }
    }
  }

  return best
}

export function getMostRecentSet(exerciseId: string): SetResult | null {
  const relevant = sessions
    .filter(s => s.exercises.some(e => e.exerciseId === exerciseId))
    .sort((a, b) => b.date.localeCompare(a.date))

  const session = relevant[0]
  if (!session) return null

  const ex = session.exercises.find(e => e.exerciseId === exerciseId)
  if (!ex) return null

  const workingSets = ex.sets.filter(s => s.type === 'working' && s.completed && s.weight != null && s.reps != null)
  const set = workingSets[workingSets.length - 1]
  if (!set) return null

  return { weight: set.weight, reps: set.reps, weightUnit: set.weightUnit, date: session.date, sessionTitle: session.title }
}
