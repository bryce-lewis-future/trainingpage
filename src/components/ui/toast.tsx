import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ToastItem {
  id: string
  message: string
  onUndo: () => void
}

interface ToastProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

const DURATION = 4000

function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function dismiss() {
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 200)
  }

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    timerRef.current = setTimeout(dismiss, DURATION)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleUndo() {
    if (timerRef.current) clearTimeout(timerRef.current)
    toast.onUndo()
    dismiss()
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 shadow-xl',
        'transition-[opacity,transform] duration-200 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      )}
    >
      <span className="text-sm text-background">{toast.message}</span>
      <button
        onClick={handleUndo}
        className="shrink-0 text-sm font-medium text-background/70 hover:text-background transition-colors"
      >
        Undo
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}

export type { ToastItem }
