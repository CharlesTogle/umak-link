export interface PublicPost {
  post_id: string
  username: string
  user_id: string
  item_name: string
  profilepicture_url: string | null
  item_image_url: string | null
  item_status: string | null
  category: string | null
  last_seen_at: string | null
  accepted_on_date: string | null
  last_seen_location: string | null
  is_anonymous: boolean
  item_description: string | null
  submission_date: string | null
  post_status: string | null
  item_type: string | null
}
