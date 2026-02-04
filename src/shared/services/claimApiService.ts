/**
 * Claim API Service
 * Wraps backend API calls for claim operations
 */

import api from '@/shared/lib/api';
import type { ProcessClaimRequest, ClaimDetails } from '@/shared/lib/api-types';

export const claimApiService = {
  /**
   * Process a claim (staff only)
   */
  async processClaim(params: {
    foundPostId: number;
    missingPostId?: number | null;
    claimDetails: ClaimDetails;
  }): Promise<{ success: boolean; claim_id: string }> {
    try {
      const request: ProcessClaimRequest = {
        found_post_id: params.foundPostId,
        missing_post_id: params.missingPostId,
        claim_details: params.claimDetails,
      };

      return await api.claims.process(request);
    } catch (error) {
      console.error('[claimApiService] Process claim error:', error);
      throw error;
    }
  },

  /**
   * Check if an item already has a claim
   */
  async checkExistingClaim(itemId: string) {
    try {
      return await api.claims.checkExisting(itemId);
    } catch (error) {
      console.error('[claimApiService] Check existing claim error:', error);
      throw error;
    }
  },
};

export default claimApiService;
