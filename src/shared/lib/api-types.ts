/**
 * TypeScript types for API requests and responses
 * These match the backend API contract
 */

// ============================================================================
// Common Types
// ============================================================================

export type UserType = 'User' | 'Staff' | 'Admin' | 'Guard';
export type ItemType = 'found' | 'lost' | 'missing';
export type ItemStatus = 'claimed' | 'unclaimed' | 'discarded' | 'returned' | 'lost';
export type PostStatus = 'pending' | 'accepted' | 'rejected' | 'archived' | 'deleted' | 'reported' | 'fraud';
export type FraudReportStatus = 'under_review' | 'verified' | 'rejected' | 'resolved' | 'open';
export type CustodyStatus =
  | 'untracked'
  | 'with_reporter'
  | 'handover_in_progress'
  | 'with_guard'
  | 'in_security_office'
  | 'claimed_by_student'
  | 'under_investigation'
  | 'discarded';
export type CustodyAttemptStatus =
  | 'open'
  | 'accepted'
  | 'rejected'
  | 'timed_out'
  | 'cancelled';
export type QrCodeSessionStatus =
  | 'active'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';
export type CustodyDecision = 'accepted' | 'rejected';
export type StudentCustodyHistoryEventType =
  | 'item_reported'
  | 'handover_attempted'
  | 'guard_rejected'
  | 'guard_accepted'
  | 'session_timed_out'
  | 'security_office_received'
  | 'attempt_cancelled'
  | 'under_investigation'
  | 'physical_take_reported'
  | 'claimed_by_student'
  | 'discarded';

export type ClaimVerificationSessionStatus =
  | 'awaiting_claimer'
  | 'qr_active'
  | 'scanned'
  | 'completed'
  | 'expired'
  | 'cancelled';
export type ClaimQrSessionStatus =
  | 'active'
  | 'scanned'
  | 'expired'
  | 'cancelled';
export type ClaimVerificationMethod =
  | 'manual_staff'
  | 'staff_qr'
  | 'guard_qr';

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
// Student Custody Types
// ============================================================================

export interface GuardPostRecord {
  guard_post_id: string;
  guard_post_name: string;
  location_id: number;
  full_location_name: string | null;
  is_active: boolean;
}

export interface GuardPostListResponse {
  guard_posts: GuardPostRecord[];
}

export interface CreateCustodyAttemptRequest {
  post_id: number;
  guard_post_id: string;
  handover_image_url: string;
  handover_image_hash: string;
  session_token: string;
}

export interface CreateCustodyAttemptResponse {
  custody_attempt_id: string;
  qr_code_session_id: string;
  manual_entry_code: string;
  attempt_status: CustodyAttemptStatus;
  qr_status: QrCodeSessionStatus;
  custody_status: CustodyStatus;
  expires_at: string;
  number_of_attempts: number;
  max_number_of_attempts: number;
  retries_remaining: number;
}

export interface CustodySessionStatusResponse {
  qr_code_session_id: string;
  custody_attempt_id: string;
  post_id: number;
  item_id: string;
  manual_entry_code: string;
  qr_status: QrCodeSessionStatus;
  attempt_status: CustodyAttemptStatus;
  custody_status: CustodyStatus;
  expires_at: string;
  scanned_at: string | null;
  decision_at: string | null;
  current_window_expired: boolean;
  can_retry: boolean;
  number_of_attempts: number;
  max_number_of_attempts: number;
  retries_remaining: number;
}

export interface RetryCustodySessionRequest {
  session_token: string;
}

export interface RetryCustodySessionResponse {
  custody_attempt_id: string;
  qr_code_session_id: string;
  manual_entry_code: string;
  attempt_status: CustodyAttemptStatus;
  qr_status: QrCodeSessionStatus;
  custody_status: CustodyStatus;
  expires_at: string;
  number_of_attempts: number;
  max_number_of_attempts: number;
  retries_remaining: number;
}

