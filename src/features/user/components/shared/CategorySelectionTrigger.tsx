import { useEffect, useRef, useState } from 'react'
import { IonChip, IonIcon } from '@ionic/react'
import { addCircle, close } from 'ionicons/icons'

interface CategorySelectionTriggerProps {
  category: string | null
  onOpenSelector: () => void
  onClear: () => void
}

// Chip with two visual states: SelectionTrigger (Add) and Active (with temporary remove mode)
export default function CategorySelectionTrigger ({
  category,
  onOpenSelector,
  onClear
}: CategorySelectionTriggerProps) {
  const [removeMode, setRemoveMode] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  if (!category) {
    // SelectionTrigger state
    return (
      <IonChip
        onClick={onOpenSelector}
        style={
          {
            '--background': 'transparent',
            '--color': '#1e293b',
            border: '2px solid var(--color-umak-blue)'
          } as any
        }
      >
        <IonIcon icon={addCircle} className='mr-1 px-2 py-1 text-umak-blue' />
        <span className='pr-3'>Add</span>
      </IonChip>
    )
  }

  // Active or RemoveSelection state
  return (
    <IonChip
      onClick={() => {
        if (!removeMode) {
          setRemoveMode(true)
          if (timer.current) window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => setRemoveMode(false), 2000)
          return
        }
        // second tap toggles back
        setRemoveMode(false)
      }}
      style={
        {
          '--background': 'transparent',
          '--color': 'var(--color-umak-blue)',
          border: '2px solid var(--color-umak-blue)'
        } as any
      }
      className='px-2 py-1'
    >
      {category}
      {removeMode && (
        <IonIcon
          icon={close}
          className='ml-1'
          onClick={e => {
            e.stopPropagation()
            setRemoveMode(false)
            onClear()
          }}
        />
      )}
    </IonChip>
  )
}
