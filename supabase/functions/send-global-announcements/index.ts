// supabase/functions/send-global-notification/index.ts
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
const CONCURRENT_LIMIT = 50;
const MAX_EXECUTION_TIME = 110000; // 110 seconds in ms
const MAX_RETRIES = 3;
// Get Firebase credentials and create access token
async function getFirebaseAccessToken() {
  const saRaw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}";
  const sa = JSON.parse(saRaw);
  const projectId = sa.project_id;
  const privateKey = sa.private_key;
  const clientEmail = sa.client_email;
  if (!projectId || !privateKey || !clientEmail) {
    throw new Error("Invalid or missing service account credentials");
  }
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
  return {
    access_token,
    projectId
  };
}
// Send notification with retry logic
async function sendNotificationWithRetry(token, title, body, description, data, accessToken, projectId, retryCount = 0) {
  try {
    const message = {
      message: {
        token,
        notification: {
          title,
          body: description || body
        },
        data: data || {},
        ...data?.image_url && {
          android: {
            notification: {
              image: data.image_url
            }
          },
          apns: {
            payload: {
              aps: {
                "mutable-content": 1
              }
            },
            fcm_options: {
              image: data.image_url
            }
          }
        }
      }
    };
    const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(message)
    });
    const fcmText = await fcmRes.text();
    if (!fcmRes.ok) {
      const isRetriable = fcmRes.status >= 500 || fcmRes.status === 429;
      if (isRetriable && retryCount < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise((resolve)=>setTimeout(resolve, delay));
        return sendNotificationWithRetry(token, title, body, description, data, accessToken, projectId, retryCount + 1);
      }
      return {
        success: false,
        retriable: isRetriable,
        reason: `${fcmRes.status} ${fcmText.substring(0, 100)}`
      };
    }
    return {
      success: true,
      retriable: false
    };
  } catch (error) {
    const isRetriable = true;
    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      await new Promise((resolve)=>setTimeout(resolve, delay));
      return sendNotificationWithRetry(token, title, body, description, data, accessToken, projectId, retryCount + 1);
    }
    return {
      success: false,
      retriable: isRetriable,
      reason: error?.message ?? String(error)
    };
  }
}
// Process notifications in batches with concurrency limit
async function processBatch(users, title, body, description, data, accessToken, projectId, startTime) {
  const successful = [];
  const failed = [];
  for(let i = 0; i < users.length; i += CONCURRENT_LIMIT){
    // Check if we're approaching timeout
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      // Mark remaining users as retriable
      for(let j = i; j < users.length; j++){
        failed.push({
          user_id: users[j].user_id,
          retriable: true,
          reason: "Execution timeout - not attempted"
        });
      }
      break;
    }
    const batch = users.slice(i, i + CONCURRENT_LIMIT);
    const promises = batch.map(async (user)=>{
      const result = await sendNotificationWithRetry(user.notification_token, title, body, description, data, accessToken, projectId);
      if (result.success) {
        successful.push(user.user_id);
      } else {
        failed.push({
          user_id: user.user_id,
          retriable: result.retriable,
          reason: result.reason ?? "Unknown error"
        });
      }
    });
    await Promise.all(promises);
  }
  return {
    successful,
    failed
  };
}
// Check if individual notifications already exist for this global announcement
async function checkExistingNotifications(globalNotificationId) {
  const { data, error } = await supabase.from('notification_table').select('notification_id').eq('global_announcement_id', globalNotificationId).limit(1);
  return !error && data && data.length > 0;
}
// Insert individual notifications for all users
async function insertIndividualNotifications(userIds, globalNotificationId, message, description, imageId, sentBy) {
  const notifications = userIds.map((userId)=>({
      title: message,
      notification_id: crypto.randomUUID(),
      sent_to: userId,
      sent_by: sentBy,
      description: description,
      type: 'global_announcement',
      image_id: imageId,
      is_read: false,
      global_announcement_id: globalNotificationId,
      data: {
        global_notification_id: String(globalNotificationId)
      }
    }));
  // Insert in batches to avoid payload size issues
  const BATCH_SIZE = 500;
  for(let i = 0; i < notifications.length; i += BATCH_SIZE){
    const batch = notifications.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('notification_table').insert(batch);
    if (error) {
      console.error(`Failed to insert notification batch ${i}-${i + batch.length}:`, error);
    }
  }
}
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
  const startTime = Date.now();
  try {
    const payload = await req.json();
    if (!payload.message) {
      return json({
        error: "Missing message"
      }, 400);
    }
    const imageUrl = payload.image_url;
    const message = payload.message;
    const description = payload.description;
    const sentBy = payload.user_id;
    let imageId = null;
    let globalNotificationId;
    // STEP 1: Insert image if provided
    if (imageUrl) {
      const { data: imageData, error: imageErr } = await supabase.from("notification_image_table").insert({
        image_url: imageUrl
      }).select("image_id").single();
      if (imageErr) {
        console.error("Failed to insert image:", imageErr);
      } else {
        imageId = imageData.image_id;
      }
    }
    // STEP 2: Create global announcement record first
    const { data: newAnnouncement, error: insertErr } = await supabase.from("global_announcements_table").insert({
      message,
      description,
      image_id: imageId,
      sent_by: sentBy,
      failed_user_ids: []
    }).select("id").single();
    if (insertErr || !newAnnouncement) {
      return json({
        error: "Failed to create announcement record"
      }, 500);
    }
    globalNotificationId = newAnnouncement.id;
    // Fetch ALL users (including those without tokens)
    const { data: allUsers, error: allUsersErr } = await supabase.from("user_table").select("user_id, notification_token");
    if (allUsersErr) {
      return json({
        error: allUsersErr.message
      }, 500);
    }
    if (!allUsers || allUsers.length === 0) {
      return json({
        success: true,
        message: "No users found",
        global_notification_id: globalNotificationId
      });
    }
    // STEP 3: Check if notifications already exist (deduplication)
    const notificationsExist = await checkExistingNotifications(globalNotificationId);
    if (!notificationsExist) {
      // Insert individual notifications for ALL users
      const allUserIds = allUsers.map((u)=>u.user_id);
      const title = message; // Define title from message
      await insertIndividualNotifications(allUserIds, globalNotificationId, message, description, imageId, sentBy);
    }
    // STEP 4: Send push notifications (only to users with tokens)
    const usersWithTokens = allUsers.filter((u)=>u.notification_token);
    const usersWithoutTokens = allUsers.filter((u)=>!u.notification_token);
    let successful = [];
    let failed = [];
    if (usersWithTokens.length > 0) {
      // Get Firebase access token
      const { access_token, projectId } = await getFirebaseAccessToken();
      // Process notifications
      const title = message;
      const notificationData = {
        image_url: imageUrl,
        global_notification_id: String(globalNotificationId)
      };
      const result = await processBatch(usersWithTokens, title, message, description, notificationData, access_token, projectId, startTime);
      successful = result.successful;
      failed = result.failed;
    }
    // STEP 5: Add users without tokens to failed list (not retriable)
    const usersWithoutTokensFailed = usersWithoutTokens.map((u)=>({
        user_id: u.user_id,
        retriable: false,
        reason: "No notification token"
      }));
    const allFailed = [
      ...failed,
      ...usersWithoutTokensFailed
    ];
    // Update global announcement with failed users
    const { error: updateErr } = await supabase.from("global_announcements_table").update({
      failed_user_ids: allFailed
    }).eq("id", globalNotificationId);
    if (updateErr) {
      console.error("Failed to update failed_user_ids:", updateErr);
    }
    const executionTime = Date.now() - startTime;
    return json({
      success: true,
      global_notification_id: globalNotificationId,
      stats: {
        total_users: allUsers.length,
        users_with_tokens: usersWithTokens.length,
        users_without_tokens: usersWithoutTokens.length,
        push_successful: successful.length,
        push_failed: failed.length,
        retriable_failed: failed.filter((f)=>f.retriable).length,
        execution_time_ms: executionTime
      },
      failed_users: allFailed.length > 0 ? allFailed : undefined
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    const msg = err?.message ?? String(err);
    return json({
      error: msg
    }, 500);
  }
});
