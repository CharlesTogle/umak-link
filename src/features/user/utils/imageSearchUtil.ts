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
    const userPrompt = `Analyze this image of a lost or found item. Identify the main object, its color, brand, model, material, and any fixed physical features visible in the image. Ignore subjective or decorative descriptors such as “gradient”, “sparkling”, “cute”, “stylish”, or any mood-based adjectives.

Generate a search query string using these rules:
1. Use only objective attributes: color, brand, model name/number, material, and physical parts (e.g., "dual camera", "leather strap").
2. Do NOT include vague aesthetic descriptors such as gradient, shimmering, glossy, sparkling, shiny, silicone, square (unless the shape is a core physical property).
3. Pair every adjective with the noun it describes using “AND”.
4. Combine related adjectives with “OR” only if they describe the SAME attribute category (e.g., color variants).
5. Combine related nouns with “OR” only if they represent alternatives of the same object type.
6. Always output 10–20 combined keyword phrases.
7. Output ONLY the final search query string. No sentences, no notes, no explanation.

Example correct output:
black AND bottle OR black AND flask OR blue AND bottle OR matte AND container OR durable AND container OR stainless AND bottle
`

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
