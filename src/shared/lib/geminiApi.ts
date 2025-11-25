import { GoogleGenAI } from '@google/genai'
import { getCategoryTypes } from '@/features/user/configs/postCategories'

interface GeminiRequestOptions {
  prompt: string
  image?: string // base64 or blob URL
  model?: string
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
}

interface GeminiResponse {
  text: string
  success: boolean
  error?: string
}

/**
 * Call Gemini API with exponential backoff retry logic
 * @param options Configuration for the Gemini API call
 * @returns Promise resolving to the generated text response
 */
export async function callGeminiApi (
  options: GeminiRequestOptions
): Promise<GeminiResponse> {
  const {
    prompt,
    image,
    model = 'gemini-2.5-flash',
    maxRetries = 5,
    baseDelay = 500, // 500ms base delay
    maxDelay = 2000 // 2 seconds max delay
  } = options

  const apiKey = import.meta.env.VITE_GEMINI_API

  if (!apiKey) {
    console.error('VITE_GEMINI_API is not set in environment variables')
    return {
      text: '',
      success: false,
      error: 'API key not configured'
    }
  }

  const genAI = new GoogleGenAI({ apiKey })

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let result: any

      if (image) {
        // Multi-modal request (text + image)
        result = await genAI.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: image.replace(/^data:image\/\w+;base64,/, '')
                  }
                }
              ]
            }
          ]
        })
      } else {
        // Text-only request
        result = await genAI.models.generateContent({
          model,
          contents: prompt
        })
      }

      const text = result?.text || result?.response?.text() || ''
      console.log('Gemini response:', text)

      return {
        text,
        success: true
      }
    } catch (err: any) {
      // Enhanced error logging
      const errorMessage = err?.message || err?.toString() || String(err)
      const statusCode =
        err?.status || err?.response?.status || err?.code || null
      console.error(
        `Attempt ${attempt} failed:`,
        JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
      )

      // Determine retryability using status code and error text
      const isRetryableStatus =
        statusCode === 503 || statusCode === 429 || statusCode === 500
      const isRetryableText =
        /503|UNAVAILABLE|RESOURCE_EXHAUSTED|rate.?limit|timeout/i.test(
          errorMessage
        )
      const isRetryable = isRetryableStatus || isRetryableText

      if (!isRetryable) {
        // Non-retryable error, fail immediately
        return {
          text: '',
          success: false,
          error: errorMessage
        }
      }

      if (attempt < maxRetries) {
        // Exponential backoff with jitter to avoid thundering herd
        const exp = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay)
        const jitter = Math.floor(Math.random() * Math.min(200, exp))
        const delay = exp + jitter
        console.warn(
          `Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
        )
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        console.error('All retries failed. Giving up.')
        return {
          text: '',
          success: false,
          error: `Failed after ${maxRetries} retries: ${errorMessage}`
        }
      }
    }
  }

  // Fallback (should never reach here)
  return {
    text: '',
    success: false,
    error: 'Unknown error occurred'
  }
}

/**
 * Simplified text-only call to Gemini API
 * @param prompt The text prompt to send
 * @param model Optional model name (default: gemini-2.5-flash-exp)
 * @returns Promise resolving to the generated text response
 */
export async function callGeminiText (
  prompt: string,
  model?: string
): Promise<GeminiResponse> {
  return callGeminiApi({ prompt, model })
}

/**
 * Call Gemini API with an image for vision tasks
 * @param prompt The text prompt describing what to analyze
 * @param image Base64-encoded image data or data URL
 * @param model Optional model name (default: gemini-2.5-flash)
 * @returns Promise resolving to the generated text response
 */
export async function callGeminiVision (
  prompt: string,
  image: string,
  model?: string
): Promise<GeminiResponse> {
  return callGeminiApi({ prompt, image, model: model || 'gemini-2.5-flash' })
}

// ============================================
// Item Metadata Generation
// ============================================

interface ItemMetadata {
  caption: string
  main_objects: string[]
  descriptive_words: string[]
  potential_brands: string[]
}

interface GenerateItemMetadataParams {
  itemName: string
  itemDescription: string
  image: string // base64 or data URL
}

interface ItemMetadataResponse {
  metadata: ItemMetadata | null
  success: boolean
  error?: string
}

// --------------------------------------------
// Item Basic Content Generation (name/category/description)
// --------------------------------------------

interface ItemBasicInfo {
  itemName: string
  itemDescription: string
  itemCategory: string
}

interface GenerateItemContentParams {
  itemName?: string
  itemDescription?: string
  image?: string // base64 or data URL
}

interface GenerateItemContentResponse {
  content: ItemBasicInfo | null
  success: boolean
  error?: string
}

/**
 * Generate a compact JSON object containing itemName, itemDescription, itemCategory.
 * This is intended for UI autofill when creating new posts. The function asks the
 * model to return only a JSON object with the three keys.
 */
export async function generateItemContent (
  params: GenerateItemContentParams
): Promise<GenerateItemContentResponse> {
  const { itemName = '', itemDescription = '', image } = params

  const prompt = `Analyze the item and return ONLY valid JSON:

{
  "itemName": "...",
  "itemDescription": "...",
  "itemCategory": "..."
}

Rules:
- itemName: ≤32 chars, include brand if identifiable
- itemDescription: One concise sentences
- itemCategory: Must be one of: ${getCategoryTypes().join(', ')}
- Use image (if provided) to enhance accuracy
- Lowercase, no markdown, no extra text

Context:
Item Name: ${itemName}
Item Description: ${itemDescription}`

  const result = await callGeminiApi({
    prompt,
    image,
    model: 'gemini-2.5-flash'
  })

  if (!result.success) {
    return { content: null, success: false, error: result.error }
  }

  try {
    let cleaned = result.text.trim()
    cleaned = cleaned.replace(/```json\n?/g, '')
    cleaned = cleaned.replace(/```\n?/g, '')
    cleaned = cleaned.trim()

    const parsed = JSON.parse(cleaned) as Partial<ItemBasicInfo>

    const itemNameOut = (parsed.itemName || '').toString().trim()
    const itemDescriptionOut = (parsed.itemDescription || '').toString().trim()
    const itemCategoryOut = (parsed.itemCategory || '').toString().trim()

    if (!itemNameOut && !itemDescriptionOut && !itemCategoryOut) {
      throw new Error('Empty content returned')
    }

    // Map returned category to one of the allowed POST_CATEGORIES. Matching is
    // case-insensitive; prefer exact match. If nothing matches, fall back to 'Other'.
    const allowed = getCategoryTypes()
    const matched =
      allowed.find(a => a.toLowerCase() === itemCategoryOut.toLowerCase()) ||
      allowed.find(
        a =>
          itemCategoryOut &&
          itemCategoryOut.length > 0 &&
          a.toLowerCase().includes(itemCategoryOut.toLowerCase())
      )

    const finalCategory = matched || 'Other'

    const content: ItemBasicInfo = {
      itemName: itemNameOut,
      itemDescription: itemDescriptionOut,
      itemCategory: finalCategory
    }

    return { content, success: true }
  } catch (err: any) {
    console.error('generateItemContent: failed to parse model response', err)
    return {
      content: null,
      success: false,
      error: `parse_error: ${err?.message || String(err)}`
    }
  }
}

/**
 * Generate metadata for an item using Gemini AI vision analysis
 * Analyzes the image and extracts main objects and descriptive words
 * @param params Item information including name, description, and image
 * @returns Promise resolving to structured metadata with main_objects and descriptive_words
 */
export async function generateItemMetadata (
  params: GenerateItemMetadataParams
): Promise<ItemMetadataResponse> {
  const { itemName, itemDescription, image } = params

  const prompt = `
You are an AI vision model. Return only valid JSON describing the image.

Required JSON keys:
- "caption": concise sentence (max 100 chars) describing the image
- "main_objects": array of 5–10 primary visible objects (nouns/noun phrases)
- "synonyms": array of 5–10 alternative terms for main_objects
- "descriptive_words": array of 15–20 adjectives describing texture, color, material, shape, condition
- "potential_brands": array of 1–5 brand names detected or inferred from visuals/context (empty array if none)

Context:
Item Name: ${itemName}
Item Description: ${itemDescription}

Rules:
- Lowercase only
- No duplicates
- Short, general terms
- No markdown, comments, or text outside JSON
- Must be valid, parsable JSON

Return only the JSON object.
`

  const result = await callGeminiApi({
    prompt,
    image,
    model: 'gemini-2.5-flash'
  })

  if (!result.success) {
    return {
      metadata: null,
      success: false,
      error: result.error
    }
  }

  try {
    // Clean up response - remove markdown code blocks if present
    let cleanedText = result.text.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, '')
    cleanedText = cleanedText.replace(/```\n?/g, '')
    cleanedText = cleanedText.trim()

    const metadata = JSON.parse(cleanedText) as ItemMetadata

    // Validate the structure
    if (
      typeof metadata.caption !== 'string' ||
      !Array.isArray(metadata.main_objects) ||
      !Array.isArray(metadata.descriptive_words) ||
      !Array.isArray(metadata.potential_brands)
    ) {
      throw new Error('Invalid metadata structure: missing required fields')
    }

    console.log('Generated metadata:', metadata)

    return {
      metadata,
      success: true
    }
  } catch (parseError: any) {
    console.error('Failed to parse metadata JSON:', parseError)
    return {
      metadata: null,
      success: false,
      error: `Failed to parse JSON response: ${parseError.message}`
    }
  }
}
