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

export interface EditPostWithImageInput extends EditPostInput {
  image: File;
  userId: string;
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
   * Edit an existing post (without image change)
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
   * Edit an existing post with image replacement
   * Handles image upload, old image deletion, and post update in one operation
   */
  async editWithImage(input: EditPostWithImageInput): Promise<{ success: boolean; post_id: number }> {
    try {
      // 1) Process and upload new image
      const displayBlob = await makeDisplay(input.image);
      const imageHash = await computeBlockHash64(input.image);

      // Get signed upload URL
      const fileName = `${input.userId}_${Date.now()}_edit.webp`;
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

      // Confirm upload and get public URL
      await api.storage.confirmUpload('items', uploadData.objectPath);

      // 2) Parse date/time from ISO string
      const lastSeenDate = new Date(input.lastSeenISO);
      const lastSeenHours = lastSeenDate.getHours();
      const lastSeenMinutes = lastSeenDate.getMinutes();

      // 3) Build location path array
      const locationPath: Array<{ name: string; type: string }> = [];

      const level1 = input.locationDetails.level1?.trim();
      if (level1) {
        locationPath.push({ name: level1, type: 'level1' });
      }

      const level2 = input.locationDetails.level2?.trim();
      if (level2 && level2 !== 'Not Applicable') {
        locationPath.push({ name: level2, type: 'level2' });
      }

      const level3 = input.locationDetails.level3?.trim();
      if (level3 && level3 !== 'Not Applicable') {
        locationPath.push({ name: level3, type: 'level3' });
      }

      // 4) Call the edit-with-image endpoint
      return await api.posts.editWithImage(input.postId, {
        p_item_name: input.item.title,
        p_item_description: input.item.desc || undefined,
        p_item_type: input.item.type,
        p_image_hash: imageHash,
        p_image_link: uploadData.publicUrl,
        p_last_seen_date: lastSeenDate.toISOString(),
        p_last_seen_hours: lastSeenHours,
        p_last_seen_minutes: lastSeenMinutes,
        p_location_path: locationPath,
        p_item_status: input.item.type === 'found' ? 'unclaimed' : 'lost',
        p_category: input.category,
        p_post_status: 'pending',
        p_is_anonymous: input.anonymous,
      });
    } catch (error) {
      console.error('[postApiService] Edit post with image error:', error);
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
   * Get user's posts
   */
  async getUserPosts(userId: string): Promise<PostRecord[]> {
    try {
      const response = await api.posts.listByUser(userId);
      return response.posts;
    } catch (error) {
      console.error('[postApiService] Get user posts error:', error);
      throw error;
    }
  },

  /**
   * Update staff assignment (staff only)
   */
  async updateStaffAssignment(postId: number, staffId: string): Promise<{ success: boolean }> {
    try {
      return await api.posts.updateStaffAssignment(postId, staffId);
    } catch (error) {
      console.error('[postApiService] Update staff assignment error:', error);
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
