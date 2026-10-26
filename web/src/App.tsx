import { useState } from 'react'
import { AlertBanner } from './components/AlertBanner'
import { CreateProjectDialog } from './components/CreateProjectDialog'
import { EmptyProjectState } from './components/EmptyProjectState'
import { ImageGallery } from './components/ImageGallery'
import { ImageUploadPanel } from './components/ImageUploadPanel'
import { ProjectHeader } from './components/ProjectHeader'
import { ProjectStats } from './components/ProjectStats'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useProjectImages } from './hooks/useProjectImages'
import { useProjects } from './hooks/useProjects'
import './App.css'

function App() {
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const projects = useProjects()
  const projectImages = useProjectImages(projects.selectedProjectId)

  async function handleCreateProject(name: string) {
    const project = await projects.addProject(name)
    if (!project) return false
    setShowProjectDialog(false)
    return true
  }

  return (
    <div className="app-shell">
      <Sidebar
        projects={projects.projects}
        selectedProjectId={projects.selectedProjectId}
        loading={projects.loading}
        onSelectProject={projects.selectProject}
        onNewProject={() => setShowProjectDialog(true)}
      />

      <main className="main-content" id="top">
        <Topbar projectName={projects.selectedProject?.name ?? null} />
        <div className="page-wrap">
          <ProjectHeader
            project={projects.selectedProject}
            onNewProject={() => setShowProjectDialog(true)}
          />
          <AlertBanner
            message={projects.error || projectImages.error}
            onDismiss={() => {
              projects.clearError()
              projectImages.clearError()
            }}
          />

          {projects.loading && !projects.selectedProject ? (
            <EmptyProjectState loading onCreateProject={() => setShowProjectDialog(true)} />
          ) : !projects.selectedProject ? (
            <EmptyProjectState loading={false} onCreateProject={() => setShowProjectDialog(true)} />
          ) : (
            <>
              <ProjectStats images={projectImages.images} loading={projectImages.loading} />
              <ImageUploadPanel
                key={projects.selectedProject.id}
                projectId={projects.selectedProject.id}
                onUploaded={projectImages.refresh}
              />
              <ImageGallery images={projectImages.images} loading={projectImages.loading} />
            </>
          )}

          <footer className="page-footer">
            <span>LabelFlow AI</span>
            <span>Image labeling, one dataset at a time.</span>
          </footer>
        </div>
      </main>

      {showProjectDialog && (
        <CreateProjectDialog
          creating={projects.creating}
          onClose={() => setShowProjectDialog(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  )
}

export default App
