import { apiRequest } from './client'
import type { Project } from '../types/project'

export function listProjects() {
  return apiRequest<Project[]>('/api/projects/')
}

export function createProject(name: string) {
  return apiRequest<Project>('/api/projects/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}
