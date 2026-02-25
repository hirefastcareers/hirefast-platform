import { useCallback, useState } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'

type CvUploadZoneProps = {
  onTextReady: (text: string) => void
  disabled?: boolean
}

export default function CvUploadZone({ onTextReady, disabled }: CvUploadZoneProps) {
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)
      if (file.type === 'text/plain') {
        const reader = new FileReader()
        reader.onload = () => {
          const text = (reader.result as string)?.trim()
          if (text && text.length >= 50) {
            onTextReady(text)
          } else {
            setError('File is too short. Paste or upload a full CV (at least 50 characters).')
          }
        }
        reader.readAsText(file)
        return
      }
      if (file.type === 'application/pdf') {
        setError('PDF: Please paste your CV text in the box below, or save the PDF as .txt and upload.')
        return
      }
      setError('Please upload a .txt file or paste your CV text below.')
    },
    [onTextReady]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDrag(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [disabled, handleFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDrag(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
  }, [])

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile]
  )

  return (
    <div className="space-y-2">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative rounded-2xl border-2 border-dashed p-8 text-center transition
          ${drag && !disabled ? 'border-[#f4601a] bg-amber-50/50' : 'border-slate-200 bg-slate-50/50'}
          ${disabled ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept=".txt,text/plain,application/pdf"
          onChange={onInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold">
          Drop your CV here or tap to upload
        </p>
        <p className="text-slate-500 text-sm mt-1">
          .txt preferred • PDF: paste text below
        </p>
      </div>
      {error && (
        <p className="text-amber-700 text-sm font-medium">{error}</p>
      )}
    </div>
  )
}

export function ProcessingOverlay() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-8">
      <Loader2 className="w-12 h-12 animate-spin text-[#f4601a]" />
      <p className="font-semibold text-slate-700">Processing with AI…</p>
      <p className="text-slate-500 text-sm">Extracting your details from your CV</p>
    </div>
  )
}
