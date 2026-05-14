import type {
  UserCustodyPageAction,
  UserCustodyPageState
} from '@/features/user/custody/types/user-custody'

export const initialUserCustodyPageState: UserCustodyPageState = {
  selectedGuardPostId: '',
  handoverImage: null,
  resultModalStatus: null,
  showCancelModal: false,
  toast: {
    color: 'danger',
    isOpen: false,
    message: ''
  }
}

export function userCustodyPageReducer (
  state: UserCustodyPageState,
  action: UserCustodyPageAction
): UserCustodyPageState {
  switch (action.type) {
    case 'guardPostChanged':
      return {
        ...state,
        selectedGuardPostId: action.guardPostId
      }
    case 'handoverImageChanged':
      return {
        ...state,
        handoverImage: action.handoverImage
      }
    case 'resultModalDismissed':
      return {
        ...state,
        resultModalStatus: null
      }
    case 'resultModalShown':
      return {
        ...state,
        resultModalStatus: action.status
      }
    case 'cancelModalDismissed':
      return {
        ...state,
        showCancelModal: false
      }
    case 'cancelModalShown':
      return {
        ...state,
        showCancelModal: true
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