export interface CancelCustodySessionResponse {
  qr_code_session_id: string;
  custody_attempt_id: string;
  attempt_status: CustodyAttemptStatus;
  qr_status: QrCodeSessionStatus;
  custody_status: CustodyStatus;
  cancelled_at: string;
}

export interface StudentCustodyHistoryEntry {
  history_id: string;
  event_type: StudentCustodyHistoryEventType;
  source_record_type: string | null;
  message: string;
  occurred_at: string;
  custody_attempt_id: string | null;
  qr_code_session_id: string | null;
  attempt_number: number | null;
  guard_post_id: string | null;
  guard_post_name: string | null;
  full_location_name: string | null;
  handover_image_url: string | null;
  actor_user_id: string | null;
  actor_name: string | null;
  discard_reason?: string | null;
}

export interface StudentCustodyHistoryResponse {
  post_id: number;
  item_id: string;
  post_status: string | null;
  custody_status: CustodyStatus;
  history: StudentCustodyHistoryEntry[];
}

// ============================================================================
// Guard Custody Types
// ============================================================================

export interface GuardManualEntryCodeScanRequest {
  manual_entry_code: string;
}

export interface GuardQrPayloadScanRequest {
  qr_code_session_id: string;
  session_token: string;
}

export type GuardScanRequest =
  | GuardManualEntryCodeScanRequest
  | GuardQrPayloadScanRequest;

export interface GuardScanResponse {
  qr_code_session_id: string;
  custody_attempt_id: string;
  post_id: number;
  item_id: string;
  item_name: string;
  item_description: string | null;
  item_image_url: string | null;
  handover_image_url: string | null;
  category: string | null;
  last_seen_at: string | null;
  last_seen_location: string | null;
  submission_date: string;
  guard_post_id: string;
  guard_post_name: string | null;
  attempt_number: number;
  custody_status: CustodyStatus;
  qr_status: QrCodeSessionStatus;
  attempt_status: CustodyAttemptStatus;
}

export interface GuardDecisionRequest {
  qr_code_session_id: string;
  decision: CustodyDecision;
  decision_reason?: string;
}

export interface GuardDecisionResponse {
  custody_attempt_id: string;
  qr_code_session_id: string;
  attempt_status: CustodyAttemptStatus;
  qr_status: QrCodeSessionStatus;
  custody_status: CustodyStatus;
  decision_at: string;
}

export type CustodyHistoryEventType = StudentCustodyHistoryEventType;
export type CustodyHistoryEvent = StudentCustodyHistoryEntry;
export type CustodyHistoryResponse = StudentCustodyHistoryResponse;

// ============================================================================
// Staff Custody Types
// ============================================================================

export interface StaffCustodyPostRequest {
  post_id: number;
}

export interface SecurityOfficeReceiptResponse {
  post_id: number;
  custody_attempt_id: string;
  custody_status: CustodyStatus;
  office_received_at: string;
}

export interface OpenCustodyInvestigationResponse {
  post_id: number;
  custody_attempt_id: string;
  custody_status: CustodyStatus;
  investigation_opened_at: string;
}

export interface NotifyGuardResponse {
  post_id: number;
  custody_attempt_id: string;
  guard_id: string;
  notification_id: string | number;
  notification_status: 'created';
  requested_at: string;
}

export interface UpdateClaimedCustodyStatusResponse {
  post_id: number;
  item_id: string;
  custody_status: 'in_security_office' | 'under_investigation' | 'claimed_by_student';
  updated_at: string;
}

// ============================================================================
// Claim Verification Types
// ============================================================================

export interface ClaimVerificationRetryMetadata {
  number_of_attempts: number;
  max_number_of_attempts: number;
  retries_remaining: number;
}

export interface ClaimVerifiedClaimerSummary {
  user_id: string;
  user_name: string;
  email: string;
  profile_picture_url: string | null;
}

export interface ClaimVerificationPostSummary {
  post_id: number;
  item_id: string;
  item_name: string | null;
  item_image_url: string | null;
  item_description: string | null;
}

