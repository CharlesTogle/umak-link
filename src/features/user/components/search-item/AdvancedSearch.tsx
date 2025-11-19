import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { IonButton, IonChip } from '@ionic/react'
import { searchOutline } from 'ionicons/icons'
import LastSeenModal from '../shared/LastSeenModal'
import LocationDetailsSelector from '../shared/LocationDetailsSelector'
import ImageUpload from '@/shared/components/ImageUpload'
import CardHeader from '@/shared/components/CardHeader'
import CategorySelection from '../shared/CategorySelection'
import FormSectionHeader from '@/shared/components/FormSectionHeader'

interface LocationDetails {
  level1: string
  level2: string
  level3: string
}

interface AdvancedSearchProps {
  searchValue?: string
  setSearchValue?: (v: string) => void
  date: string
  time: string
  meridian: 'AM' | 'PM'
  toISODate: (date: string, time: string, meridian: 'AM' | 'PM') => string
  handleDateChange: (e: CustomEvent) => void
  locationDetails: LocationDetails
  setLocationDetails: Dispatch<SetStateAction<LocationDetails>>
  image: File | null
  setImage: (file: File | null) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  handleSearch: () => void
}

export default function AdvancedSearch ({

  date,
  time,
  meridian,
  toISODate,
  handleDateChange,
  locationDetails,
  setLocationDetails,
  image,
  setImage,
  selectedCategories,
  setSelectedCategories,
  handleSearch,
}: AdvancedSearchProps) {
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const handleCategorySelect = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }
  const removeCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category))
  }

  // ------------------ UI ------------------
  return (
    <div className=' bg-gray-50 mb-5 w-full'>
      <div className='mx-5 mt-3 rounded-xl shadow-md p-4 border border-gray-200'>
        <CardHeader title='Advanced Search' icon={searchOutline} />
        <LastSeenModal
          date={toISODate(date, time, meridian)}
          handleDateChange={handleDateChange}
        />
        <LocationDetailsSelector
          locationDetails={locationDetails}
          setLocationDetails={setLocationDetails}
        />

        {/* CATEGORY SELECTOR (Multi-select) */}
        <div className='mb-4'>
          <FormSectionHeader header='Categories' />
          <IonButton
            expand='block'
            fill='outline'
            onClick={() => setShowCategoryModal(true)}
            className='text-left'
          >
            {selectedCategories.length > 0
              ? `${selectedCategories.length} selected`
              : 'Select categories'}
          </IonButton>
          {selectedCategories.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-2'>
              {selectedCategories.map(cat => (
                <IonChip
                  key={cat}
                  onClick={() => removeCategory(cat)}
                  className='cursor-pointer px-3 bg-transparent border-1 border-umak-blue text-black'
                  color='primary'
                >
                  {cat} ×
                </IonChip>
              ))}
            </div>
          )}
        </div>

        {/* IMAGE UPLOAD */}
        <ImageUpload
          label='Reverse Image Search'
          image={image}
          onImageChange={setImage}
        />

        {/* SEARCH BUTTON */}
        <IonButton
          expand='block'
          className=' text-white font-default-font rounded-md'
          onClick={handleSearch}
          style={
            {
              ['--background']: 'var(--color-umak-blue, #1D2981)'
            } as React.CSSProperties
          }
        >
          SEARCH
        </IonButton>
      </div>

      {/* Category Selection Modal */}
      <CategorySelection
        isOpen={showCategoryModal}
        mode='multi'
        selectedCategories={selectedCategories}
        onClose={() => setShowCategoryModal(false)}
        onSelect={handleCategorySelect}
      />
    </div>
  )
}
