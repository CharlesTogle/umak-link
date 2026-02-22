/**
 * Claim API Service
 * Wraps backend API calls for claim operations
 */

import api, { ApiError } from '@/shared/lib/api';
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
   * Check if an item already has a claim (basic check)
   */
  async checkExistingClaim(itemId: string) {
    try {
      return await api.claims.checkExisting(itemId);
    } catch (error) {
      console.error('[claimApiService] Check existing claim error:', error);
      throw error;
    }
  },

  /**
   * Check if an item already has a claim with full details including staff name
   */
  async checkExistingClaimFull(itemId: string): Promise<{
    claim_id: string;
    item_id: string;
    claimer_name: string;
    claimer_school_email: string;
    claimer_contact_num: string;
    processed_by_staff_id: string;
    claimed_at: string;
    staff_name?: string;
  } | null> {
    try {
      const response = await api.claims.checkExisting(itemId);
      if (!response.exists || !response.claim) {
        return null;
      }
      return {
        claim_id: response.claim.claim_id,
        item_id: response.claim.item_id,
        claimer_name: response.claim.claimer_name,
        claimer_school_email: response.claim.claimer_school_email || response.claim.claimer_email,
        claimer_contact_num: response.claim.claimer_contact_num,
        processed_by_staff_id: response.claim.processed_by_staff_id,
        claimed_at: response.claim.claimed_at,
        staff_name: response.claim.staff_name,
      };
    } catch (error) {
      // If 404 or claim not found, return null
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      console.error('[claimApiService] Check existing claim full error:', error);
      throw error;
    }
  },

  /**
   * Get full claim details by item ID
   */
  async getClaimByItem(itemId: string): Promise<{ claim_id: string; linked_lost_item_id: string | null } | null> {
    try {
      const response = await api.claims.getByItemFull(itemId);
      return response.claim;
    } catch (error) {
      console.error('[claimApiService] Get claim by item error:', error);
      return null;
    }
  },

  /**
   * Delete a claim by claim ID
   */
  async deleteClaim(claimId: string): Promise<{ success: boolean }> {
    try {
      return await api.claims.delete(claimId);
    } catch (error) {
      console.error('[claimApiService] Delete claim error:', error);
      throw error;
    }
  },

  /**
   * Delete claim by item ID and update linked missing item
   */
  async deleteClaimByItem(itemId: string): Promise<{ success: boolean }> {
    try {
      return await api.claims.deleteByItem(itemId);
    } catch (error) {
      console.error('[claimApiService] Delete claim by item error:', error);
      throw error;
    }
  },
};

export default claimApiService;