export interface ClaimQrScanPayload {
  claimQrSessionId: string;
  sessionToken: string;
}

export interface CreateClaimVerificationSessionRequest {
  found_post_id: number;
}

export type CreateClaimVerificationSessionResponse =
  ClaimVerificationSessionStatusResponse;

export interface JoinClaimVerificationSessionRequest {
  join_code: string;
  session_token: string;
}

export interface JoinClaimVerificationSessionResponse
  extends ClaimVerificationRetryMetadata {
  claim_verification_session_id: string;
  claim_qr_session_id: string;
  join_code: string;
  status: ClaimVerificationSessionStatus;
  qr_status: ClaimQrSessionStatus;
  expires_at: string;
  found_post: ClaimVerificationPostSummary;
}

export interface ClaimVerificationSessionStatusResponse
  extends ClaimVerificationRetryMetadata {
  claim_verification_session_id: string;
  found_post_id: number;
  item_id: string;
  join_code: string;
  status: ClaimVerificationSessionStatus;
  qr_status: ClaimQrSessionStatus | null;
  expires_at: string;
  scanned_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  current_window_expired: boolean;
  can_retry: boolean;
  verified_claimer: ClaimVerifiedClaimerSummary | null;
}

export interface RetryClaimVerificationSessionRequest {
  session_token: string;
}

export interface RetryClaimVerificationSessionResponse
  extends ClaimVerificationRetryMetadata {
  claim_verification_session_id: string;
  claim_qr_session_id: string;
  join_code: string;
  status: ClaimVerificationSessionStatus;
  qr_status: ClaimQrSessionStatus;
  expires_at: string;
}

export interface ScanClaimVerificationRequest {
  claim_qr_session_id: string;
  session_token: string;
}

export interface ScanClaimVerificationResponse {
  claim_verification_session_id: string;
  claim_qr_session_id: string;
  status: ClaimVerificationSessionStatus;
  qr_status: ClaimQrSessionStatus;
  scanned_at: string;
  verified_claimer: ClaimVerifiedClaimerSummary;
}

export interface CancelClaimVerificationSessionResponse
  extends ClaimVerificationRetryMetadata {
  claim_verification_session_id: string;
  claim_qr_session_id: string | null;
  status: ClaimVerificationSessionStatus;
  qr_status: ClaimQrSessionStatus | null;
  cancelled_at: string;
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
  p_image_link?: string;
  p_category?: string;
  p_last_seen_date?: string;
  p_last_seen_hours?: number;
  p_last_seen_minutes?: number;
  p_item_status?: ItemStatus;
  p_post_status?: PostStatus;
  // Legacy fields kept temporarily for older edit paths.
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
  custody_status?: CustodyStatus;
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
  discard_reason?: string;
}

// ============================================================================
// Claim Types
// ============================================================================

export interface ClaimDetails {
  claimer_name: string;
  claimer_school_email: string;
  claimer_contact_num: string;
  claimed_at?: string | null;
  poster_name: string;
  staff_id: string;
  staff_name: string;
}

export interface ProcessClaimRequest {
  found_post_id: number;
  missing_post_id?: number | null;
  claim_details: ClaimDetails;
  claim_verification?: {
    claim_verification_session_id: string;
    verification_method: Exclude<ClaimVerificationMethod, 'manual_staff'>;
  };
}

