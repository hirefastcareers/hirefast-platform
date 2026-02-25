import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type DropdownContextValue = {
  open: boolean
  setOpen: (v: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

function useDropdown() {
  const ctx = useContext(DropdownContext)
  if (!ctx) throw new Error('Dropdown components must be used within DropdownMenu')
  return ctx
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const trigger = triggerRef.current
    const content = contentRef.current
    if (
      trigger?.contains(e.target as Node) ||
      content?.contains(e.target as Node)
    )
      return
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [open, handleClickOutside])

  return (
    <DropdownContext.Provider
      value={{ open, setOpen, triggerRef, contentRef }}
    >
      <div className="relative">{children}</div>
    </DropdownContext.Provider>
  )
}

export function DropdownMenuTrigger({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { open, setOpen, triggerRef } = useDropdown()
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-haspopup="listbox"
      onClick={() => setOpen(!open)}
      className={className}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  children,
  className = '',
  align = 'start',
}: {
  children: ReactNode
  className?: string
  align?: 'start' | 'end' | 'center'
}) {
  const { open, setOpen, contentRef } = useDropdown()
  const alignClass =
    align === 'end'
      ? 'right-0'
      : align === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : 'left-0'

  if (!open) return null

  return (
    <div
      ref={contentRef}
      role="listbox"
      className={`absolute z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ${alignClass} ${className}`}
      style={{ minWidth: '12rem' }}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  onSelect,
  className = '',
}: {
  children: ReactNode
  onSelect?: () => void
  className?: string
}) {
  const { setOpen } = useDropdown()
  const handleClick = () => {
    onSelect?.()
    setOpen(false)
  }
  return (
    <div
      role="option"
      onClick={handleClick}
      className={`cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100 outline-none ${className}`}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-500 ${className}`}
    >
      {children}
    </div>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-slate-200" />
}
