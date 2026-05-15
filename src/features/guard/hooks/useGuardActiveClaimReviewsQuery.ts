import { useQuery } from '@tanstack/react-query'
import { fetchGuardActiveClaimReviews } from '@/features/guard/services/guardCustodyService'

const guardActiveClaimReviewQueryKeys = {
  activeClaimReviews: ['guard-custody', 'active-claim-reviews'] as const
}

export function useGuardActiveClaimReviewsQuery (enabled = true) {
  return useQuery({
    queryKey: guardActiveClaimReviewQueryKeys.activeClaimReviews,
    queryFn: fetchGuardActiveClaimReviews,
    enabled,
    retry: 1
  })
}
