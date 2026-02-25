import { useEffect, useCallback } from 'react'

type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

/**
 * Bottom drawer (Sheet) for mobile-first Express Apply. Slides up from bottom; no modal on mobile per .cursorrules.
 */
export function Sheet({ open, onOpenChange, children }: SheetProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    },
    [onOpenChange]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleEscape])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-slate-900 shadow-2xl animate-slide-up"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-3">
      {children}
    </div>
  )
}

export function SheetContent({ children }: { children: React.ReactNode }) {
  return <div className="p-4 pb-safe">{children}</div>
}
