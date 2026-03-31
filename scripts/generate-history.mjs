/**
 * generate-history.mjs
 * Generates a 6-month workout history for client "Alex" (30yo male, intermediate).
 * Usage: node scripts/generate-history.mjs
 * Output: data/client-history.json
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'

// ── Seeded RNG (Mulberry32) ──────────────────────────────────────────────────
let _seed = 0xABCD1234
function rng() {
  _seed |= 0
  _seed = (_seed + 0x6D2B79F5) | 0
  let t = Math.imul(_seed ^ (_seed >>> 15), _seed | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const ri  = (min, max) => Math.floor(rng() * (max - min + 1)) + min
const rn  = (scale)    => (rng() - 0.5) * 2 * scale
const r5  = (v)        => Math.round(v / 5) * 5
const r25 = (v)        => Math.round(v / 2.5) * 2.5

// ── Date helpers ─────────────────────────────────────────────────────────────
const START = new Date('2025-10-06T00:00:00Z')  // Monday, week 1
const END   = new Date('2026-03-31T00:00:00Z')

function addDays(d, n) {
  const r = new Date(d)
  r.setUTCDate(r.getUTCDate() + n)
  return r
}
function weekOf(date) {
  return Math.floor((date - START) / (7 * 24 * 3600 * 1000)) + 1
}
function isoDate(d) { return d.toISOString().slice(0, 10) }

// ── ID counters ───────────────────────────────────────────────────────────────
let _sn = 0, _setn = 0
const newSid  = () => `session-${String(++_sn).padStart(3, '0')}`
const newStid = () => `set-${String(++_setn).padStart(5, '0')}`

// ── Progression table ─────────────────────────────────────────────────────────
// s=start weight, e=end weight, i=intro week (1 = from week 1)
// All weights in lbs. Dumbbell exercises = per-hand weight.
const PROG = {
  bench:     { s: 145, e: 175, i: 1  },
  inclineDb: { s: 55,  e: 65,  i: 5  },  // weeks 5–7 only
  deadlift:  { s: 225, e: 290, i: 1  },
  row:       { s: 135, e: 165, i: 1  },
  latPull:   { s: 130, e: 150, i: 1  },
  ohp:       { s: 95,  e: 115, i: 1  },
  hipThrust: { s: 135, e: 185, i: 1  },
  rdl:       { s: 135, e: 165, i: 1  },
  squat:     { s: 185, e: 230, i: 1  },
  legPress:  { s: 270, e: 340, i: 1  },  // weeks 1–11
  legExt:    { s: 90,  e: 120, i: 1  },
  legCurl:   { s: 80,  e: 100, i: 1  },
  calfStand: { s: 130, e: 165, i: 1  },
  calfSeat:  { s: 80,  e: 105, i: 1  },
  pushdown:  { s: 60,  e: 80,  i: 1  },
  curl:      { s: 85,  e: 105, i: 1  },
  ovhTri:    { s: 45,  e: 60,  i: 1  },
  latRaise:  { s: 20,  e: 30,  i: 1  },
  rearDelt:  { s: 20,  e: 30,  i: 1  },
  hammer:    { s: 35,  e: 45,  i: 1  },
  facePull:  { s: 40,  e: 55,  i: 13 },  // added week 13
  bss:       { s: 30,  e: 50,  i: 12 },  // replaces leg press from week 12
}

function targetWeight(key, week) {
  const p = PROG[key]
  if (!p) return 0
  const span = 26 - p.i
  const t = span <= 0 ? 1 : Math.max(0, Math.min(1, (week - p.i) / span))
  return p.s + (p.e - p.s) * t
}

// Deadlift has a regression event weeks 14–16, then recovery.
function deadliftWeight(week) {
  const peak = targetWeight('deadlift', 13)  // ~290 * (13/26) + 225 ≈ 257
  if (week >= 14 && week <= 16) {
    return r5(peak - (week - 13) * 15 + rn(5))  // drops ~15/week
  }
  if (week > 16) {
    const low = peak - 3 * 15
    const recoverFrac = Math.min(1, (week - 16) / 5)
    return r5(low + (targetWeight('deadlift', week) - low) * recoverFrac + rn(5))
  }
  return r5(targetWeight('deadlift', week) + rn(5))
}

function exerciseWeight(key, week) {
  if (key === 'deadlift') return deadliftWeight(week)
  // Dumbbell isolations: round to 2.5
  if (['latRaise', 'rearDelt', 'hammer', 'inclineDb', 'bss', 'ovhTri'].includes(key)) {
    return r25(targetWeight(key, week) + rn(2.5))
  }
  return r5(targetWeight(key, week) + rn(5))
}

// ── Rep schemes ───────────────────────────────────────────────────────────────
function repRange(type, week) {
  if (type === 'main') {
    if (week <= 8)  return [4, 6]
    if (week <= 16) return [5, 8]
    return [6, 10]
  }
  if (type === 'secondary') return week <= 12 ? [8, 10] : [8, 12]
  return [10, 15]  // isolation
}

function numWorkingSets(type, week) {
  return (type === 'main' && week <= 8) ? 4 : 3
}

// ── Set builder ───────────────────────────────────────────────────────────────
function buildSets(exCfg, week) {
  const { key, type, warmups = 0, bw = false, core = false } = exCfg
  const sets = []

  if (core) {
    // Plank: 3 timed holds, reps = seconds
    for (let i = 0; i < 3; i++) {
      sets.push({ type: 'working', reps: ri(30, 60), weight: null, weightUnit: 'lbs', completed: true })
    }
    return sets
  }

  if (bw) {
    // Bodyweight (chin-ups, walking lunges): no weight, reps as normal
    const [lo, hi] = type === 'secondary' ? [5, 10] : [10, 16]
    for (let i = 0; i < numWorkingSets(type, week); i++) {
      sets.push({ type: 'working', reps: ri(lo, hi), weight: null, weightUnit: 'lbs', completed: true })
    }
    return sets
  }

  const base = exerciseWeight(key, week)

  // Warmup sets
  const warmupPcts = warmups >= 2 ? [0.5, 0.7] : [0.65]
  warmupPcts.slice(0, warmups).forEach(pct => {
    sets.push({
      type: 'warmup',
      reps: type === 'main' ? ri(4, 6) : ri(8, 10),
      weight: Math.max(0, r5(base * pct)),
      weightUnit: 'lbs',
      completed: true,
    })
  })

  // Working sets
  const [lo, hi] = repRange(type, week)
  for (let i = 0; i < numWorkingSets(type, week); i++) {
    const w = ['latRaise', 'rearDelt', 'hammer', 'inclineDb', 'bss', 'ovhTri'].includes(key)
      ? r25(base + rn(2.5))
      : r5(base + rn(5))
    sets.push({
      type: 'working',
      reps: ri(lo, hi),
      weight: Math.max(0, w),
      weightUnit: 'lbs',
      completed: true,
    })
  }

  return sets
}

// ── Program definition ────────────────────────────────────────────────────────
// Returns an ordered array of exercise configs for a given session type + week.
function program(sessionType, week) {
  switch (sessionType) {
    case 'upper-a': return upperA(week)
    case 'lower-a': return lowerA(week)
    case 'upper-b': return upperB(week)
    case 'lower-b': return lowerB(week)
    default: return []
  }
}

function upperA(week) {
  // Bench → Incline DB weeks 5–7 (shoulder discomfort), then back to bench
  const bench = (week >= 5 && week <= 7)
    ? { id: 'ex-002', name: 'Incline Dumbbell Press', key: 'inclineDb', type: 'main', warmups: 2 }
    : { id: 'ex-001', name: 'Barbell Bench Press',    key: 'bench',     type: 'main', warmups: 2 }

  const exs = [
    bench,
    { id: 'ex-020', name: 'Overhead Press',   key: 'ohp',      type: 'secondary', warmups: 1 },
    { id: 'ex-022', name: 'Lateral Raise',    key: 'latRaise', type: 'isolation'               },
    { id: 'ex-035', name: 'Tricep Pushdown',  key: 'pushdown', type: 'isolation'               },
    { id: 'ex-028', name: 'Barbell Curl',     key: 'curl',     type: 'isolation'               },
  ]

  // Face Pull added week 13 as prehab
  if (week >= 13) {
    exs.splice(2, 0, { id: 'ex-017', name: 'Face Pull', key: 'facePull', type: 'isolation' })
  }

  return exs
}

function lowerA(week) {
  // Leg Press → Bulgarian Split Squat from week 12
  const legEx = week >= 12
    ? { id: 'ex-070', name: 'Bulgarian Split Squat', key: 'bss',      type: 'secondary', warmups: 1 }
    : { id: 'ex-067', name: 'Leg Press',             key: 'legPress', type: 'secondary', warmups: 1 }

  return [
    { id: 'ex-064', name: 'Back Squat',          key: 'squat',     type: 'main',      warmups: 2 },
    { id: 'ex-063', name: 'Romanian Deadlift',   key: 'rdl',       type: 'secondary', warmups: 1 },
    legEx,
    { id: 'ex-073', name: 'Leg Curl',            key: 'legCurl',   type: 'isolation'              },
    { id: 'ex-078', name: 'Standing Calf Raise', key: 'calfStand', type: 'isolation'              },
    { id: 'ex-046', name: 'Plank',               key: 'plank',     type: 'core',      core: true  },
  ]
}

function upperB(week) {
  // Lat Pulldown → Chin-Up from week 16
  const pullEx = week >= 16
    ? { id: 'ex-011', name: 'Chin-Up',      key: 'chinUp',  type: 'secondary', bw: true }
    : { id: 'ex-015', name: 'Lat Pulldown', key: 'latPull', type: 'secondary', warmups: 1 }

  return [
    { id: 'ex-012', name: 'Barbell Row',               key: 'row',     type: 'main',      warmups: 2 },
    pullEx,
    { id: 'ex-024', name: 'Rear Delt Flye',            key: 'rearDelt', type: 'isolation'             },
    { id: 'ex-030', name: 'Hammer Curl',               key: 'hammer',  type: 'isolation'             },
    { id: 'ex-037', name: 'Overhead Tricep Extension', key: 'ovhTri',  type: 'isolation'             },
  ]
}

function lowerB(week) {
  return [
    { id: 'ex-009', name: 'Barbell Deadlift',    key: 'deadlift',  type: 'main',      warmups: 2 },
    { id: 'ex-058', name: 'Hip Thrust',          key: 'hipThrust', type: 'secondary', warmups: 1 },
    { id: 'ex-069', name: 'Walking Lunge',       key: 'lunge',     type: 'isolation', bw: true   },
    { id: 'ex-068', name: 'Leg Extension',       key: 'legExt',    type: 'isolation'              },
    { id: 'ex-079', name: 'Seated Calf Raise',   key: 'calfSeat',  type: 'isolation'              },
    { id: 'ex-046', name: 'Plank',               key: 'plank',     type: 'core',      core: true  },
  ]
}

// ── Session builder ───────────────────────────────────────────────────────────
const TITLES = {
  'upper-a': 'Upper A — Push',
  'lower-a': 'Lower A — Squat',
  'upper-b': 'Upper B — Pull',
  'lower-b': 'Lower B — Hinge',
}

function buildSession(date, sessionType, isIncomplete) {
  const week    = weekOf(date)
  const id      = newSid()
  const exList  = program(sessionType, week)

  // Session start: 7:00–7:20am UTC + random seconds jitter
  const startOffset = ri(0, 20) * 60 + ri(0, 59)
  const startMs     = date.getTime() + 7 * 3600_000 + startOffset * 1000
  let cursorMs      = startMs

  // Incomplete sessions: either truncate at a later exercise, or truncate sets in the last one.
  // Pick one of two behaviors randomly.
  const truncateStyle  = rng() < 0.5 ? 'drop-last' : 'partial-sets'
  const numFullEx      = isIncomplete
    ? ri(Math.max(1, exList.length - 2), exList.length - 1)
    : exList.length

  const exercises = []

  for (let ei = 0; ei < exList.length; ei++) {
    const exCfg = exList[ei]

    // Skip exercises beyond truncation point
    if (isIncomplete && truncateStyle === 'drop-last' && ei >= numFullEx) break

    // Inter-exercise gap (3–5 min)
    if (ei > 0) cursorMs += ri(3, 5) * 60_000

    let sets = buildSets(exCfg, week)

    // Partially complete the last exercise in 'partial-sets' mode
    if (isIncomplete && truncateStyle === 'partial-sets' && ei === numFullEx) {
      const workingIdxs = sets.reduce((acc, s, i) => s.type === 'working' ? [...acc, i] : acc, [])
      const doneCount   = Math.max(1, Math.floor(workingIdxs.length * (0.25 + rng() * 0.5)))
      sets = sets.map((s, i) => {
        if (s.type !== 'working') return s
        const pos = workingIdxs.indexOf(i)
        return { ...s, completed: pos < doneCount }
      })
    }

    // Stamp each set with a timestamp
    const timedSets = sets.map((s, si) => {
      if (si > 0) cursorMs += ri(2, 4) * 60_000  // rest between sets
      const ts = new Date(cursorMs + ri(0, 45) * 1000).toISOString()
      return { id: newStid(), ...s, timestamp: ts }
    })

    cursorMs += 2 * 60_000  // buffer after last set of each exercise

    exercises.push({
      id:           `${id}-e${String(ei + 1).padStart(2, '0')}`,
      exerciseId:   exCfg.id,
      exerciseName: exCfg.name,
      order:        ei + 1,
      notes:        '',
      sets:         timedSets,
    })

    // Stop after partial exercise in 'partial-sets' mode
    if (isIncomplete && truncateStyle === 'partial-sets' && ei === numFullEx) break
  }

  const durationMinutes = Math.max(10, Math.round((cursorMs - startMs) / 60_000))

  return {
    id,
    date:            isoDate(date),
    startTime:       new Date(startMs).toISOString(),
    title:           TITLES[sessionType],
    status:          isIncomplete ? 'in-progress' : 'complete',
    durationMinutes,
    exercises,
  }
}

// ── Build schedule ────────────────────────────────────────────────────────────
// Mon→Upper A, Tue→Lower A, Thu→Upper B, Fri→Lower B
const DOW_MAP = { 1: 'upper-a', 2: 'lower-a', 4: 'upper-b', 5: 'lower-b' }

const planned = []
for (let d = new Date(START); d <= END; d = addDays(d, 1)) {
  const dow = d.getUTCDay()
  if (DOW_MAP[dow]) planned.push({ date: new Date(d), type: DOW_MAP[dow] })
}

// Skip ~15% of sessions; bias skips toward December (weeks 9–13, holiday period)
const skipSet      = new Set()
const targetSkips  = Math.round(planned.length * 0.15)
while (skipSet.size < targetSkips) {
  const i = ri(0, planned.length - 1)
  const w = weekOf(planned[i].date)
  // Higher skip probability in December
  const threshold = (w >= 9 && w <= 13) ? 0.55 : 0.25
  if (rng() < threshold) skipSet.add(i)
}

// Mark ~11 sessions as incomplete (not-first-3, not-last-3)
const eligible     = planned.map((_, i) => i).filter(i => !skipSet.has(i) && i > 3 && i < planned.length - 3)
const incompleteSet = new Set()
while (incompleteSet.size < 11) {
  incompleteSet.add(eligible[ri(0, eligible.length - 1)])
}

// ── Generate all sessions ─────────────────────────────────────────────────────
const sessions = []
planned.forEach(({ date, type }, i) => {
  if (skipSet.has(i)) return
  sessions.push(buildSession(date, type, incompleteSet.has(i)))
})

// ── Output ────────────────────────────────────────────────────────────────────
const output = {
  client: {
    id:          'client-001',
    name:        'Alex',
    age:         30,
    sex:         'male',
    generatedAt: new Date().toISOString(),
  },
  sessions,
}

if (!existsSync('data')) mkdirSync('data', { recursive: true })
writeFileSync('data/client-history.json', JSON.stringify(output, null, 2), 'utf8')

const totalSets  = sessions.reduce((a, s) => a + s.exercises.reduce((b, e) => b + e.sets.length, 0), 0)
const complete   = sessions.filter(s => s.status === 'complete').length
const incomplete = sessions.filter(s => s.status === 'in-progress').length

console.log(`Sessions : ${sessions.length} total (${complete} complete, ${incomplete} in-progress, ${skipSet.size} skipped)`)
console.log(`Exercises: ${sessions.reduce((a, s) => a + s.exercises.length, 0)}`)
console.log(`Sets     : ${totalSets}`)
console.log(`Date range: ${sessions[0].date} → ${sessions.at(-1).date}`)
console.log(`Output   : data/client-history.json`)
