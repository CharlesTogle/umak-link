/**
 * Admin API Service
 * Wraps backend API calls for admin operations
 */

import api from '@/shared/lib/api';
import type { DashboardStats } from '@/shared/lib/api-types';

export const adminApiService = {
  /**
   * Get dashboard statistics (admin only)
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await api.admin.getDashboardStats();
    } catch (error) {
      console.error('[adminApiService] Get dashboard stats error:', error);
      throw error;
    }
  },

  /**
   * Insert audit log (staff/admin)
   */
  async insertAuditLog(params: {
    userId: string;
    action: string;
    tableName: string;
    recordId: string;
    changes: Record<string, unknown>;
  }): Promise<{ success: boolean; audit_id: string }> {
    try {
      return await api.admin.insertAuditLog({
        user_id: params.userId,
        action: params.action,
        table_name: params.tableName,
        record_id: params.recordId,
        changes: params.changes,
      });
    } catch (error) {
      console.error('[adminApiService] Insert audit log error:', error);
      throw error;
    }
  },

  /**
   * Get audit logs (admin only)
   */
  async getAuditLogs(limit?: number, offset?: number) {
    try {
      const response = await api.admin.getAuditLogs(limit, offset);
      return response.logs;
    } catch (error) {
      console.error('[adminApiService] Get audit logs error:', error);
      throw error;
    }
  },
};

export default adminApiService;
