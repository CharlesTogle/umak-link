import type {
  CancelCustodySessionResponse,
  CreateCustodyAttemptResponse,
  CustodyAttemptStatus,
  CustodyHistoryResponse,
  CustodySessionStatusResponse,
  CustodyStatus,
  GuardPostRecord,
  QrCodeSessionStatus,
  RetryCustodySessionResponse
} from '@/shared/lib/api-types'

export interface CreateUserCustodyAttemptInput {
  postId: number
  guardPostId: string
  guardPostName: string
  handoverImage: File
}

export interface StartUserCustodyAttemptResult
  extends CreateCustodyAttemptResponse {
  guardPostId: string
  guardPostName: string
  handoverImageHash: string
  handoverImageUrl: string
  manualEntryCode: string
  sessionToken: string
}

export interface RetryUserCustodySessionResult
  extends RetryCustodySessionResponse {
  manualEntryCode: string
  sessionToken: string
}

export interface StoredUserCustodySession {
  postId: number
  custodyAttemptId: string
  qrCodeSessionId: string
  manualEntryCode: string
  sessionToken: string
  guardPostId: string
  guardPostName: string
  handoverImageHash: string
  handoverImageUrl: string
  custodyStatus: CustodyStatus
  attemptStatus: CustodyAttemptStatus
  qrStatus: QrCodeSessionStatus
  expiresAt: string
  numberOfAttempts: number
  maxNumberOfAttempts: number
  retriesRemaining: number
  createdAt: string
}

export interface UserCustodyRouteParams {
  postId: string
}

export interface UserCustodyPageProps {
  postId: number
}

export interface UserCustodyTimelineCardProps {
  history: CustodyHistoryResponse
  isLoading?: boolean
}

export interface UserCustodyGuardPostFieldProps {
  guardPosts: GuardPostRecord[]
  isLoading: boolean
  errorMessage?: string | null
  selectedGuardPostId: string
  onGuardPostChange: (guardPostId: string) => void
}

export interface UserCustodyStatusSummaryProps {
  activeSession: StoredUserCustodySession | null
  sessionStatus: CustodySessionStatusResponse | null
  onCancel: () => void
  onRetry: () => void
  isCancelling: boolean
  isRetrying: boolean
}

export interface UserCustodyQrCardProps {
  activeSession: StoredUserCustodySession
  sessionStatus: CustodySessionStatusResponse | null
}

export interface UserCustodyResultModalProps {
  isOpen: boolean
  title: string
  message: string
  onClose: () => void
}

export interface UserCustodyFormCardProps {
  guardPosts: GuardPostRecord[]
  isGuardPostsLoading: boolean
  guardPostsErrorMessage?: string | null
  selectedGuardPostId: string
  handoverImage: File | null
  isSubmitting: boolean
  onGuardPostChange: (guardPostId: string) => void
  onHandoverImageChange: (file: File | null) => void
  onOpenQrCode: () => void
}

export interface UserCustodyToastState {
  color: 'danger' | 'success' | 'warning'
  isOpen: boolean
  message: string
}

export interface UserCustodyPageState {
  selectedGuardPostId: string
  handoverImage: File | null
  resultModalStatus: 'accepted' | 'rejected' | null
  showCancelModal: boolean
  toast: UserCustodyToastState
}

export type UserCustodyPageAction =
  | {
    type: 'guardPostChanged'
    guardPostId: string
  }
  | {
    type: 'handoverImageChanged'
    handoverImage: File | null
  }
  | {
    type: 'resultModalDismissed'
  }
  | {
    type: 'resultModalShown'
    status: 'accepted' | 'rejected'
  }
  | {
    type: 'cancelModalDismissed'
  }
  | {
    type: 'cancelModalShown'
  }
  | {
    type: 'toastDismissed'
  }
  | {
    type: 'toastShown'
    color: UserCustodyToastState['color']
    message: string
  }

export type UserCustodySessionMutationResult =
  | CancelCustodySessionResponse
  | RetryUserCustodySessionResult
  | StartUserCustodyAttemptResult
