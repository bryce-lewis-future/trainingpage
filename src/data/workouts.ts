import type { Exercise } from './exercises'

// ─── Primitives ───────────────────────────────────────────────────────────────

export type SetType = 'warmup' | 'working' | 'drop' | 'failure' | 'rest-pause'

export type IntensityType = 'rpe' | 'percent-1rm' | 'rir'

export interface Intensity {
  type: IntensityType
  value: number // RPE 1–10, % 1RM 0–100, or RIR 0–5
}

export interface WorkSet {
  id: string
  type: SetType
  reps: number | null         // null = AMRAP
  weight: number | null       // null = bodyweight
  weightUnit: 'lbs' | 'kg'
  restSeconds: number         // rest after this set
  intensity: Intensity | null
  notes: string
  completed: boolean
}

// ─── Exercise Instance (exercise within a day) ────────────────────────────────

export interface WorkoutExercise {
  id: string
  exerciseId: string           // ref → exercises.ts
  order: number
  sets: WorkSet[]
  notes: string
  supersetGroupId: string | null  // exercises sharing an id are supersetted
}

// ─── Day ──────────────────────────────────────────────────────────────────────

export type DayStatus = 'not-started' | 'in-progress' | 'complete'

export interface WorkoutDay {
  id: string
  date: string
  title: string
  subtitle: string
  status: DayStatus
  estimatedMinutes: number
  exercises: WorkoutExercise[]
  notes: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function totalVolume(exercise: WorkoutExercise): number {
  return exercise.sets.reduce((acc, s) => {
    if (s.weight == null || s.reps == null) return acc
    return acc + s.weight * s.reps
  }, 0)
}

export function completedSets(exercise: WorkoutExercise): number {
  return exercise.sets.filter((s) => s.completed).length
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const mockDays: WorkoutDay[] = [
  {
    id: 'day-001',
    date: 'Monday, Mar 29',
    title: 'Upper Body Strength',
    subtitle: 'Focus on compound pushing movements',
    status: 'complete',
    estimatedMinutes: 55,
    notes: 'Keep rest times strict. Focus on bar path on press.',
    exercises: [
      {
        id: 'we-001',
        exerciseId: 'ex-001', // Barbell Bench Press
        order: 1,
        notes: 'Pause 1s at chest on working sets',
        supersetGroupId: null,
        sets: [
          { id: 's-001', type: 'warmup',  reps: 10, weight: 95,  weightUnit: 'lbs', restSeconds: 60,  intensity: null,                          notes: '', completed: true },
          { id: 's-002', type: 'warmup',  reps: 5,  weight: 135, weightUnit: 'lbs', restSeconds: 90,  intensity: null,                          notes: '', completed: true },
          { id: 's-003', type: 'working', reps: 5,  weight: 185, weightUnit: 'lbs', restSeconds: 180, intensity: { type: 'rpe', value: 7 },      notes: '', completed: true },
          { id: 's-004', type: 'working', reps: 5,  weight: 185, weightUnit: 'lbs', restSeconds: 180, intensity: { type: 'rpe', value: 8 },      notes: '', completed: true },
          { id: 's-005', type: 'working', reps: 4,  weight: 185, weightUnit: 'lbs', restSeconds: 180, intensity: { type: 'rpe', value: 9 },      notes: 'grinder', completed: true },
        ],
      },
      {
        id: 'we-002',
        exerciseId: 'ex-021', // Dumbbell Shoulder Press
        order: 2,
        notes: '',
        supersetGroupId: null,
        sets: [
          { id: 's-006', type: 'warmup',  reps: 12, weight: 25, weightUnit: 'lbs', restSeconds: 60,  intensity: null,                          notes: '', completed: true },
          { id: 's-007', type: 'working', reps: 10, weight: 45, weightUnit: 'lbs', restSeconds: 120, intensity: { type: 'rpe', value: 7 },      notes: '', completed: true },
          { id: 's-008', type: 'working', reps: 10, weight: 45, weightUnit: 'lbs', restSeconds: 120, intensity: { type: 'rpe', value: 8 },      notes: '', completed: true },
          { id: 's-009', type: 'working', reps: 8,  weight: 45, weightUnit: 'lbs', restSeconds: 120, intensity: { type: 'rpe', value: 9 },      notes: '', completed: true },
        ],
      },
      {
        id: 'we-003',
        exerciseId: 'ex-022', // Lateral Raise
        order: 3,
        notes: 'Superset with tricep pushdown',
        supersetGroupId: 'ss-001',
        sets: [
          { id: 's-010', type: 'working', reps: 15, weight: 15, weightUnit: 'lbs', restSeconds: 30,  intensity: { type: 'rir', value: 2 },      notes: '', completed: true },
          { id: 's-011', type: 'working', reps: 15, weight: 15, weightUnit: 'lbs', restSeconds: 30,  intensity: { type: 'rir', value: 1 },      notes: '', completed: true },
          { id: 's-012', type: 'working', reps: 12, weight: 15, weightUnit: 'lbs', restSeconds: 30,  intensity: { type: 'rir', value: 0 },      notes: '', completed: true },
        ],
      },
      {
        id: 'we-004',
        exerciseId: 'ex-035', // Tricep Pushdown
        order: 4,
        notes: 'Superset with lateral raise',
        supersetGroupId: 'ss-001',
        sets: [
          { id: 's-013', type: 'working', reps: 12, weight: 50, weightUnit: 'lbs', restSeconds: 90,  intensity: { type: 'rir', value: 2 },      notes: '', completed: true },
          { id: 's-014', type: 'working', reps: 12, weight: 50, weightUnit: 'lbs', restSeconds: 90,  intensity: { type: 'rir', value: 1 },      notes: '', completed: true },
          { id: 's-015', type: 'working', reps: null, weight: 50, weightUnit: 'lbs', restSeconds: 90, intensity: { type: 'rir', value: 0 },     notes: 'AMRAP', completed: true },
        ],
      },
    ],
  },

  {
    id: 'day-002',
    date: 'Tuesday, Mar 30',
    title: 'Lower Body Power',
    subtitle: 'Squats, deadlifts, and plyometrics',
    status: 'in-progress',
    estimatedMinutes: 60,
    notes: 'Prioritize depth on squats. Belt on top sets.',
    exercises: [
      {
        id: 'we-005',
        exerciseId: 'ex-064', // Back Squat
        order: 1,
        notes: '3-second eccentric on all working sets',
        supersetGroupId: null,
        sets: [
          { id: 's-016', type: 'warmup',  reps: 10, weight: 135, weightUnit: 'lbs', restSeconds: 90,  intensity: null,                         notes: '', completed: true },
          { id: 's-017', type: 'warmup',  reps: 5,  weight: 185, weightUnit: 'lbs', restSeconds: 120, intensity: null,                         notes: '', completed: true },
          { id: 's-018', type: 'working', reps: 5,  weight: 225, weightUnit: 'lbs', restSeconds: 240, intensity: { type: 'rpe', value: 7 },     notes: '', completed: true },
          { id: 's-019', type: 'working', reps: 5,  weight: 225, weightUnit: 'lbs', restSeconds: 240, intensity: { type: 'rpe', value: 8 },     notes: '', completed: false },
          { id: 's-020', type: 'working', reps: 5,  weight: 225, weightUnit: 'lbs', restSeconds: 240, intensity: { type: 'rpe', value: 8 },     notes: '', completed: false },
        ],
      },
      {
        id: 'we-006',
        exerciseId: 'ex-058', // Hip Thrust
        order: 2,
        notes: '',
        supersetGroupId: null,
        sets: [
          { id: 's-021', type: 'working', reps: 10, weight: 135, weightUnit: 'lbs', restSeconds: 120, intensity: { type: 'rpe', value: 7 },     notes: '', completed: false },
          { id: 's-022', type: 'working', reps: 10, weight: 155, weightUnit: 'lbs', restSeconds: 120, intensity: { type: 'rpe', value: 8 },     notes: '', completed: false },
          { id: 's-023', type: 'working', reps: 10, weight: 155, weightUnit: 'lbs', restSeconds: 120, intensity: { type: 'rpe', value: 8 },     notes: '', completed: false },
        ],
      },
      {
        id: 'we-007',
        exerciseId: 'ex-096', // Box Jump
        order: 3,
        notes: 'Stick the landing, reset fully between reps',
        supersetGroupId: null,
        sets: [
          { id: 's-024', type: 'working', reps: 5,  weight: null, weightUnit: 'lbs', restSeconds: 120, intensity: null,                        notes: '', completed: false },
          { id: 's-025', type: 'working', reps: 5,  weight: null, weightUnit: 'lbs', restSeconds: 120, intensity: null,                        notes: '', completed: false },
          { id: 's-026', type: 'working', reps: 5,  weight: null, weightUnit: 'lbs', restSeconds: 120, intensity: null,                        notes: '', completed: false },
        ],
      },
    ],
  },

  {
    id: 'day-003',
    date: 'Wednesday, Mar 31',
    title: 'Active Recovery',
    subtitle: 'Mobility, stretching, and light cardio',
    status: 'not-started',
    estimatedMinutes: 30,
    notes: 'Keep heart rate under 130bpm. Focus on breathing.',
    exercises: [
      {
        id: 'we-008',
        exerciseId: 'ex-092', // Treadmill Run
        order: 1,
        notes: 'Zone 2 — conversational pace',
        supersetGroupId: null,
        sets: [
          { id: 's-027', type: 'working', reps: 1, weight: null, weightUnit: 'lbs', restSeconds: 0, intensity: { type: 'rpe', value: 3 },       notes: '20 min steady state', completed: false },
        ],
      },
      {
        id: 'we-009',
        exerciseId: 'ex-046', // Plank
        order: 2,
        notes: '',
        supersetGroupId: null,
        sets: [
          { id: 's-028', type: 'working', reps: 1, weight: null, weightUnit: 'lbs', restSeconds: 60, intensity: null,                           notes: '60 sec hold', completed: false },
          { id: 's-029', type: 'working', reps: 1, weight: null, weightUnit: 'lbs', restSeconds: 60, intensity: null,                           notes: '60 sec hold', completed: false },
        ],
      },
      {
        id: 'we-010',
        exerciseId: 'ex-047', // Side Plank
        order: 3,
        notes: '',
        supersetGroupId: null,
        sets: [
          { id: 's-030', type: 'working', reps: 1, weight: null, weightUnit: 'lbs', restSeconds: 45, intensity: null,                           notes: '30 sec each side', completed: false },
          { id: 's-031', type: 'working', reps: 1, weight: null, weightUnit: 'lbs', restSeconds: 45, intensity: null,                           notes: '30 sec each side', completed: false },
        ],
      },
    ],
  },
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getDayById(id: string): WorkoutDay | undefined {
  return mockDays.find((d) => d.id === id)
}

export function getExercisesForDay(day: WorkoutDay, exerciseDb: Exercise[]): Array<{ workoutExercise: WorkoutExercise; exercise: Exercise }> {
  return day.exercises
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((we) => ({
      workoutExercise: we,
      exercise: exerciseDb.find((e) => e.id === we.exerciseId)!,
    }))
}
