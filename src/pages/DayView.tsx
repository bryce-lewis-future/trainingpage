import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback, type ReactNode, Fragment } from 'react'
import { AlignJustify, AlignCenter, Menu, Plus, Link, Clock, ChevronDown, MoreHorizontal, HelpCircle } from 'lucide-react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DayHeader } from '@/components/training/DayCard'
import { ExerciseCard } from '@/components/training/ExerciseCard'
import { DragHandle } from '@/components/dnd/DragHandle'
import { Button } from '@/components/ui/button'
import { ToastContainer, type ToastItem } from '@/components/ui/toast'
import { exercises, type Exercise } from '@/data/exercises'
import { useDragSensors } from '@/lib/dnd'
import { cn } from '@/lib/utils'

interface ExerciseItem {
  id: string
  type: 'exercise'
  exercise: Exercise
  autoOpen: boolean
}

interface SectionItem {
  id: string
  type: 'section'
  title: string
  subtitle: string
  estimatedTime: string
  children: ExerciseItem[]
  autoSelect?: boolean
  isGeneratingName?: boolean
}

async function generateSectionName(exercises: Exercise[]): Promise<string> {
  const list = exercises.map(e =>
    `${e.name} (${e.bodyParts.join(', ')}; ${e.equipment.join(', ')})`
  ).join(', ')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 10,
      messages: [
        {
          role: 'system',
          content: 'You are a fitness coach naming workout sections. Respond with only the section name — no punctuation, no explanation, no quotes. Keep it under 5 words. Use title case.',
        },
        {
          role: 'user',
          content: `Name a workout section containing these exercises: ${list}`,
        },
      ],
    }),
  })
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

type WorkoutItem = ExerciseItem | SectionItem

function PaletteIcon({ rainbow }: { rainbow: boolean }) {
  const stroke = rainbow ? 'url(#rg)' : 'currentColor'
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {rainbow && (
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#f00" />
            <stop offset="20%"  stopColor="#ff7f00" />
            <stop offset="40%"  stopColor="#ffe600" />
            <stop offset="60%"  stopColor="#00c800" />
            <stop offset="80%"  stopColor="#0050ff" />
            <stop offset="100%" stopColor="#8b00ff" />
          </linearGradient>
        </defs>
      )}
      <circle cx="13.5" cy="6.5" r=".5" fill={stroke} stroke={stroke} />
      <circle cx="17.5" cy="10.5" r=".5" fill={stroke} stroke={stroke} />
      <circle cx="8.5"  cy="7.5"  r=".5" fill={stroke} stroke={stroke} />
      <circle cx="6.5"  cy="12.5" r=".5" fill={stroke} stroke={stroke} />
      <path stroke={stroke} d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  )
}

type Mode = 'planning' | 'edit' | 'voice-cues'
type Density = 'contracted' | 'medium' | 'relaxed'

const densities: { id: Density; icon: ReactNode }[] = [
  { id: 'contracted', icon: <AlignJustify className="size-3.5" /> },
  { id: 'medium',     icon: <AlignCenter  className="size-3.5" /> },
  { id: 'relaxed',    icon: <Menu         className="size-3.5" /> },
]

const modes: { id: Mode; label: string }[] = [
  { id: 'planning', label: 'Planning' },
  { id: 'edit', label: 'Edit' },
  { id: 'voice-cues', label: 'Voice Cues' },
]

const days = [
  {
    date: 'Mon',
    title: 'Upper Body Strength',
    subtitle: 'Focus on compound pushing movements',
    status: 'complete' as const,
    estimatedTime: '55m',
  },
  {
    date: 'Tue',
    title: 'Lower Body Power',
    subtitle: 'Squats, deadlifts, and plyometrics',
    status: 'in-progress' as const,
    estimatedTime: '60m',
  },
  {
    date: 'Wed',
    title: 'Active Recovery',
    subtitle: 'Mobility, stretching, and light cardio',
    status: 'not-started' as const,
    estimatedTime: '30m',
  },
]

const LOADING_VERBS = [
  'Spotting', 'Programming', 'Periodizing', 'Chalking up', 'Loading',
  'Calibrating', 'Strategizing', 'Plotting', 'Sculpting', 'Forging',
  'Coaching', 'Analyzing', 'Peaking', 'Mobilizing', 'Activating',
  'Thinking', 'Pondering', 'Calculating', 'Devising', 'Racking up',
]