export interface ExistingClaimResponse {
  exists: boolean;
  claim?: {
    claim_id: string;
    item_id: string;
    claimer_name: string;
    claimer_email: string;
    claimer_school_email: string;
    claimer_contact_num: string;
    processed_by_staff_id: string;
    claimed_at: string | null;
    staff_name?: string;
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

export interface FraudReportClaimInfo {
  claimer_name: string | null;
  claimer_email?: string | null;
  claimer_school_email: string | null;
  claimer_contact_num: string | null;
  claimed_at: string | null;
  claim_id: string | null;
  linked_lost_item_id: string | null;
}

export interface FraudReportItemInfo {
  item_id: string | null;
  item_name: string | null;
  item_description: string | null;
  image_id: string | null;
  item_image_url: string | null;
  item_status: ItemStatus | null;
  item_type: ItemType | null;
  category: string | null;
  last_seen_at: string | null;
  last_seen_location: string | null;
}

export interface FraudReportPublicNested {
  report_id: string;
  post_id: number;
  reason: string;
  status: FraudReportStatus;
  created_at: string;
  proof_image_url: string | null;
  reporter: UserProfile | null;
  poster: UserProfile;
  claim_info: FraudReportClaimInfo | null;
  item_info: FraudReportItemInfo;
  poster_id?: string;
  post_status?: PostStatus | null;
  item_id?: string | null;
  is_anonymous?: boolean;
  submitted_on_date_local?: string | null;
  accepted_on_date_local?: string | null;
  claim_processed_by_name?: string | null;
  claim_processed_by_email?: string | null;
  claim_processed_by_profile_picture_url?: string | null;
  fraud_reviewer_id?: string | null;
  fraud_reviewer_name?: string | null;
  fraud_reviewer_email?: string | null;
  fraud_reviewer_profile_picture_url?: string | null;
}

export interface FraudReportPublicFlat {
  report_id: string;
  post_id: string;
  report_status: string | null;
  reason_for_reporting: string | null;
  date_reported: string | null;
  proof_image_url: string | null;
  poster_id: string;
  post_status: string | null;
  item_id: string | null;
  is_anonymous: boolean;
  submitted_on_date_local: string | null;
  accepted_on_date_local: string | null;
  last_seen_date: string | null;
  last_seen_time: string | null;
  last_seen_at: string | null;
  last_seen_location: string | null;
  item_name: string | null;
  item_description: string | null;
  image_id: string | null;
  item_image_url: string | null;
  item_status: string | null;
  item_type: string | null;
  category: string | null;
  claimer_name: string | null;
  claimer_school_email: string | null;
  claimer_contact_num: string | null;
  claimed_at: string | null;
  claim_id: string | null;
  linked_lost_item_id: string | null;
  claim_processed_by_name: string | null;
  claim_processed_by_email: string | null;
  claim_processed_by_profile_picture_url: string | null;
  reporter_id: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_profile_picture_url: string | null;
  poster_name: string | null;
  poster_email: string | null;
  poster_profile_picture_url: string | null;
  fraud_reviewer_id: string | null;
  fraud_reviewer_name: string | null;
  fraud_reviewer_email: string | null;
  fraud_reviewer_profile_picture_url: string | null;
}

export type FraudReportPublic = FraudReportPublicNested | FraudReportPublicFlat;

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
  data?: NotificationPayloadData;
  image_url?: string | null;
}

export type NotificationPayloadValue =
  | string
  | number
  | boolean
  | null
  | string[];

export type NotificationPayloadData = Record<string, NotificationPayloadValue>;

export interface NotificationRecord {
  notification_id: string | number;
  user_id: string;
  title: string;
  body: string;
  description?: string | null;
  sent_to?: string | null;
  sent_by?: string | null;
  type: string;
  data?: NotificationPayloadData | null;
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

export interface GlobalAnnouncementSendStats {
  total_users: number;
  users_with_tokens: number;
  users_without_tokens: number;
  push_successful: number;
  push_failed: number;
  retriable_failed: number;
  execution_time_ms: number;
}

export interface GlobalAnnouncementFailedUser {
  user_id: string;
  retriable: boolean;
  reason: string;
}

export interface SendGlobalAnnouncementResponse {
  success: boolean;
  global_notification_id: number;
  push_status: 'complete' | 'partial' | 'failed' | 'not_attempted';
  stats: GlobalAnnouncementSendStats;
  failed_users?: GlobalAnnouncementFailedUser[];
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
