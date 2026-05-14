import type {
  GuardReviewAction,
  GuardReviewState
} from '@/features/guard/types/guard-custody'

export const initialGuardReviewState: GuardReviewState = {
  decisionReason: '',
  toast: {
    color: 'danger',
    isOpen: false,
    message: ''
  }
}

export function guardReviewReducer (
  state: GuardReviewState,
  action: GuardReviewAction
): GuardReviewState {
  switch (action.type) {
    case 'decisionReasonChanged':
      return {
        ...state,
        decisionReason: action.value
      }
    case 'toastDismissed':
      return {
        ...state,
        toast: {
          ...state.toast,
          isOpen: false
        }
      }
    case 'toastShown':
      return {
        ...state,
        toast: {
          color: action.color,
          isOpen: true,
          message: action.message
        }
      }
    default:
      return state
  }
}
