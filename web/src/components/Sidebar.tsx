import { CloudUpload, ChevronRight, FolderKanban, LoaderCircle, Plus, Sparkles } from 'lucide-react'
import type { Project } from '../types/project'

type SidebarProps = {
  projects: Project[]
  selectedProjectId: number | null
  loading: boolean
  onSelectProject: (projectId: number) => void
  onNewProject: () => void
}

export function Sidebar({
  projects,
  selectedProjectId,
  loading,
  onSelectProject,
  onNewProject,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#top" aria-label="LabelFlow home">
        <span className="brand-mark">
          <Sparkles size={18} strokeWidth={2.2} />
        </span>
        <span>
          labelflow<span className="brand-period">.</span>
        </span>
      </a>

      <div className="sidebar-section-heading">
        <span>Workspace</span>
        <span className="workspace-pill">LOCAL</span>
      </div>
      <button className="sidebar-new-project" onClick={onNewProject}>
        <Plus size={16} /> New project
      </button>

      <div className="project-list-heading">
        <span>Your projects</span>
        <span className="project-count">{projects.length}</span>
      </div>
      <nav className="project-nav" aria-label="Projects">
        {loading ? (
          <div className="sidebar-loading">
            <LoaderCircle className="spin" size={15} /> Loading projects
          </div>
        ) : projects.length === 0 ? (
          <p className="sidebar-empty">Your projects will show up here.</p>
        ) : (
          projects.map((project) => (
            <button
              className={`project-nav-item ${selectedProjectId === project.id ? 'is-selected' : ''}`}
              key={project.id}
              onClick={() => onSelectProject(project.id)}
            >
              <FolderKanban size={16} />
              <span className="project-nav-name">{project.name}</span>
              {selectedProjectId === project.id && (
                <ChevronRight size={15} className="project-chevron" />
              )}
            </button>
          ))
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="storage-card">
          <span className="storage-icon">
            <CloudUpload size={17} />
          </span>
          <div>
            <strong>Image storage</strong>
            <span>Cloudflare R2</span>
          </div>
          <span className="online-dot" title="R2 is used for image storage" />
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">LF</div>
          <div>
            <strong>Local workspace</strong>
            <span>Personal account</span>
          </div>
          <span className="user-menu">•••</span>
        </div>
      </div>
    </aside>
  )
}
