import { useEffect, useMemo, useState } from 'react'
import { createProject, listProjects } from '../api/projects'
import type { Project } from '../types/project'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  useEffect(() => {
    let ignore = false
    listProjects()
      .then((data) => {
        if (ignore) return
        setProjects(data)
        setSelectedProjectId((currentId) =>
          currentId && data.some((project) => project.id === currentId) ? currentId : (data[0]?.id ?? null),
        )
      })
      .catch((cause: unknown) => {
        if (!ignore) setError(cause instanceof Error ? cause.message : 'Could not load projects.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => { ignore = true }
  }, [])

  async function addProject(name: string) {
    setError('')
    setCreating(true)
    try {
      const project = await createProject(name.trim())
      setProjects((current) => [project, ...current])
      setSelectedProjectId(project.id)
      return project
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the project.')
      return null
    } finally {
      setCreating(false)
    }
  }

  function selectProject(projectId: number) {
    setSelectedProjectId(projectId)
    setError('')
  }

  return {
    projects,
    selectedProject,
    selectedProjectId,
    selectProject,
    loading,
    creating,
    error,
    clearError: () => setError(''),
    addProject,
  }
}
