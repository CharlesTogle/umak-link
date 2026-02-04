/**
 * Fraud Report API Service
 * Wraps backend API calls for fraud report operations
 */

import api from '@/shared/lib/api';
import type { FraudReportCreateRequest, FraudReportPublic } from '@/shared/lib/api-types';

export const fraudReportApiService = {
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
   * List all fraud reports (staff only)
   */
  async listReports(): Promise<FraudReportPublic[]> {
    try {
      const response = await api.fraudReports.list();
      return response.reports;
    } catch (error) {
      console.error('[fraudReportApiService] List reports error:', error);
      throw error;
    }
  },

  /**
   * Update fraud report status (staff only)
   */
  async updateStatus(reportId: string, status: string): Promise<{ success: boolean }> {
    try {
      return await api.fraudReports.updateStatus(reportId, { status: status as any });
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
};

export default fraudReportApiService;
