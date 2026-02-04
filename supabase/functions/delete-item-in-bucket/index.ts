import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const startTime = Date.now();
  console.log("=== Delete Item in Bucket - Request Started ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Request method:", req.method);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));

  try {
    // Parse request body
    console.log("Parsing request body...");
    const body = await req.json();
    console.log("Request body:", body);
    
    const { imageLink } = body;

    if (!imageLink) {
      console.error("ERROR: imageLink is missing from request body");
      return new Response(
        JSON.stringify({ ok: false, error: "imageLink is required" }), 
        { status: 400 }
      );
    }

    console.log("Image link to delete:", imageLink);

    // Initialize Supabase client
    console.log("Initializing Supabase client...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Supabase URL:", supabaseUrl);
    console.log("Service role key exists:", !!serviceRoleKey);
    console.log("Service role key length:", serviceRoleKey?.length || 0);

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("ERROR: Missing environment variables");
      console.error("SUPABASE_URL exists:", !!supabaseUrl);
      console.error("SUPABASE_SERVICE_ROLE_KEY exists:", !!serviceRoleKey);
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    console.log("Supabase client initialized successfully");

    // Parse the URL to extract bucket and path
    console.log("Parsing image URL...");
    const url = new URL(imageLink);
    console.log("URL hostname:", url.hostname);
    console.log("URL pathname:", url.pathname);
    console.log("URL pathname parts:", url.pathname.split("/"));

    const pathParts = url.pathname.split("/");
    console.log("Full path parts:", pathParts);
    
    // Remove empty strings and extract bucket name
    const filteredParts = pathParts.filter(part => part !== "");
    console.log("Filtered path parts:", filteredParts);
    
    // Expected format: /storage/v1/object/public/bucketName/path/to/file
    // After split and filter: ["storage", "v1", "object", "public", "bucketName", "path", "to", "file"]
    let bucketName: string;
    let filePath: string;
    
    const publicIndex = filteredParts.indexOf("public");
    if (publicIndex !== -1 && filteredParts.length > publicIndex + 1) {
      bucketName = filteredParts[publicIndex + 1];
      filePath = filteredParts.slice(publicIndex + 2).join("/");
    } else {
      // Fallback to original logic
      const [, , extractedBucket, ...pathSegments] = pathParts;
      bucketName = extractedBucket;
      filePath = pathSegments.join("/");
    }

    console.log("Extracted bucket name:", bucketName);
    console.log("Extracted file path:", filePath);

    if (!bucketName || !filePath) {
      console.error("ERROR: Failed to extract bucket name or file path");
      console.error("Bucket name:", bucketName);
      console.error("File path:", filePath);
      throw new Error("Invalid image URL format");
    }

    // Attempt to delete the file from storage
    console.log(`Attempting to delete file from bucket "${bucketName}"...`);
    console.log(`File path: "${filePath}"`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    console.log("Storage delete response - data:", data);
    console.log("Storage delete response - error:", error);

    if (error) {
      console.error("ERROR: Storage deletion failed");
      console.error("Error code:", error.message);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw error;
    }

    const duration = Date.now() - startTime;
    console.log("=== Delete Item in Bucket - Success ===");
    console.log("File deleted successfully");
    console.log("Duration (ms):", duration);
    console.log("Response:", { ok: true, bucketName, filePath, duration });

    return new Response(
      JSON.stringify({ 
        ok: true, 
        bucketName, 
        filePath,
        duration 
      }), 
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    const duration = Date.now() - startTime;
    console.error("=== Delete Item in Bucket - Error ===");
    console.error("Error occurred after (ms):", duration);
    console.error("Error type:", err?.constructor?.name);
    console.error("Error message:", String(err));
    console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace");
    
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: String(err),
        duration 
      }), 
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});