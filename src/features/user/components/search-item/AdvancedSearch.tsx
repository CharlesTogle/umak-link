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
  hasSelectedDate: boolean
  toISODate: (date: string, time: string, meridian: 'AM' | 'PM') => string
  handleDateChange: (e: CustomEvent) => void
  handleClearDate: () => void
  locationDetails: LocationDetails
  setLocationDetails: Dispatch<SetStateAction<LocationDetails>>
  image: File | null
  setImage: (file: File | null) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  selectedStatuses: string[]
  setSelectedStatuses: (statuses: string[]) => void
  // Variant: 'user' (default) or 'staff' to show staff-only options
  variant?: 'user' | 'staff'
  // Post status filtering (staff-only)
  selectedPostStatuses?: string[]
  setSelectedPostStatuses?: (statuses: string[]) => void
  claimFromDate: string | null
  setClaimFromDate: (date: string | null) => void
  claimToDate: string | null
  setClaimToDate: (date: string | null) => void
  handleSearch: () => void
}

export default function AdvancedSearch ({
  date,
  time,
  meridian,
  hasSelectedDate,
  toISODate,
  handleDateChange,
  handleClearDate,
  locationDetails,
  setLocationDetails,
  image,
  setImage,
  selectedCategories,
  setSelectedCategories,
  selectedStatuses,
  setSelectedStatuses,
  claimFromDate,
  setClaimFromDate,
  claimToDate,
  setClaimToDate,
  handleSearch,
  variant = 'user',
  selectedPostStatuses,
  setSelectedPostStatuses
}: AdvancedSearchProps) {
  // Status multi-select logic
  const STATUS_OPTIONS =
    variant === 'staff'
      ? [
          { label: 'Unclaimed', value: 'unclaimed' },
          { label: 'Claimed', value: 'claimed' },
          { label: 'Returned', value: 'returned' },
          { label: 'Lost', value: 'lost' },
          { label: 'Discarded', value: 'discarded' }
        ]
      : [
          { label: 'Unclaimed', value: 'unclaimed' },
          { label: 'Claimed', value: 'claimed' },
          { label: 'Discarded', value: 'discarded' }
        ]

  const handleStatusSelect = (status: string) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status))
    } else {
      setSelectedStatuses([...selectedStatuses, status])
    }
  }

  // Post status (staff only)
  const POST_STATUS_OPTIONS = [
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Pending', value: 'pending' }
  ]

  const handlePostStatusSelect = (status: string) => {
    if (!setSelectedPostStatuses || !selectedPostStatuses) return
    if (selectedPostStatuses.includes(status)) {
      setSelectedPostStatuses(selectedPostStatuses.filter(s => s !== status))
    } else {
      setSelectedPostStatuses([...selectedPostStatuses, status])
    }
  }

  // Claimed date modal logic
  const [showClaimFromModal, setShowClaimFromModal] = useState(false)
  const [showClaimToModal, setShowClaimToModal] = useState(false)

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
          hasSelectedDate={hasSelectedDate}
          onClear={handleClearDate}
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

        {/* STATUS SELECTOR (Multi-select) */}
        <div className='mb-4'>
          <FormSectionHeader header='Status' />
          <div className='flex flex-wrap gap-2'>
            {STATUS_OPTIONS.map(opt => (
              <IonChip
                key={opt.value}
                onClick={() => handleStatusSelect(opt.value)}
                className={`cursor-pointer px-3 border-1 border-umak-blue text-black ${
                  selectedStatuses.includes(opt.value)
                    ? 'bg-umak-blue text-white'
                    : 'bg-transparent'
                }`}
                color={
                  selectedStatuses.includes(opt.value) ? 'primary' : 'default'
                }
              >
                {opt.label} {selectedStatuses.includes(opt.value) ? '×' : ''}
              </IonChip>
            ))}
          </div>
        </div>

        {/* POST STATUS (Staff only) */}
        {variant === 'staff' && (
          <div className='mb-4'>
            <FormSectionHeader header='Post Status' />
            <div className='flex flex-wrap gap-2'>
              {POST_STATUS_OPTIONS.map(opt => (
                <IonChip
                  key={opt.value}
                  onClick={() => handlePostStatusSelect(opt.value)}
                  className={`cursor-pointer px-3 border-1 border-umak-blue text-black ${
                    selectedPostStatuses &&
                    selectedPostStatuses.includes(opt.value)
                      ? 'bg-umak-blue text-white'
                      : 'bg-transparent'
                  }`}
                  color={
                    selectedPostStatuses &&
                    selectedPostStatuses.includes(opt.value)
                      ? 'primary'
                      : 'default'
                  }
                >
                  {opt.label}{' '}
                  {selectedPostStatuses &&
                  selectedPostStatuses.includes(opt.value)
                    ? '×'
                    : ''}
                </IonChip>
              ))}
            </div>
          </div>
        )}

        {/* CLAIMED FROM/TO DATE SELECTORS */}
        <div className='mb-4'>
          <FormSectionHeader header='Claimed Date Range' />
          <div className='flex flex-row gap-3'>
            {/* Claimed From */}
            <div>
              <button
                onClick={() => setShowClaimFromModal(true)}
                className='px-4! py-2! text-umak-blue! border! border-umak-blue! rounded-md!'
              >
                {claimFromDate
                  ? `From: ${new Date(claimFromDate).toLocaleDateString(
                      'en-US'
                    )}`
                  : 'Select From Date'}
              </button>
            </div>
            {/* Claimed To */}
            <div>
              <button
                onClick={() => setShowClaimToModal(true)}
                className='px-4! py-2! text-umak-blue! border! border-umak-blue! rounded-md!'
              >
                {claimToDate
                  ? `To: ${new Date(claimToDate).toLocaleDateString('en-US')}`
                  : 'Select To Date'}
              </button>
            </div>
          </div>
        </div>

        {/* CLAIMED FROM MODAL */}
        {showClaimFromModal && (
          <LastSeenModal
            date={claimFromDate ?? undefined}
            handleDateChange={e => {
              setClaimFromDate(e.detail.value as string)
              setShowClaimFromModal(false)
            }}
            showTime={false}
            hasSelectedDate={!!claimFromDate}
            onClear={() => {
              setClaimFromDate(null)
              setShowClaimFromModal(false)
            }}
            text='Claimed From'
          />
        )}
        {/* CLAIMED TO MODAL */}
        {showClaimToModal && (
          <LastSeenModal
            date={claimToDate ?? undefined}
            handleDateChange={e => {
              setClaimToDate(e.detail.value as string)
              setShowClaimToModal(false)
            }}
            showTime={false}
            hasSelectedDate={!!claimToDate}
            onClear={() => {
              setClaimToDate(null)
              setShowClaimToModal(false)
            }}
            text='Claimed To'
          />
        )}

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
