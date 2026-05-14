import api from '@/shared/lib/api'

export const staffCustodyApiService = {
  receiveInSecurityOffice: (postId: number) =>
    api.staffCustody.receiveInSecurityOffice(postId),

  openInvestigation: (postId: number) =>
    api.staffCustody.openInvestigation(postId),

  notifyGuard: (postId: number) =>
    api.staffCustody.notifyGuard(postId),

  updateClaimedCustodyStatus: (
    postId: number,
    custodyStatus: 'in_security_office' | 'under_investigation' | 'claimed_by_student'
  ) => api.staffCustody.updateClaimedCustodyStatus(postId, custodyStatus)
}
