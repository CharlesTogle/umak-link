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
    listPublic: (): Promise<PostListResponse> =>
      this.request<PostListResponse>('GET', '/posts/public'),

    get: (id: number): Promise<PostRecord> =>
      this.request<PostRecord>('GET', `/posts/${id}`),

    getFull: (id: number): Promise<PostRecordDetails> =>
      this.request<PostRecordDetails>('GET', `/posts/${id}/full`),

    create: (data: CreatePostRequest): Promise<{ post_id: number }> =>
      this.request<{ post_id: number }>('POST', '/posts', data),

    edit: (id: number, data: EditPostRequest): Promise<{ success: boolean; post_id: number }> =>
      this.request<{ success: boolean; post_id: number }>('PUT', `/posts/${id}`, data),

    delete: (id: number): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('DELETE', `/posts/${id}`),

    updateStatus: (id: number, data: UpdatePostStatusRequest): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PUT', `/posts/${id}/status`, data),

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
  };

  // ============================================================================
  // Fraud Reports
  // ============================================================================

  fraudReports = {
    create: (data: FraudReportCreateRequest): Promise<{ success: boolean; report_id: string }> =>
      this.request<{ success: boolean; report_id: string }>('POST', '/fraud-reports', data),

    list: (): Promise<FraudReportListResponse> =>
      this.request<FraudReportListResponse>('GET', '/fraud-reports'),

    updateStatus: (id: string, data: FraudReportStatusRequest): Promise<{ success: boolean }> =>
      this.request<{ success: boolean }>('PATCH', `/fraud-reports/${id}/status`, data),

    resolve: (id: string, data: FraudReportResolveRequest): Promise<{ success: boolean; data: unknown }> =>
      this.request<{ success: boolean; data: unknown }>('POST', `/fraud-reports/${id}/resolve`, data),
  };

  // ============================================================================
  // Search
  // ============================================================================

  search = {
    items: (data: SearchItemsRequest): Promise<{ results: PostRecord[] }> =>
      this.request<{ results: PostRecord[] }>('POST', '/search/items', data),

    itemsStaff: (data: SearchItemsStaffRequest): Promise<{ results: PostRecord[] }> =>
      this.request<{ results: PostRecord[] }>('POST', '/search/items/staff', data),
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

    list: (): Promise<{ announcements: AnnouncementRecord[] }> =>
      this.request<{ announcements: AnnouncementRecord[] }>('GET', '/announcements'),
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
  // Users
  // ============================================================================

  users = {
    search: (query: string): Promise<UserSearchResponse> =>
      this.request<UserSearchResponse>('GET', `/users/search?query=${encodeURIComponent(query)}`),
  };

  // ============================================================================
  // Admin
  // ============================================================================

  admin = {
    getDashboardStats: (): Promise<DashboardStats> =>
      this.request<DashboardStats>('GET', '/admin/dashboard-stats'),

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
  };
}

// Singleton instance
export const api = new ApiClient();
export { ApiClient, ApiError };
export default api;
