-- Create pending_match table for tracking failed AI match attempts
-- This table stores posts that failed to generate AI search queries
-- A cron job will retry these periodically

CREATE TABLE IF NOT EXISTS pending_match (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  poster_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  
  -- Ensure we don't have duplicate entries for the same post
  UNIQUE(post_id)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_pending_match_status ON pending_match(status);
CREATE INDEX IF NOT EXISTS idx_pending_match_created_at ON pending_match(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_match_poster_id ON pending_match(poster_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_pending_match_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pending_match_updated_at
  BEFORE UPDATE ON pending_match
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_match_updated_at();

-- Add comment
COMMENT ON TABLE pending_match IS 'Tracks failed AI match attempts for retry processing via cron job';
