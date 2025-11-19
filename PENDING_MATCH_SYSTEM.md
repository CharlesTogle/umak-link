# Pending Match System

## Overview
The pending_match system handles retry logic for failed AI-powered item matching attempts. When the AI image search query generation fails, the post is added to this queue for later retry.

## Database Schema

### Table: `pending_match`
Located in: `sql/create_pending_match_table.sql`

**Columns:**
- `id` (UUID): Primary key
- `post_id` (UUID): Reference to the post that needs matching
- `poster_id` (UUID): Reference to the user who posted the item
- `status` (TEXT): Current status - 'pending', 'processing', 'completed', or 'failed'
- `retry_count` (INTEGER): Number of retry attempts made
- `last_retry_at` (TIMESTAMPTZ): Timestamp of last retry attempt
- `created_at` (TIMESTAMPTZ): When the entry was created
- `updated_at` (TIMESTAMPTZ): Auto-updated on changes
- `error_message` (TEXT): Last error message if any

**Indexes:**
- `idx_pending_match_status`: For efficient status-based queries
- `idx_pending_match_created_at`: For date-based queries
- `idx_pending_match_poster_id`: For user-specific queries

## How It Works

### 1. Initial Match Attempt
When a staff member clicks the "MATCH" button on a missing item post:
- System tries to generate an AI search query from the item image
- If successful: Searches for matching found items immediately
- If failed: Adds entry to `pending_match` table

### 2. Retry Logic (Cron Job - To Be Implemented)
A scheduled job should:
1. Query `pending_match` table for status='pending' AND retry_count < MAX_RETRIES
2. For each entry:
   - Attempt to generate AI search query again for 5 times (retries with backoffs)
   - If successful:
     - Update status to 'completed'
     - notify the poster of matches found
   - If all 5 failed:
     - Increment retry_count
     - Update last_retry_at
     - Update error_message
     - If retry_count >= MAX_RETRIES, set status to 'failed'

### 3. Configuration
Recommended settings:
- MAX_RETRIES: 3-5 attempts
- RETRY_INTERVAL: 1-6 hours between attempts
- CLEANUP_AGE: Delete 'completed' or 'failed' entries older than 60 days

## Implementation Guide

### Cron Job Implementation (Supabase Edge Function)

Create: `supabase/functions/retry-pending-matches/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_RETRIES = 3
const BATCH_SIZE = 10

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get pending matches
    const { data: pendingMatches, error } = await supabase
      .from('pending_match')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (error) throw error

    for (const match of pendingMatches || []) {
      // Update status to processing
      await supabase
        .from('pending_match')
        .update({ status: 'processing' })
        .eq('id', match.id)

      try {
        // Get post details
        const { data: post } = await supabase
          .from('posts')
          .select('*')
          .eq('post_id', match.post_id)
          .single()

        if (post) {
          // Retry match logic here (call the handleMatch function)
          // If successful, update to 'completed'
          // If failed, increment retry_count
        }
      } catch (retryError) {
        await supabase
          .from('pending_match')
          .update({
            status: 'pending',
            retry_count: match.retry_count + 1,
            last_retry_at: new Date().toISOString(),
            error_message: String(retryError)
          })
          .eq('id', match.id)
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: pendingMatches?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Schedule the Cron Job

Add to Supabase Dashboard > Database > Cron Jobs (using pg_cron extension):

```sql
-- Run every 6 hours
SELECT cron.schedule(
  'retry-pending-matches',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/retry-pending-matches',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

## Delete Reasons

The system provides 4 standard reasons for deleting missing item posts:
1. **Duplicate Post** - Same item posted multiple times
2. **Irrelevant Post** - Not a lost item or doesn't fit criteria
3. **Spam or Inappropriate Content** - Malicious or inappropriate content
4. **Insufficient Information** - Not enough details to process

## Monitoring

### Check Pending Queue
```sql
SELECT status, COUNT(*) 
FROM pending_match 
GROUP BY status;
```

### Check Retry Statistics
```sql
SELECT 
  AVG(retry_count) as avg_retries,
  MAX(retry_count) as max_retries,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM pending_match;
```

### Find Old Entries
```sql
SELECT * 
FROM pending_match 
WHERE created_at < NOW() - INTERVAL '30 days'
AND status IN ('completed', 'failed');
```

## Next Steps

1. ✅ Database table created
2. ✅ Handler functions implemented
3. ✅ UI integration complete
4. ⏳ Deploy SQL migration
5. ⏳ Create Edge Function for cron job
6. ⏳ Schedule cron job in Supabase
7. ⏳ Set up monitoring and alerts
