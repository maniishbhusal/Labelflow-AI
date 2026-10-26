import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  CloudUpload,
  FolderKanban,
  ImagePlus,
  Images,
  LoaderCircle,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import './App.css'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

type Project = {
  id: number
  name: string
  created_at: string
}

type ProjectImage = {
  id: number
  original_filename: string
  content_type: string
  file_size: number | null
  width: number | null
  height: number | null
  status: 'pending' | 'ready' | 'failed'
  download_url: string | null
  created_at: string
  uploaded_at: string | null
}

type UploadIntent = {
  image: ProjectImage
  upload: {
    method: 'PUT'
    url: string
    headers: Record<string, string>
    expires_in: number
  }
}

type UploadStage = 'idle' | 'preparing' | 'uploading' | 'verifying'

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Could not reach the API. Make sure Django is running on port 8000.')
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new Error(readErrorMessage(payload) || `The API returned ${response.status}.`)
  return payload as T
}

function readErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (typeof value === 'string') return value
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  }
  return null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatBytes(value: number | null) {
  if (!value) return '—'
  return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function getImageContentType(file: File) {
  if (file.type === 'image/jpeg' || file.type === 'image/png') return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'png') return 'image/png'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  return ''
}

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [images, setImages] = useState<ProjectImage[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [imagesLoading, setImagesLoading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [isDragging, setIsDragging] = useState(false)

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )
  const readyImages = images.filter((image) => image.status === 'ready').length
  const pendingImages = images.filter((image) => image.status === 'pending').length

  useEffect(() => {
    let ignore = false
    setProjectsLoading(true)
    apiRequest<Project[]>('/api/projects/')
      .then((data) => {
        if (ignore) return
        setProjects(data)
        setSelectedProjectId((currentId) =>
          currentId && data.some((project) => project.id === currentId) ? currentId : (data[0]?.id ?? null),
        )
        setPageError('')
      })
      .catch((error: unknown) => {
        if (!ignore) setPageError(error instanceof Error ? error.message : 'Could not load projects.')
      })
      .finally(() => { if (!ignore) setProjectsLoading(false) })
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    if (!selectedProjectId) {
      setImages([])
      return
    }

    let ignore = false
    setImagesLoading(true)
    setPageError('')
    apiRequest<ProjectImage[]>(`/api/projects/${selectedProjectId}/images/`)
      .then((data) => { if (!ignore) setImages(data) })
      .catch((error: unknown) => {
        if (!ignore) setPageError(error instanceof Error ? error.message : 'Could not load images.')
      })
      .finally(() => { if (!ignore) setImagesLoading(false) })
    return () => { ignore = true }
  }, [selectedProjectId])

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = projectName.trim()
    if (!name) return

    setCreatingProject(true)
    setPageError('')
    try {
      const project = await apiRequest<Project>('/api/projects/', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      setProjects((current) => [project, ...current])
      setSelectedProjectId(project.id)
      setProjectName('')
      setShowProjectDialog(false)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Could not create the project.')
    } finally {
      setCreatingProject(false)
    }
  }

  function chooseFile(file: File | undefined) {
    if (!file) return
    const contentType = getImageContentType(file)
    if (!['image/jpeg', 'image/png'].includes(contentType)) {
      setPageError('Choose a JPG, JPEG, or PNG image.')
      setSelectedFile(null)
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setPageError('This image is larger than the 10 MB upload limit.')
      setSelectedFile(null)
      return
    }
    setPageError('')
    setSelectedFile(file)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.currentTarget.files?.[0])
    event.currentTarget.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (isBusy) return
    chooseFile(event.dataTransfer.files[0])
  }

  async function refreshImages(projectId: number) {
    const latest = await apiRequest<ProjectImage[]>(`/api/projects/${projectId}/images/`)
    setImages(latest)
  }

  async function handleUpload() {
    if (!selectedProject || !selectedFile) return
    let currentStage: UploadStage = 'preparing'
    setPageError('')
    setUploadStage(currentStage)

    try {
      const contentType = getImageContentType(selectedFile)
      const intent = await apiRequest<UploadIntent>(`/api/projects/${selectedProject.id}/images/`, {
        method: 'POST',
        body: JSON.stringify({
          file_name: selectedFile.name,
          content_type: contentType,
          file_size: selectedFile.size,
        }),
      })

      currentStage = 'uploading'
      setUploadStage(currentStage)
      let r2Response: Response
      try {
        r2Response = await fetch(intent.upload.url, {
          method: intent.upload.method,
          headers: intent.upload.headers,
          body: selectedFile,
        })
      } catch {
        throw new Error('Could not upload to R2. Check your bucket CORS rule allows http://localhost:5173, PUT, and Content-Type.')
      }
      if (!r2Response.ok) {
        throw new Error(`R2 rejected the upload (${r2Response.status}). Check the R2 credentials, URL expiry, and Content-Type.`)
      }

      currentStage = 'verifying'
      setUploadStage(currentStage)
      await apiRequest<ProjectImage>(`/api/projects/${selectedProject.id}/images/${intent.image.id}/complete/`, {
        method: 'POST',
      })
      await refreshImages(selectedProject.id)
      setSelectedFile(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The upload could not be completed.'
      setPageError(currentStage === 'verifying' ? `${message} The image may still be pending; try refreshing the project.` : message)
    } finally {
      setUploadStage('idle')
    }
  }

  const isBusy = uploadStage !== 'idle'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="LabelFlow home">
          <span className="brand-mark"><Sparkles size={18} strokeWidth={2.2} /></span>
          <span>labelflow<span className="brand-period">.</span></span>
        </a>

        <div className="sidebar-section-heading">
          <span>Workspace</span>
          <span className="workspace-pill">LOCAL</span>
        </div>
        <button className="sidebar-new-project" onClick={() => setShowProjectDialog(true)}>
          <Plus size={16} /> New project
        </button>

        <div className="project-list-heading">
          <span>Your projects</span>
          <span className="project-count">{projects.length}</span>
        </div>
        <nav className="project-nav" aria-label="Projects">
          {projectsLoading ? (
            <div className="sidebar-loading"><LoaderCircle className="spin" size={15} /> Loading projects</div>
          ) : projects.length === 0 ? (
            <p className="sidebar-empty">Your projects will show up here.</p>
          ) : projects.map((project) => (
            <button
              className={`project-nav-item ${selectedProjectId === project.id ? 'is-selected' : ''}`}
              key={project.id}
              onClick={() => { setSelectedProjectId(project.id); setSelectedFile(null); setPageError('') }}
            >
              <FolderKanban size={16} />
              <span className="project-nav-name">{project.name}</span>
              {selectedProjectId === project.id && <ChevronRight size={15} className="project-chevron" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="storage-card">
            <span className="storage-icon"><CloudUpload size={17} /></span>
            <div><strong>Image storage</strong><span>Cloudflare R2</span></div>
            <span className="online-dot" title="R2 configured when upload is enabled" />
          </div>
          <div className="sidebar-user">
            <div className="user-avatar">LF</div>
            <div><strong>Local workspace</strong><span>Personal account</span></div>
            <span className="user-menu">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{selectedProject?.name ?? 'Projects'}</strong></div>
          <div className="topbar-actions">
            <a className="docs-link" href="/api/docs/" target="_blank" rel="noreferrer">API docs <ArrowUpRight size={14} /></a>
            <div className="topbar-avatar">M</div>
          </div>
        </header>

        <div className="page-wrap">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> IMAGE DATASET WORKSPACE</div>
              <h1>{selectedProject ? selectedProject.name : 'Your labeling projects'}</h1>
              <p>{selectedProject ? `Collect images here, then get them ready for AI-assisted annotation. Created ${formatDate(selectedProject.created_at)}.` : 'Create a project to start organizing your image datasets.'}</p>
            </div>
            <button className="button button-primary heading-create" onClick={() => setShowProjectDialog(true)}>
              <Plus size={17} /> New project
            </button>
          </section>

          {pageError && (
            <div className="alert alert-error" role="alert">
              <CircleAlert size={18} />
              <span>{pageError}</span>
              <button className="alert-close" onClick={() => setPageError('')} aria-label="Dismiss error"><X size={16} /></button>
            </div>
          )}

          {projectsLoading && !selectedProject ? (
            <section className="empty-project-state">
              <div className="empty-illustration"><LoaderCircle className="spin" size={30} strokeWidth={1.5} /></div>
              <span className="empty-kicker">Loading workspace</span>
              <h2>Getting your projects.</h2>
              <p>Your projects and image libraries will appear here.</p>
            </section>
          ) : !selectedProject ? (
            <section className="empty-project-state">
              <div className="empty-illustration"><FolderKanban size={32} strokeWidth={1.5} /></div>
              <span className="empty-kicker">A good dataset starts with a project</span>
              <h2>Give your images a home.</h2>
              <p>Projects keep image uploads organized so you can review and label a dataset one step at a time.</p>
              <button className="button button-primary" onClick={() => setShowProjectDialog(true)}><Plus size={17} /> Create your first project</button>
            </section>
          ) : selectedProject && (
            <>
              <section className="stats-row" aria-label="Project summary">
                <div className="stat-card">
                  <span className="stat-icon stat-icon-indigo"><Images size={18} /></span>
                  <div><span className="stat-label">Images in project</span><strong>{imagesLoading ? '—' : images.length}</strong></div>
                  <span className="stat-footnote">all uploads</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon stat-icon-green"><CheckCircle2 size={18} /></span>
                  <div><span className="stat-label">Ready to label</span><strong>{imagesLoading ? '—' : readyImages}</strong></div>
                  <span className="stat-footnote">verified images</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon stat-icon-amber"><Clock3 size={18} /></span>
                  <div><span className="stat-label">Still processing</span><strong>{imagesLoading ? '—' : pendingImages}</strong></div>
                  <span className="stat-footnote">pending uploads</span>
                </div>
              </section>

              <section className="upload-section">
                <div className="section-heading">
                  <div><span className="section-kicker">STEP 01 <span /> ADD YOUR DATA</span><h2>Upload images</h2><p>Start with JPG or PNG images. You can add more later.</p></div>
                  <span className="limit-badge">JPG · PNG <span /> UP TO 10 MB</span>
                </div>

                <div
                  className={`upload-dropzone ${isDragging ? 'is-dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
                  onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false) }}
                  onDrop={handleDrop}
                >
                  <div className="dropzone-icon"><ImagePlus size={22} /></div>
                  {selectedFile ? (
                    <>
                      <div className="dropzone-title">{selectedFile.name}</div>
                      <p>{formatBytes(selectedFile.size)} · Ready to upload</p>
                      <div className="upload-actions">
                        <button className="button button-primary" disabled={isBusy} onClick={handleUpload}>
                          {isBusy ? <LoaderCircle className="spin" size={16} /> : <CloudUpload size={16} />}
                          {uploadStage === 'preparing' ? 'Preparing…' : uploadStage === 'uploading' ? 'Uploading to R2…' : uploadStage === 'verifying' ? 'Verifying…' : 'Upload image'}
                        </button>
                        {!isBusy && <button className="button button-quiet" onClick={() => setSelectedFile(null)}>Choose another</button>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="dropzone-title">Drop an image here, or <label className="file-picker">browse<input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleFileChange} disabled={isBusy} /></label></div>
                      <p>The file uploads directly to private Cloudflare storage.</p>
                      <span className="dropzone-security"><Check size={13} /> Your storage credentials stay on the server</span>
                    </>
                  )}
                </div>

                {uploadStage !== 'idle' && (
                  <div className="upload-progress" aria-live="polite">
                    <div className={`progress-step ${uploadStage === 'preparing' ? 'active' : 'complete'}`}><span>{uploadStage === 'preparing' ? <LoaderCircle className="spin" size={14} /> : <Check size={13} />}</span>Prepare upload</div>
                    <div className={`progress-step ${uploadStage === 'uploading' ? 'active' : uploadStage === 'verifying' ? 'complete' : ''}`}><span>{uploadStage === 'uploading' ? <LoaderCircle className="spin" size={14} /> : uploadStage === 'verifying' ? <Check size={13} /> : '2'}</span>Send to R2</div>
                    <div className={`progress-step ${uploadStage === 'verifying' ? 'active' : ''}`}><span>{uploadStage === 'verifying' ? <LoaderCircle className="spin" size={14} /> : '3'}</span>Verify image</div>
                  </div>
                )}
              </section>

              <section className="gallery-section">
                <div className="gallery-heading">
                  <div><span className="section-kicker">PROJECT LIBRARY</span><h2>Image gallery <span className="gallery-count">{images.length}</span></h2></div>
                  <span className="gallery-sort">Newest first</span>
                </div>
                {imagesLoading ? (
                  <div className="gallery-loading"><LoaderCircle className="spin" size={18} /> Loading project images…</div>
                ) : images.length === 0 ? (
                  <div className="empty-gallery">
                    <div className="empty-gallery-icon"><Images size={23} /></div>
                    <h3>No images yet</h3>
                    <p>Your uploaded images will appear here, ready for the next step.</p>
                  </div>
                ) : (
                  <div className="image-grid">
                    {images.map((image) => (
                      <article className="image-card" key={image.id}>
                        <div className="image-preview">
                          {image.status === 'ready' && image.download_url ? (
                            <img src={image.download_url} alt={image.original_filename} />
                          ) : (
                            <div className="image-placeholder"><Images size={24} />{image.status === 'failed' ? <span>Upload failed</span> : <span>Waiting for upload</span>}</div>
                          )}
                          <span className={`image-status status-${image.status}`}>
                            {image.status === 'ready' ? <><CheckCircle2 size={12} /> Ready</> : image.status === 'pending' ? <><Clock3 size={12} /> Pending</> : <><CircleAlert size={12} /> Failed</>}
                          </span>
                        </div>
                        <div className="image-card-info">
                          <strong title={image.original_filename}>{image.original_filename}</strong>
                          <div><span>{image.width && image.height ? `${image.width} × ${image.height}` : image.content_type.split('/')[1]?.toUpperCase()}</span><span>{formatBytes(image.file_size)}</span></div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          <footer className="page-footer"><span>LabelFlow AI</span><span>Image labeling, one dataset at a time.</span></footer>
        </div>
      </main>

      {showProjectDialog && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowProjectDialog(false) }}>
          <section className="project-modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
            <div className="modal-topline"><span className="modal-icon"><FolderKanban size={19} /></span><button className="icon-button" onClick={() => setShowProjectDialog(false)} aria-label="Close dialog"><X size={18} /></button></div>
            <span className="section-kicker">NEW WORKSPACE</span>
            <h2 id="new-project-title">Create a project</h2>
            <p>Give this dataset a clear name. You can upload images right after.</p>
            <form onSubmit={handleCreateProject}>
              <label className="field-label" htmlFor="project-name">Project name</label>
              <input id="project-name" className="text-input" autoFocus maxLength={255} placeholder="e.g. Street scenes — Kathmandu" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
              <div className="modal-actions">
                <button type="button" className="button button-quiet" onClick={() => setShowProjectDialog(false)}>Cancel</button>
                <button type="submit" className="button button-primary" disabled={!projectName.trim() || creatingProject}>
                  {creatingProject ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}
                  {creatingProject ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
