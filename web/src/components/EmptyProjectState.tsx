import { FolderKanban, LoaderCircle, Plus } from 'lucide-react'

type EmptyProjectStateProps = {
  loading: boolean
  onCreateProject: () => void
}

export function EmptyProjectState({ loading, onCreateProject }: EmptyProjectStateProps) {
  return (
    <section className="empty-project-state">
      <div className="empty-illustration">
        {loading ? <LoaderCircle className="spin" size={30} strokeWidth={1.5} /> : <FolderKanban size={32} strokeWidth={1.5} />}
      </div>
      {loading ? (
        <><span className="empty-kicker">Loading workspace</span><h2>Getting your projects.</h2><p>Your projects and image libraries will appear here.</p></>
      ) : (
        <><span className="empty-kicker">A good dataset starts with a project</span><h2>Give your images a home.</h2><p>Projects keep image uploads organized so you can review and label a dataset one step at a time.</p><button className="button button-primary" onClick={onCreateProject}><Plus size={17} /> Create your first project</button></>
      )}
    </section>
  )
}
