import { useState } from 'react'
import { completeImageUpload, createImageUploadIntent, uploadImageToStorage } from '../api/projectImages'
import type { ImageUploadStage } from '../types/projectImage'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

function getImageContentType(file: File) {
  if (file.type === 'image/jpeg' || file.type === 'image/png') return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'png') return 'image/png'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  return ''
}

export function useImageUpload(projectId: number, onUploaded: () => Promise<void>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [stage, setStage] = useState<ImageUploadStage>('idle')
  const [error, setError] = useState('')

  function chooseFile(file: File | undefined) {
    if (!file) return
    const contentType = getImageContentType(file)
    if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
      setError('Choose a JPG, JPEG, or PNG image.')
      setSelectedFile(null)
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('This image is larger than the 10 MB upload limit.')
      setSelectedFile(null)
      return
    }
    setError('')
    setSelectedFile(file)
  }

  async function uploadSelectedFile() {
    if (!selectedFile || stage !== 'idle') return
    let currentStage: ImageUploadStage = 'preparing'
    setError('')
    setStage(currentStage)

    try {
      const contentType = getImageContentType(selectedFile)
      const intent = await createImageUploadIntent(projectId, selectedFile, contentType)

      currentStage = 'uploading'
      setStage(currentStage)
      await uploadImageToStorage(intent.upload.url, intent.upload.method, intent.upload.headers, selectedFile)

      currentStage = 'verifying'
      setStage(currentStage)
      await completeImageUpload(projectId, intent.image.id)
      await onUploaded()
      setSelectedFile(null)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The upload could not be completed.'
      setError(currentStage === 'verifying' ? `${message} The image may still be pending; refresh the project.` : message)
    } finally {
      setStage('idle')
    }
  }

  return {
    selectedFile,
    stage,
    isBusy: stage !== 'idle',
    error,
    chooseFile,
    uploadSelectedFile,
    clearError: () => setError(''),
    clearSelectedFile: () => setSelectedFile(null),
  }
}
