/**
 * API Client for UMak-LINK Backend
 *
 * This client wraps all backend API endpoints with type-safe methods.
 * It handles authentication tokens, error handling, and request/response formatting.
 */

import { getE2eAccessToken } from './e2eAuth';
import {
  getApiErrorMessageFromPayload,
  getDefaultErrorCode,
  type ApiErrorContext,
  type ApiErrorPayload,
} from './errorHandling';
import { supabase } from './supabase';
import type {
  AuthMeResponse,
  CreatePostAutofillRequest,
  CreatePostAutofillResponse,
  CreatePostRequest,
  EditPostRequest,
  PostListResponse,
  PostRecord,
  PostRecordDetails,
  UpdatePostStatusRequest,
  UpdateItemStatusRequest,
  ProcessClaimRequest,
  ExistingClaimResponse,
  FraudReportCreateRequest,
  FraudReportPublic,
  FraudReportListResponse,
  FraudReportResolveRequest,
  SearchItemsRequest,
  SearchImageQueryRequest,
  SearchImageQueryResponse,
  SearchItemsStaffRequest,
  SendNotificationRequest,
  NotificationRecord,
  SendGlobalAnnouncementRequest,
  SendGlobalAnnouncementResponse,
  AnnouncementRecord,
  DashboardStats,
  GuardPostListResponse,
  CreateCustodyAttemptRequest,
  CreateCustodyAttemptResponse,
  CustodySessionStatusResponse,
  RetryCustodySessionRequest,
  RetryCustodySessionResponse,
  CreateClaimVerificationSessionRequest,
  CreateClaimVerificationSessionResponse,
  JoinClaimVerificationSessionRequest,
  JoinClaimVerificationSessionResponse,
  ClaimVerificationSessionStatusResponse,
  RetryClaimVerificationSessionRequest,
  RetryClaimVerificationSessionResponse,
  ScanClaimVerificationRequest,
  ScanClaimVerificationResponse,
  CancelClaimVerificationSessionResponse,
  GuardActiveClaimReviewsResponse,
  CancelCustodySessionResponse,
  StudentCustodyHistoryResponse,
  GuardDecisionRequest,
  GuardDecisionResponse,
  SecurityOfficeReceiptResponse,
  OpenCustodyInvestigationResponse,
  NotifyGuardResponse,
  UpdateClaimedCustodyStatusResponse,
  GuardScanRequest,
  GuardScanResponse,
  UserProfile,
  UserClaimCodeResponse,
  UserSearchResponse,
} from './api-types';

type ApiRecord = Record<string, unknown>;
type ApiRecordList = ApiRecord[];

function sortCustodyHistoryEntries (
  entries: StudentCustodyHistoryResponse['history']
): StudentCustodyHistoryResponse['history'] {
  return entries
    .map((entry, index) => ({
      entry,
      index,
      occurredAtMs: Date.parse(entry.occurred_at)
    }))
    .sort((left, right) => {
      const leftTime = Number.isNaN(left.occurredAtMs)
        ? Number.MAX_SAFE_INTEGER
        : left.occurredAtMs
      const rightTime = Number.isNaN(right.occurredAtMs)
        ? Number.MAX_SAFE_INTEGER
        : right.occurredAtMs

      if (leftTime !== rightTime) {
        return leftTime - rightTime
      }

      return left.index - right.index
    })
    .map(({ entry }) => entry)
}

const configuredApiUrl = import.meta.env.VITE_API_URL;
if (!configuredApiUrl) {
  console.warn('[config] Missing VITE_API_URL. Using default http://localhost:8080.');
}

class ApiError extends Error {
  public code: string;
  public errorTitle: string;
  public requestId?: string;
  public retryAfterSeconds?: number;

  constructor(
    public statusCode: number,
    params: {
      code?: string
      errorTitle?: string
      data?: unknown
      context?: ApiErrorContext
      fallbackMessage?: string
    }
  ) {
    const payload = (params.data as ApiErrorPayload | undefined) ?? undefined;
    const code = params.code ?? payload?.code ?? getDefaultErrorCode(statusCode);
    const errorTitle = params.errorTitle ?? payload?.error ?? `HTTP ${statusCode}`;
    const message = getApiErrorMessageFromPayload({
      statusCode,
      code,
      retryAfterSeconds: payload?.retryAfterSeconds
    }, params.context ?? 'action', params.fallbackMessage);

    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.errorTitle = errorTitle;
    this.data = params.data;
    this.requestId = payload?.requestId;
    this.retryAfterSeconds = payload?.retryAfterSeconds;
  }

