export type ProjectImageStatus = 'pending' | 'ready' | 'failed'

export type ProjectImage = {
  id: number
  original_filename: string
  content_type: string
  file_size: number | null
  width: number | null
  height: number | null
  status: ProjectImageStatus
  download_url: string | null
  created_at: string
  uploaded_at: string | null
}

export type ImageUploadIntent = {
  image: ProjectImage
  upload: {
    method: 'PUT'
    url: string
    headers: Record<string, string>
    expires_in: number
  }
}

export type ImageUploadStage = 'idle' | 'preparing' | 'uploading' | 'verifying'
