/**
 * Pending Match API Service
 * Wraps backend API calls for pending match operations
 */

import api from '@/shared/lib/api';

export const pendingMatchApiService = {
  /**
   * Create a pending match entry (staff only)
   */
  async createPendingMatch(data: {
    post_id: number;
    poster_id: string;
    status: string;
    is_retriable: boolean;
    failed_reason?: string;
  }): Promise<{ success: boolean; id: string }> {
    try {
      return await api.pendingMatches.create(data);
    } catch (error) {
      console.error('[pendingMatchApiService] Create pending match error:', error);
      throw error;
    }
  },

  /**
   * List pending matches (staff only)
   */
  async listPendingMatches(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<any[]> {
    try {
      const response = await api.pendingMatches.list(params);
      return response.pending_matches;
    } catch (error) {
      console.error('[pendingMatchApiService] List pending matches error:', error);
      throw error;
    }
  },

  /**
   * Update pending match status (staff only)
   */
  async updateStatus(id: string, status: string): Promise<{ success: boolean }> {
    try {
      return await api.pendingMatches.updateStatus(id, status);
    } catch (error) {
      console.error('[pendingMatchApiService] Update status error:', error);
      throw error;
    }
  },
};

export default pendingMatchApiService;
