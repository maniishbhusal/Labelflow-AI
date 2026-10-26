import { useCallback, useEffect, useState } from 'react'
import { listProjectImages } from '../api/projectImages'
import type { ProjectImage } from '../types/projectImage'

export function useProjectImages(projectId: number | null) {
  const [images, setImages] = useState<ProjectImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!projectId) {
      setImages([])
      return
    }
    const latestImages = await listProjectImages(projectId)
    setImages(latestImages)
  }, [projectId])

  useEffect(() => {
    if (!projectId) {
      setImages([])
      setLoading(false)
      return
    }

    let ignore = false
    setLoading(true)
    setError('')
    listProjectImages(projectId)
      .then((data) => { if (!ignore) setImages(data) })
      .catch((cause: unknown) => {
        if (!ignore) setError(cause instanceof Error ? cause.message : 'Could not load images.')
      })
      .finally(() => { if (!ignore) setLoading(false) })

    return () => { ignore = true }
  }, [projectId])

  return { images, loading, error, refresh, clearError: () => setError('') }
}
