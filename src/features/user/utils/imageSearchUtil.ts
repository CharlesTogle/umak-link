import { searchApiService } from '@/shared/services'

/**
 * Convert image File to base64 data URL
 */
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface GenerateImageSearchQueryParams {
  image: File
  searchValue?: string
}

interface GenerateImageSearchQueryResponse {
  searchQuery: string
  success: boolean
  error?: string
}

/**
 * Generate a search query string from an image using the backend AI route.
 * @param params Image file and optional existing search value
 * @returns Promise resolving to a backend-generated search query string
 */
export async function generateImageSearchQuery (
  params: GenerateImageSearchQueryParams
): Promise<GenerateImageSearchQueryResponse> {
  const { image, searchValue = '' } = params

  try {
    const base64ImageData = await fileToDataUrl(image)
    const finalQuery = await searchApiService.generateImageQuery({
      imageDataUrl: base64ImageData,
      searchValue
    })

    console.log('Generated search query:', finalQuery)

    return {
      searchQuery: finalQuery,
      success: true
    }
  } catch (err: any) {
    console.error('Failed to generate image search query:', err)
    return {
      searchQuery: searchValue.trim(),
      success: false,
      error: err?.message || String(err)
    }
  }
}