function SectionCard({
  section,
  onUpdate,
  className,
  dragListeners,
  dragAttributes,
  setActivatorRef,
  collapsed = false,
  onToggleCollapse,
  autoSelect,
  isGeneratingName,
}: {
  section: SectionItem
  onUpdate?: (updates: Partial<Pick<SectionItem, 'title' | 'subtitle' | 'estimatedTime'>>) => void
  className?: string
  dragListeners?: DraggableSyntheticListeners
  dragAttributes?: DraggableAttributes
  setActivatorRef?: (el: HTMLButtonElement | null) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  autoSelect?: boolean
  isGeneratingName?: boolean
}) {
  const titleRef = useRef<HTMLSpanElement>(null)
  const subtitleRef = useRef<HTMLSpanElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const editableClass = 'cursor-text outline-none'
  const [showNote, setShowNote] = useState(() => section.subtitle.length > 0)
  const [menuOpen, setMenuOpen] = useState(false)
  const didAutoSelect = useRef(false)
  const loadingVerb = useRef(LOADING_VERBS[Math.floor(Math.random() * LOADING_VERBS.length)])

  useEffect(() => {
    if (!autoSelect || didAutoSelect.current || !titleRef.current) return
    didAutoSelect.current = true
    titleRef.current.focus()
    const range = document.createRange()
    range.selectNodeContents(titleRef.current)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [autoSelect])

  return (
    <div className={cn('group/card relative pb-1 pt-4', className)}>
      <div className="absolute left-0 top-[1.7rem] -translate-y-1/2">
        <DragHandle
          listeners={dragListeners}
          attributes={dragAttributes}
          handleRef={setActivatorRef}
        />
      </div>
      <div className="flex items-center gap-2 pl-4">
          {isGeneratingName ? (
            <span
              className="flex-1 text-sm font-semibold bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_2s_linear_infinite]"
              style={{ backgroundImage: 'linear-gradient(90deg, var(--muted-foreground) 0%, var(--foreground) 50%, var(--muted-foreground) 100%)' }}
            >
              {loadingVerb.current}…
            </span>
          ) : (
            <span
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              className={`flex-1 text-sm font-semibold text-foreground leading-snug ${editableClass}`}
              onBlur={e => onUpdate?.({ title: e.currentTarget.textContent ?? '' })}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); titleRef.current?.blur(); window.getSelection()?.removeAllRanges() }
                if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); subtitleRef.current?.focus() }
              }}
            >
              {section.title}
            </span>
          )}
          <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span
              ref={timeRef}
              contentEditable
              suppressContentEditableWarning
              className={`min-w-[2ch] ${editableClass}`}
              onBlur={e => onUpdate?.({ estimatedTime: e.currentTarget.textContent ?? '' })}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); timeRef.current?.blur() }
              }}
            >
              {section.estimatedTime}
            </span>
          </span>
          <PopoverPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverPrimitive.Trigger
              tabIndex={-1}
              className="shrink-0 flex items-center justify-center size-5 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="size-3.5" />
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Positioner side="bottom" align="end" sideOffset={6} positionMethod="fixed" collisionPadding={8}>
                <PopoverPrimitive.Popup
                  className={cn(
                    'z-[60] w-44 overflow-hidden rounded-xl',
                    'bg-card shadow-xl ring-1 ring-foreground/10',
                    'transition-[opacity,scale] duration-150 ease-out',
                    'data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0',
                    'data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0',
                  )}
                >
                  <ul className="p-1">
                    <li>
                      <button
                        tabIndex={-1}
                        onMouseDown={e => {
                          e.preventDefault()
                          setMenuOpen(false)
                          setShowNote(true)
                          setTimeout(() => subtitleRef.current?.focus(), 0)
                        }}
                        className="flex w-full items-center rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Add note
                      </button>
                    </li>
                  </ul>
                </PopoverPrimitive.Popup>
              </PopoverPrimitive.Positioner>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>
          <button
            tabIndex={-1}
            onClick={onToggleCollapse}
            className="shrink-0 flex items-center justify-center size-5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn('size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]', collapsed && '-rotate-180')} />
          </button>
      </div>
      {showNote && (
        <span
          ref={subtitleRef}
          contentEditable
          suppressContentEditableWarning
          className={`block px-4 text-xs text-muted-foreground whitespace-pre-wrap break-words empty:before:content-['Add_a_note…'] empty:before:text-muted-foreground/50 ${editableClass}`}
          onBlur={e => {
            const val = e.currentTarget.textContent ?? ''
            onUpdate?.({ subtitle: val })
            if (!val) setShowNote(false)
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); subtitleRef.current?.blur() }
            if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); titleRef.current?.focus() }
          }}
        >
          {section.subtitle}
        </span>
      )}
    </div>
  )
}

