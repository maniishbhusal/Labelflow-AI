import { ArrowUpRight, ChevronRight } from 'lucide-react'

type TopbarProps = { projectName: string | null }

export function Topbar({ projectName }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>Workspace</span>
        <ChevronRight size={14} />
        <strong>{projectName ?? 'Projects'}</strong>
      </div>
      <div className="topbar-actions">
        <a className="docs-link" href="/api/docs/" target="_blank" rel="noreferrer">
          API docs <ArrowUpRight size={14} />
        </a>
        <div className="topbar-avatar">M</div>
      </div>
    </header>
  )
}
