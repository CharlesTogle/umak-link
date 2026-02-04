import { adminApiService } from '@/shared/services';

export interface DashboardStats {
  pendingVerifications: number;
  pendingFraudReports: number;
  claimedCount: number;
  unclaimedCount: number;
  toReviewCount: number;
  lostCount: number;
  returnedCount: number;
  reportedCount: number;
  missingCount?: number;
  foundCount?: number;
}

export async function getDashboardStats(date_range: string = 'all'): Promise<DashboardStats> {
  // Note: Backend API currently doesn't support date_range parameter
  // The RPC call would need to be updated in the backend to support this
  const data = await adminApiService.getDashboardStats();

  console.log('Dashboard stats data:', data);

  return {
    pendingVerifications: data?.pending_verifications ?? 0,
    pendingFraudReports: data?.pending_fraud_reports ?? 0,
    claimedCount: data?.claimed_count ?? 0,
    unclaimedCount: data?.unclaimed_count ?? 0,
    toReviewCount: data?.to_review_count ?? 0,
    lostCount: data?.lost_count ?? 0,
    returnedCount: data?.returned_count ?? 0,
    reportedCount: data?.reported_count ?? 0,
    missingCount: 0, // Not available from backend yet
    foundCount: 0, // Not available from backend yet
  };
}
