// supabase/functions/process-pending-matches/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
// ============================================================================
// RATE LIMIT CONTROL
// ============================================================================
const RATE_LIMIT_HIT_COUNT = 10;
const RATE_LIMIT_COOLDOWN_MS = 60000; // 60 seconds
// ============================================================================
// GEMINI API FUNCTIONS
// ============================================================================
let rateLimitHits = 0;
let cronStartTime = 0;
async function callGeminiApi(options) {
  const { prompt, image, model = "gemini-2.5-flash", maxRetries = 5, baseDelay = 500, maxDelay = 5000 } = options;
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment variables");
    return {
      text: "",
      success: false,
      error: "API key not configured"
    };
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  for(let attempt = 1; attempt <= maxRetries; attempt++){
    try {
      const modelInstance = genAI.getGenerativeModel({
        model
      });
      let result;
      if (image) {
        result = await modelInstance.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: image.replace(/^data:image\/\w+;base64,/, "")
            }
          }
        ]);
      } else {
        result = await modelInstance.generateContent(prompt);
      }
      const text = result?.response?.text() || "";
      console.log("Gemini response:", text);
      return {
        text,
        success: true
      };
    } catch (err) {
      const errorMessage = err?.message || err?.toString() || String(err);
      const statusCode = err?.status || err?.response?.status || err?.statusCode || null;
      console.error(`Attempt ${attempt} failed:`, {
        message: errorMessage,
        statusCode
      });
      // Check for rate limit errors
      const isRateLimit = statusCode === 429 || /RESOURCE_EXHAUSTED|rate.?limit/i.test(errorMessage);
      if (isRateLimit) {
        rateLimitHits++;
        console.warn(`Rate limit hit detected (${rateLimitHits}/${RATE_LIMIT_HIT_COUNT})`);
        // Check if we've hit the threshold
        if (rateLimitHits >= RATE_LIMIT_HIT_COUNT) {
          console.warn("Rate limit threshold reached. Stopping immediately.");
          return {
            text: "",
            success: false,
            error: "RATE_LIMIT_STOP"
          };
        }
        // Calculate remaining time budget
        const elapsed = Date.now() - cronStartTime;
        const remainingBudget = 110000 - elapsed;
        // Only wait if we have enough time budget (60s + 5s buffer)
        if (remainingBudget > 65000) {
          console.warn(`Waiting ${RATE_LIMIT_COOLDOWN_MS / 1000} seconds to cool down...`);
          await new Promise((resolve)=>setTimeout(resolve, RATE_LIMIT_COOLDOWN_MS));
          continue; // Retry after cooldown
        } else {
          console.warn("Not enough time budget to wait. Stopping.");
          return {
            text: "",
            success: false,
            error: "RATE_LIMIT_STOP"
          };
        }
      }
      // Check for non-retryable errors
      const nonRetryableStatuses = [
        400,
        401,
        403,
        404
      ];
      const isNonRetryableStatus = nonRetryableStatuses.includes(statusCode);
      if (isNonRetryableStatus) {
        return {
          text: "",
          success: false,
          error: `Non-retryable error (${statusCode}): ${errorMessage}`
        };
      }
      // Check for retryable errors
      const isRetryableStatus = statusCode === 503 || statusCode === 500;
      const isRetryableText = /503|UNAVAILABLE|timeout/i.test(errorMessage);
      const isRetryable = isRetryableStatus || isRetryableText;
      if (!isRetryable) {
        return {
          text: "",
          success: false,
          error: `Non-retryable error: ${errorMessage}`
        };
      }
      // Exponential backoff with jitter
      if (attempt < maxRetries) {
        const exp = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
        const jitter = Math.floor(Math.random() * Math.min(200, exp));
        const delay = exp + jitter;
        console.warn(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve)=>setTimeout(resolve, delay));
      } else {
        console.error("All retries failed. Marking as retriable.");
        return {
          text: "",
          success: false,
          error: `Failed after ${maxRetries} retries: ${errorMessage}`
        };
      }
    }
  }
  return {
    text: "",
    success: false,
    error: "Unknown error occurred"
  };
}
async function fileUrlToBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for(let i = 0; i < bytes.byteLength; i++){
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
async function generateImageSearchQuery(image, searchValue) {
  try {
    let base64ImageData = image;
    // If it's a URL, convert to base64
    if (image.startsWith("http://") || image.startsWith("https://")) {
      base64ImageData = await fileUrlToBase64(image);
      base64ImageData = `data:image/jpeg;base64,${base64ImageData}`;
    }
    const userPrompt = `Analyze this image of a lost or found item. Identify the main object, color, brand, and key descriptive features.

Generate a search query string using these rules:
1. Combine adjectives with the nouns they describe into single phrases using the word "AND". Example: "black AND bottle".
2. Combine related adjectives with "OR" for flexibility. Example: "black OR matte OR shiny".
3. Combine related nouns with "OR" only if they represent alternatives of the same type. Example: "bottle OR container".
4. Do not match adjectives or nouns in isolation; always pair adjectives with their noun when relevant.
5. Generate minimum of 10 keywords and a maximum of 20 keywords ONLY.
IMPORTANT: DO NOT output anything else. NO sentences, NO notes, NO explanations, NO steps. Output ONLY the final search query string.

Example correct output:
black AND bottle OR black AND flask OR blue AND bottle OR matte AND container OR durable OR reusable`;
    const result = await callGeminiApi({
      prompt: userPrompt,
      image: base64ImageData,
      maxRetries: 5,
      baseDelay: 500,
      maxDelay: 5000
    });
    // Handle rate limit stop signal
    if (result.error === "RATE_LIMIT_STOP") {
      return {
        searchQuery: searchValue.trim(),
        success: false,
        error: "RATE_LIMIT_STOP"
      };
    }
    if (!result.success) {
      return {
        searchQuery: searchValue.trim(),
        success: false,
        error: result.error
      };
    }
    let imageKeywords = result.text.trim();
    imageKeywords = imageKeywords.replace(/```/g, "");
    imageKeywords = imageKeywords.replace(/['"]/g, "");
    imageKeywords = imageKeywords.trim();
    let finalQuery = "";
    if (searchValue.trim() && imageKeywords) {
      finalQuery = `${searchValue.trim()} OR ${imageKeywords}`;
    } else if (imageKeywords) {
      finalQuery = imageKeywords;
    } else if (searchValue.trim()) {
      finalQuery = searchValue.trim();
    }
    console.log("Generated search query:", finalQuery);
    return {
      searchQuery: finalQuery,
      success: true
    };
  } catch (err) {
    console.error("Failed to generate image search query:", err);
    return {
      searchQuery: searchValue.trim(),
      success: false,
      error: err?.message || String(err)
    };
  }
}
// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================
async function processPendingMatch(record, supabase, supabaseUrl, supabaseAnonKey) {
  console.log(`\n=== Processing pending match ID: ${record.id} ===`);
  try {
    // Step 1: Build search value from item data
    const metadata = record.item_metadata || {};
    const mainObjects = Array.isArray(metadata.main_objects) ? metadata.main_objects.join(" OR ") : "";
    const descriptiveWords = Array.isArray(metadata.descriptive_words) ? metadata.descriptive_words.join(" OR ") : "";
    const potentialBrands = Array.isArray(metadata.potential_brands) ? metadata.potential_brands.join(" OR ") : "";
    const searchParts = [
      record.item_name,
      record.item_description,
      mainObjects,
      descriptiveWords,
      potentialBrands
    ].filter((part)=>part && part.trim()).join(" OR ");
    console.log("Text-based search parts:", searchParts);
    // Step 2: Generate search query (with or without image)
    let searchQuery = searchParts;
    let geminiSuccess = true;
    let geminiError;
    if (record.image_link) {
      console.log("Image found, generating enhanced search query...");
      const imageResult = await generateImageSearchQuery(record.image_link, searchParts);
      // Handle rate limit stop - propagate up immediately
      if (imageResult.error === "RATE_LIMIT_STOP") {
        console.warn("Rate limit stop detected, propagating up...");
        throw new Error("RATE_LIMIT_STOP");
      }
      if (imageResult.success) {
        searchQuery = imageResult.searchQuery;
      } else {
        geminiSuccess = false;
        geminiError = imageResult.error;
        console.error("Gemini failed:", imageResult.error);
        // Check if error is non-retryable
        if (imageResult.error?.includes("Non-retryable") || imageResult.error?.includes("400") || imageResult.error?.includes("404") || imageResult.error?.includes("401") || imageResult.error?.includes("403")) {
          console.log("Non-retryable error detected, marking as failed");
          await supabase.from("pending_match").update({
            status: "failed",
            is_retriable: false,
            failed_reason: imageResult.error
          }).eq("id", record.id);
          return;
        } else {
          // Retriable error, keep as pending
          console.log("Retriable error, keeping as pending");
          await supabase.from("pending_match").update({
            status: "pending",
            is_retriable: true,
            failed_reason: imageResult.error
          }).eq("id", record.id);
          return;
        }
      }
    }
    console.log("Final search query:", searchQuery);
    // Step 3: Search for matching items
    const { data: searchResults, error: searchError } = await supabase.rpc("search_items_fts", {
      search_term: searchQuery,
      limit_count: 10,
      p_date: null,
      p_category: null,
      p_location_last_seen: null
    });
    if (searchError) {
      console.error("Search error:", searchError);
      await supabase.from("pending_match").update({
        status: "failed",
        is_retriable: false,
        failed_reason: `Search failed: ${searchError.message}`
      }).eq("id", record.id);
      return;
    }
    console.log(`Found ${searchResults?.length || 0} potential matches`);
    // Filter for "found" items only and exclude the original post
    const foundMatches = (searchResults || []).filter((item)=>item.item_type === "found" && item.post_id !== record.post_id);
    console.log(`Filtered to ${foundMatches.length} 'found' items`);
    if (foundMatches.length === 0) {
      console.log("No matches found, marking as match_complete");
      await supabase.from("pending_match").update({
        status: "match_complete"
      }).eq("id", record.id);
      return;
    }
    // Step 4: Send notification
    const matchedPostIds = foundMatches.map((item)=>item.post_id);
    const notificationBody = `We've found ${foundMatches.length}+ items similar to your missing item ${record.item_name}`;
    console.log("Sending notification to user:", record.poster_id);
    const notificationPayload = {
      user_id: record.poster_id,
      title: "Found Similar Items",
      body: notificationBody,
      description: notificationBody,
      type: "match",
      data: {
        postId: record.post_id,
        matched_post_ids: matchedPostIds,
        link: "/user/matches"
      }
    };
    // Call send-notification edge function
    const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(notificationPayload)
    });
    const notificationResult = await notificationResponse.json();
    console.log("Notification result:", notificationResult);
    // Step 5: Update status to match_complete
    await supabase.from("pending_match").update({
      status: "match_complete"
    }).eq("id", record.id);
    console.log(`Successfully processed pending match ID: ${record.id}`);
  } catch (err) {
    // Re-throw rate limit stop to be handled by main loop
    if (err?.message === "RATE_LIMIT_STOP") {
      throw err;
    }
    console.error(`Error processing match ID ${record.id}:`, err);
    await supabase.from("pending_match").update({
      status: "failed",
      is_retriable: false,
      failed_reason: err?.message || String(err)
    }).eq("id", record.id);
  }
}
// ============================================================================
// EDGE FUNCTION HANDLER
// ============================================================================
Deno.serve(async (req)=>{
  const startTime = Date.now();
  cronStartTime = startTime; // Set global start time
  rateLimitHits = 0; // Reset rate limit counter
  const TIMEOUT_MS = 110000; // 110 seconds
  console.log("=== Starting process-pending-matches cron job ===");
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Fetch all pending matches
    const { data: pendingMatches, error: fetchError } = await supabase.from("pending_match_v").select("*").eq("status", "pending").eq("is_retriable", true);
    if (fetchError) {
      console.error("Error fetching pending matches:", fetchError);
      return new Response(JSON.stringify({
        error: fetchError.message
      }), {
        status: 500
      });
    }
    console.log(`Found ${pendingMatches?.length || 0} pending matches to process`);
    let processed = 0;
    let failed = 0;
    let timedOut = false;
    let rateLimitStopped = false;
    // Process each pending match
    for (const record of pendingMatches || []){
      // Check if we're approaching timeout
      const elapsed = Date.now() - startTime;
      if (elapsed >= TIMEOUT_MS) {
        console.log(`Timeout approaching (${elapsed}ms), stopping processing`);
        timedOut = true;
        break;
      }
      try {
        await processPendingMatch(record, supabase, supabaseUrl, supabaseAnonKey);
        processed++;
      } catch (err) {
        // Check for rate limit stop signal
        if (err?.message === "RATE_LIMIT_STOP") {
          console.warn("Rate limit threshold reached. Stopping cron job early.");
          rateLimitStopped = true;
          break;
        }
        console.error(`Failed to process match ID ${record.id}:`, err);
        failed++;
      }
    }
    const totalTime = Date.now() - startTime;
    const summary = {
      success: true,
      total_pending: pendingMatches?.length || 0,
      processed,
      failed,
      remaining: (pendingMatches?.length || 0) - processed - failed,
      timed_out: timedOut,
      rate_limit_stopped: rateLimitStopped,
      rate_limit_hits: rateLimitHits,
      execution_time_ms: totalTime
    };
    console.log("=== Cron job summary ===", summary);
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Unhandled error in cron job:", err);
    return new Response(JSON.stringify({
      error: err?.message || String(err)
    }), {
      status: 500
    });
  }
});
