import { supabase } from '@/shared/lib/supabase'

export interface DashboardStats {
  pendingVerifications: number
  pendingFraudReports: number
  claimedCount: number
  unclaimedCount: number
  toReviewCount: number
  lostCount: number
  returnedCount: number
  reportedCount: number
}

export async function getDashboardStats (): Promise<DashboardStats> {
  // Mirrors previous inline logic in Dashboard.tsx
  const { data, error } = await supabase.rpc('get_dashboard_stats')
  if (error) throw error

  console.log('Dashboard stats data:', data)
  return {
    pendingVerifications: data[0].pending_verifications || 0,
    pendingFraudReports: data[0].pending_fraud_reports || 0,
    claimedCount: data[0].claimed_count || 0,
    unclaimedCount: data[0].unclaimed_count || 0,
    toReviewCount: data[0].to_review_count || 0,
    lostCount: data[0].lost_count || 0,
    returnedCount: data[0].returned_count || 0,
    reportedCount: data[0].reported_count || 0
  }
}
