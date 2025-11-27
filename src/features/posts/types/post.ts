export interface PublicPost {
  post_id: string
  item_id: string
  username: string
  user_id: string
  item_name: string
  profilepicture_url: string | null
  item_image_url: string | null
  item_description: string | null
  item_status: string | null
  category: string | null
  last_seen_at: string | null
  last_seen_location: string | null
  accepted_by_staff_name: string | null
  accepted_by_staff_email: string | null
  submission_date: string | null
  post_status: string | null
  is_anonymous: boolean
  claimed_by_name: string | null
  claimed_by_email: string | null
  claimed_by_contact: string | null
  claimed_at: string | null
  claim_processed_by_staff_id: string | null
  claim_id: string | null
  accepted_on_date: string | null
  item_type: string | null
}
