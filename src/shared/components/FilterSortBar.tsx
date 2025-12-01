import { useState } from 'react'
import {
  IonButton,
  IonIcon,
  IonModal,
  IonChip,
  IonLabel,
  IonCard,
  IonCardContent
} from '@ionic/react'
import { funnelOutline } from 'ionicons/icons'

export type FilterOption<T = string> = {
  value: T
  label: string
}

export type FilterCategory<T = string> = {
  categoryName: string
  options: FilterOption<T>[]
}

export type SortOption = {
  value: string
  label: string
  icon?: string
}

export type FilterSelectionType = 'single' | 'multiple' | 'single-per-category'

interface FilterSortBarProps<T = string> {
  // Title and icon
  title: string
  icon?: string

  // Filter configuration (use either filterOptions OR filterCategories, not both)
  filterOptions?: FilterOption<T>[]
  filterCategories?: FilterCategory<T>[]
  activeFilters: Set<T>
  onFilterChange: (filters: Set<T>) => void
  filterSelectionType?: FilterSelectionType
  filterModalTitle?: string
  filterModalSubtitle?: string
  hasFilterClear?: boolean
  hasFilterEnter?: boolean

  // Sort configuration
  sortOptions: SortOption[]
  activeSort: string
  onSortChange: (sort: string) => void
  sortModalTitle?: string
  sortButtonLabel?: string

  // Optional className for styling
  className?: string
  breakpoints?: number[]
  initialBreakpoint?: number
}

export default function FilterSortBar<T extends string = string> ({
  title,
  icon,
  filterOptions,
  filterCategories,
  activeFilters,
  onFilterChange,
  filterSelectionType = 'multiple',
  filterModalTitle = 'Filter',
  filterModalSubtitle,
  hasFilterClear = false,
  hasFilterEnter = false,
  className = '',
  breakpoints,
  initialBreakpoint
}: FilterSortBarProps<T>) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Determine if we're using categories or flat list
  const usingCategories = !!filterCategories && filterCategories.length > 0
  const allFilterOptions = usingCategories
    ? filterCategories.flatMap(cat => cat.options)
    : filterOptions || []

  // For single selection, hasEnter/hasClear are ignored and modal auto-closes on selection

  const handleFilterClick = (value: T, categoryName?: string) => {
    if (filterSelectionType === 'single') {
      // Single selection: replace entirely
      onFilterChange(new Set([value]))
      setIsFilterOpen(false)
    } else if (
      filterSelectionType === 'single-per-category' &&
      categoryName &&
      usingCategories
    ) {
      // Single per category: remove any other filters from same category, add/toggle this one
      const category = filterCategories!.find(
        cat => cat.categoryName === categoryName
      )
      if (!category) return

      const categoryValues = new Set(category.options.map(opt => opt.value))
      const newFilters = new Set(activeFilters)

      // Remove all filters from this category
      categoryValues.forEach(val => newFilters.delete(val))

      // If not already selected, add it; if already selected, it's now removed (toggle off)
      if (!activeFilters.has(value)) {
        newFilters.add(value)
      }

      onFilterChange(newFilters)
    } else {
      // Multiple selection: toggle
      const newFilters = new Set(activeFilters)
      if (newFilters.has(value)) {
        newFilters.delete(value)
      } else {
        newFilters.add(value)
      }
      onFilterChange(newFilters)
    }
  }

  const handleClearFilters = () => {
    onFilterChange(new Set())
    setIsFilterOpen(false)
  }

  const handleApplyFilters = () => {
    setIsFilterOpen(false)
  }

  const FilterChip = ({
    option,
    categoryName
  }: {
    option: FilterOption<T>
    categoryName?: string
  }) => {
    const isActive = activeFilters.has(option.value)

    return (
      <IonChip
        onClick={() => handleFilterClick(option.value, categoryName)}
        outline={!isActive}
        className='m-1 px-4'
        style={{
          '--background': isActive ? 'var(--color-umak-blue)' : 'transparent',
          '--color': isActive ? 'white' : 'var(--color-umak-blue)',
          border: '2px solid var(--color-umak-blue)'
        }}
      >
        <IonLabel>{option.label}</IonLabel>
      </IonChip>
    )
  }

  // Find current sort option for button

  return (
    <>
      {/* Top action row */}
      <IonCard className={`px-4 mb-3 ${className}`}>
        <IonCardContent className='flex items-center justify-between gap-3'>
          <div className='flex items-center mb-2 gap-2 text-umak-blue'>
            {icon && <IonIcon icon={icon} style={{ fontSize: '32px' }} />}
            <span className='font-medium'>{title}</span>
          </div>
          <div className='flex items-center gap-2'>
            <IonButton
              fill='outline'
              onClick={() => setIsFilterOpen(true)}
              className='rounded-full'
              style={{
                '--border-color': 'var(--color-umak-blue)',
                '--color': 'var(--color-umak-blue)'
              }}
            >
              <IonIcon icon={funnelOutline} slot='start' className='mr-2' />
              Filter
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Filter Modal */}
      <IonModal
        isOpen={isFilterOpen}
        onDidDismiss={() => setIsFilterOpen(false)}
        backdropDismiss={true}
        initialBreakpoint={initialBreakpoint || 0.55}
        breakpoints={breakpoints || [0, 0.55, 0.75]}
        className='font-default-font'
        style={{ '--border-radius': '2rem' }}
      >
        <div className='flex flex-col items-center pb-6'>
          <p className='my-4 text-base font-semibold'>{filterModalTitle}</p>
          {filterModalSubtitle && (
            <p className='-mt-2 mb-4 text-sm text-gray-500'>
              {filterModalSubtitle}
            </p>
          )}

          {/* Render categorized or flat filters */}
          {usingCategories ? (
            <div className='w-full px-4 '>
              <div className='w-full bg-black h-px mb-4' />
              {filterCategories!.map((category, idx) => (
                <div key={idx} className='mb-4'>
                  <p className='text-sm font-semibold text-gray-700 mb-2'>
                    {category.categoryName}
                  </p>
                  <div className='flex flex-wrap'>
                    {category.options.map(option => (
                      <FilterChip
                        key={String(option.value)}
                        option={option}
                        categoryName={category.categoryName}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-wrap justify-center px-4'>
              {allFilterOptions.map(option => (
                <FilterChip key={String(option.value)} option={option} />
              ))}
            </div>
          )}

          {(hasFilterClear || hasFilterEnter) && (
            <div className='ml-auto mr-5 gap-2'>
              {hasFilterClear && (
                <IonButton
                  fill='clear'
                  onClick={handleClearFilters}
                  style={{ '--color': 'var(--color-umak-blue)' }}
                >
                  Clear filters
                </IonButton>
              )}
              {hasFilterEnter && (
                <IonButton
                  onClick={handleApplyFilters}
                  style={{
                    '--background': 'var(--color-umak-blue)',
                    '--color': 'white'
                  }}
                >
                  Apply
                </IonButton>
              )}
            </div>
          )}
        </div>
      </IonModal>
    </>
  )
}
