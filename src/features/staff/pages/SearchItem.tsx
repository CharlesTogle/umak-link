import { useCallback, useState, useRef, useMemo } from 'react'
import SearchHistory from '@/features/user/components/search-item/SearchHistory'
import Header from '@/shared/components/Header'
import AdvancedSearch from '@/features/user/components/search-item/AdvancedSearch'
import { IonSearchbar, IonContent, IonButton, IonToast } from '@ionic/react'
import { Keyboard } from '@capacitor/keyboard'
import { useNavigation } from '@/shared/hooks/useNavigation'
import useStaffSearch from '@/features/staff/hooks/useStaffSearch'
import SearchLoadingPage from '@/features/user/pages/SearchLoadingPage'
import { useSearchHistory } from '@/features/user/hooks/useSearchHistory'

export default function StaffSearchItem () {
  const { searchHistory, setSearchHistory, addToHistory } = useSearchHistory()
  const [searchValue, setSearchValue] = useState('')

  // Initialize date/time/meridian to current Philippine Time (UTC+8)
  const now = new Date()
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000
  const utc8Time = utcTime + 8 * 3600000
  const local = new Date(utc8Time)
  let initialHours = local.getHours()
  const initialMinutes = local.getMinutes().toString().padStart(2, '0')
  const initialMeridian = initialHours >= 12 ? 'PM' : 'AM'
  initialHours = initialHours % 12 || 12

  const [date, setDate] = useState(
    local.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  )
  const [time, setTime] = useState(`${initialHours}:${initialMinutes}`)
  const [meridian, setMeridian] = useState(initialMeridian as 'AM' | 'PM')
  const [hasSelectedDate, setHasSelectedDate] = useState(false)
  const [locationDetails, setLocationDetails] = useState({
    level1: '',
    level2: '',
    level3: ''
  })
  const [image, setImage] = useState<File | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedPostStatuses, setSelectedPostStatuses] = useState<string[]>([])
  const [claimFromDate, setClaimFromDate] = useState<string | null>(null)
  const [claimToDate, setClaimToDate] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 })
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const searchRef = useRef<HTMLIonSearchbarElement | null>(null)
  const { navigate } = useNavigation()
  const { handleAdvancedSearch: processAdvancedSearch, toISODate } =
    useStaffSearch()

  // Filter logic
  const filteredHistory = useMemo(() => {
    if (!searchValue.trim()) return searchHistory
    const matches = searchHistory.filter(item =>
      item.toLowerCase().includes(searchValue.toLowerCase())
    )
    return matches.length > 0 ? matches : ['No Result Found']
  }, [searchHistory, searchValue])

  const handleCancel = useCallback(() => {
    setSearchValue('')
    if (!searchRef.current) return
    Keyboard.hide()
    navigate('/staff/home')
  }, [navigate])

  const handleSearchbarFocus = useCallback(() => {
    if (!searchRef.current) return
    try {
      searchRef.current.setFocus()
    } catch {
      const input = searchRef.current.querySelector('input')
      input?.focus()
    }
    Keyboard.show()
  }, [])

  const handleInput = (e: CustomEvent) => {
    setSearchValue(e.detail.value!)
  }

  const handleDateChange = (e: CustomEvent) => {
    const iso = e.detail.value as string
    if (iso) {
      const d = new Date(iso)
      const formattedDate = d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Manila'
      })
      let hours = d.getHours()
      const minutes = d.getMinutes().toString().padStart(2, '0')
      const meridianVal = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12 || 12
      const formattedTime = `${hours}:${minutes}`
      setDate(formattedDate)
      setTime(formattedTime)
      setMeridian(meridianVal as 'AM' | 'PM')
      setHasSelectedDate(true)
    }
  }

  const handleClearDate = () => {
    setHasSelectedDate(false)
  }

  // Handle search history item click
  const handleHistoryItemClick = async (term: string) => {
    setSearchValue(term)

    setIsSearching(true)
    setSearchProgress({ current: 0, total: 0 })

    const response = await processAdvancedSearch({
      searchValue: term,
      date: hasSelectedDate ? date : null,
      time: hasSelectedDate ? time : null,
      meridian: hasSelectedDate ? meridian : null,
      locationDetails,
      selectedCategories,
      selectedStatuses,
      selectedPostStatuses,
      image,
      onProgress: (current, total) => {
        setSearchProgress({ current, total })
      },
      claimFromDate,
      claimToDate
    })

    if (!response.success) {
      setToastMessage(response.message || 'Search failed. Please try again.')
      setShowToast(true)
      setIsSearching(false)
      return
    }

    const encodedTerm = encodeURIComponent(term)
    navigate(`/staff/search/results?q=${encodedTerm}`)
  }

  // Handle advanced search submission
  const handleAdvancedSearch = async () => {
    setIsSearching(true)
    setSearchProgress({ current: 0, total: 0 })

    const response = await processAdvancedSearch({
      searchValue,
      date: hasSelectedDate ? date : null,
      time: hasSelectedDate ? time : null,
      meridian: hasSelectedDate ? meridian : null,
      locationDetails,
      selectedCategories,
      selectedStatuses,
      selectedPostStatuses,
      claimFromDate,
      claimToDate,
      image,
      onProgress: (current, total) => {
        setSearchProgress({ current, total })
      }
    })

    if (!response.success) {
      setToastMessage(response.message || 'Search failed. Please try again.')
      setShowToast(true)
      setIsSearching(false)
      return
    }

    // Add search term to history if it's not empty
    if (searchValue.trim()) {
      addToHistory(searchValue.trim())
    }

    const encodedValue = encodeURIComponent(searchValue)
    navigate(`/staff/search/results?q=${encodedValue}`)
  }

  return (
    <>
      {isSearching ? (
        <SearchLoadingPage
          currentStep={searchProgress.current}
          totalSteps={searchProgress.total}
        />
      ) : (
        <IonContent>
          <div className='fixed top-0 w-full z-999'>
            <Header logoShown={false} isProfileAndNotificationShown={false}>
              <div className='flex items-center bg-[#1e2b87]'>
                <IonSearchbar
                  ref={searchRef}
                  placeholder='Search'
                  value={searchValue}
                  onIonInput={handleInput}
                  onIonFocus={handleSearchbarFocus}
                  style={
                    {
                      ['--border-radius']: '0.5rem'
                    } as React.CSSProperties
                  }
                />
                <IonButton
                  fill='clear'
                  color='light'
                  className='ml-2 text-sm font-medium'
                  onClick={handleCancel}
                >
                  CANCEL
                </IonButton>
              </div>
            </Header>
          </div>
          <div className='mt-14' />
          <SearchHistory
            searchHistory={filteredHistory}
            setSearchHistory={setSearchHistory}
            onItemClick={handleHistoryItemClick}
          />
          <AdvancedSearch
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            date={date}
            time={time}
            meridian={meridian}
            hasSelectedDate={hasSelectedDate}
            toISODate={toISODate}
            handleDateChange={handleDateChange}
            handleClearDate={handleClearDate}
            locationDetails={locationDetails}
            setLocationDetails={setLocationDetails}
            image={image}
            setImage={setImage}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            selectedPostStatuses={selectedPostStatuses}
            setSelectedPostStatuses={setSelectedPostStatuses}
            claimFromDate={claimFromDate}
            setClaimFromDate={setClaimFromDate}
            claimToDate={claimToDate}
            setClaimToDate={setClaimToDate}
            handleSearch={handleAdvancedSearch}
            variant='staff'
          />
        </IonContent>
      )}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color='danger'
      />
    </>
  )
}