function InsertZone({ dragging, onAdd, onAddSection, hideSection }: { dragging: boolean; onAdd: () => void; onAddSection: () => void; hideSection?: boolean }) {
  return (
    <div className={`group/insert relative z-10 -my-[5px] flex h-4 items-center justify-center${dragging ? ' pointer-events-none' : ''}`}>
      <div className="flex overflow-hidden rounded-md bg-card shadow-sm ring-1 ring-foreground/10 opacity-0 transition-opacity duration-150 group-hover/insert:opacity-100">
        <button
          tabIndex={-1}
          onClick={onAdd}
          className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
        {!hideSection && (
          <button
            tabIndex={-1}
            onClick={onAddSection}
            className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Link className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function SortableExerciseCard({
  item,
  onExerciseChange,
  onDelete,
  activeId,
  isAltDrag,
  isSelected,
}: {
  item: ExerciseItem
  onExerciseChange: (ex: Exercise) => void
  onDelete: () => void
  activeId?: string | null
  isAltDrag?: boolean
  isSelected?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const wasDragging = useRef(activeId === item.id)
  if (isDragging) wasDragging.current = true

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-dnd-id={item.id}
      style={{
        transform: isAltDrag ? undefined : CSS.Transform.toString(transform),
        transition: (!isAltDrag && transition) ? 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
        opacity: isDragging && !isAltDrag ? 0 : 1,
        cursor: 'grab',
      }}
      onClickCapture={e => {
        if (wasDragging.current) {
          wasDragging.current = false
          e.stopPropagation()
        }
      }}
    >
      <ExerciseCard
        exercise={item.exercise}
        onExerciseChange={onExerciseChange}
        onDelete={onDelete}
        autoOpen={item.autoOpen}
        className={isSelected ? 'ring-2 ring-orange-400/70 ring-offset-2 ring-offset-muted' : undefined}
      />
    </div>
  )
}

function SortableSectionCard({
  item,
  onUpdate,
  onExerciseChange,
  onDeleteExercise,
  onAddExercise,
  draggingId,
  isAltDrag,
  isSelected,
  selectedChildId,
}: {
  item: SectionItem
  onUpdate: (updates: Partial<Pick<SectionItem, 'title' | 'subtitle' | 'estimatedTime'>>) => void
  onExerciseChange: (id: string, ex: Exercise) => void
  onDeleteExercise: (id: string) => void
  onAddExercise: (afterIndex: number) => void
  draggingId: string | null
  isAltDrag?: boolean
  isSelected?: boolean
  selectedChildId?: string | null
}) {
  const [collapsed, setCollapsed] = useState(false)
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: item.id })

  const exerciseCount = item.children.length

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ? 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
        opacity: isDragging ? 0 : 1,
      }}
      className={cn(
        'mb-3 rounded-xl transition-[background-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        collapsed && 'bg-card ring-1 ring-foreground/10',
        isSelected && !selectedChildId && 'ring-2 ring-orange-400/70 ring-offset-2 ring-offset-muted',
      )}
    >
      <SectionCard
        section={item}
        onUpdate={onUpdate}
        dragListeners={listeners}
        dragAttributes={attributes}
        setActivatorRef={setActivatorNodeRef as unknown as (el: HTMLButtonElement | null) => void}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        autoSelect={item.autoSelect}
        isGeneratingName={item.isGeneratingName}
      />

      {/* Expanded: exercise list */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ gridTemplateRows: collapsed ? '0fr' : '1fr' }}
      >
        <div className="overflow-hidden px-1 pb-1">
          <SortableContext items={item.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col mt-1">
              {item.children.map((child, cidx) => (
                <Fragment key={child.id}>
                  {cidx > 0 && <InsertZone dragging={!!draggingId} onAdd={() => onAddExercise(cidx)} onAddSection={() => {}} hideSection />}
                  <SortableExerciseCard
                    item={child}
                    onExerciseChange={ex => onExerciseChange(child.id, ex)}
                    onDelete={() => onDeleteExercise(child.id)}
                    activeId={draggingId}
                    isAltDrag={isAltDrag}
                    isSelected={selectedChildId === child.id}
                  />
                </Fragment>
              ))}
            </div>
          </SortableContext>
        </div>
      </div>

      {/* Collapsed: summary card */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ gridTemplateRows: collapsed ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-3 pt-0">
            <span className="text-xs text-muted-foreground">
              {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MorphOverlay({ exercise, isAltDrag }: { exercise: Exercise; isAltDrag: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const cardDimsRef = useRef<{ w: number; h: number } | null>(null)
  const pillDimsRef = useRef<{ w: number; h: number } | null>(null)
  const scaleRef = useRef<{ x: number; y: number } | null>(null)
  const [ready, setReady] = useState(false)
  // Pill transition is enabled one rAF after measurement so it doesn't
  // animate from scale(1) → pillInitScale on mount.
  const [pillTransitionReady, setPillTransitionReady] = useState(false)

  useLayoutEffect(() => {
    if (ready) return
    const container = containerRef.current
    const card = cardRef.current
    const pill = pillRef.current
    if (!container || !card || !pill) return

    const cardRect = card.getBoundingClientRect()
    const pillRect = pill.getBoundingClientRect()
    cardDimsRef.current = { w: cardRect.width, h: cardRect.height }
    pillDimsRef.current = { w: pillRect.width, h: pillRect.height }
    scaleRef.current = {
      x: cardRect.width / pillRect.width,
      y: cardRect.height / pillRect.height,
    }

    // Lock container to card dims (no visual change) then enable transition
    container.style.width = `${cardRect.width}px`
    container.style.height = `${cardRect.height}px`
    container.style.borderRadius = '12px'
    container.getBoundingClientRect() // force reflow
    container.style.transition =
      'width 220ms cubic-bezier(0.4,0,0.2,1), height 220ms cubic-bezier(0.4,0,0.2,1), border-radius 220ms cubic-bezier(0.4,0,0.2,1)'

    setReady(true)
    // Enable pill transition one frame later so the initial scale jump is instant
    requestAnimationFrame(() => setPillTransitionReady(true))
  }, [ready])

  // Animate container dims when isAltDrag toggles
  useEffect(() => {
    if (!ready) return
    const container = containerRef.current
    if (!container) return
    const dims = isAltDrag ? pillDimsRef.current : cardDimsRef.current
    if (!dims) return
    container.style.width = `${dims.w}px`
    container.style.height = `${dims.h}px`
    container.style.borderRadius = isAltDrag ? '8px' : '12px'
  }, [isAltDrag, ready])

  // Pill starts scaled to match card dimensions so it morphs from card → pill
  const pillInitScale = scaleRef.current
    ? `scale(${scaleRef.current.x}, ${scaleRef.current.y})`
    : 'scale(1)'

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Card — in normal flow until measured (gives container its initial size), then absolute */}
      <div
        ref={cardRef}
        style={{
          position: ready ? 'absolute' : 'relative',
          top: 0,
          left: 0,
          width: ready && cardDimsRef.current ? cardDimsRef.current.w : undefined,
          transition: ready ? 'opacity 220ms ease-out, transform 220ms ease-out' : undefined,
          opacity: ready ? (isAltDrag ? 0 : 1) : 1,
          transform: isAltDrag ? 'scale(0.96)' : 'scale(1.02)',
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      >
        <ExerciseCard exercise={exercise} className="shadow-xl" />
      </div>
      {/* Pill — starts at card scale, shrinks to natural size when alt-drag activates */}
      <div
        ref={pillRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transition: pillTransitionReady ? 'opacity 220ms ease-out, transform 220ms ease-out' : undefined,
          opacity: ready && isAltDrag ? 1 : 0,
          transform: ready ? (isAltDrag ? 'scale(1)' : pillInitScale) : 'scale(1)',
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      >
        <div className="inline-flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 shadow-lg ring-1 ring-blue-400/40">
          <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
            +
          </div>
          <span className="text-sm font-medium text-foreground">{exercise.name}</span>
        </div>
      </div>
    </div>
  )
}

export function DayView() {
  const [mode, setMode] = useState<Mode>('edit')
  const modeRef = useRef<Mode>('edit')
  const [colored, setColored] = useState(false)
  const [density, setDensity] = useState<Density>('medium')
  const [selectedCol, setSelectedCol] = useState<number>(0)
  const [focusLevel, setFocusLevel] = useState<'column' | 'item' | 'child'>('column')
  const focusLevelRef = useRef<'column' | 'item' | 'child'>('column')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const selectedItemIdRef = useRef<string | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const selectedChildIdRef = useRef<string | null>(null)

  function setFocusLevelBoth(v: 'column' | 'item' | 'child') { focusLevelRef.current = v; setFocusLevel(v) }
  function setSelectedItemBoth(id: string | null) { selectedItemIdRef.current = id; setSelectedItemId(id) }
  function setSelectedChildBoth(id: string | null) { selectedChildIdRef.current = id; setSelectedChildId(id) }
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([
    { id: crypto.randomUUID(), type: 'exercise', exercise: exercises[0], autoOpen: false },
  ])
  const workoutItemsRef = useRef(workoutItems)
  useEffect(() => { workoutItemsRef.current = workoutItems }, [workoutItems])
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeIdRef = useRef<string | null>(null)
  function setActiveIdBoth(id: string | null) { activeIdRef.current = id; setActiveId(id) }
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastsRef = useRef(toasts)
  useEffect(() => { toastsRef.current = toasts }, [toasts])
  const sensors = useDragSensors()

  // Alt-drag (duplicate) state — refs for event handlers, state for rendering
  const altHeldRef = useRef(false)
  const isAltDragRef = useRef(false)
  const altInsertionRef = useRef<number | null>(null)
  const [isAltDrag, setIsAltDrag] = useState(false)
  const [altInsertionIndex, setAltInsertionIndex] = useState<number | null>(null)

  function setAltDragActive(val: boolean) {
    isAltDragRef.current = val
    setIsAltDrag(val)
  }
  function setAltInsertion(idx: number | null) {
    altInsertionRef.current = idx
    setAltInsertionIndex(idx)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Alt') {
        altHeldRef.current = true
        if (activeIdRef.current) setAltDragActive(true)
      }
      if (modeRef.current === 'edit' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const target = e.target as HTMLElement
        if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        setSelectedCol(prev => e.key === 'ArrowLeft'
          ? Math.max(0, prev - 1)
          : Math.min(days.length - 1, prev + 1)
        )
      }
      if (modeRef.current === 'edit' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        const target = e.target as HTMLElement
        if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        const level = focusLevelRef.current
        if (level === 'column') return // up/down not meaningful at column level
        e.preventDefault()
        const items = workoutItemsRef.current
        const dir = e.key === 'ArrowUp' ? -1 : 1
        if (level === 'item') {
          const idx = items.findIndex(i => i.id === selectedItemIdRef.current)
          if (idx === -1) return
          const next = items[Math.max(0, Math.min(items.length - 1, idx + dir))]
          setSelectedItemBoth(next.id)
        } else if (level === 'child') {
          const section = items.find(i => i.id === selectedItemIdRef.current)
          if (section?.type !== 'section') return
          const idx = section.children.findIndex(c => c.id === selectedChildIdRef.current)
          if (idx === -1) return
          const next = section.children[Math.max(0, Math.min(section.children.length - 1, idx + dir))]
          setSelectedChildBoth(next.id)
        }
      }
      if (modeRef.current === 'edit' && e.key === 'Tab') {
        const target = e.target as HTMLElement
        if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        const items = workoutItemsRef.current
        const level = focusLevelRef.current
        if (!e.shiftKey) {
          if (level === 'column') {
            // Tab from column → topmost item (exercise or section, same level)
            setFocusLevelBoth('item')
            setSelectedItemBoth(items[0]?.id ?? null)
            setSelectedChildBoth(null)
          } else if (level === 'item') {
            // Tab from item → only go deeper if it's a section (like opening a folder)
            const item = items.find(i => i.id === selectedItemIdRef.current)
            if (item?.type === 'section' && item.children.length > 0) {
              setFocusLevelBoth('child')
              setSelectedChildBoth(item.children[0].id)
            }
            // exercise = already deepest, do nothing
          }
        } else {
          // Shift+Tab: go up
          if (level === 'child') {
            setFocusLevelBoth('item')
            setSelectedChildBoth(null)
          } else if (level === 'item') {
            setFocusLevelBoth('column')
            setSelectedItemBoth(null)
            setSelectedChildBoth(null)
          }
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        const latest = toastsRef.current.at(-1)
        if (!latest) return
        e.preventDefault()
        latest.onUndo()
        setToasts(t => t.filter(x => x.id !== latest.id))
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'Alt') {
        altHeldRef.current = false
        if (activeIdRef.current) setAltDragActive(false)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  function handleDragStart({ active }: DragStartEvent) {
    setActiveIdBoth(active.id as string)
    if (altHeldRef.current) {
      setAltDragActive(true)
      setAltInsertion(null)
    }
  }

  function findContainer(id: string, items: WorkoutItem[]): 'root' | string | null {
    for (const item of items) {
      if (item.id === id) return 'root'
      if (item.type === 'section') {
        if (item.children.some(c => c.id === id)) return item.id
      }
    }
    return null
  }

  function handleDragOver({ active, over, activatorEvent, delta }: DragOverEvent) {
    if (!over || active.id === over.id) return
    const activeId = active.id as string
    const overId = over.id as string

    if (isAltDragRef.current) {
      // Compute insertion index from cursor Y vs over-item midpoint
      const overEl = document.querySelector(`[data-dnd-id="${overId}"]`) as HTMLElement | null
      const overIdx = workoutItems.findIndex(i => i.id === overId)
      if (overEl && overIdx !== -1) {
        const rect = overEl.getBoundingClientRect()
        const mouseY = (activatorEvent as MouseEvent).clientY + delta.y
        const insertBefore = mouseY < rect.top + rect.height / 2
        setAltInsertion(insertBefore ? overIdx : overIdx + 1)
      }
      return // don't mutate items during alt-drag
    }

    setWorkoutItems(prev => {
      const sourceId = findContainer(activeId, prev)
      if (!sourceId) return prev // not an exercise

      // Determine destination container
      let destId: 'root' | string = 'root'
      for (const item of prev) {
        if (item.id === overId) {
          destId = item.type === 'section' ? item.id : 'root'
          break
        }
        if (item.type === 'section' && item.children.some(c => c.id === overId)) {
          destId = item.id
          break
        }
      }

      if (sourceId === destId) return prev // same container, let onDragEnd handle it

      // Find the active exercise item
      let activeItem: ExerciseItem | null = null
      if (sourceId === 'root') {
        const found = prev.find(i => i.id === activeId)
        if (!found || found.type !== 'exercise') return prev
        activeItem = found
      } else {
        const section = prev.find(i => i.id === sourceId && i.type === 'section') as SectionItem | undefined
        activeItem = section?.children.find(c => c.id === activeId) ?? null
      }
      if (!activeItem) return prev

      // Remove from source
      let next: WorkoutItem[] = sourceId === 'root'
        ? prev.filter(i => i.id !== activeId)
        : prev.map(i => i.id === sourceId && i.type === 'section'
            ? { ...i, children: i.children.filter(c => c.id !== activeId) }
            : i)

      // Insert into destination
      if (destId === 'root') {
        const overIdx = next.findIndex(i => i.id === overId)
        next = [...next]
        next.splice(overIdx >= 0 ? overIdx : next.length, 0, activeItem)
      } else {
        next = next.map(i => {
          if (i.id !== destId || i.type !== 'section') return i
          const children = [...i.children]
          const overChildIdx = children.findIndex(c => c.id === overId)
          children.splice(overChildIdx >= 0 ? overChildIdx : children.length, 0, activeItem!)
          return { ...i, children }
        })
      }

      // Delete any section that was emptied by the move
      next = next.filter(i => i.type !== 'section' || i.children.length > 0)

      return next
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveIdBoth(null)

    if (isAltDragRef.current) {
      const insertAt = altInsertionRef.current
      setAltInsertion(null)
      // Defer clearing isAltDrag so DragOverlay still sees dropAnimation={null}
      // during this render, preventing the ghost return animation
      requestAnimationFrame(() => setAltDragActive(false))
      if (insertAt === null) return
      const activeId = active.id as string
      setWorkoutItems(prev => {
        // Find the original exercise (root or inside a section)
        let original: ExerciseItem | null = null
        for (const item of prev) {
          if (item.type === 'exercise' && item.id === activeId) { original = item; break }
          if (item.type === 'section') {
            const child = item.children.find(c => c.id === activeId)
            if (child) { original = child; break }
          }
        }
        if (!original) return prev
        const copy: ExerciseItem = { ...original, id: crypto.randomUUID(), autoOpen: false }
        const next = [...prev]
        next.splice(insertAt, 0, copy)
        return next
      })
      return
    }

    if (!over || active.id === over.id) return
    const activeId = active.id as string
    const overId = over.id as string
    setWorkoutItems(prev => {
      // Top-level reorder
      const from = prev.findIndex(i => i.id === activeId)
      const to = prev.findIndex(i => i.id === overId)
      if (from !== -1 && to !== -1) return arrayMove(prev, from, to)
      // Reorder within a section
      return prev.map(item => {
        if (item.type !== 'section') return item
        const childFrom = item.children.findIndex(c => c.id === activeId)
        if (childFrom === -1) return item
        const childTo = item.children.findIndex(c => c.id === overId)
        if (childTo === -1) return item
        return { ...item, children: arrayMove(item.children, childFrom, childTo) }
      })
    })
  }

  const activeItem = useMemo(() => {
    if (!activeId) return null
    for (const item of workoutItems) {
      if (item.id === activeId) return item
      if (item.type === 'section') {
        const child = item.children.find(c => c.id === activeId)
        if (child) return child
      }
    }
    return null
  }, [activeId, workoutItems])

  function addExercise(at?: number) {
    const item: ExerciseItem = { id: crypto.randomUUID(), type: 'exercise', exercise: exercises[0], autoOpen: true }
    setWorkoutItems(prev => {
      const next = [...prev]
      next.splice(at ?? next.length, 0, item)
      return next
    })
  }

  async function addSection(at: number) {
    const upper = workoutItems[at]
    const lower = workoutItems[at + 1]
    if (!upper || !lower || upper.type !== 'exercise' || lower.type !== 'exercise') return

    const id = crypto.randomUUID()
    const section: SectionItem = {
      id,
      type: 'section',
      title: '',
      subtitle: '',
      estimatedTime: '10m',
      children: [upper, lower],
      isGeneratingName: true,
    }
    setWorkoutItems(prev => {
      const next = [...prev]
      next.splice(at, 2, section)
      return next
    })

    const name = await generateSectionName([upper.exercise, lower.exercise])
    setWorkoutItems(prev => prev.map(item =>
      item.id === id ? { ...item, title: name, isGeneratingName: false, autoSelect: true } : item
    ))
  }

  const deleteExercise = useCallback((id: string) => {
    setWorkoutItems(prev => {
      const snapshot = prev
      const next = prev
        .filter(item => item.id !== id)
        .map(item => item.type === 'section'
          ? { ...item, children: item.children.filter(c => c.id !== id) }
          : item
        )

      const toastId = crypto.randomUUID()
      setToasts(t => [...t, {
        id: toastId,
        message: 'Exercise deleted',
        onUndo: () => setWorkoutItems(snapshot),
      }])

      return next
    })
  }, [])

  function updateExercise(id: string, exercise: Exercise) {
    setWorkoutItems(prev => prev.map(item => {
      if (item.type === 'exercise') return item.id === id ? { ...item, exercise, autoOpen: false } : item
      return { ...item, children: item.children.map(c => c.id === id ? { ...c, exercise, autoOpen: false } : c) }
    }))
  }

  function updateSection(id: string, updates: Partial<Pick<SectionItem, 'title' | 'subtitle' | 'estimatedTime'>>) {
    setWorkoutItems(prev =>
      prev.map(item => item.id === id && item.type === 'section' ? { ...item, ...updates } : item)
    )
  }

  function addExerciseToSection(sectionId: string, afterIndex: number) {
    const newItem: ExerciseItem = { id: crypto.randomUUID(), type: 'exercise', exercise: exercises[0], autoOpen: true }
    setWorkoutItems(prev => prev.map(item => {
      if (item.id !== sectionId || item.type !== 'section') return item
      const children = [...item.children]
      children.splice(afterIndex, 0, newItem)
      return { ...item, children }
    }))
  }

  return (
    <div className="min-h-screen bg-muted p-6" onClick={() => {
      if (modeRef.current === 'edit' && focusLevelRef.current !== 'column') {
        setFocusLevelBoth('column')
        setSelectedItemBoth(null)
        setSelectedChildBoth(null)
      }
    }}>
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))} />
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon" onClick={() => setColored((c) => !c)}>
          <PaletteIcon rainbow={colored} />
        </Button>
        <div className="flex rounded-lg border border-border bg-background p-0.5">
          {densities.map(({ id, icon }) => (
            <Button
              key={id}
              variant={density === id ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setDensity(id)}
              className="size-7 rounded-md"
            >
              {icon}
            </Button>
          ))}
        </div>
        <div className="flex rounded-lg border border-border bg-background p-0.5">
          {modes.map(({ id, label }) => (
            <Button
              key={id}
              variant={mode === id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
  modeRef.current = id
  setMode(id)
  if (id === 'edit') {
    setSelectedCol(0)
    setFocusLevelBoth('column')
    setSelectedItemBoth(null)
    setSelectedChildBoth(null)
  }
}}
              className="rounded-md"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto px-1 pt-1 pb-4">
        {days.map((day, i) => (
          <div key={day.date} className="flex w-72 shrink-0 flex-col gap-2">
            {i === 0 && <DayHeader {...day} />}
            <div className={cn(
              'flex flex-col rounded-xl bg-foreground/6 p-3 transition-shadow duration-150',
              mode === 'edit' && focusLevel === 'column' && selectedCol === i && 'ring-2 ring-orange-400/70 ring-offset-2 ring-offset-muted',
            )}>
              {i === 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={workoutItems.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {workoutItems.map((item, idx) => (
                      <Fragment key={item.id}>
                        {idx > 0 && isAltDrag && (
                          <div className="relative z-10 flex h-[8px] items-center">
                            {altInsertionIndex === idx && (
                              <>
                                <div className="absolute inset-x-0 h-0.5 rounded-full bg-blue-400/60" />
                                <div className="absolute left-0 size-2 -translate-x-1 rounded-full bg-blue-400/60" />
                              </>
                            )}
                          </div>
                        )}
                        {idx > 0 && !isAltDrag && (
                          <InsertZone
                            dragging={!!activeId}
                            onAdd={() => addExercise(idx)}
                            onAddSection={() => addSection(idx - 1)}
                            hideSection={workoutItems[idx - 1].type === 'section' || item.type === 'section'}
                          />
                        )}
                        {item.type === 'exercise' ? (
                          <SortableExerciseCard
                            item={item}
                            onExerciseChange={ex => updateExercise(item.id, ex)}
                            onDelete={() => deleteExercise(item.id)}
                            activeId={activeId}
                            isAltDrag={isAltDrag}
                            isSelected={focusLevel === 'item' && selectedItemId === item.id}
                          />
                        ) : (
                          <SortableSectionCard
                            item={item}
                            onUpdate={updates => updateSection(item.id, updates)}
                            onExerciseChange={updateExercise}
                            onDeleteExercise={deleteExercise}
                            onAddExercise={afterIndex => addExerciseToSection(item.id, afterIndex)}
                            draggingId={activeId}
                            isAltDrag={isAltDrag}
                            isSelected={focusLevel === 'item' && selectedItemId === item.id}
                            selectedChildId={focusLevel === 'child' && selectedItemId === item.id ? selectedChildId : null}
                          />
                        )}
                      </Fragment>
                    ))}
                  </SortableContext>
                  {isAltDrag && altInsertionIndex === workoutItems.length && (
                    <div className="relative z-10 -my-px h-px">
                      <div className="absolute inset-x-0 h-0.5 rounded-full bg-blue-400/60" />
                      <div className="absolute left-0 top-1/2 size-2 -translate-x-1 -translate-y-1/2 rounded-full bg-blue-400/60" />
                    </div>
                  )}
                  <DragOverlay dropAnimation={isAltDrag ? null : undefined}>
                    {activeItem && (
                      activeItem.type === 'exercise'
                        ? <MorphOverlay exercise={activeItem.exercise} isAltDrag={isAltDrag} />
                        : <div className="scale-[1.02] opacity-95">
                            <SectionCard section={activeItem} />
                            <div className="mt-1 flex flex-col gap-1.5">
                              {activeItem.children.map(child => (
                                <ExerciseCard key={child.id} exercise={child.exercise} />
                              ))}
                            </div>
                          </div>
                    )}
                  </DragOverlay>
                  <button
                    onClick={() => addExercise()}
                    className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    <Plus className="size-3.5" />
                    Add exercise
                  </button>
                </DndContext>
              )}
              {i !== 0 && (
                <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border">
                  <span className="text-xs text-muted-foreground">Exercises go here</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Help button — bottom right */}
      <PopoverPrimitive.Root>
        <PopoverPrimitive.Trigger className="fixed bottom-6 right-6 flex size-8 items-center justify-center rounded-full bg-foreground/10 text-foreground/50 hover:bg-foreground/15 hover:text-foreground/80 transition-colors">
          <HelpCircle className="size-4" />
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner side="top" align="end" sideOffset={8} positionMethod="fixed" collisionPadding={16}>
            <PopoverPrimitive.Popup className={cn(
              'z-50 w-72 rounded-xl bg-card p-4 shadow-xl ring-1 ring-foreground/10',
              'transition-[opacity,scale] duration-150 ease-out',
              'data-starting-style:opacity-0 data-starting-style:scale-[0.98]',
              'data-ending-style:opacity-0 data-ending-style:scale-[0.98]',
            )}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Keyboard Shortcuts</p>
              <div className="flex flex-col gap-2">
                {[
                  { keys: ['←', '→'], label: 'Move between day columns' },
                  { keys: ['↑', '↓'], label: 'Move between items' },
                  { keys: ['Tab'], label: 'Focus deeper (open section)' },
                  { keys: ['Shift', 'Tab'], label: 'Focus up a level' },
                  { keys: ['⌘', 'Z'], label: 'Undo last deletion' },
                  { keys: ['Option', 'Drag'], label: 'Duplicate an exercise' },
                ].map(({ keys, label }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      {keys.map(k => (
                        <kbd key={k} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground/70 ring-1 ring-foreground/10">{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  )
}
