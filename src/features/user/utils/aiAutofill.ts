import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { generateItemContent } from '@/shared/lib/geminiApi'

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

/**
 * Rate limit configuration
 */
const RL_KEY = 'ai_autofill_timestamps'
const WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 10

/**
 * Read timestamps from hybrid storage (Preferences on native, localStorage on web)
 */
const readTimestamps = async (): Promise<number[]> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: RL_KEY })
      if (!value) return []
      return JSON.parse(value)
    }
    const raw = localStorage.getItem(RL_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/**
 * Write timestamps to hybrid storage
 */
const writeTimestamps = async (arr: number[]) => {
  try {
    const v = JSON.stringify(arr)
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: RL_KEY, value: v })
      return
    }
    localStorage.setItem(RL_KEY, v)
  } catch {
    // noop
  }
}

export interface AutofillResult {
  success: boolean
  rateLimitExceeded?: boolean
  skipped?: boolean
  content?: {
    itemName?: string
    itemDescription?: string
    itemCategory?: string
  }
  error?: string
}

export interface AutofillOptions {
  imageFile: File
  currentTitle: string
  currentDesc: string
  currentCategory: string | null
}

/**
 * Business logic: Generate AI content with timeout and autofill empty fields
 * Returns result object for UI layer to handle state updates
 */
export async function generateAndAutofillFields (
  options: AutofillOptions
): Promise<AutofillResult> {
  const { imageFile, currentTitle, currentDesc, currentCategory } = options

  // Prune old timestamps and check quota
  const now = Date.now()
  const existing = await readTimestamps()
  const recent = existing.filter(t => now - t <= WINDOW_MS)

  if (recent.length >= MAX_ATTEMPTS) {
    console.warn('[AI Autofill] Rate limit exceeded')
    return { success: false, rateLimitExceeded: true }
  }

  // Record this attempt (count attempts regardless of success)
  recent.push(now)
  void writeTimestamps(recent)

  const titleEmpty = !currentTitle.trim()
  const descEmpty = !currentDesc.trim()
  const categoryEmpty = !currentCategory

  // Only generate if at least one field is empty
  if (!titleEmpty && !descEmpty && !categoryEmpty) {
    console.log('[AI Autofill] Skipped: All fields already filled')
    return { success: true, skipped: true }
  }

  console.log('[AI Autofill] Starting generation for empty fields...')

  // Create a timeout promise that rejects after 10s
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('ai_timeout')), 10000)
  )

  try {
    const base64 = await fileToDataUrl(imageFile)

    const aiPromise = generateItemContent({
      itemName: titleEmpty ? '' : currentTitle.trim(),
      itemDescription: descEmpty ? '' : currentDesc.trim(),
      image: base64
    })

    console.log('[AI Autofill] Awaiting AI response with timeout...')
    const aiResult = (await Promise.race([aiPromise, timeoutPromise])) as any

    if (aiResult && aiResult.success && aiResult.content) {
      const c = aiResult.content
      console.log('[AI Autofill] Success:', c)

      const content: {
        itemName?: string
        itemDescription?: string
        itemCategory?: string
      } = {}

      // Only include fields that were empty
      if (titleEmpty && c.itemName) {
        content.itemName = c.itemName
        console.log('[AI Autofill] Set title:', c.itemName)
      }
      if (descEmpty && c.itemDescription) {
        content.itemDescription = c.itemDescription
        console.log('[AI Autofill] Set description:', c.itemDescription)
      }
      if (categoryEmpty && c.itemCategory) {
        content.itemCategory = c.itemCategory
        console.log('[AI Autofill] Set category:', c.itemCategory)
      }

      return { success: true, content }
    }

    return { success: false, error: 'No content returned from AI' }
  } catch (err: any) {
    console.error('[AI Autofill] Failed:', err)

    if (err?.message === 'ai_timeout') {
      return { success: false, error: 'ai_timeout' }
    }

    return { success: false, error: err?.message || 'Unknown error' }
  }
}
