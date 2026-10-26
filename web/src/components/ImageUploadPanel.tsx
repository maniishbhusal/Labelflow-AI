import { useState, type ChangeEvent, type DragEvent } from 'react'
import { Check, CloudUpload, ImagePlus, LoaderCircle } from 'lucide-react'
import { useImageUpload } from '../hooks/useImageUpload'
import { formatBytes } from '../utils/format'
import { AlertBanner } from './AlertBanner'

type ImageUploadPanelProps = {
  projectId: number
  onUploaded: () => Promise<void>
}

export function ImageUploadPanel({ projectId, onUploaded }: ImageUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const upload = useImageUpload(projectId, onUploaded)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    upload.chooseFile(event.currentTarget.files?.[0])
    event.currentTarget.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (!upload.isBusy) upload.chooseFile(event.dataTransfer.files[0])
  }

  return (
    <section className="upload-section">
      <div className="section-heading">
        <div><span className="section-kicker">STEP 01 <span /> ADD YOUR DATA</span><h2>Upload images</h2><p>Start with JPG or PNG images. You can add more later.</p></div>
        <span className="limit-badge">JPG · PNG <span /> UP TO 10 MB</span>
      </div>

      <div
        className={`upload-dropzone ${isDragging ? 'is-dragging' : ''} ${upload.selectedFile ? 'has-file' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false) }}
        onDrop={handleDrop}
      >
        <div className="dropzone-icon"><ImagePlus size={22} /></div>
        {upload.selectedFile ? (
          <>
            <div className="dropzone-title">{upload.selectedFile.name}</div>
            <p>{formatBytes(upload.selectedFile.size)} · Ready to upload</p>
            <div className="upload-actions">
              <button className="button button-primary" disabled={upload.isBusy} onClick={upload.uploadSelectedFile}>
                {upload.isBusy ? <LoaderCircle className="spin" size={16} /> : <CloudUpload size={16} />}
                {upload.stage === 'preparing' ? 'Preparing…' : upload.stage === 'uploading' ? 'Uploading to R2…' : upload.stage === 'verifying' ? 'Verifying…' : 'Upload image'}
              </button>
              {!upload.isBusy && <button className="button button-quiet" onClick={upload.clearSelectedFile}>Choose another</button>}
            </div>
          </>
        ) : (
          <>
            <div className="dropzone-title">Drop an image here, or <label className="file-picker">browse<input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleFileChange} disabled={upload.isBusy} /></label></div>
            <p>The file uploads directly to private Cloudflare storage.</p>
            <span className="dropzone-security"><Check size={13} /> Your storage credentials stay on the server</span>
          </>
        )}
      </div>

      <AlertBanner message={upload.error} onDismiss={upload.clearError} />

      {upload.stage !== 'idle' && (
        <div className="upload-progress" aria-live="polite">
          <div className={`progress-step ${upload.stage === 'preparing' ? 'active' : 'complete'}`}><span>{upload.stage === 'preparing' ? <LoaderCircle className="spin" size={14} /> : <Check size={13} />}</span>Prepare upload</div>
          <div className={`progress-step ${upload.stage === 'uploading' ? 'active' : upload.stage === 'verifying' ? 'complete' : ''}`}><span>{upload.stage === 'uploading' ? <LoaderCircle className="spin" size={14} /> : upload.stage === 'verifying' ? <Check size={13} /> : '2'}</span>Send to R2</div>
          <div className={`progress-step ${upload.stage === 'verifying' ? 'active' : ''}`}><span>{upload.stage === 'verifying' ? <LoaderCircle className="spin" size={14} /> : '3'}</span>Verify image</div>
        </div>
      )}
    </section>
  )
}
