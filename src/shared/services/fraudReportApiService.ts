/**
 * Fraud Report API Service
 * Wraps backend API calls for fraud report operations
 */

import api from '@/shared/lib/api';
import type { FraudReportCreateRequest, FraudReportPublic } from '@/shared/lib/api-types';

export const fraudReportApiService = {
  /**
   * Get single fraud report (staff only)
   */
  async getReport(reportId: string): Promise<any> {
    try {
      return await api.fraudReports.get(reportId);
    } catch (error) {
      console.error('[fraudReportApiService] Get report error:', error);
      throw error;
    }
  },

  /**
   * Get fraud report status (staff only)
   */
  async getReportStatus(reportId: string): Promise<string> {
    try {
      const response = await api.fraudReports.getStatus(reportId);
      return response.report_status;
    } catch (error) {
      console.error('[fraudReportApiService] Get report status error:', error);
      throw error;
    }
  },

  /**
   * Create a fraud report
   */
  async createReport(params: FraudReportCreateRequest): Promise<{ success: boolean; report_id: string }> {
    try {
      return await api.fraudReports.create(params);
    } catch (error) {
      console.error('[fraudReportApiService] Create report error:', error);
      throw error;
    }
  },

  /**
   * List fraud reports with pagination and filtering (staff only)
   */
  async listReports(params?: {
    limit?: number;
    offset?: number;
    exclude?: string[];
    ids?: string[];
    sort?: 'asc' | 'desc';
  }): Promise<FraudReportPublic[]> {
    try {
      const response = await api.fraudReports.list(params);
      return response.reports;
    } catch (error) {
      console.error('[fraudReportApiService] List reports error:', error);
      throw error;
    }
  },

  /**
   * Update fraud report status (staff only)
   */
  async updateStatus(
    reportId: string,
    status: string,
    processedByStaffId?: string
  ): Promise<{ success: boolean }> {
    try {
      return await api.fraudReports.updateStatus(reportId, status, processedByStaffId);
    } catch (error) {
      console.error('[fraudReportApiService] Update status error:', error);
      throw error;
    }
  },

  /**
   * Resolve a fraud report (staff only)
   */
  async resolveReport(reportId: string, deleteClaim?: boolean): Promise<{ success: boolean }> {
    try {
      return await api.fraudReports.resolve(reportId, { delete_claim: deleteClaim });
    } catch (error) {
      console.error('[fraudReportApiService] Resolve report error:', error);
      throw error;
    }
  },

  /**
   * Delete a fraud report (staff only)
   */
  async deleteReport(reportId: string): Promise<{ success: boolean }> {
    try {
      return await api.fraudReports.delete(reportId);
    } catch (error) {
      console.error('[fraudReportApiService] Delete report error:', error);
      throw error;
    }
  },

  /**
   * Check for duplicate fraud reports
   */
  async checkDuplicates(
    postId: string | number,
    userId: string,
    concern?: string
  ): Promise<{ hasDuplicateSelf: boolean; hasDuplicateOthers: boolean }> {
    try {
      const result = await api.fraudReports.checkDuplicates(postId, userId, concern);
      return {
        hasDuplicateSelf: result.has_duplicate_self,
        hasDuplicateOthers: result.has_duplicate_others,
      };
    } catch (error) {
      console.error('[fraudReportApiService] Check duplicates error:', error);
      throw error;
    }
  },
};

export default fraudReportApiService;
