/**
 * API Services
 * Central export for all API service wrappers
 */

export { postApiService } from './postApiService';
export { searchApiService } from './searchApiService';
export { claimApiService } from './claimApiService';
export { fraudReportApiService } from './fraudReportApiService';
export { notificationApiService } from './notificationApiService';
export { adminApiService } from './adminApiService';
export { itemApiService } from './itemApiService';
export { pendingMatchApiService } from './pendingMatchApiService';

// Re-export the main API client
export { default as api } from '@/shared/lib/api';
