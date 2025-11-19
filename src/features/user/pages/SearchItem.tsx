import { useCallback, useState, useRef, useMemo } from 'react'
import SearchHistory from '@/features/user/components/search-item/SearchHistory'
import Header from '@/shared/components/Header'
import AdvancedSearch from '@/features/user/components/search-item/AdvancedSearch'
import { IonSearchbar, IonContent, IonButton, IonToast } from '@ionic/react'
import { Keyboard } from '@capacitor/keyboard'
import { useNavigation } from '@/shared/hooks/useNavigation'
import useSearch from '@/features/user/hooks/useSearch'
import SearchLoadingPage from './SearchLoadingPage'

export default function SearchItem () {
  const [searchHistory, setSearchHistory] = useState<string[]>([
    'HPSB',
    'Oval',
    'Tumbler',
    'Red bleachers',
    'Item'
  ])
  const [searchValue, setSearchValue] = useState('')

  // ------------------ LIFTED ADVANCED SEARCH STATES ------------------
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
  const [locationDetails, setLocationDetails] = useState({
    level1: '',
    level2: '',
    level3: ''
  })
  const [image, setImage] = useState<File | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 })
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const searchRef = useRef<HTMLIonSearchbarElement | null>(null)
  const { navigate } = useNavigation()
  const { handleAdvancedSearch: processAdvancedSearch, toISODate } = useSearch()

  // 🔍 Filter logic
  const filteredHistory = useMemo(() => {
    if (!searchValue.trim()) return searchHistory
    const matches = searchHistory.filter(item =>
      item.toLowerCase().includes(searchValue.toLowerCase())
    )
    // If no matches, return an artificial "No Result Found" entry
    return matches.length > 0 ? matches : ['No Result Found']
  }, [searchHistory, searchValue])

  const handleCancel = useCallback(() => {
    setSearchValue('')
    if (!searchRef.current) return
    Keyboard.hide()
    navigate('/user/home')
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
    }
  }

  // Handle advanced search submission
  const handleAdvancedSearch = async () => {
    setIsSearching(true)
    setSearchProgress({ current: 0, total: 0 })

    const response = await processAdvancedSearch({
      searchValue,
      date,
      time,
      meridian,
      locationDetails,
      selectedCategories,
      image,
      onProgress: (current, total) => {
        setSearchProgress({ current, total })
      }
    })

    // setIsSearching(false)/

    if (!response.success) {
      setToastMessage(response.message || 'Search failed. Please try again.')
      setShowToast(true)
      setIsSearching(false)
      return
    }
    navigate('/user/search/results')
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
          />
          <AdvancedSearch
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            date={date}
            time={time}
            meridian={meridian}
            toISODate={toISODate}
            handleDateChange={handleDateChange}
            locationDetails={locationDetails}
            setLocationDetails={setLocationDetails}
            image={image}
            setImage={setImage}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            handleSearch={handleAdvancedSearch}
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
