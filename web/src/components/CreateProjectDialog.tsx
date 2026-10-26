import { useState, type FormEvent } from 'react'
import { FolderKanban, LoaderCircle, Plus, X } from 'lucide-react'

type CreateProjectDialogProps = {
  creating: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<boolean>
}

export function CreateProjectDialog({ creating, onClose, onCreate }: CreateProjectDialogProps) {
  const [name, setName] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const created = await onCreate(name.trim())
    if (created) setName('')
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="project-modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
        <div className="modal-topline"><span className="modal-icon"><FolderKanban size={19} /></span><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>
        <span className="section-kicker">NEW WORKSPACE</span>
        <h2 id="new-project-title">Create a project</h2>
        <p>Give this dataset a clear name. You can upload images right after.</p>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="project-name">Project name</label>
          <input id="project-name" className="text-input" autoFocus maxLength={255} placeholder="e.g. Street scenes — Kathmandu" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="modal-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={!name.trim() || creating}>
              {creating ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}
              {creating ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
