-- Backward-compatible item search vector rebuild.
-- Index both legacy Gemini metadata and the newer structured metadata fields.

ALTER TABLE public.item_table
  ALTER COLUMN search_vector
  SET EXPRESSION AS (
    (
      setweight(to_tsvector('english'::regconfig, COALESCE(item_name, ''::text)), 'A'::"char")
      || setweight(to_tsvector('english'::regconfig, COALESCE(item_description, ''::text)), 'A'::"char")
      || setweight(to_tsvector('english'::regconfig, COALESCE((item_metadata ->> 'caption'::text), ''::text)), 'A'::"char")
      || setweight(to_tsvector('english'::regconfig, COALESCE((item_metadata -> 'main_objects'::text)::text, '[]'::text)), 'A'::"char")
      || setweight(to_tsvector('english'::regconfig, COALESCE(category, ''::text)), 'B'::"char")
      || setweight(to_tsvector('english'::regconfig, COALESCE((item_metadata ->> 'brand'::text), ''::text)), 'B'::"char")
      || setweight(to_tsvector('english'::regconfig, COALESCE((item_metadata -> 'potential_brands'::text)::text, '[]'::text)), 'B'::"char")
      || setweight(to_tsvector('english'::regconfig, COALESCE((item_metadata -> 'keywords'::text)::text, '[]'::text)), 'C'::"char")
      || setweight(to_tsvector('english'::regconfig, COALESCE((item_metadata -> 'synonyms'::text)::text, '[]'::text)), 'C'::"char")
      || setweight(to_tsvector('english'::regconfig, COALESCE((item_metadata -> 'descriptive_words'::text)::text, '[]'::text)), 'C'::"char")
      || setweight(to_tsvector('english'::regconfig, COALESCE((item_metadata ->> 'color'::text), ''::text)), 'C'::"char")
    )
  );

ANALYZE public.item_table;
