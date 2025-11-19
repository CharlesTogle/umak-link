import { useRef, useState, useEffect } from 'react'
import { IonIcon, IonButton } from '@ionic/react'
import { close as closeIcon } from 'ionicons/icons'
import LazyImage from '@/shared/components/LazyImage'

interface Props {
  src: string
  alt?: string
  className?: string
}

export default function ExpandableImage ({ src, alt, className }: Props) {
  const [open, setOpen] = useState(false)
  const holdTimer = useRef<number | null>(null)
  const prevOverflow = useRef<string>('')

  useEffect(() => {
    if (open) {
      prevOverflow.current = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = prevOverflow.current || ''
    }

    return () => {
      document.body.style.overflow = prevOverflow.current || ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const startHold = () => {
    holdTimer.current = window.setTimeout(() => setOpen(true), 500)
  }
  const clearHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  return (
    <>
      <div
        className={`inline-block cursor-pointer rounded-lg overflow-visible shadow-md transition-transform hover:scale-105 ${
          className || ''
        }`}
        onClick={e => {
          setOpen(true)
          e.stopPropagation()
        }}
        onPointerDown={startHold}
        onPointerUp={clearHold}
        onPointerLeave={clearHold}
        onContextMenu={e => e.preventDefault()}
      >
        <LazyImage
          src={src}
          alt={alt}
          className='w-full h-full object-cover select-none outline-none border-none'
        />
      </div>

      {open && (
        <div
          role='dialog'
          aria-modal='true'
          // ensure overlay is on top of everything
          className='fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/70 transition-all duration-200'
          style={{ zIndex: 9999 }}
          onClick={() => setOpen(false)}
        >
          <div
            className='relative bg-transparent rounded-xl shadow-2xl overflow-hidden p-2 max-w-[90vw] max-h-[90vh] flex items-center justify-center animate-fadeIn'
            onClick={e => e.stopPropagation()}
          >
            <IonButton
              fill='clear'
              className='absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full shadow-lg w-8 aspect-square flex items-center justify-center focus:outline-none border-none'
              onClick={() => setOpen(false)}
            >
              <IonIcon
                icon={closeIcon}
                className='text-[16px]'
                color='dark'
                slot='icon-only'
              />
            </IonButton>

            <img
              src={src}
              alt={alt}
              className='max-w-full max-h-[85vh] object-contain rounded-lg transition-transform duration-200 select-none outline-none border-none shadow-none'
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  )
}
