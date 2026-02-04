/**
 * Item API Service
 * Wraps backend API calls for item operations
 */

import api from '@/shared/lib/api';

export const itemApiService = {
  /**
   * Get item details (staff only)
   */
  async getItem(itemId: string): Promise<any> {
    try {
      return await api.items.get(itemId);
    } catch (error) {
      console.error('[itemApiService] Get item error:', error);
      throw error;
    }
  },

  /**
   * Update item metadata (staff only)
   */
  async updateMetadata(itemId: string, metadata: Record<string, any>): Promise<{ success: boolean }> {
    try {
      return await api.items.updateMetadata(itemId, metadata);
    } catch (error) {
      console.error('[itemApiService] Update metadata error:', error);
      throw error;
    }
  },
};

export default itemApiService;