  public data?: unknown;

  toContextMessage (context: ApiErrorContext, fallbackMessage?: string): string {
    return getApiErrorMessageFromPayload({
      statusCode: this.statusCode,
      code: this.code,
      retryAfterSeconds: this.retryAfterSeconds
    }, context, fallbackMessage)
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = configuredApiUrl || 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  private async getAccessToken(): Promise<string | null> {
    const e2eToken = getE2eAccessToken();
    if (e2eToken) {
      return e2eToken;
    }

    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestInit & { timeout?: number }
  ): Promise<T> {
    const hasBody = typeof body !== 'undefined';
    const headers: Record<string, string> = {
      ...((options?.headers as Record<string, string>) || {}),
    };

    if (hasBody) {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }

    const token = await this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include', // Required for CORS with credentials
      ...options,
    };

    if (hasBody) {
      config.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${path}`;

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutMs = options?.timeout ?? 30000; // Default 30s
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      // Only set timeout if timeoutMs > 0 (0 means no timeout)
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      }

      config.signal = controller.signal;

      const response = await fetch(url, config);
      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as ApiErrorPayload));
        const statusCode =
          typeof errorData.statusCode === 'number'
            ? errorData.statusCode
            : response.status;

        throw new ApiError(statusCode, {
          code: typeof errorData.code === 'string' ? errorData.code : undefined,
          errorTitle: typeof errorData.error === 'string' ? errorData.error : undefined,
          data: errorData
        });
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle timeout/abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(504, {
          code: 'REQUEST_TIMEOUT',
          errorTitle: 'Gateway Timeout',
          data: { code: 'REQUEST_TIMEOUT', statusCode: 504, error: 'Gateway Timeout' }
        });
      }
      throw new ApiError(0, {
        code: 'NETWORK_ERROR',
        errorTitle: 'Network Error',
        data: { code: 'NETWORK_ERROR', statusCode: 0, error: 'Network Error' }
      });
    }
  }

  // ============================================================================
  // Email
  // ============================================================================

  email = {
    send: (data: {
      to: string;
      subject: string;
      html: string;
      senderUuid: string;
      from?: string;
    }): Promise<{ success: boolean; message?: string; error?: string; to?: string }> =>
      this.request('POST', '/email/send', data),
  };

  // ============================================================================
  // Authentication
  // ============================================================================

  auth = {
    getMe: (): Promise<AuthMeResponse> =>
      this.request<AuthMeResponse>('GET', '/auth/me'),

    appLoginAudit: (): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('POST', '/auth/app-login-audit'),

    updateProfile: (updates: {
      notification_token?: string | null;
      user_name?: string | null;
      profile_picture_url?: string | null;
    }): Promise<{ user: UserProfile }> =>
      this.request<{ user: UserProfile }>('PATCH', '/auth/profile', updates),
  };

  // ============================================================================
  // AI
  // ============================================================================

  ai = {
    createPostAutofill: (
      data: CreatePostAutofillRequest,
      options?: RequestInit & { timeout?: number }
    ): Promise<CreatePostAutofillResponse> =>
      this.request<CreatePostAutofillResponse>(
        'POST',
        '/ai/create-post-autofill',
        data,
        options
      ),
  };

  // ============================================================================
  // Student Custody
  // ============================================================================

  custody = {
    listGuardPosts: (): Promise<GuardPostListResponse> =>
      this.request<GuardPostListResponse>('GET', '/custody/guard-posts'),

    createAttempt: (
      data: CreateCustodyAttemptRequest
    ): Promise<CreateCustodyAttemptResponse> =>
      this.request<CreateCustodyAttemptResponse>('POST', '/custody/attempts', data),

    getSessionStatus: (
      qrCodeSessionId: string
    ): Promise<CustodySessionStatusResponse> =>
      this.request<CustodySessionStatusResponse>(
        'GET',
        `/custody/sessions/${qrCodeSessionId}/status`
      ),

    retrySession: (
      qrCodeSessionId: string,
      data: RetryCustodySessionRequest
    ): Promise<RetryCustodySessionResponse> =>
      this.request<RetryCustodySessionResponse>(
        'POST',
        `/custody/sessions/${qrCodeSessionId}/retry`,
        data
      ),

    cancelSession: (
      qrCodeSessionId: string
    ): Promise<CancelCustodySessionResponse> =>
      this.request<CancelCustodySessionResponse>(
        'POST',
        `/custody/sessions/${qrCodeSessionId}/cancel`
      ),

    getPostHistory: async (postId: number): Promise<StudentCustodyHistoryResponse> => {
      const response = await this.request<StudentCustodyHistoryResponse>(
        'GET',
        `/custody/posts/${postId}/history`
      )

      return {
        ...response,
        history: sortCustodyHistoryEntries(response.history)
      }
    },
  };

  // ============================================================================
  // Guard Custody
  // ============================================================================

  guardCustody = {
    scan: (data: GuardScanRequest): Promise<GuardScanResponse> =>
      this.request<GuardScanResponse>('POST', '/guard/custody/scan', data),

    decide: (
      custodyAttemptId: string,
      data: GuardDecisionRequest
    ): Promise<GuardDecisionResponse> =>
      this.request<GuardDecisionResponse>(
        'POST',
        `/guard/custody/attempts/${custodyAttemptId}/decision`,
        data
      ),

    listActiveClaimReviews: (): Promise<GuardActiveClaimReviewsResponse> =>
      this.request<GuardActiveClaimReviewsResponse>('GET', '/guard/reviews/active'),
  };

  // ============================================================================
  // Staff Custody
  // ============================================================================

  staffCustody = {
    receiveInSecurityOffice: (
      postId: number
    ): Promise<SecurityOfficeReceiptResponse> =>
      this.request<SecurityOfficeReceiptResponse>(
        'POST',
        '/staff/custody/security-office/receive',
        { post_id: postId }
      ),

    openInvestigation: (
      postId: number
    ): Promise<OpenCustodyInvestigationResponse> =>
      this.request<OpenCustodyInvestigationResponse>(
        'POST',
        '/staff/custody/investigations/open',
        { post_id: postId }
      ),

    notifyGuard: (postId: number): Promise<NotifyGuardResponse> =>
      this.request<NotifyGuardResponse>(
        'POST',
        '/staff/custody/guards/notify',
        { post_id: postId }
      ),

    updateClaimedCustodyStatus: (
      postId: number,
      custodyStatus: 'in_security_office' | 'under_investigation' | 'claimed_by_student'
    ): Promise<UpdateClaimedCustodyStatusResponse> =>
      this.request<UpdateClaimedCustodyStatusResponse>(
        'PUT',
        '/staff/custody/status',
        {
          post_id: postId,
          custody_status: custodyStatus,
        }
      ),
  };

  // ============================================================================
  // Posts & Items
  // ============================================================================

  posts = {
    // Comprehensive list with filtering
    list: (params?: {
      type?: 'public' | 'pending' | 'staff' | 'own';
      item_type?: 'found' | 'missing';
      status?: string;
      poster_id?: string;
      item_id?: string;
      linked_item_id?: string;
      post_ids?: string[];
      exclude_ids?: string[];
      limit?: number;
      offset?: number;
      include_count?: boolean;
      order_by?: 'submission_date' | 'accepted_on_date';
      order_direction?: 'asc' | 'desc';
    }): Promise<PostListResponse> => {
      const queryParams = new URLSearchParams();
      if (params?.type) queryParams.set('type', params.type);
      if (params?.item_type) queryParams.set('item_type', params.item_type);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.poster_id) queryParams.set('poster_id', params.poster_id);
      if (params?.item_id) queryParams.set('item_id', params.item_id);
      if (params?.linked_item_id) queryParams.set('linked_item_id', params.linked_item_id);
      if (params?.post_ids?.length) queryParams.set('post_ids', params.post_ids.join(','));
      if (params?.exclude_ids?.length) queryParams.set('exclude_ids', params.exclude_ids.join(','));
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());
      if (params?.include_count) queryParams.set('include_count', 'true');
      if (params?.order_by) queryParams.set('order_by', params.order_by);
      if (params?.order_direction) queryParams.set('order_direction', params.order_direction);

      const queryString = queryParams.toString();
      return this.request<PostListResponse>(
        'GET',
        `/posts${queryString ? `?${queryString}` : ''}`
      );
    },

    // Get total count
    getCount: (params?: {
      type?: 'public' | 'pending' | 'staff' | 'own';
      item_type?: 'found' | 'missing';
      status?: string;
      poster_id?: string;
    }): Promise<{ count: number }> => {
      const queryParams = new URLSearchParams();
      if (params?.type) queryParams.set('type', params.type);
      if (params?.item_type) queryParams.set('item_type', params.item_type);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.poster_id) queryParams.set('poster_id', params.poster_id);

      const queryString = queryParams.toString();
      return this.request<{ count: number }>(
        'GET',
        `/posts/count${queryString ? `?${queryString}` : ''}`
      );
    },

    // Get post by item ID
    getByItemId: (itemId: string): Promise<PostRecord> =>
      this.request<PostRecord>('GET', `/posts/by-item/${itemId}`),

    // Get post record details by item ID
    getByItemIdDetails: (itemId: string): Promise<PostRecordDetails> =>
      this.request<PostRecordDetails>('GET', `/posts/by-item-details/${itemId}`),

    listPublic: (): Promise<PostListResponse> =>
      this.request<PostListResponse>('GET', '/posts/public'),

    listByUser: (userId: string): Promise<PostListResponse> =>
      this.request<PostListResponse>('GET', `/posts/user/${userId}`),

    get: (id: number): Promise<PostRecord> =>
      this.request<PostRecord>('GET', `/posts/${id}`),

    getFull: (id: number): Promise<PostRecordDetails> =>
      this.request<PostRecordDetails>('GET', `/posts/${id}/full`),

    create: (data: CreatePostRequest): Promise<{ post_id: number }> =>
      this.request<{ post_id: number }>('POST', '/posts', data),

    edit: (id: number, data: EditPostRequest): Promise<{ success: boolean; post_id: number }> =>
      this.request<{ success: boolean; post_id: number }>('PUT', `/posts/${id}`, data),

    editWithImage: (id: number, data: {
      p_item_name?: string;
      p_item_description?: string;
      p_item_type?: string;
      p_image_hash?: string;
      p_image_link?: string;
      p_last_seen_date?: string;
      p_last_seen_hours?: number;
      p_last_seen_minutes?: number;
      p_location_path?: Array<{ name: string; type: string }>;
      p_item_status?: string;
      p_category?: string;
      p_post_status?: string;
      p_is_anonymous?: boolean;
    }): Promise<{ success: boolean; post_id: number }> =>
      this.request<{ success: boolean; post_id: number }>('PUT', `/posts/${id}/edit-with-image`, data),

    delete: (id: number): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('DELETE', `/posts/${id}`),

    updateStatus: (id: number, data: UpdatePostStatusRequest): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PUT', `/posts/${id}/status`, data),

    updateStaffAssignment: (id: number, staffId: string): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PUT', `/posts/${id}/staff-assignment`, { staff_id: staffId }),

    updateItemStatus: (itemId: string, data: UpdateItemStatusRequest): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PUT', `/posts/items/${itemId}/status`, data),
  };

  // ============================================================================
  // Claims
  // ============================================================================

  claims = {
    process: (data: ProcessClaimRequest): Promise<{ success: boolean; claim_id: string }> =>
      this.request<{ success: boolean; claim_id: string }>('POST', '/claims/process', data),

    checkExisting: (itemId: string): Promise<ExistingClaimResponse> =>
      this.request<ExistingClaimResponse>('GET', `/claims/by-item/${itemId}`),

    getByItemFull: (itemId: string): Promise<{ claim: { claim_id: string; linked_lost_item_id: string | null } | null }> =>
      this.request<{ claim: { claim_id: string; linked_lost_item_id: string | null } | null }>('GET', `/claims/by-item/${itemId}/full`),

    delete: (claimId: string): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('DELETE', `/claims/${claimId}`),

    deleteByItem: (itemId: string): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('DELETE', `/claims/by-item/${itemId}`),
  };

  // ============================================================================
  // Claim Verification
  // ============================================================================

  claimVerification = {
    createSession: (
      data: CreateClaimVerificationSessionRequest
    ): Promise<CreateClaimVerificationSessionResponse> =>
      this.request<CreateClaimVerificationSessionResponse>(
        'POST',
        '/claims/verification-sessions',
        data
      ),

    joinSession: (
      data: JoinClaimVerificationSessionRequest
    ): Promise<JoinClaimVerificationSessionResponse> =>
      this.request<JoinClaimVerificationSessionResponse>(
        'POST',
        '/claims/verification-sessions/join',
        data
      ),

    getSessionStatus: (
      claimVerificationSessionId: string
    ): Promise<ClaimVerificationSessionStatusResponse> =>
      this.request<ClaimVerificationSessionStatusResponse>(
        'GET',
        `/claims/verification-sessions/${claimVerificationSessionId}/status`
      ),

    retrySession: (
      claimVerificationSessionId: string,
      data: RetryClaimVerificationSessionRequest
    ): Promise<RetryClaimVerificationSessionResponse> =>
      this.request<RetryClaimVerificationSessionResponse>(
        'POST',
        `/claims/verification-sessions/${claimVerificationSessionId}/retry`,
        data
      ),

    scanSession: (
      data: ScanClaimVerificationRequest
    ): Promise<ScanClaimVerificationResponse> =>
      this.request<ScanClaimVerificationResponse>(
        'POST',
        '/claims/verification-sessions/scan',
        data
      ),

    cancelSession: (
      claimVerificationSessionId: string
    ): Promise<CancelClaimVerificationSessionResponse> =>
      this.request<CancelClaimVerificationSessionResponse>(
        'POST',
        `/claims/verification-sessions/${claimVerificationSessionId}/cancel`
      ),
  };

  // ============================================================================
  // Fraud Reports
  // ============================================================================

  fraudReports = {
    get: (id: string): Promise<FraudReportPublic> =>
      this.request<FraudReportPublic>('GET', `/fraud-reports/${id}`),

    getStatus: (id: string): Promise<{ report_status: string }> =>
      this.request<{ report_status: string }>('GET', `/fraud-reports/${id}/status`),

    create: (data: FraudReportCreateRequest): Promise<{ success: boolean; report_id: string }> =>
      this.request<{ success: boolean; report_id: string }>('POST', '/fraud-reports', data),

    list: (params?: {
      limit?: number;
      offset?: number;
      exclude?: string[];
      ids?: string[];
      sort?: 'asc' | 'desc';
    }): Promise<FraudReportListResponse> => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());
      if (params?.exclude?.length) queryParams.set('exclude', params.exclude.join(','));
      if (params?.ids?.length) queryParams.set('ids', params.ids.join(','));
      if (params?.sort) queryParams.set('sort', params.sort);

      const queryString = queryParams.toString();
      return this.request<FraudReportListResponse>(
        'GET',
        `/fraud-reports${queryString ? `?${queryString}` : ''}`
      );
    },

    updateStatus: (
      id: string,
      status: string,
      processedByStaffId?: string
    ): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PUT', `/fraud-reports/${id}/status`, {
        status,
        processed_by_staff_id: processedByStaffId,
      }),

    resolve: (id: string, data: FraudReportResolveRequest): Promise<{ success: boolean; data: unknown }> =>
      this.request<{ success: boolean; data: unknown }>('POST', `/fraud-reports/${id}/resolve`, data),

    delete: (id: string): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('DELETE', `/fraud-reports/${id}`),

    checkDuplicates: (postId: string | number, userId: string, concern?: string): Promise<{
      has_duplicate_self: boolean;
      has_duplicate_others: boolean;
    }> => {
      const params = new URLSearchParams();
      params.set('post_id', String(postId));
      params.set('user_id', userId);
      if (concern) params.set('concern', concern);
      return this.request<{
        has_duplicate_self: boolean;
        has_duplicate_others: boolean;
      }>('GET', `/fraud-reports/check-duplicates?${params.toString()}`);
    },
  };

  // ============================================================================
  // Search
  // ============================================================================

  search = {
    items: (data: SearchItemsRequest): Promise<{ results: PostRecord[] }> =>
      this.request<{ results: PostRecord[] }>('POST', '/search/items', data),

    itemsStaff: (data: SearchItemsStaffRequest): Promise<{ results: PostRecord[] }> =>
      this.request<{ results: PostRecord[] }>('POST', '/search/items/staff', data),

    imageQuery: (
      data: SearchImageQueryRequest,
      options?: RequestInit & { timeout?: number }
    ): Promise<SearchImageQueryResponse> =>
      this.request<SearchImageQueryResponse>(
        'POST',
        '/search/image-query',
        data,
        options
      ),

    matchMissingItem: (postId: string): Promise<{
      success: boolean;
      matches: ApiRecordList;
      missing_post?: ApiRecord;
      total_matches?: number;
    }> =>
      this.request<{
        success: boolean;
        matches: ApiRecordList;
        missing_post?: ApiRecord;
        total_matches?: number;
      }>('POST', '/search/match-missing-item', { post_id: postId }),
  };

  // ============================================================================
  // Notifications
  // ============================================================================

  notifications = {
    send: (data: SendNotificationRequest): Promise<{ success: boolean; notification_id: string | number }> =>
      this.request<{ success: boolean; notification_id: string | number }>('POST', '/notifications/send', data),

    list: (): Promise<{ notifications: NotificationRecord[] }> =>
      this.request<{ notifications: NotificationRecord[] }>('GET', '/notifications'),

    getCount: (): Promise<{ unread_count: number }> =>
      this.request<{ unread_count: number }>('GET', '/notifications/count'),

    markAsRead: (id: string | number): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PATCH', `/notifications/${id}/read`),

    delete: (id: string | number): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('DELETE', `/notifications/${id}`),
  };

  // ============================================================================
  // Announcements
  // ============================================================================

  announcements = {
    send: (data: SendGlobalAnnouncementRequest): Promise<SendGlobalAnnouncementResponse> =>
      this.request<SendGlobalAnnouncementResponse>('POST', '/announcements/send', data),

    list: (params?: { limit?: number; offset?: number }): Promise<{
      announcements: AnnouncementRecord[];
      count: number;
    }> => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());
      const queryString = queryParams.toString();
      return this.request('GET', `/announcements${queryString ? `?${queryString}` : ''}`);
    },
  };

  // ============================================================================
  // Storage
  // ============================================================================

  storage = {
    getUploadUrl: (
      bucket: 'items' | 'profilePictures',
      fileName: string,
      contentType: string
    ): Promise<{ uploadUrl: string; objectPath: string; publicUrl: string }> =>
      this.request<{ uploadUrl: string; objectPath: string; publicUrl: string }>(
        'POST',
        '/storage/upload-url',
        { bucket, fileName, contentType }
      ),

    confirmUpload: (
      bucket: 'items' | 'profilePictures',
      objectPath: string
    ): Promise<{ publicUrl: string }> =>
      this.request<{ publicUrl: string }>('POST', '/storage/confirm-upload', { bucket, objectPath }),

    delete: (bucket: 'items' | 'profilePictures', objectPath: string): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('DELETE', '/storage', { bucket, objectPath }),
  };

  // ============================================================================
  // Items
  // ============================================================================

  items = {
    get: (itemId: string): Promise<unknown> =>
      this.request<unknown>('GET', `/items/${itemId}`),

    updateMetadata: (itemId: string, metadata: ApiRecord): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PUT', `/items/${itemId}/metadata`, { item_metadata: metadata }),
  };

  // ============================================================================
  // Pending Matches
  // ============================================================================

  pendingMatches = {
    create: (data: {
      post_id: number;
      poster_id: string;
      status: string;
      is_retriable: boolean;
      failed_reason?: string;
    }): Promise<{ success: boolean; id: string }> =>
      this.request<{ success: boolean; id: string }>('POST', '/pending-matches', data),

    list: (params?: {
      limit?: number;
      offset?: number;
      status?: string;
    }): Promise<{ pending_matches: ApiRecordList; count: number }> => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());
      if (params?.status) queryParams.set('status', params.status);

      const queryString = queryParams.toString();
      return this.request<{ pending_matches: ApiRecordList; count: number }>(
        'GET',
        `/pending-matches${queryString ? `?${queryString}` : ''}`
      );
    },

    updateStatus: (id: string, status: string): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PUT', `/pending-matches/${id}/status`, { status }),
  };

  // ============================================================================
  // Users
  // ============================================================================

  users = {
    getMyClaimCode: (): Promise<UserClaimCodeResponse> =>
      this.request<UserClaimCodeResponse>('GET', '/users/me/claim-code'),

    get: (userId: string): Promise<UserProfile> =>
      this.request<UserProfile>('GET', `/users/${userId}`),

    search: (query: string): Promise<UserSearchResponse> =>
      this.request<UserSearchResponse>('GET', `/users/search?query=${encodeURIComponent(query)}`),

    resolveClaimCode: (
      code: string,
      options?: { foundPostId?: number }
    ): Promise<UserProfile> => {
      const queryParams = new URLSearchParams();
      if (
        typeof options?.foundPostId === 'number' &&
        Number.isFinite(options.foundPostId)
      ) {
        queryParams.set('found_post_id', String(options.foundPostId));
      }

      const queryString = queryParams.toString();
      return this.request<UserProfile>(
        'GET',
        `/users/claim-code/${encodeURIComponent(code)}${queryString ? `?${queryString}` : ''}`
      );
    },
  };

  // ============================================================================
  // Admin
  // ============================================================================

  admin = {
    getDashboardStats: (): Promise<DashboardStats> =>
      this.request<DashboardStats>('GET', '/admin/dashboard-stats'),

    getUsers: (params?: {
      user_type?: string[];
    }): Promise<{ users: Array<Partial<UserProfile>> }> => {
      const queryParams = new URLSearchParams();
      if (params?.user_type?.length) queryParams.set('user_type', params.user_type.join(','));

      const queryString = queryParams.toString();
      return this.request<{ users: Array<Partial<UserProfile>> }>(
        'GET',
        `/admin/users${queryString ? `?${queryString}` : ''}`
      );
    },

    updateUserRole: (userId: string, role: 'User' | 'Staff' | 'Admin', previousRole?: 'User' | 'Staff' | 'Admin'): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PUT', `/admin/users/${userId}/role`, { role, previous_role: previousRole }),

    insertAuditLog: (data: {
      user_id: string;
      action: string;
      table_name: string;
      record_id: string;
      changes: Record<string, unknown>;
    }): Promise<{ success: boolean; audit_id: string }> =>
      this.request<{ success: boolean; audit_id: string }>('POST', '/admin/audit-logs', data),

    getAuditLogs: (limit?: number, offset?: number): Promise<{ logs: unknown[] }> =>
      this.request<{ logs: unknown[] }>(
        'GET',
        `/admin/audit-logs?limit=${limit || 100}&offset=${offset || 0}`
      ),

    getAuditLog: (id: string): Promise<ApiRecord> =>
      this.request<ApiRecord>('GET', `/admin/audit-logs/${id}`),

    getAuditLogsByUser: (userId: string, limit?: number, offset?: number): Promise<{ logs: unknown[] }> =>
      this.request<{ logs: unknown[] }>(
        'GET',
        `/admin/audit-logs/user/${userId}?limit=${limit || 100}&offset=${offset || 0}`
      ),

    getAuditLogsByAction: (actionType: string, limit?: number, offset?: number): Promise<{ logs: unknown[] }> =>
      this.request<{ logs: unknown[] }>(
        'GET',
        `/admin/audit-logs/action/${actionType}?limit=${limit || 100}&offset=${offset || 0}`
      ),

    getWeeklyStats: (): Promise<{
      weeks: string[];
      series: { missing: number[]; found: number[]; reports: number[]; pending: number[] };
    }> => this.request('GET', '/admin/stats/weekly'),

    getExportData: (startDate: string, endDate: string): Promise<{ rows: ApiRecordList }> =>
      this.request(
        'GET',
        `/admin/stats/export?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
      ),
  };
}

// Singleton instance
export const api = new ApiClient();
export { ApiClient, ApiError };
export default api;
