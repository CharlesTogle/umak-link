import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonChip,
  IonButton
} from '@ionic/react'
import { POST_CATEGORIES } from '@/features/user/configs/postCategories'

interface CategorySelectionProps {
  isOpen: boolean
  mode?: 'single' | 'multi'
  // For single-select mode
  selected?: string | null
  // For multi-select mode
  selectedCategories?: string[]
  onClose: () => void
  onSelect: (category: string) => void
}

// Bottom-sheet style category selector covering ~1/3 of the screen
export default function CategorySelection ({
  isOpen,
  mode = 'single',
  selected,
  selectedCategories = [],
  onClose,
  onSelect
}: CategorySelectionProps) {
  // Determine if a category is selected based on mode
  const isCategorySelected = (categoryType: string) => {
    if (mode === 'multi') {
      return selectedCategories.includes(categoryType)
    }
    return selected === categoryType
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.5}
      breakpoints={[0, 0.5, 0.5, 1]}
      backdropDismiss={true}
      className='category-selection-modal'
    >
      <IonHeader>
        <IonToolbar className='px-4'>
          <IonTitle>Select Category</IonTitle>
          <IonButton slot='end' onClick={onClose} color='medium'>
            Close
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-padding'>
        <div className='text-sm text-gray-600 mb-3'>
          State which category the item belongs in.
        </div>

        {/* Chips grid */}
        <div className='flex flex-wrap justify-center gap-2 mt-2'>
          {POST_CATEGORIES.map(cat => {
            const isSelected = isCategorySelected(cat.type)
            return (
              <IonChip
                key={cat.type}
                onClick={() => onSelect(cat.type)}
                className='py-1 px-5'
                style={
                  {
                    '--background': isSelected
                      ? 'var(--color-umak-blue)'
                      : 'transparent',
                    '--color': isSelected ? 'white' : 'var(--color-umak-blue)',
                    border: '2px solid var(--color-umak-blue)'
                  } as any
                }
              >
                {cat.type}
              </IonChip>
            )
          })}
        </div>
      </IonContent>
    </IonModal>
  )
}
