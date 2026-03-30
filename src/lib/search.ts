import type { Exercise } from '@/data/exercises'

export interface MatchSegment {
  text: string
  highlighted: boolean
}

export interface SearchResult {
  exercise: Exercise
  score: number
  segments: MatchSegment[]
}

function isSubsequence(query: string, name: string): boolean {
  let qi = 0
  for (let ni = 0; ni < name.length && qi < query.length; ni++) {
    if (name[ni] === query[qi]) qi++
  }
  return qi === query.length
}

// Both query and name should be lowercase before calling
function scoreMatch(query: string, name: string): number {
  if (name === query) return 1000
  if (name.startsWith(query)) return 800
  if (name.includes(query)) return 600
  const tokens = query.split(/\s+/).filter(Boolean)
  if (tokens.length > 1 && tokens.every(t => name.includes(t))) return 400
  if (isSubsequence(query, name)) return 200
  return 0
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  if (ranges.length === 0) return []
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    if (sorted[i][0] <= last[1]) {
      last[1] = Math.max(last[1], sorted[i][1])
    } else {
      merged.push(sorted[i])
    }
  }
  return merged
}

// query and lower are both lowercase; originalName preserves casing for output
function computeSegments(query: string, lower: string, originalName: string): MatchSegment[] {
  let ranges: [number, number][] = []

  const subIdx = lower.indexOf(query)
  if (subIdx !== -1) {
    ranges = [[subIdx, subIdx + query.length]]
  } else {
    const tokens = query.split(/\s+/).filter(Boolean)
    if (tokens.length > 1 && tokens.every(t => lower.includes(t))) {
      for (const token of tokens) {
        const idx = lower.indexOf(token)
        if (idx !== -1) ranges.push([idx, idx + token.length])
      }
    } else if (isSubsequence(query, lower)) {
      let ni = 0
      for (let qi = 0; qi < query.length; qi++) {
        while (ni < lower.length && lower[ni] !== query[qi]) ni++
        if (ni < lower.length) { ranges.push([ni, ni + 1]); ni++ }
      }
    }
  }

  ranges = mergeRanges(ranges)

  const segments: MatchSegment[] = []
  let pos = 0
  for (const [start, end] of ranges) {
    if (pos < start) segments.push({ text: originalName.slice(pos, start), highlighted: false })
    segments.push({ text: originalName.slice(start, end), highlighted: true })
    pos = end
  }
  if (pos < originalName.length) segments.push({ text: originalName.slice(pos), highlighted: false })
  if (segments.length === 0) segments.push({ text: originalName, highlighted: false })

  return segments
}

export function searchExercises(query: string, exercises: Exercise[]): SearchResult[] {
  const trimmed = query.trim()

  if (!trimmed) {
    return [...exercises]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(exercise => ({
        exercise,
        score: 0,
        segments: [{ text: exercise.name, highlighted: false }],
      }))
  }

  const q = trimmed.toLowerCase()

  return exercises
    .map(exercise => {
      const lower = exercise.name.toLowerCase()
      const score = scoreMatch(q, lower)
      if (score === 0) return null
      const shortBonus = Math.max(0, 30 - lower.length * 0.5)
      return {
        exercise,
        score: score + shortBonus,
        segments: computeSegments(q, lower, exercise.name),
      }
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.exercise.name.localeCompare(b.exercise.name)
    })
}
