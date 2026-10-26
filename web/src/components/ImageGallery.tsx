import { CheckCircle2, CircleAlert, Clock3, Images, LoaderCircle } from 'lucide-react'
import type { ProjectImage } from '../types/projectImage'
import { formatBytes } from '../utils/format'

type ImageGalleryProps = { images: ProjectImage[]; loading: boolean }

export function ImageGallery({ images, loading }: ImageGalleryProps) {
  return (
    <section className="gallery-section">
      <div className="gallery-heading">
        <div>
          <span className="section-kicker">PROJECT LIBRARY</span>
          <h2>
            Image gallery <span className="gallery-count">{images.length}</span>
          </h2>
        </div>
        <span className="gallery-sort">Newest first</span>
      </div>
      {loading ? (
        <div className="gallery-loading">
          <LoaderCircle className="spin" size={18} /> Loading project images…
        </div>
      ) : images.length === 0 ? (
        <div className="empty-gallery">
          <div className="empty-gallery-icon">
            <Images size={23} />
          </div>
          <h3>No images yet</h3>
          <p>Your uploaded images will appear here, ready for the next step.</p>
        </div>
      ) : (
        <div className="image-grid">
          {images.map((image) => (
            <article className="image-card" key={image.id}>
              <div className="image-preview">
                {image.status === 'ready' && image.download_url ? (
                  <img
                    src={image.download_url}
                    alt={image.original_filename}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="image-placeholder">
                    <Images size={24} />
                    <span>
                      {image.status === 'failed' ? 'Upload failed' : 'Waiting for upload'}
                    </span>
                  </div>
                )}
                <span className={`image-status status-${image.status}`}>
                  {image.status === 'ready' ? (
                    <>
                      <CheckCircle2 size={12} /> Ready
                    </>
                  ) : image.status === 'pending' ? (
                    <>
                      <Clock3 size={12} /> Pending
                    </>
                  ) : (
                    <>
                      <CircleAlert size={12} /> Failed
                    </>
                  )}
                </span>
              </div>
              <div className="image-card-info">
                <strong title={image.original_filename}>{image.original_filename}</strong>
                <div>
                  <span>
                    {image.width && image.height
                      ? `${image.width} × ${image.height}`
                      : image.content_type.split('/')[1]?.toUpperCase()}
                  </span>
                  <span>{formatBytes(image.file_size)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
