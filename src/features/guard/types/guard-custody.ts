import type { ReactNode } from 'react'
import type {
  GuardDecisionRequest as ApiGuardDecisionRequest,
  GuardDecisionResponse as ApiGuardDecisionResponse,
  GuardScanRequest as ApiGuardScanRequest,
  GuardScanResponse as ApiGuardScanResponse
} from '@/shared/lib/api-types'

export type GuardScanRequest = ApiGuardScanRequest
export type GuardScanResponse = ApiGuardScanResponse
export type GuardDecisionRequest = ApiGuardDecisionRequest
export type GuardDecisionResponse = ApiGuardDecisionResponse

export interface GuardQrPayload {
  qrCodeSessionId: string
  sessionToken: string
}

export interface GuardManualCodePayload {
  manualEntryCode: string
}

export type GuardScanPayload = GuardQrPayload | GuardManualCodePayload

export interface GuardManualEntryFormProps {
  isSubmitting: boolean
  onSubmit: (payload: GuardManualCodePayload) => Promise<void>
}

export interface GuardCameraScannerCardProps {
  isSubmitting: boolean
  onScan: (payload: GuardQrPayload) => Promise<void>
}

export interface GuardRouteParams {
  custodyAttemptId: string
}

export interface StoredGuardScanSession {
  scan: GuardScanResponse
  scanned_at: string
}

export interface GuardDecisionSummary {
  post_id: number
  custody_attempt_id: string
  qr_code_session_id: string
  attempt_status: GuardDecisionResponse['attempt_status']
  decision_at: string
  item_name: string
  guard_post_name: string | null
}

export type GuardToastColor = 'success' | 'danger'

export interface GuardDecisionCardProps {
  decisionReason: string
  isSubmitting: boolean
  pendingDecision: GuardDecisionRequest['decision'] | null
  onDecisionReasonChange: (value: string) => void
  onAccept: () => void
  onReject: () => void
}

export interface GuardReviewImagePanelProps {
  title: string
  imageAlt: string
  imageUrl: string | null
  emptyState: string
  testId: string
}

export interface GuardReviewMissingStateProps {
  onOpenScan: () => void
  onReturnHome: () => void
}

export interface GuardReviewSummaryCardProps {
  scan: GuardScanResponse
}

export interface GuardSessionSummaryProps {
  activeSession?: StoredGuardScanSession | null
  latestDecision?: GuardDecisionSummary | null
  onLatestDecisionClick?: () => void
}

export interface GuardStatusBannerProps {
  tone: 'success' | 'warning'
  title: string
  description: string
  testId?: string
}

export type GuardQrScannerPhase =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'unsupported'
  | 'error'

export interface GuardQrScannerState {
  isOpen: boolean
  message: string
  phase: GuardQrScannerPhase
}

export type GuardQrScannerAction =
  | {
    type: 'cameraClosed'
  }
  | {
    type: 'cameraOpened'
  }
  | {
    type: 'errorShown'
    message: string
  }
  | {
    type: 'idleShown'
    message: string
  }
  | {
    type: 'scanningStarted'
    message: string
  }
  | {
    type: 'startupStarted'
    message: string
  }
  | {
    type: 'unsupportedShown'
    message: string
  }

export interface GuardSurfaceCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  testId?: string
}

export interface GuardReviewToastState {
  color: GuardToastColor
  isOpen: boolean
  message: string
}

export interface GuardReviewState {
  decisionReason: string
  toast: GuardReviewToastState
}

export type GuardReviewAction =
  | {
    type: 'decisionReasonChanged'
    value: string
  }
  | {
    type: 'toastDismissed'
  }
  | {
    type: 'toastShown'
    message: string
    color: GuardToastColor
  }
