-- Align items_pending_metadata with the backend metadata batch job.
-- The backend selects both category and item_type from this view.

CREATE OR REPLACE VIEW public.items_pending_metadata
WITH (security_invoker = 'on') AS
SELECT
  i.item_id,
  i.item_name,
  i.item_description,
  i.created_at,
  iim.image_link AS image_url,
  p.post_id,
  p.status AS post_status,
  p.accepted_on_date,
  (
    EXTRACT(EPOCH FROM (now() - COALESCE(p.accepted_on_date, i.created_at))) / 3600::numeric
  ) AS hours_waiting,
  NULLIF(i.category, ''::text) AS category,
  i.type AS item_type
FROM public.item_table AS i
JOIN public.post_table AS p
  ON i.item_id = p.item_id
JOIN public.item_image_table AS iim
  ON i.image_id = iim.item_image_id
WHERE
  i.item_metadata IS NULL
  AND p.status = 'accepted'::public.post_status_enum
  AND iim.image_link IS NOT NULL
ORDER BY COALESCE(p.accepted_on_date, i.created_at);
