export const LOGOUT_REDIRECT_IN_PROGRESS_KEY = 'logout_redirect_in_progress'

export function isLogoutRedirectInProgress (): boolean {
  return sessionStorage.getItem(LOGOUT_REDIRECT_IN_PROGRESS_KEY) === '1'
}
