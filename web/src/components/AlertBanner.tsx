import { CircleAlert, X } from 'lucide-react'

type AlertBannerProps = {
  message: string
  onDismiss: () => void
}

export function AlertBanner({ message, onDismiss }: AlertBannerProps) {
  if (!message) return null
  return (
    <div className="alert alert-error" role="alert">
      <CircleAlert size={18} />
      <span>{message}</span>
      <button className="alert-close" onClick={onDismiss} aria-label="Dismiss error">
        <X size={16} />
      </button>
    </div>
  )
}
