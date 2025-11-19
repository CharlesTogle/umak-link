import { useState } from 'react'

type LazyImageProps = {
  src?: string
  alt?: string
  className?: string
  /** show a subtle dark overlay over the skeleton while loading */
  overlay?: boolean
}

// A small image component that shows a local skeleton until the image is loaded.
export default function LazyImage ({
  src,
  alt = '',
  className = '',
  overlay = true
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* base skeleton box (pulsing) */}
      {!loaded && (
        <div
          className='absolute inset-0 rounded-xl bg-gray-50 border border-gray-200 animate-pulse'
          style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
        />
      )}

      {/* optional dark overlay to give a shadow/veil effect while loading */}
      {!loaded && overlay && (
        <div className='absolute inset-0 rounded-xl bg-black/20 pointer-events-none animate-pulse' />
      )}

      {src ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover rounded-xl ${
            loaded ? 'block' : 'hidden'
          }`}
        />
      ) : null}
    </div>
  )
}
