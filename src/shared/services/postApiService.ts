/**
 * Post API Service
 * Wraps backend API calls for post operations
 */

import api from '@/shared/lib/api';
import type { PostRecord, CreatePostRequest, EditPostRequest } from '@/shared/lib/api-types';
import { computeBlockHash64 } from '@/shared/utils/hashUtils';
import { makeDisplay } from '@/shared/utils/imageUtils';

export interface CreatePostInput {
  anonymous: boolean;
  item: {
    title: string;
    desc: string;
    type: 'found' | 'lost' | 'missing';
  };
  category: string;
  lastSeenISO: string;
  locationDetails: {
    level1: string;
    level2: string;
    level3: string;
  };
  imageName: string;
  image: File;
  userId: string;
}

export interface EditPostInput {
  postId: number;
  item: {
    title: string;
    desc: string;
    type: 'found' | 'lost' | 'missing';
  };
  category: string;
  lastSeenISO: string;
  locationDetails: {
    level1: string;
    level2: string;
    level3: string;
  };
  anonymous: boolean;
}

export const postApiService = {
  /**
   * Create a new post
   */
  async createPost(input: CreatePostInput): Promise<{ post_id: number }> {
    try {
      // Process image
      const displayBlob = await makeDisplay(input.image);
      const imageHash = await computeBlockHash64(input.image);

      // Get signed upload URL
      const fileName = `${input.userId}_${Date.now()}_${input.imageName}`;
      const uploadData = await api.storage.getUploadUrl('items', fileName, displayBlob.type);

      // Upload image
      const uploadRes = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: displayBlob,
        headers: {
          'Content-Type': displayBlob.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image');
      }

      // Confirm upload
      await api.storage.confirmUpload('items', uploadData.objectPath);

      // Parse date/time from ISO string
      const lastSeenDate = new Date(input.lastSeenISO);
      const locationPath = [
        { name: input.locationDetails.level1, type: 'building' },
        { name: input.locationDetails.level2, type: 'floor' },
        { name: input.locationDetails.level3, type: 'room' },
      ].filter((loc) => loc.name);

      // Create post via API
      const postData: CreatePostRequest = {
        p_item_name: input.item.title,
        p_item_description: input.item.desc || undefined,
        p_item_type: input.item.type,
        p_poster_id: input.userId,
        p_image_hash: imageHash,
        p_category: input.category,
        p_date_day: lastSeenDate.getDate(),
        p_date_month: lastSeenDate.getMonth() + 1,
        p_date_year: lastSeenDate.getFullYear(),
        p_time_hour: lastSeenDate.getHours(),
        p_time_minute: lastSeenDate.getMinutes(),
        p_location_path: locationPath,
        p_is_anonymous: input.anonymous,
      };

      return await api.posts.create(postData);
    } catch (error) {
      console.error('[postApiService] Create post error:', error);
      throw error;
    }
  },

  /**
   * Edit an existing post
   */
  async editPost(input: EditPostInput): Promise<{ success: boolean; post_id: number }> {
    try {
      const lastSeenDate = new Date(input.lastSeenISO);
      const locationPath = [
        { name: input.locationDetails.level1, type: 'building' },
        { name: input.locationDetails.level2, type: 'floor' },
        { name: input.locationDetails.level3, type: 'room' },
      ].filter((loc) => loc.name);

      const editData: EditPostRequest = {
        post_id: input.postId,
        p_item_name: input.item.title,
        p_item_description: input.item.desc || undefined,
        p_item_type: input.item.type,
        p_category: input.category,
        p_date_day: lastSeenDate.getDate(),
        p_date_month: lastSeenDate.getMonth() + 1,
        p_date_year: lastSeenDate.getFullYear(),
        p_time_hour: lastSeenDate.getHours(),
        p_time_minute: lastSeenDate.getMinutes(),
        p_location_path: locationPath,
        p_is_anonymous: input.anonymous,
      };

      return await api.posts.edit(input.postId, editData);
    } catch (error) {
      console.error('[postApiService] Edit post error:', error);
      throw error;
    }
  },

  /**
   * Delete a post
   */
  async deletePost(postId: number): Promise<{ success: boolean }> {
    try {
      return await api.posts.delete(postId);
    } catch (error) {
      console.error('[postApiService] Delete post error:', error);
      throw error;
    }
  },

  /**
   * Get all public posts
   */
  async listPublicPosts(): Promise<PostRecord[]> {
    try {
      const response = await api.posts.listPublic();
      return response.posts;
    } catch (error) {
      console.error('[postApiService] List posts error:', error);
      throw error;
    }
  },

  /**
   * Get single post
   */
  async getPost(postId: number): Promise<PostRecord> {
    try {
      return await api.posts.get(postId);
    } catch (error) {
      console.error('[postApiService] Get post error:', error);
      throw error;
    }
  },

  /**
   * Get full post details (staff only)
   */
  async getFullPost(postId: number): Promise<PostRecord> {
    try {
      return await api.posts.getFull(postId);
    } catch (error) {
      console.error('[postApiService] Get full post error:', error);
      throw error;
    }
  },

  /**
   * Update post status (staff only)
   */
  async updatePostStatus(
    postId: number,
    status: string,
    rejectionReason?: string
  ): Promise<{ success: boolean }> {
    try {
      return await api.posts.updateStatus(postId, { status: status as any, rejection_reason: rejectionReason });
    } catch (error) {
      console.error('[postApiService] Update post status error:', error);
      throw error;
    }
  },

  /**
   * Update item status (staff only)
   */
  async updateItemStatus(itemId: string, status: string): Promise<{ success: boolean }> {
    try {
      return await api.posts.updateItemStatus(itemId, { status: status as any });
    } catch (error) {
      console.error('[postApiService] Update item status error:', error);
      throw error;
    }
  },
};

export default postApiService;
