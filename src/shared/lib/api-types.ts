/**
 * TypeScript types for API requests and responses
 * These match the backend API contract
 */

// ============================================================================
// Common Types
// ============================================================================

export type UserType = 'User' | 'Staff' | 'Admin';
export type ItemType = 'found' | 'lost' | 'missing';
export type ItemStatus = 'claimed' | 'unclaimed' | 'discarded' | 'returned' | 'lost';
export type PostStatus = 'pending' | 'accepted' | 'rejected' | 'archived' | 'deleted' | 'reported' | 'fraud';
export type FraudReportStatus = 'under_review' | 'verified' | 'rejected' | 'resolved' | 'open';

// ============================================================================
// Auth Types
// ============================================================================

export interface UserProfile {
  user_id: string;
  user_name: string | null;
  email: string | null;
  profile_picture_url: string | null;
  user_type: UserType;
  notification_token: string | null;
}

export interface AuthLoginRequest {
  googleIdToken: string;
}

export interface AuthLoginResponse {
  token: string;
  user: UserProfile;
}

export interface AuthMeResponse {
  user: UserProfile;
}

export interface UserSearchResponse {
  results: UserProfile[];
}

// ============================================================================
// Post Types
// ============================================================================

export interface LocationPath {
  name: string;
  type: string;
}

export interface CreatePostRequest {
  p_item_name: string;
  p_item_description?: string;
  p_item_type: ItemType;
  p_poster_id: string;
  p_image_hash: string;
  p_category?: string;
  p_date_day?: number;
  p_date_month?: number;
  p_date_year?: number;
  p_time_hour?: number;
  p_time_minute?: number;
  p_location_path: LocationPath[];
  p_is_anonymous?: boolean;
}

export interface EditPostRequest extends Partial<CreatePostRequest> {
  post_id: number;
}

export interface PostRecord {
  post_id: number;
  item_id: string;
  poster_name: string;
  poster_id: string;
  item_name: string;
  item_description: string | null;
  item_type: ItemType;
  item_image_url: string;
  category: string | null;
  last_seen_at: string | null;
  last_seen_location: string | null;
  submission_date: string;
  post_status: PostStatus;
  item_status: ItemStatus;
  accepted_by_staff_name: string | null;
  accepted_by_staff_email: string | null;
  claim_id: string | null;
  claimed_by_name: string | null;
  claimed_by_email: string | null;
  claim_processed_by_staff_id: string | null;
  accepted_on_date: string | null;
  is_anonymous: boolean;
}

export interface PostRecordDetails extends PostRecord {
  linked_lost_item_id: string | null;
  returned_at_local: string | null;
}

export interface PostListResponse {
  posts: PostRecord[];
  count?: number;
}

export interface UpdatePostStatusRequest {
  status: PostStatus;
  rejection_reason?: string;
}

export interface UpdateItemStatusRequest {
  status: ItemStatus;
}

// ============================================================================
// Claim Types
// ============================================================================

export interface ClaimDetails {
  claimer_name: string;
  claimer_school_email: string;
  claimer_contact_num: string;
  poster_name: string;
  staff_id: string;
  staff_name: string;
}

export interface ProcessClaimRequest {
  found_post_id: number;
  missing_post_id?: number | null;
  claim_details: ClaimDetails;
}

export interface ExistingClaimResponse {
  exists: boolean;
  claim?: {
    claim_id: string;
    claimer_name: string;
    claimer_email: string;
    claimed_at: string;
  };
}

// ============================================================================
// Fraud Report Types
// ============================================================================

export interface FraudReportCreateRequest {
  post_id: number;
  reason: string;
  proof_image_url?: string | null;
  reported_by?: string | null;
  claim_id?: string | null;
  claimer_name?: string | null;
  claimer_school_email?: string | null;
  claimer_contact_num?: string | null;
  claimed_at?: string | null;
  claim_processed_by_staff_id?: string | null;
}

export interface FraudReportPublic {
  report_id: string;
  post_id: number;
  reason: string;
  status: FraudReportStatus;
  created_at: string;
  reporter: UserProfile | null;
  poster: UserProfile;
  claim_info: Record<string, unknown> | null;
  item_info: Record<string, unknown>;
}

export interface FraudReportListResponse {
  reports: FraudReportPublic[];
  count?: number;
}

export interface FraudReportStatusRequest {
  status: FraudReportStatus;
}

export interface FraudReportResolveRequest {
  delete_claim?: boolean;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchItemsRequest {
  query: string;
  limit?: number;
  last_seen_date?: string | null;
  category?: string[] | null;
  location_last_seen?: string | null;
  claim_from?: string | null;
  claim_to?: string | null;
  item_status?: ItemStatus[] | null;
  sort?: 'submission_date';
  sort_direction?: 'asc' | 'desc';
}

export interface SearchItemsStaffRequest extends Omit<SearchItemsRequest, 'sort'> {
  sort?: 'accepted_on_date' | 'submission_date';
}

// ============================================================================
// Notification Types
// ============================================================================

export interface SendNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  description?: string | null;
  type: string;
  data?: Record<string, unknown>;
  image_url?: string | null;
}

export interface NotificationRecord {
  notification_id: number;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  image_url?: string | null;
}

export interface SendGlobalAnnouncementRequest {
  user_id: string;
  message: string;
  description?: string | null;
  image_url?: string | null;
}

export interface AnnouncementRecord {
  global_notification_id: number;
  message: string;
  description: string | null;
  created_at: string;
  image_url?: string | null;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface DashboardStats {
  pending_verifications: number;
  pending_fraud_reports: number;
  claimed_count: number;
  unclaimed_count: number;
  to_review_count: number;
  lost_count: number;
  returned_count: number;
  reported_count: number;
}
