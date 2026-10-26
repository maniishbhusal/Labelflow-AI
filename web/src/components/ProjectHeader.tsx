import { Plus } from 'lucide-react'
import type { Project } from '../types/project'
import { formatDate } from '../utils/format'

type ProjectHeaderProps = {
  project: Project | null
  onNewProject: () => void
}

export function ProjectHeader({ project, onNewProject }: ProjectHeaderProps) {
  return (
    <section className="page-heading">
      <div>
        <div className="eyebrow">
          <span className="eyebrow-dot" /> IMAGE DATASET WORKSPACE
        </div>
        <h1>{project ? project.name : 'Your labeling projects'}</h1>
        <p>
          {project
            ? `Collect images here, then get them ready for AI-assisted annotation. Created ${formatDate(project.created_at)}.`
            : 'Create a project to start organizing your image datasets.'}
        </p>
      </div>
      <button className="button button-primary heading-create" onClick={onNewProject}>
        <Plus size={17} /> New project
      </button>
    </section>
  )
}
