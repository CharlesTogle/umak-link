/**
 * Gemini API (DEPRECATED - Client-side calls removed)
 *
 * This file has been deprecated as all AI operations now run server-side
 * via the backend API for security reasons.
 *
 * The backend handles:
 * - Metadata generation (automatic via /jobs/metadata-batch)
 * - Item matching (automatic via /jobs/pending-match)
 *
 * If you need AI functionality, use the backend API endpoints instead.
 */

interface GeminiRequestOptions {
  prompt: string;
  image?: string;
  model?: string;
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface GeminiResponse {
  text: string;
  success: boolean;
  error?: string;
}

export interface GenerateItemContentParams {
  itemName?: string;
  itemDescription?: string;
  image?: string;
}

export interface GenerateItemContentResponse {
  content: {
    itemName: string;
    itemDescription: string;
    itemCategory: string;
  } | null;
  success: boolean;
  error?: string;
}

/**
 * @deprecated This function is deprecated. AI operations now run server-side.
 * Metadata is generated automatically by the backend.
 */
export async function callGeminiApi(_options: GeminiRequestOptions): Promise<GeminiResponse> {
  console.warn(
    '[geminiApi] DEPRECATED: Client-side Gemini calls are no longer supported. ' +
      'AI operations now run server-side for security. Metadata is generated automatically.'
  );

  return {
    text: '',
    success: false,
    error: 'Client-side Gemini API calls are no longer supported. Operations moved server-side.',
  };
}

/**
 * @deprecated This function is deprecated. Metadata generation is now automatic server-side.
 */
export async function generateItemMetadata(_itemData: {
  name: string;
  description?: string;
  category?: string;
  type: string;
}): Promise<null> {
  console.warn(
    '[geminiApi] DEPRECATED: generateItemMetadata is no longer used. ' +
      'Metadata is generated automatically by the backend after post creation.'
  );

  return null;
}

/**
 * @deprecated Client-side content generation has been removed.
 */
export async function generateItemContent(
  _params: GenerateItemContentParams
): Promise<GenerateItemContentResponse> {
  console.warn(
    '[geminiApi] DEPRECATED: generateItemContent is no longer supported client-side. ' +
      'AI autofill now requires a server-side implementation.'
  );

  return {
    content: null,
    success: false,
    error: 'Client-side Gemini content generation is no longer supported.',
  };
}

/**
 * @deprecated Client-side vision calls have been removed.
 */
export async function callGeminiVision(
  prompt: string,
  image: string,
  model?: string
): Promise<GeminiResponse> {
  return callGeminiApi({ prompt, image, model });
}

// Export empty stub for backward compatibility
export default {
  callGeminiApi,
  callGeminiVision,
  generateItemContent,
  generateItemMetadata,
};
