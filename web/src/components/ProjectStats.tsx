import { CheckCircle2, Clock3, Images } from 'lucide-react'
import type { ProjectImage } from '../types/projectImage'

type ProjectStatsProps = { images: ProjectImage[]; loading: boolean }

export function ProjectStats({ images, loading }: ProjectStatsProps) {
  const readyImages = images.filter((image) => image.status === 'ready').length
  const pendingImages = images.filter((image) => image.status === 'pending').length

  return (
    <section className="stats-row" aria-label="Project summary">
      <div className="stat-card">
        <span className="stat-icon stat-icon-accent">
          <Images size={18} />
        </span>
        <div>
          <span className="stat-label">Images in project</span>
          <strong>{loading ? '—' : images.length}</strong>
        </div>
        <span className="stat-footnote">all uploads</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon stat-icon-green">
          <CheckCircle2 size={18} />
        </span>
        <div>
          <span className="stat-label">Ready to label</span>
          <strong>{loading ? '—' : readyImages}</strong>
        </div>
        <span className="stat-footnote">verified images</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon stat-icon-amber">
          <Clock3 size={18} />
        </span>
        <div>
          <span className="stat-label">Still processing</span>
          <strong>{loading ? '—' : pendingImages}</strong>
        </div>
        <span className="stat-footnote">pending uploads</span>
      </div>
    </section>
  )
}
