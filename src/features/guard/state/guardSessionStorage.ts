import type {
  GuardDecisionSummary,
  GuardScanResponse,
  StoredGuardScanSession
} from '@/features/guard/types/guard-custody'

const ACTIVE_GUARD_SCAN_SESSION_KEY = 'guard.active-scan-session'
const LAST_GUARD_DECISION_KEY = 'guard.last-decision'

function canUseStorage (): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function readActiveGuardScanSession (): StoredGuardScanSession | null {
  if (!canUseStorage()) return null

  const rawValue = window.sessionStorage.getItem(ACTIVE_GUARD_SCAN_SESSION_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue) as StoredGuardScanSession
  } catch {
    window.sessionStorage.removeItem(ACTIVE_GUARD_SCAN_SESSION_KEY)
    return null
  }
}

export function storeActiveGuardScanSession (
  scan: GuardScanResponse
): StoredGuardScanSession {
  const value: StoredGuardScanSession = {
    scan,
    scanned_at: new Date().toISOString()
  }

  if (canUseStorage()) {
    window.sessionStorage.setItem(
      ACTIVE_GUARD_SCAN_SESSION_KEY,
      JSON.stringify(value)
    )
  }

  return value
}

export function clearActiveGuardScanSession (): void {
  if (!canUseStorage()) return
  window.sessionStorage.removeItem(ACTIVE_GUARD_SCAN_SESSION_KEY)
}

export function readLastGuardDecision (): GuardDecisionSummary | null {
  if (!canUseStorage()) return null

  const rawValue = window.sessionStorage.getItem(LAST_GUARD_DECISION_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue) as GuardDecisionSummary
  } catch {
    window.sessionStorage.removeItem(LAST_GUARD_DECISION_KEY)
    return null
  }
}

export function storeLastGuardDecision (
  summary: GuardDecisionSummary
): GuardDecisionSummary {
  if (canUseStorage()) {
    window.sessionStorage.setItem(
      LAST_GUARD_DECISION_KEY,
      JSON.stringify(summary)
    )
  }

  return summary
}

export function clearLastGuardDecision (): void {
  if (!canUseStorage()) return
  window.sessionStorage.removeItem(LAST_GUARD_DECISION_KEY)
}
