import {
  useState, useEffect, useRef, useMemo,
  type KeyboardEvent, type RefObject,
} from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { Check, ChevronDown, ChevronsUpDown, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { exercises } from '@/data/exercises'
import type { Exercise, BodyPart, Equipment } from '@/data/exercises'
import { searchExercises, type MatchSegment } from '@/lib/search'
import { cn } from '@/lib/utils'

interface ExerciseSearchPopoverProps {
  currentExercise: Exercise
  onSelect: (exercise: Exercise) => void
  anchorRef: RefObject<HTMLDivElement | null>
  autoOpen?: boolean
  onCancel?: () => void
}

const ALL_BODY_PARTS: BodyPart[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'glutes', 'quads', 'hamstrings',
  'calves', 'full-body', 'cardio',
]

const EQUIPMENT_OPTIONS: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'kettlebell',
  'machine', 'bodyweight', 'resistance-band', 'pull-up-bar',
]

function labelFor(s: string) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function relativeDate(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1) return 'today'
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}

function HighlightedName({ segments }: { segments: MatchSegment[] }) {
  return (
    <span>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <span key={i} className="font-semibold text-foreground">{seg.text}</span>
        ) : (
          <span key={i} className="text-muted-foreground">{seg.text}</span>
        )
      )}
    </span>
  )
}

// ── Generic filter dropdown ─────────────────────────────────────────────────

interface FilterDropdownProps<T extends string> {
  options: T[]
  active: Set<T>
  onToggle: (v: T) => void
  onClear: () => void
  placeholder: string
}

