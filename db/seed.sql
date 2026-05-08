BEGIN;

WITH seed_users (user_id, user_name, email, user_type, created_at, last_login) AS (
  VALUES
    ('14b2cb75-dfbf-45cf-b3c9-f6380fe59270'::uuid, 'Primary Seed User', 'seed.primary@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '120 days', now() - interval '1 day'),
    ('a1d4ce6d-0b0e-4f8f-a0ef-4a32956543a1'::uuid, 'Avery Dela Cruz', 'avery.delacruz@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '110 days', now() - interval '2 days'),
    ('b2f9f1d8-c4cf-4c17-b6e5-1b48b4f229b2'::uuid, 'Bianca Ramos', 'bianca.ramos@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '108 days', now() - interval '3 days'),
    ('c3a63b9a-3b7d-4ae0-b74a-6f770f9677c3'::uuid, 'Carlo Villanueva', 'carlo.villanueva@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '104 days', now() - interval '5 days'),
    ('d4ed9a4f-93df-4a2d-87c6-25d0f0c8c6d4'::uuid, 'Dianne Mendoza', 'dianne.mendoza@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '98 days', now() - interval '4 days'),
    ('e57a1ea9-bdf6-4a97-9358-51f6115c5ce5'::uuid, 'Ethan Flores', 'ethan.flores@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '96 days', now() - interval '6 days'),
    ('f6b44cd5-2571-4f6b-a3c4-0f18ff6aa0f6'::uuid, 'Faith Navarro', 'faith.navarro@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '90 days', now() - interval '7 days'),
    ('07bc85f7-9f7c-42b3-9621-bc0da15fa607'::uuid, 'Gabriel Santos', 'gabriel.santos@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '88 days', now() - interval '2 days'),
    ('18d9f7a4-2df7-48d9-8d76-1d0ef364b818'::uuid, 'Hannah Lim', 'hannah.lim@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '84 days', now() - interval '8 days'),
    ('29a3f3e5-e390-4388-9195-90eb7fb99929'::uuid, 'Ian Castillo', 'ian.castillo@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '82 days', now() - interval '5 days'),
    ('3ab8c2a1-d43f-4dae-b0cc-a19b60a6aa3a'::uuid, 'Janelle Torres', 'janelle.torres@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '78 days', now() - interval '9 days'),
    ('4bc1db7a-f9cf-4ac9-8fa0-f5ad3d2ed94b'::uuid, 'Kyle Domingo', 'kyle.domingo@umak.edu.ph', 'User'::public.user_type_enum, now() - interval '74 days', now() - interval '11 days')
)
INSERT INTO public.user_table (
  user_id,
  user_name,
  email,
  profile_picture_url,
  user_type,
  created_at,
  last_login,
  notification_token
)
SELECT
  user_id,
  user_name,
  email,
  NULL,
  user_type,
  created_at,
  last_login,
  NULL
FROM seed_users
ON CONFLICT (user_id) DO UPDATE
SET
  user_name = EXCLUDED.user_name,
  email = EXCLUDED.email,
  profile_picture_url = EXCLUDED.profile_picture_url,
  user_type = EXCLUDED.user_type,
  created_at = EXCLUDED.created_at,
  last_login = EXCLUDED.last_login,
  notification_token = EXCLUDED.notification_token;

DO $$
DECLARE
  seed_user_ids uuid[] := ARRAY[
    '14b2cb75-dfbf-45cf-b3c9-f6380fe59270'::uuid,
    'a1d4ce6d-0b0e-4f8f-a0ef-4a32956543a1'::uuid,
    'b2f9f1d8-c4cf-4c17-b6e5-1b48b4f229b2'::uuid,
    'c3a63b9a-3b7d-4ae0-b74a-6f770f9677c3'::uuid,
    'd4ed9a4f-93df-4a2d-87c6-25d0f0c8c6d4'::uuid,
    'e57a1ea9-bdf6-4a97-9358-51f6115c5ce5'::uuid,
    'f6b44cd5-2571-4f6b-a3c4-0f18ff6aa0f6'::uuid,
    '07bc85f7-9f7c-42b3-9621-bc0da15fa607'::uuid,
    '18d9f7a4-2df7-48d9-8d76-1d0ef364b818'::uuid,
    '29a3f3e5-e390-4388-9195-90eb7fb99929'::uuid,
    '3ab8c2a1-d43f-4dae-b0cc-a19b60a6aa3a'::uuid,
    '4bc1db7a-f9cf-4ac9-8fa0-f5ad3d2ed94b'::uuid
  ];
  adjectives text[] := ARRAY[
    'Black',
    'Blue',
    'Red',
    'Silver',
    'Green',
    'White',
    'Gray',
    'Yellow',
    'Navy',
    'Brown',
    'Teal',
    'Maroon'
  ];
  name_modifiers text[] := ARRAY[
    'Canvas',
    'Mesh',
    'Classic',
    'Compact',
    'Portable',
    'Slim',
    'Heavy-Duty',
    'Clear',
    'Soft-Touch',
    'Foldable',
    'Sport',
    'Campus',
    'Minimal',
    'Travel',
    'Everyday',
    'Signature',
    'Utility'
  ];
  detail_notes text[] := ARRAY[
    'A small class schedule is tucked inside.',
    'There is a faint name sticker on one side.',
    'The zipper pull shows light wear.',
    'One corner has a minor scuff from daily use.',
    'It was last seen near a classroom doorway.',
    'A receipt from the canteen is still inside.',
    'There is a noticeable scratch near the edge.',
    'The owner attached a simple key charm.',
    'It looks recently cleaned but still slightly damp.',
    'The strap adjustment is set shorter than usual.',
    'A folded worksheet is tucked into an inner pocket.',
    'The case has a small marker label on the back.',
    'There is a loose paper clip attached to it.'
  ];
  templates jsonb := $templates$
  [
    {"name": "Umbrella", "category": "Umbrellas", "description": "umbrella with a curved handle and a few dried rain spots.", "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Backpack", "category": "Bags", "description": "backpack with a half-open front pocket and a hanging keychain.", "image_url": "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Water Bottle", "category": "Water Bottles", "description": "insulated water bottle with a flip-top lid and faint sticker marks.", "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Student ID", "category": "Documents", "description": "student ID inside a clear holder with a worn campus lace.", "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Laptop Charger", "category": "Electronics", "description": "laptop charger neatly coiled with one velcro strap around the cable.", "image_url": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Wireless Earbuds", "category": "Electronics", "description": "wireless earbuds in a small charging case with light surface scratches.", "image_url": "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Notebook", "category": "Books & Notebooks", "description": "notebook filled with class notes and a folded receipt tucked inside.", "image_url": "https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Wallet", "category": "Wallets & Cards", "description": "wallet with a few cards inside and slightly worn edges.", "image_url": "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Key Ring", "category": "Keys", "description": "key ring holding two keys and a small plastic tag.", "image_url": "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Prescription Glasses", "category": "Eyewear", "description": "pair of prescription glasses inside a soft pouch with a microfiber cloth.", "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Pencil Case", "category": "School Supplies", "description": "zippered pencil case containing a few pens and a small eraser.", "image_url": "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Hoodie", "category": "Clothing", "description": "hoodie with the drawstrings tucked in and a folded sleeve cuff.", "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80"},
    {"name": "USB Flash Drive", "category": "Electronics", "description": "USB flash drive on a short metal loop with a labeled cap.", "image_url": "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Tote Bag", "category": "Bags", "description": "canvas tote bag with printed text and a receipt in the side seam.", "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Power Bank", "category": "Electronics", "description": "power bank with one charging cable attached and one missing cap.", "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Badminton Racket", "category": "Sports Equipment", "description": "badminton racket in a soft cover with one spare shuttlecock.", "image_url": "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Lunch Box", "category": "Other", "description": "lunch box with a snap lock lid and a reusable spoon inside.", "image_url": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Calculator", "category": "School Supplies", "description": "scientific calculator with a small name sticker on the back.", "image_url": "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Lanyard Card Holder", "category": "Accessories", "description": "lanyard card holder with one transit card and a loose clasp.", "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"},
    {"name": "Inhaler Pouch", "category": "Medical Items", "description": "small zip pouch containing an inhaler and folded tissue packet.", "image_url": "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80"}
  ]
  $templates$::jsonb;
  locations jsonb := $locations$
  [
    [{"name": "HPSB", "type": "building"}, {"name": "5 Floor", "type": "floor"}, {"name": "Room 503", "type": "room"}],
    [{"name": "HPSB", "type": "building"}, {"name": "6 Floor", "type": "floor"}, {"name": "Room 611", "type": "room"}],
    [{"name": "HPSB", "type": "building"}, {"name": "7 Floor", "type": "floor"}, {"name": "Room 707", "type": "room"}],
    [{"name": "HPSB", "type": "building"}, {"name": "8 Floor", "type": "floor"}, {"name": "Room 804", "type": "room"}],
    [{"name": "HPSB", "type": "building"}, {"name": "9 Floor", "type": "floor"}, {"name": "Room 910", "type": "room"}],
    [{"name": "HPSB", "type": "building"}, {"name": "10 Floor", "type": "floor"}, {"name": "Room 1004", "type": "room"}],
    [{"name": "HPSB", "type": "building"}, {"name": "11 Floor", "type": "floor"}, {"name": "Cafeteria Area", "type": "area"}],
    [{"name": "HPSB", "type": "building"}, {"name": "11 Floor", "type": "floor"}, {"name": "Clinic Room", "type": "room"}],
    [{"name": "HPSB", "type": "building"}, {"name": "12 Floor", "type": "floor"}, {"name": "Basketball Court", "type": "area"}],
    [{"name": "Academic Building 1", "type": "building"}, {"name": "2 Floor", "type": "floor"}, {"name": "Not Applicable", "type": "area"}],
    [{"name": "Academic Building 2", "type": "building"}, {"name": "3 Floor", "type": "floor"}, {"name": "Not Applicable", "type": "area"}],
    [{"name": "Academic Building 3", "type": "building"}, {"name": "1 Floor", "type": "floor"}, {"name": "Not Applicable", "type": "area"}],
    [{"name": "Admin Building", "type": "building"}, {"name": "1 Floor", "type": "floor"}, {"name": "Not Applicable", "type": "area"}],
    [{"name": "Oval Guard side Bleachers", "type": "building"}, {"name": "Stadium Area", "type": "area"}, {"name": "Blue Bleachers", "type": "area"}],
    [{"name": "Oval Fort side Bleachers", "type": "building"}, {"name": "Stadium Area", "type": "area"}, {"name": "Green Bleachers", "type": "area"}],
    [{"name": "Oval JP Rizal side Bleachers", "type": "building"}, {"name": "Stadium Area", "type": "area"}, {"name": "Red Bleachers", "type": "area"}]
  ]
  $locations$::jsonb;
  post_count integer := 220;
  i integer;
  user_idx integer;
  template_count integer := jsonb_array_length(templates);
  location_count integer := jsonb_array_length(locations);
  template jsonb;
  location_path jsonb;
  adjective text;
  name_modifier text;
  detail_note text;
  item_name text;
  item_description text;
  category text;
  image_url text;
  image_hash text;
  item_type public.item_type_enum;
  item_status public.item_status_enum;
  post_status public.post_status_enum;
  last_seen_date date;
  last_seen_hours integer;
  last_seen_minutes integer;
  submitted_at timestamptz;
  accepted_at timestamptz;
  created_post_id integer;
  created_item_id uuid;
  seed_post record;
BEGIN
  FOR seed_post IN
    SELECT DISTINCT pt.post_id, it.item_id
    FROM public.post_table pt
    JOIN public.item_table it ON it.item_id = pt.item_id
    JOIN public.item_image_table iim ON iim.item_image_id = it.image_id
    WHERE iim.image_hash LIKE 'seed-umak-link-%'
    ORDER BY pt.post_id
  LOOP
    DELETE FROM public.pending_match WHERE post_id = seed_post.post_id;
    DELETE FROM public.claim_table
    WHERE item_id = seed_post.item_id
       OR linked_lost_item_id = seed_post.item_id;
    PERFORM 1 FROM public.delete_post_by_id(seed_post.post_id);
  END LOOP;

  DELETE FROM public.item_image_table iim
  WHERE iim.image_hash LIKE 'seed-umak-link-%'
    AND NOT EXISTS (
      SELECT 1
      FROM public.item_table it
      WHERE it.image_id = iim.item_image_id
    );

  FOR i IN 1..post_count LOOP
    template := templates -> ((i - 1) % template_count);
    location_path := locations -> ((i - 1) % location_count);
    adjective := adjectives[1 + ((i - 1) % array_length(adjectives, 1))];
    name_modifier := name_modifiers[1 + ((i - 1) % array_length(name_modifiers, 1))];
    detail_note := detail_notes[1 + ((i - 1) % array_length(detail_notes, 1))];
    image_hash := 'seed-umak-link-' || lpad(i::text, 3, '0');

    IF i % 4 = 0 OR i % 9 = 0 THEN
      user_idx := 1;
    ELSE
      user_idx := 2 + ((i - 1) % (array_length(seed_user_ids, 1) - 1));
    END IF;

    item_type := CASE
      WHEN i % 2 = 0 THEN 'found'::public.item_type_enum
      ELSE 'lost'::public.item_type_enum
    END;

    post_status := CASE
      WHEN i % 17 = 0 THEN 'reported'::public.post_status_enum
      WHEN i % 10 = 0 THEN 'rejected'::public.post_status_enum
      WHEN i % 5 = 0 THEN 'pending'::public.post_status_enum
      ELSE 'accepted'::public.post_status_enum
    END;

    item_status := CASE
      WHEN item_type = 'lost'::public.item_type_enum THEN 'lost'::public.item_status_enum
      WHEN post_status IN ('pending'::public.post_status_enum, 'rejected'::public.post_status_enum, 'reported'::public.post_status_enum) THEN 'unclaimed'::public.item_status_enum
      WHEN i % 11 = 0 THEN 'returned'::public.item_status_enum
      WHEN i % 7 = 0 THEN 'claimed'::public.item_status_enum
      WHEN i % 13 = 0 THEN 'discarded'::public.item_status_enum
      ELSE 'unclaimed'::public.item_status_enum
    END;

    category := template ->> 'category';
    image_url := template ->> 'image_url';
    item_name := adjective || ' ' || name_modifier || ' ' || (template ->> 'name');
    item_description := adjective || ' ' || lower(name_modifier) || ' ' || (template ->> 'description') || ' ' || detail_note;
    last_seen_date := current_date - ((i % 75) + 1);
    last_seen_hours := 7 + (i % 11);
    last_seen_minutes := (i * 7) % 60;
    submitted_at := now() - make_interval(days => (i % 70), hours => (i % 14), mins => ((i * 3) % 60));
    accepted_at := CASE
      WHEN post_status = 'accepted'::public.post_status_enum THEN submitted_at + interval '4 hours'
      WHEN post_status = 'reported'::public.post_status_enum THEN submitted_at + interval '1 day'
      ELSE NULL
    END;

    SELECT out_post_id, out_item_id
    INTO created_post_id, created_item_id
    FROM public.create_post_with_item_date_time_location(
      p_poster_id => seed_user_ids[user_idx],
      p_item_name => item_name,
      p_item_description => item_description,
      p_item_type => item_type,
      p_image_link => image_url,
      p_last_seen_date => last_seen_date,
      p_last_seen_hours => last_seen_hours,
      p_last_seen_minutes => last_seen_minutes,
      p_location_path => location_path,
      p_image_hash => image_hash,
      p_item_status => item_status,
      p_category => category,
      p_post_status => post_status,
      p_is_anonymous => (i % 8 = 0)
    );

    UPDATE public.post_table
    SET
      submitted_on_date = submitted_at,
      accepted_on_date = accepted_at,
      rejection_reason = CASE
        WHEN post_status = 'rejected'::public.post_status_enum THEN 'Seed data rejection note: duplicate report for the same item.'
        ELSE NULL
      END
    WHERE post_id = created_post_id;

    UPDATE public.item_table
    SET created_at = submitted_at
    WHERE item_id = created_item_id;

    UPDATE public.item_image_table
    SET created_at = submitted_at
    WHERE item_image_id = (
      SELECT image_id
      FROM public.item_table
      WHERE item_id = created_item_id
    );
  END LOOP;
END $$;

COMMIT;
