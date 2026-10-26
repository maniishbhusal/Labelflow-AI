import { apiRequest } from './client'
import type { ImageUploadIntent, ProjectImage } from '../types/projectImage'

export function listProjectImages(projectId: number) {
  return apiRequest<ProjectImage[]>(`/api/projects/${projectId}/images/`)
}

export function createImageUploadIntent(projectId: number, file: File, contentType: string) {
  return apiRequest<ImageUploadIntent>(`/api/projects/${projectId}/images/`, {
    method: 'POST',
    body: JSON.stringify({
      file_name: file.name,
      content_type: contentType,
      file_size: file.size,
    }),
  })
}

export async function uploadImageToStorage(
  url: string,
  method: 'PUT',
  headers: Record<string, string>,
  file: File,
) {
  let response: Response
  try {
    response = await fetch(url, { method, headers, body: file })
  } catch {
    throw new Error(
      'Could not upload to R2. Check your bucket CORS rule allows http://localhost:5173, PUT, and Content-Type.',
    )
  }

  if (!response.ok) {
    throw new Error(
      `R2 rejected the upload (${response.status}). Check the R2 credentials, URL expiry, and Content-Type.`,
    )
  }
}

export function completeImageUpload(projectId: number, imageId: number) {
  return apiRequest<ProjectImage>(`/api/projects/${projectId}/images/${imageId}/complete/`, {
    method: 'POST',
  })
}
