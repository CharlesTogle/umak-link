// =====================================================
// Supabase Edge Function: generate-metadata-batch
// Description: Batch processes items needing AI metadata generation
// Deploy: supabase functions deploy generate-metadata-batch
// =====================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
// Configuration
const BATCH_SIZE = 10; // Process 10 items per run
const RATE_LIMIT_MS = 500; // Wait 500ms between items to avoid rate limits
const MAX_RETRIES = 5; // Retry failed items up to 5 times
const RETRY_DELAYS = [
  500,
  1000,
  2000,
  4000,
  7000
]; // Exponential backoff in ms (base 500ms, max 7s)
// =====================================================
// Helper: Convert ArrayBuffer to Base64 (chunk-based)
// =====================================================
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // Process 8KB at a time
  let binary = '';
  for(let i = 0; i < bytes.length; i += chunkSize){
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

function normalizeStringArray(value) {
  if (typeof value === 'string') {
    const normalized = normalizeOptionalString(value);
    return normalized ? [normalized] : [];
  }

  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const results = [];

  for (const entry of value){
    const normalized = normalizeOptionalString(entry);
    if (!normalized) continue;

    const lowered = normalized.toLowerCase();
    if (seen.has(lowered)) continue;

    seen.add(lowered);
    results.push(normalized);
  }

  return results;
}

function mergeUniqueTerms(...values) {
  const seen = new Set();
  const results = [];

  for (const value of values){
    const entries = Array.isArray(value) ? value : [value];
    for (const entry of entries){
      const normalized = normalizeOptionalString(entry);
      if (!normalized) continue;

      const lowered = normalized.toLowerCase();
      if (seen.has(lowered)) continue;

      seen.add(lowered);
      results.push(normalized);
    }
  }

  return results;
}
// =====================================================
// Gemini API Helper
// =====================================================
async function generateMetadataWithGemini(itemName, itemDescription, base64Image, geminiApiKey) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash'
  });
  const prompt = `
Analyze this lost/found item and generate metadata for search matching.

Item Name: ${itemName}
Description: ${itemDescription || 'No description provided'}

Generate the following:
1. Keywords (5-10 relevant search terms)
2. Color (primary color if discernible)
3. Brand (if mentioned or identifiable)
4. Condition (good/fair/poor/unknown)
5. Estimated value range (low/medium/high/unknown)
6. Caption (short literal description of the item)
7. Main objects (1-3 core object labels)
8. Synonyms (0-5 alternative search words)
9. Descriptive words (2-6 visible physical descriptors)
10. Potential brands (0-3 likely or mentioned brands)

Rules:
- Infer only what is reasonably visible from the image and the provided item context.
- Return valid JSON only. No markdown. No explanation.
- Keep terms practical for lost-and-found search.
- Use empty arrays when an attribute is not available.

Respond in JSON format:
{
  "keywords": ["keyword1", "keyword2"],
  "color": "color or null",
  "brand": "brand or null",
  "condition": "condition",
  "value_range": "range",
  "caption": "short caption or null",
  "main_objects": ["object1"],
  "synonyms": ["synonym1"],
  "descriptive_words": ["descriptor1"],
  "potential_brands": ["brand1"]
}
`;
  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      }
    ]);
    const response = await result.response;
    const text = response.text();
    // Clean up response
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\n?/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();
    const parsed = JSON.parse(cleanedText);
    const metadata = {
      keywords: normalizeStringArray(parsed.keywords),
      color: normalizeOptionalString(parsed.color),
      brand: normalizeOptionalString(parsed.brand),
      condition: normalizeOptionalString(parsed.condition) || 'unknown',
      value_range: normalizeOptionalString(parsed.value_range) || 'unknown',
      caption: normalizeOptionalString(parsed.caption),
      main_objects: normalizeStringArray(parsed.main_objects),
      synonyms: normalizeStringArray(parsed.synonyms),
      descriptive_words: normalizeStringArray(parsed.descriptive_words),
      potential_brands: mergeUniqueTerms(parsed.potential_brands, parsed.brand)
    };
    return {
      success: true,
      metadata
    };
  } catch (error) {
    console.error('Gemini generation failed:', error);
    return {
      success: false,
      error: error.message || String(error)
    };
  }
}
// =====================================================
// Process Single Item with Retry Logic
// =====================================================
async function processItemWithRetry(item, supabase, geminiApiKey) {
  for(let attempt = 0; attempt < MAX_RETRIES; attempt++){
    try {
      console.log(`[${item.item_id}] Attempt ${attempt + 1}/${MAX_RETRIES}`);
      // 1. Fetch image from Supabase Storage
      const imageResponse = await fetch(item.image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      const blob = await imageResponse.blob();
      const arrayBuffer = await blob.arrayBuffer();
      // FIXED: Use chunk-based conversion to avoid stack overflow
      const base64Image = arrayBufferToBase64(arrayBuffer);
      // 2. Generate metadata with Gemini
      const result = await generateMetadataWithGemini(item.item_name, item.item_description, base64Image, geminiApiKey);
      if (!result.success || !result.metadata) {
        throw new Error(result.error || 'Metadata generation failed');
      }
      // 3. Update item_table with generated metadata
      const { error: updateError } = await supabase.from('item_table').update({
        item_metadata: result.metadata
      }).eq('item_id', item.item_id);
      if (updateError) {
        throw updateError;
      }
      console.log(`[${item.item_id}] ✅ Success`);
      return {
        itemId: item.item_id,
        success: true
      };
    } catch (error) {
      console.error(`[${item.item_id}] Attempt ${attempt + 1} failed:`, error);
      // Check if error is retryable (503, UNAVAILABLE, rate limit)
      const errorMsg = error.message || String(error);
      const isRetryable = /503|UNAVAILABLE|RESOURCE_EXHAUSTED|rate.?limit/i.test(errorMsg);
      if (!isRetryable) {
        // Non-retryable error, fail immediately
        return {
          itemId: item.item_id,
          success: false,
          error: errorMsg
        };
      }
      // Wait before retry (exponential backoff)
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt];
        console.log(`[${item.item_id}] Waiting ${delay}ms before retry...`);
        await new Promise((resolve)=>setTimeout(resolve, delay));
      }
    }
  }
  return {
    itemId: item.item_id,
    success: false,
    error: `Failed after ${MAX_RETRIES} attempts`
  };
}
// =====================================================
// Main Handler
// =====================================================
serve(async (req)=>{
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }
  try {
    // 1. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      throw new Error('Missing required environment variables');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // 2. Get pending items from view
    const { data: pendingItems, error: queryError } = await supabase.from('items_pending_metadata').select('*').limit(BATCH_SIZE);
    if (queryError) {
      throw queryError;
    }
    if (!pendingItems || pendingItems.length === 0) {
      console.log('No items pending metadata generation');
      return new Response(JSON.stringify({
        message: 'No items pending',
        processed: 0,
        succeeded: 0,
        failed: 0
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    console.log(`Processing ${pendingItems.length} items...`);
    // 3. Process each item
    const results = [];
    for(let i = 0; i < pendingItems.length; i++){
      const item = pendingItems[i];
      const result = await processItemWithRetry(item, supabase, geminiApiKey);
      results.push(result);
      // Rate limiting: wait between items (except for last one)
      if (i < pendingItems.length - 1) {
        await new Promise((resolve)=>setTimeout(resolve, RATE_LIMIT_MS));
      }
    }
    // 4. Calculate summary
    const successCount = results.filter((r)=>r.success).length;
    const failedCount = results.length - successCount;
    const summary = {
      message: 'Batch processing completed',
      processed: results.length,
      succeeded: successCount,
      failed: failedCount,
      results: results.map((r)=>({
          item_id: r.itemId,
          success: r.success,
          error: r.error || null
        }))
    };
    console.log('Summary:', summary);
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    return new Response(JSON.stringify({
      error: error.message || String(error),
      processed: 0,
      succeeded: 0,
      failed: 0
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
