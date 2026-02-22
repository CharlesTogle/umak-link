/**
 * API Client for UMak-LINK Backend
 *
 * This client wraps all backend API endpoints with type-safe methods.
 * It handles authentication tokens, error handling, and request/response formatting.
 */

import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthMeResponse,
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
  FraudReportListResponse,
  FraudReportStatusRequest,
  FraudReportResolveRequest,
  SearchItemsRequest,
  SearchItemsStaffRequest,
  SendNotificationRequest,
  NotificationRecord,
  SendGlobalAnnouncementRequest,
  AnnouncementRecord,
  DashboardStats,
  UserSearchResponse,
} from './api-types';

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private loadToken(): void {
    // Load token from localStorage or sessionStorage
    this.token = localStorage.getItem('api_token');
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('api_token', token);
    } else {
      localStorage.removeItem('api_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      ...options,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || errorData.error || `HTTP ${response.status}`,
          errorData
        );
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
      throw new ApiError(0, 'Network error', error);
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
    loginWithGoogle: (googleIdToken: string): Promise<AuthLoginResponse> =>
      this.request<AuthLoginResponse>('POST', '/auth/google', { googleIdToken }),

    getMe: (): Promise<AuthMeResponse> =>
      this.request<AuthMeResponse>('GET', '/auth/me'),
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
  // Fraud Reports
  // ============================================================================

  fraudReports = {
    get: (id: string): Promise<any> =>
      this.request<any>('GET', `/fraud-reports/${id}`),

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

    matchMissingItem: (postId: string): Promise<{
      success: boolean;
      matches: any[];
      missing_post?: any;
      total_matches?: number;
    }> =>
      this.request<{
        success: boolean;
        matches: any[];
        missing_post?: any;
        total_matches?: number;
      }>('POST', '/search/match-missing-item', { post_id: postId }),
  };

  // ============================================================================
  // Notifications
  // ============================================================================

  notifications = {
    send: (data: SendNotificationRequest): Promise<{ success: boolean; notification_id: number }> =>
      this.request<{ success: boolean; notification_id: number }>('POST', '/notifications/send', data),

    list: (): Promise<{ notifications: NotificationRecord[] }> =>
      this.request<{ notifications: NotificationRecord[] }>('GET', '/notifications'),

    getCount: (): Promise<{ unread_count: number }> =>
      this.request<{ unread_count: number }>('GET', '/notifications/count'),

    markAsRead: (id: number): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PATCH', `/notifications/${id}/read`),

    delete: (id: number): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('DELETE', `/notifications/${id}`),
  };

  // ============================================================================
  // Announcements
  // ============================================================================

  announcements = {
    send: (data: SendGlobalAnnouncementRequest): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('POST', '/announcements/send', data),

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
    get: (itemId: string): Promise<any> =>
      this.request<any>('GET', `/items/${itemId}`),

    updateMetadata: (itemId: string, metadata: Record<string, any>): Promise<{ success: boolean }> =>
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
    }): Promise<{ pending_matches: any[]; count: number }> => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());
      if (params?.status) queryParams.set('status', params.status);

      const queryString = queryParams.toString();
      return this.request<{ pending_matches: any[]; count: number }>(
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
    get: (userId: string): Promise<any> =>
      this.request<any>('GET', `/users/${userId}`),

    search: (query: string): Promise<UserSearchResponse> =>
      this.request<UserSearchResponse>('GET', `/users/search?query=${encodeURIComponent(query)}`),
  };

  // ============================================================================
  // Admin
  // ============================================================================

  admin = {
    getDashboardStats: (): Promise<DashboardStats> =>
      this.request<DashboardStats>('GET', '/admin/dashboard-stats'),

    getUsers: (params?: {
      user_type?: string[];
    }): Promise<{ users: any[] }> => {
      const queryParams = new URLSearchParams();
      if (params?.user_type?.length) queryParams.set('user_type', params.user_type.join(','));

      const queryString = queryParams.toString();
      return this.request<{ users: any[] }>(
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

    getAuditLog: (id: string): Promise<any> =>
      this.request<any>('GET', `/admin/audit-logs/${id}`),

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

    getExportData: (startDate: string, endDate: string): Promise<{ rows: any[] }> =>
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
