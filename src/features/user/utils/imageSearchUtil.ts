import { callGeminiVision } from '@/shared/lib/geminiApi'

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
 * Generate a search query string from an image using Gemini AI
 * Analyzes the image and extracts keywords for search, combining them with existing search value
 * @param params Image file and optional existing search value
 * @returns Promise resolving to a search query string with keywords separated by '&'
 */
export async function generateImageSearchQuery (
  params: GenerateImageSearchQueryParams
): Promise<GenerateImageSearchQueryResponse> {
  const { image, searchValue = '' } = params

  try {
    const base64ImageData = await fileToDataUrl(image)
    const userPrompt = `Analyze this image of a lost or found item. Identify the main object, color, brand, and key descriptive features.

Generate a search query string using these rules:
1. Combine adjectives with the nouns they describe into single phrases using the word "AND". Example: "black AND bottle".
2. Combine related adjectives with "OR" for flexibility. Example: "black OR matte OR shiny".
3. Combine related nouns with "OR" only if they represent alternatives of the same type. Example: "bottle OR container".
4. Do not match adjectives or nouns in isolation; always pair adjectives with their noun when relevant.
5. Generate minimum of 10 keywords and a maximum of 20 keywords ONLY.
IMPORTANT: DO NOT output anything else. NO sentences, NO notes, NO explanations, NO steps. Output ONLY the final search query string.

Example correct output:
black AND bottle OR black AND flask OR blue AND bottle OR matte AND container OR durable OR reusable`

    const result = await callGeminiVision(userPrompt, base64ImageData)

    if (!result.success) {
      return {
        searchQuery: searchValue.trim(),
        success: false,
        error: result.error
      }
    }
    let imageKeywords = result.text.trim()
    imageKeywords = imageKeywords.replace(/```/g, '')
    imageKeywords = imageKeywords.replace(/['"]/g, '')
    imageKeywords = imageKeywords.trim()
    let finalQuery = ''

    if (searchValue.trim() && imageKeywords) {
      finalQuery = `${searchValue.trim()} OR ${imageKeywords}`
    } else if (imageKeywords) {
      finalQuery = imageKeywords
    } else if (searchValue.trim()) {
      finalQuery = searchValue.trim()
    }

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
