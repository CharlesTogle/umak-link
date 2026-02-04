/**
 * Search API Service
 * Wraps backend API calls for search operations
 */

import api from '@/shared/lib/api';
import type { SearchItemsRequest, SearchItemsStaffRequest, PostRecord } from '@/shared/lib/api-types';

export const searchApiService = {
  /**
   * User search
   */
  async searchItems(params: {
    query: string;
    limit?: number;
    lastSeenDate?: string | null;
    category?: string[] | null;
    locationLastSeen?: string | null;
    claimFrom?: string | null;
    claimTo?: string | null;
    itemStatus?: string[] | null;
    sort?: 'submission_date';
    sortDirection?: 'asc' | 'desc';
  }): Promise<PostRecord[]> {
    try {
      const request: SearchItemsRequest = {
        query: params.query,
        limit: params.limit,
        last_seen_date: params.lastSeenDate,
        category: params.category,
        location_last_seen: params.locationLastSeen,
        claim_from: params.claimFrom,
        claim_to: params.claimTo,
        item_status: params.itemStatus as any,
        sort: params.sort,
        sort_direction: params.sortDirection,
      };

      const response = await api.search.items(request);
      return response.results;
    } catch (error) {
      console.error('[searchApiService] Search items error:', error);
      throw error;
    }
  },

  /**
   * Staff search with additional filters
   */
  async searchItemsStaff(params: {
    query: string;
    limit?: number;
    lastSeenDate?: string | null;
    category?: string[] | null;
    locationLastSeen?: string | null;
    claimFrom?: string | null;
    claimTo?: string | null;
    itemStatus?: string[] | null;
    sort?: 'accepted_on_date' | 'submission_date';
    sortDirection?: 'asc' | 'desc';
  }): Promise<PostRecord[]> {
    try {
      const request: SearchItemsStaffRequest = {
        query: params.query,
        limit: params.limit,
        last_seen_date: params.lastSeenDate,
        category: params.category,
        location_last_seen: params.locationLastSeen,
        claim_from: params.claimFrom,
        claim_to: params.claimTo,
        item_status: params.itemStatus as any,
        sort: params.sort,
        sort_direction: params.sortDirection,
      };

      const response = await api.search.itemsStaff(request);
      return response.results;
    } catch (error) {
      console.error('[searchApiService] Search items staff error:', error);
      throw error;
    }
  },

  /**
   * Search users (staff/admin only)
   */
  async searchUsers(query: string) {
    try {
      const response = await api.users.search(query);
      return response.results;
    } catch (error) {
      console.error('[searchApiService] Search users error:', error);
      throw error;
    }
  },
};

export default searchApiService;
