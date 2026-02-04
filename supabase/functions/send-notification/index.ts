// supabase/functions/send-notification/index.ts
import * as jose from "https://esm.sh/jose@4.15.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400"
};
const json = (body, status = 200)=>new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);
Deno.serve(async (req)=>{
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return json({
      error: "Method not allowed"
    }, 405);
  }
  try {
    const { user_id, title, body, description, type, data, image_url } = await req.json();
    if (!user_id || !title || !body || !type) {
      return json({
        error: "Missing user_id, title, body, or type"
      }, 400);
    }
    // Step 1: Fetch user and notification token
    const { data: user, error: userErr } = await supabase.from("user_table").select("user_id, notification_token").eq("user_id", user_id).single();
    if (userErr) {
      return json({
        error: userErr.message
      }, 500);
    }
    if (!user) {
      return json({
        error: "User not found"
      }, 404);
    }
    let imageId = null;
    // Step 2: Insert image if provided
    if (image_url) {
      const { data: imageData, error: imageErr } = await supabase.from("notification_image_table").insert({
        image_url: image_url
      }).select("image_id").single();
      if (imageErr) {
        console.error("Failed to insert image:", imageErr);
      } else {
        imageId = imageData.image_id;
      }
    }
    // Step 3: Insert notification record to Supabase
    const notificationPayload = {
      notification_id: crypto.randomUUID(),
      description: description || body,
      title: title,
      sent_to: user.user_id,
      sent_by: data?.sent_by ?? null,
      is_read: false,
      type,
      image_id: imageId,
      data: data || {}
    };
    const { data: insertData, error: insertErr } = await supabase.from("notification_table").insert(notificationPayload).select();
    if (insertErr) {
      return json({
        error: insertErr.message
      }, 500);
    }
    // Step 4: Try to send FCM notification (non-blocking, only if user has token)
    let fcmResult = null;
    let fcmError = null;
    if (user.notification_token) {
      try {
        // Firebase service account
        const saRaw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}";
        const sa = JSON.parse(saRaw);
        const projectId = sa.project_id;
        const privateKey = sa.private_key;
        const clientEmail = sa.client_email;
        if (!projectId || !privateKey || !clientEmail) {
          throw new Error("Invalid or missing service account credentials");
        }
        // Create service-account JWT
        const now = Math.floor(Date.now() / 1000);
        const jwt = await new jose.SignJWT({
          iss: clientEmail,
          scope: "https://www.googleapis.com/auth/cloud-platform",
          aud: "https://oauth2.googleapis.com/token",
          iat: now,
          exp: now + 3600
        }).setProtectedHeader({
          alg: "RS256"
        }).sign(await jose.importPKCS8(privateKey, "RS256"));
        // Exchange for OAuth2 access token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt
          })
        });
        if (!tokenRes.ok) {
          const details = await tokenRes.text();
          throw new Error(`Token exchange failed: ${details}`);
        }
        const { access_token } = await tokenRes.json();
        // Send FCM message
        const message = {
          message: {
            token: user.notification_token,
            notification: {
              title,
              body: description || body
            },
            data: data || {},
            ...image_url && {
              android: {
                notification: {
                  image: image_url
                }
              },
              apns: {
                payload: {
                  aps: {
                    "mutable-content": 1
                  }
                },
                fcm_options: {
                  image: image_url
                }
              }
            }
          }
        };
        const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(message)
        });
        const fcmText = await fcmRes.text();
        if (!fcmRes.ok) {
          throw new Error(`FCM send failed: ${fcmText}`);
        }
        fcmResult = JSON.parse(fcmText);
      } catch (err) {
        // Log the error but don't fail the request
        fcmError = err?.message ?? String(err);
        console.error("FCM notification failed:", fcmError);
      }
    }
    // Always return success since DB insert succeeded
    const jsonResponse = {
      success: true,
      inserted: insertData,
      fcm: {
        sent: fcmResult !== null,
        result: fcmResult,
        error: fcmError,
        has_token: !!user.notification_token
      }
    };
    console.log(jsonResponse);
    return json(jsonResponse);
  } catch (err) {
    console.error("Unhandled error:", err);
    const msg = err?.message ?? String(err);
    return json({
      error: msg
    }, 500);
  }
});