function FilterDropdown<T extends string>({
  options, active, onToggle, onClear, placeholder,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter(o =>
    labelFor(o).toLowerCase().includes(search.toLowerCase())
  )

  const label = active.size === 0
    ? placeholder
    : active.size === 1
      ? labelFor([...active][0])
      : `${placeholder} · ${active.size}`

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        render={
          <button
            tabIndex={-1}
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
              active.size > 0 || open
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          />
        }
      >
        {label}
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          positionMethod="fixed"
          collisionPadding={8}
        >
          <PopoverPrimitive.Popup
            initialFocus={inputRef}
            className={cn(
              'z-[60] w-48 overflow-hidden rounded-xl',
              'bg-card shadow-xl ring-1 ring-foreground/10',
              'transition-[opacity,scale] duration-150 ease-out',
              'data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0',
            )}
          >
            <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-2">
              <Search className="size-3 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setOpen(false)}
                placeholder="Search..."
                className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <ul className="max-h-48 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <li className="px-2 py-1.5 text-xs text-muted-foreground">No results</li>
              ) : (
                filtered.map(opt => {
                  const checked = active.has(opt)
                  return (
                    <li key={opt}>
                      <button
                        tabIndex={-1}
                        onMouseDown={e => { e.preventDefault(); onToggle(opt) }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                      >
                        <span className={cn(
                          'flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors',
                          checked ? 'border-foreground bg-foreground' : 'border-border',
                        )}>
                          {checked && <Check className="size-2.5 text-background" strokeWidth={3} />}
                        </span>
                        <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>
                          {labelFor(opt)}
                        </span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>

            {active.size > 0 && (
              <div className="border-t border-border p-1">
                <button
                  tabIndex={-1}
                  onMouseDown={e => { e.preventDefault(); onClear(); setSearch('') }}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted"
                >
                  Clear
                </button>
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

// ── Sort dropdown ──────────────────────────────────────────────────────────

type SortOption = 'best-match' | 'popular' | 'a-z' | 'recent'

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'best-match', label: 'Best matches' },
  { id: 'popular',    label: 'Most popular' },
  { id: 'a-z',        label: 'A–Z' },
  { id: 'recent',     label: 'Most recent' },
]

interface SortDropdownProps {
  value: SortOption
  onChange: (v: SortOption) => void
}

function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false)
  const label = SORT_OPTIONS.find(o => o.id === value)!.label

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        render={
          <button
            tabIndex={-1}
            className="flex items-center gap-0.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
          />
        }
      >
        {label}
        <ChevronsUpDown className="size-3 shrink-0" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="bottom"
          align="end"
          sideOffset={4}
          positionMethod="fixed"
          collisionPadding={8}
        >
          <PopoverPrimitive.Popup
            className={cn(
              'z-[60] w-36 overflow-hidden rounded-xl',
              'bg-card shadow-xl ring-1 ring-foreground/10',
              'transition-[opacity,scale] duration-150 ease-out',
              'data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0',
            )}
          >
            <ul className="p-1">
              {SORT_OPTIONS.map(opt => (
                <li key={opt.id}>
                  <button
                    tabIndex={-1}
                    onMouseDown={e => { e.preventDefault(); onChange(opt.id); setOpen(false) }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <span className={opt.id === value ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {opt.label}
                    </span>
                    {opt.id === value && <Check className="ml-auto size-3 shrink-0 text-foreground" />}
                  </button>
                </li>
              ))}
            </ul>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function ExerciseSearchPopover({
  currentExercise,
  onSelect,
  anchorRef,
  autoOpen,
  onCancel,
}: ExerciseSearchPopoverProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [cardHeight, setCardHeight] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [activeBodyParts, setActiveBodyParts] = useState<Set<BodyPart>>(new Set())
  const [activeEquipment, setActiveEquipment] = useState<Set<Equipment>>(new Set())
  const [bodyweightOnly, setBodyweightOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('best-match')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const isFirstOpen = useRef(true)
  const hasCommitted = useRef(!autoOpen)

  useEffect(() => {
    if (autoOpen) setOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      const emptyOnOpen = autoOpen && isFirstOpen.current
      isFirstOpen.current = false
      setQuery(emptyOnOpen ? '' : currentExercise.name)
      setActiveIndex(0)
      setActiveBodyParts(new Set())
      setActiveEquipment(new Set())
      setBodyweightOnly(false)
      setSortBy('best-match')
      if (anchorRef.current) setCardHeight(anchorRef.current.offsetHeight)
      requestAnimationFrame(() => inputRef.current?.select())
    }
  }, [open, currentExercise.name, anchorRef])

  function toggleBodyPart(bp: BodyPart) {
    setActiveBodyParts(prev => {
      const next = new Set(prev)
      next.has(bp) ? next.delete(bp) : next.add(bp)
      return next
    })
    setActiveIndex(0)
  }

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      if (bodyweightOnly && !ex.bodyweightOnly) return false
      if (activeBodyParts.size > 0 && !ex.bodyParts.some(bp => activeBodyParts.has(bp))) return false
      if (activeEquipment.size > 0 && !ex.equipment.some(eq => activeEquipment.has(eq))) return false
      return true
    })
  }, [activeBodyParts, activeEquipment, bodyweightOnly])

  const results = useMemo(() => {
    const base = searchExercises(query, filteredExercises)
    if (sortBy === 'best-match') return base
    return [...base].sort((a, b) => {
      if (sortBy === 'popular') return (b.exercise.popularity ?? 50) - (a.exercise.popularity ?? 50)
      if (sortBy === 'a-z') return a.exercise.name.localeCompare(b.exercise.name)
      if (sortBy === 'recent') {
        const aDate = a.exercise.lastUsed ?? '1970-01-01'
        const bDate = b.exercise.lastUsed ?? '1970-01-01'
        return bDate.localeCompare(aDate)
      }
      return 0
    })
  }, [query, filteredExercises, sortBy])

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function handleSelect(exercise: Exercise) {
    hasCommitted.current = true
    onSelect(exercise)
    setOpen(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) handleSelect(results[activeIndex].exercise)
    } else if (e.key === 'Escape') {
      if (!hasCommitted.current && onCancel) {
        onCancel()
      } else {
        setOpen(false)
      }
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        render={
          <span
            role="button"
            tabIndex={0}
            className="cursor-pointer text-sm font-medium text-foreground focus-visible:outline-none"
          />
        }
      >
        {currentExercise.name}
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchorRef}
          side="bottom"
          align="start"
          sideOffset={-cardHeight}
          positionMethod="fixed"
          collisionPadding={8}
        >
          <PopoverPrimitive.Popup
            initialFocus={inputRef}
            className={cn(
              'z-[200] flex w-[var(--anchor-width)] flex-col rounded-xl',
              'bg-card text-card-foreground shadow-xl ring-1 ring-foreground/10',
              'transition-[opacity,scale] duration-150 ease-out',
              'data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0',
            )}
          >
            {/* Search row */}
            <div className="relative flex items-center gap-2 border-b border-border px-4 pt-4 pb-2.5">
              {query === '' && (
                <span className="pointer-events-none absolute inset-0 flex items-center gap-1.5 px-4 pt-4 pb-2.5 text-sm text-muted-foreground">
                  <Search className="size-3.5 shrink-0" />
                  Find an exercise
                </span>
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveIndex(0) }}
                onKeyDown={handleKeyDown}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground focus:outline-none"
              />
              <button
                tabIndex={-1}
                onMouseDown={e => { e.preventDefault(); setShowFilters(f => !f) }}
                className={cn(
                  'shrink-0 rounded-md p-1 transition-colors',
                  showFilters
                    ? 'bg-blue-500 text-white'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-label="Toggle filters"
              >
                <SlidersHorizontal className="size-3.5" />
              </button>
            </div>

            {/* Filter chips */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ gridTemplateRows: showFilters ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <button
                    tabIndex={-1}
                    onMouseDown={e => { e.preventDefault(); setBodyweightOnly(f => !f); setActiveIndex(0) }}
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                      bodyweightOnly
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Bodyweight
                  </button>
                  <FilterDropdown
                    options={ALL_BODY_PARTS}
                    active={activeBodyParts}
                    onToggle={toggleBodyPart}
                    onClear={() => { setActiveBodyParts(new Set()); setActiveIndex(0) }}
                    placeholder="Body part"
                  />
                  <FilterDropdown
                    options={EQUIPMENT_OPTIONS}
                    active={activeEquipment}
                    onToggle={eq => {
                      setActiveEquipment(prev => {
                        const n = new Set(prev)
                        n.has(eq) ? n.delete(eq) : n.add(eq)
                        return n
                      })
                      setActiveIndex(0)
                    }}
                    onClear={() => { setActiveEquipment(new Set()); setActiveIndex(0) }}
                    placeholder="Equipment"
                  />
                </div>
              </div>
            </div>

            {/* Results header — only when a query is active */}
            {query.trim() !== '' && (
              <div className="flex items-center justify-between px-3 pt-3 pb-0.5">
                <span className="text-xs text-muted-foreground/60">
                  {results.length === 0
                    ? 'No results'
                    : `${results.length} result${results.length === 1 ? '' : 's'}`}
                </span>
                <SortDropdown value={sortBy} onChange={v => { setSortBy(v); setActiveIndex(0) }} />
              </div>
            )}

            {/* Results */}
            <ul ref={listRef} className="max-h-[288px] overflow-y-auto p-1" role="listbox">
              {results.length === 0 ? (
                <li className="flex flex-col gap-3 px-3 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">No results for "{query}"</p>
                    <p className="text-xs text-muted-foreground">This exercise isn't in the library yet.</p>
                  </div>
                  <button
                    tabIndex={-1}
                    onMouseDown={e => e.preventDefault()}
                    className="flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Plus className="size-3.5" />
                    Request "{query}"
                  </button>
                </li>
              ) : (
                results.map((result, i) => (
                  <li
                    key={result.exercise.id}
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={e => { e.preventDefault(); handleSelect(result.exercise) }}
                    className={cn(
                      'flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2',
                      i === activeIndex && 'bg-muted',
                    )}
                  >
                    {/* Avatar */}
                    <div className="size-8 shrink-0 rounded-md bg-muted-foreground/15" />

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-snug">
                        <HighlightedName segments={result.segments} />
                      </div>
                      <div className="text-xs text-muted-foreground/60 leading-snug truncate">
                        {sortBy === 'popular'
                          ? `${result.exercise.popularity ?? 50} uses`
                          : sortBy === 'recent' && result.exercise.lastUsed
                            ? relativeDate(result.exercise.lastUsed)
                            : 'Strength · Compound movement'}
                      </div>
                    </div>

                    {result.exercise.id === currentExercise.id && (
                      <Check className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </li>
                ))
              )}
            </ul>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
