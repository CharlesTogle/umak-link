import { useMutation } from '@tanstack/react-query'
import {
  scanGuardCustodySession,
  submitGuardCustodyDecision
} from '@/features/guard/services/guardCustodyService'
import type {
  GuardDecisionRequest,
  GuardDecisionResponse,
  GuardManualEntryPayload,
  GuardScanRequest,
  GuardScanResponse
} from '@/features/guard/types/guard-custody'

const guardCustodyMutationKeys = {
  decision: (custodyAttemptId: string) =>
    ['guard-custody', 'decision', custodyAttemptId] as const,
  scan: ['guard-custody', 'scan'] as const
}

function mapManualEntryPayloadToRequest (
  payload: GuardManualEntryPayload
): GuardScanRequest {
  return {
    qr_code_session_id: payload.qrCodeSessionId,
    session_token: payload.sessionToken
  }
}

export function useGuardScanMutation () {
  return useMutation<GuardScanResponse, Error, GuardManualEntryPayload>({
    mutationKey: guardCustodyMutationKeys.scan,
    mutationFn: async payload =>
      await scanGuardCustodySession(mapManualEntryPayloadToRequest(payload)),
    retry: 1
  })
}

export function useGuardDecisionMutation (custodyAttemptId: string) {
  return useMutation<GuardDecisionResponse, Error, GuardDecisionRequest>({
    mutationKey: guardCustodyMutationKeys.decision(custodyAttemptId),
    mutationFn: async (payload: GuardDecisionRequest) =>
      await submitGuardCustodyDecision(custodyAttemptId, payload),
    retry: 1
  })
}
