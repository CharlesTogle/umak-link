/**
 * Admin API Service
 * Wraps backend API calls for admin operations
 */

import api from '@/shared/lib/api';
import type { DashboardStats, UserProfile } from '@/shared/lib/api-types';

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
   * Get users with optional type filter (admin only)
   */
  async getUsers(params?: { user_type?: string[] }): Promise<Partial<UserProfile>[]> {
    try {
      const response = await api.admin.getUsers(params);
      return response.users;
    } catch (error) {
      console.error('[adminApiService] Get users error:', error);
      throw error;
    }
  },

  /**
   * Update user role (admin only)
   */
  async updateUserRole(
    userId: string,
    role: 'User' | 'Staff' | 'Admin',
    previousRole?: 'User' | 'Staff' | 'Admin'
  ): Promise<{ success: boolean }> {
    try {
      return await api.admin.updateUserRole(userId, role, previousRole);
    } catch (error) {
      console.error('[adminApiService] Update user role error:', error);
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

  /**
   * Get single audit log (admin only)
   */
  async getAuditLog(id: string): Promise<any> {
    try {
      return await api.admin.getAuditLog(id);
    } catch (error) {
      console.error('[adminApiService] Get audit log error:', error);
      throw error;
    }
  },

  /**
   * Get audit logs by user (staff only)
   */
  async getAuditLogsByUser(userId: string, limit?: number, offset?: number): Promise<any[]> {
    try {
      const response = await api.admin.getAuditLogsByUser(userId, limit, offset);
      return response.logs;
    } catch (error) {
      console.error('[adminApiService] Get user audit logs error:', error);
      throw error;
    }
  },

  /**
   * Get audit logs by action type (admin only)
   */
  async getAuditLogsByAction(actionType: string, limit?: number, offset?: number): Promise<any[]> {
    try {
      const response = await api.admin.getAuditLogsByAction(actionType, limit, offset);
      return response.logs;
    } catch (error) {
      console.error('[adminApiService] Get audit logs by action error:', error);
      throw error;
    }
  },
};

export default adminApiService;
