import { supabase } from '@/shared/lib/supabase'
import { generateImageSearchQuery } from '@/features/user/utils/imageSearchUtil'
import { useSearchContext } from '@/shared/contexts/SearchContext'

interface LocationDetails {
  level1: string
  level2: string
  level3: string
}

interface AdvancedSearchParams {
  searchValue: string
  date: string
  time: string
  meridian: 'AM' | 'PM'
  locationDetails: LocationDetails
  selectedCategories: string[]
  image: File | null
  onProgress?: (step: number, totalSteps: number) => void
}

interface SearchResult {
  searchKeywords: string
  lastSeen: { date: string; time: string; meridian: 'AM' | 'PM' }
  location: string
  categories: string[]
  image: string | null
}

interface SearchResponse {
  success: boolean
  message?: string
  data?: SearchResult
}

export default function useSearch () {
  // Obtain the search context at the top-level of this custom hook
  // (calling context hooks inside nested functions causes invalid hook calls)
  const searchCtx = useSearchContext()

  /**
   * Convert date/time/meridian to ISO Date string
   */
  const toISODate = (date: string, time: string, meridian: 'AM' | 'PM') => {
    const [month, day, year] = date.split('/')
    let [hours, minutes] = time.split(':').map(Number)
    if (meridian === 'PM' && hours < 12) hours += 12
    if (meridian === 'AM' && hours === 12) hours = 0
    const paddedMonth = month.padStart(2, '0')
    const paddedDay = day.padStart(2, '0')
    const paddedHours = hours.toString().padStart(2, '0')
    const paddedMinutes = minutes.toString().padStart(2, '0')
    return `${year}-${paddedMonth}-${paddedDay}T${paddedHours}:${paddedMinutes}:00+08:00`
  }
  const aggregateLocation = (locationDetails: LocationDetails): string => {
    return [
      locationDetails.level1,
      locationDetails.level2,
      locationDetails.level3
    ]
      .filter(level => level.trim() !== '')
      .join(' > ')
  }

  async function handleAdvancedSearch (
    params: AdvancedSearchParams
  ): Promise<SearchResponse> {
    const {
      searchValue,
      date,
      time,
      meridian,
      locationDetails,
      selectedCategories,
      image,
      onProgress
    } = params

    // Use the context methods from the top-level context reference
    searchCtx.clearSearchResults()

    // Validation: return null if search value is not provided
    if (!searchValue || searchValue.trim() === '') {
      return { success: false, message: 'Please provide a search term' }
    }

    const shouldSkipImageAnalysis =
      searchValue &&
      searchValue.trim() !== '' &&
      date &&
      date.trim() !== '' &&
      image == null

    const totalSteps = shouldSkipImageAnalysis ? 3 : image ? 4 : 3

    // Step 1: Initialize
    onProgress?.(1, totalSteps)

    // Step 2: Aggregate location
    const aggregatedLocation = aggregateLocation(locationDetails)
    onProgress?.(2, totalSteps)

    let finalSearchKeywords = searchValue

    // If we should skip image/Gemini analysis, jump straight to DB RPC
    if (!shouldSkipImageAnalysis && image) {
      onProgress?.(3, totalSteps)
      const imageSearchResult = await generateImageSearchQuery({
        image,
        searchValue
      })

      if (imageSearchResult.success) {
        finalSearchKeywords += `${
          finalSearchKeywords.trim() !== '' ? ' OR ' : ''
        }${imageSearchResult.searchQuery}`
      } else {
        console.warn(
          'Image search query generation failed:',
          imageSearchResult.error
        )
        // Return failure if query generation failed
        return {
          success: false,
          message:
            'AI image analysis failed. Please try again later or search without an image.'
        }
      }
    }

    // Final step: Prepare result
    onProgress?.(totalSteps, totalSteps)

    const searchResult: SearchResult = {
      searchKeywords: finalSearchKeywords,
      lastSeen: { date, time, meridian },
      location: aggregatedLocation,
      categories: selectedCategories,
      image: image ? image.name : null
    }

    try {
      const lastSeenDate = searchResult.lastSeen
        ? new Date(
            toISODate(
              searchResult.lastSeen.date,
              searchResult.lastSeen.time,
              searchResult.lastSeen.meridian
            )
          )
        : null

      const data = await searchItem({
        query: searchResult.searchKeywords,
        lastSeenDate,
        limit: 50,
        locationLastSeen: searchResult.location || null,
        category:
          Array.isArray(searchResult.categories) &&
          searchResult.categories.length > 0
            ? searchResult.categories[0]
            : null
      })

      const postIds: string[] = Array.isArray(data)
        ? data
            .map((r: any) => r.id ?? r.post_id ?? r.postId ?? r.postID ?? null)
            .filter(Boolean)
            .map(String)
        : []

      searchCtx.setSearchResults(postIds)
    } catch (dbErr) {
      console.error(
        'Error running DB search or saving results from hook:',
        dbErr
      )
      // Clear any previous results to avoid stale data
      searchCtx.setSearchResults([])
    }

    console.log('Advanced Search Result:', searchResult)
    return { success: true, data: searchResult }
  }

  async function searchItem ({
    query,
    lastSeenDate = null,
    limit = 10,
    locationLastSeen = null,
    category = null
  }: {
    query: string
    lastSeenDate?: Date | null
    limit?: number
    locationLastSeen?: string | null
    category?: string | null
  }) {
    const { data, error } = await supabase.rpc('search_items_fts', {
      search_term: query,
      limit_count: limit,
      p_date: lastSeenDate ? lastSeenDate.toISOString().split('T')[0] : null,
      p_category: category,
      p_location_last_seen: locationLastSeen
    })

    if (error) throw error

    console.log('Search RPC Data:', data)
    return data
  }

  return { searchItem, handleAdvancedSearch, toISODate }
}
