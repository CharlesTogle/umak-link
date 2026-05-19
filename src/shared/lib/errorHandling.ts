export type ApiErrorContext = 'action' | 'page' | 'auth'

export interface ApiErrorPayload {
  statusCode?: number
  error?: string
  code?: string
  message?: string
  requestId?: string
  retryAfterSeconds?: number
}

const DEFAULT_RATE_LIMIT_SECONDS = 5

const STATUS_ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  408: 'REQUEST_TIMEOUT',
  409: 'CONFLICT',
  410: 'GONE',
  422: 'VALIDATION_FAILED',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_SERVER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
  504: 'REQUEST_TIMEOUT'
}

export function getDefaultErrorCode (statusCode: number): string {
  return STATUS_ERROR_CODES[statusCode] ?? STATUS_ERROR_CODES[500]
}

function formatRateLimitedMessage (retryAfterSeconds?: number): string {
  const seconds = retryAfterSeconds ?? DEFAULT_RATE_LIMIT_SECONDS
  return `You are doing this too fast, please wait ${seconds} second${seconds === 1 ? '' : 's'} before doing the next action.`
}

export function getApiErrorMessageFromPayload (
  payload: Pick<ApiErrorPayload, 'statusCode' | 'code' | 'message' | 'retryAfterSeconds'>,
  context: ApiErrorContext = 'action',
  fallback?: string
): string {
  const statusCode = payload.statusCode ?? 500
  const code = payload.code ?? getDefaultErrorCode(statusCode)
  const message = typeof payload.message === 'string' ? payload.message.trim() : ''

  if (code === 'NETWORK_ERROR' || statusCode === 0) {
    return 'Please check your internet connection and try again.'
  }

  if (code === 'REQUEST_TIMEOUT' || statusCode === 408 || statusCode === 504) {
    return context === 'auth'
      ? 'Request timed out. Please check your internet connection and try again.'
      : 'The request took too long. Please try again.'
  }

  if (code === 'CUSTODY_HANDOVER_LIMIT_REACHED') {
    return message || fallback || 'You can only attempt handover a limited number of times in 1 hour. Please try again later.'
  }

  if (code === 'RATE_LIMITED' || statusCode === 429) {
    return formatRateLimitedMessage(payload.retryAfterSeconds)
  }

  if (code === 'GONE' || statusCode === 410) {
    return fallback ?? 'This session or code already expired. Please start again.'
  }

  if (context === 'auth') {
    if (statusCode === 401 || statusCode === 403) {
      return 'Unable to complete sign in. Please try again.'
    }

    if (statusCode === 404) {
      return 'Page not found.'
    }

    return fallback ?? 'Unable to complete sign in. Please try again.'
  }

  if (context === 'page') {
    if (statusCode === 404 || code === 'NOT_FOUND') {
      return 'Page not found.'
    }

    if (statusCode === 403 || code === 'FORBIDDEN') {
      return 'You are not allowed to do this action.'
    }

    return 'Action didn\'t succeed, please try again later.'
  }

  if (statusCode === 401) {
    return 'Your session expired. Please sign in again.'
  }

  if (statusCode === 403) {
    return 'You are not allowed to do this action.'
  }

  if (statusCode === 404 || code === 'NOT_FOUND') {
    return 'Page not found.'
  }

  if (statusCode === 422) {
    return 'Some information is invalid. Please review and try again.'
  }

  if (statusCode >= 500) {
    return 'Action didn\'t succeed, please try again later.'
  }

  return fallback ?? 'Action didn\'t succeed, please try again later.'
}

export function getUiErrorMessage (
  error: unknown,
  options: { context?: ApiErrorContext; fallback?: string } = {}
): string {
  const { context = 'action', fallback } = options

  if (error && typeof error === 'object') {
    const typed = error as ApiErrorPayload

    if (typeof typed.statusCode === 'number' || typeof typed.code === 'string') {
      return getApiErrorMessageFromPayload({
        statusCode: typed.statusCode,
        code: typed.code,
        message: typed.message,
        retryAfterSeconds: typed.retryAfterSeconds
      }, context, fallback)
    }
  }

  if (error instanceof Error) {
    if (context === 'auth') {
      return fallback ?? 'Unable to complete sign in. Please try again.'
    }

    if (error.message.trim()) {
      return error.message
    }
  }

  return fallback ?? 'Action didn\'t succeed, please try again later.'
}

export function isDuplicateResourceError (error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  return (error as { code?: string }).code === 'DUPLICATE_RESOURCE'
}
