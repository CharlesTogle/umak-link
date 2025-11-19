import { IonChip, IonIcon } from '@ionic/react'
import { close } from 'ionicons/icons'

export type ChipState = 'active' | 'selectionTrigger' | 'removeSelection'

interface CategoryChipProps {
  category: string | null
  state: ChipState
  onClick: () => void
  onRemove?: () => void
}

export default function CategoryChip ({
  category,
  state,
  onClick,
  onRemove
}: CategoryChipProps) {
  if (state === 'selectionTrigger') {
    return (
      <IonChip
        onClick={onClick}
        style={{
          '--color': '#64748B',
          border: '2px dashed #64748B',
          cursor: 'pointer'
        }}
      >
        + Select Category
      </IonChip>
    )
  }

  if (state === 'active') {
    return (
      <IonChip
        onClick={onClick}
        style={{
          '--color': 'white',
          cursor: 'pointer'
        }}
      >
        {category}
      </IonChip>
    )
  }

  if (state === 'removeSelection') {
    return (
      <IonChip
        style={{
          '--color': 'white',
          position: 'relative'
        }}
      >
        {category}
        <IonIcon
          icon={close}
          onClick={e => {
            e.stopPropagation()
            onRemove?.()
          }}
          style={{
            marginLeft: '4px',
            cursor: 'pointer'
          }}
        />
      </IonChip>
    )
  }

  return null
}
