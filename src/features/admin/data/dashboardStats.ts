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
  missingCount?: number
  foundCount?: number
}

export async function getDashboardStats (
  date_range: string = 'all'
): Promise<DashboardStats> {
  // Call the RPC which accepts a date_range parameter (e.g., 'today','week','month','year','all')
  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    date_range
  })
  if (error) throw error

  console.log('Dashboard stats data:', data)
  const row = (Array.isArray(data) && data[0]) || data

  return {
    pendingVerifications: row?.pending_verifications ?? row?.pending_count ?? 0,
    pendingFraudReports: row?.pending_fraud_reports ?? 0,
    claimedCount: row?.claimed_count ?? 0,
    unclaimedCount: row?.unclaimed_count ?? 0,
    toReviewCount: row?.to_review_count ?? row?.pending_count ?? 0,
    lostCount: row?.lost_count ?? 0,
    returnedCount: row?.returned_count ?? 0,
    reportedCount: row?.reported_count ?? row?.pending_fraud_reports ?? 0,
    missingCount: row?.missing_count ?? 0,
    foundCount: row?.found_count ?? 0
  }
}
