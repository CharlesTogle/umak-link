import { adminApiService } from '@/shared/services'

// Types
export interface AuditLog {
  log_id: string
  user_id: string | null
  user_name: string | null
  email: string | null
  profile_picture_url: string | null
  action_type: string | null
  details: Record<string, any> | null
  timestamp: string | null // ISO timestamp with timezone
  timestamp_local: string | null
}

export interface CreateAuditLogInput {
  user_id: string
  action_type: string
  details?: any
}

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getString (value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function normalizeAuditLog (value: unknown): AuditLog | null {
  if (!isRecord(value)) return null
  const userTable = isRecord(value.user_table) ? value.user_table : null
  const logId = getString(value.log_id) ?? getString(value.audit_id)
  if (!logId) return null

  return {
    log_id: logId,
    user_id: getString(value.user_id),
    user_name: getString(value.user_name) ?? getString(userTable?.user_name),
    email: getString(value.email) ?? getString(userTable?.email),
    profile_picture_url:
      getString(value.profile_picture_url) ??
      getString(userTable?.profile_picture_url),
    action_type: getString(value.action_type) ?? getString(value.action),
    details:
      (isRecord(value.details) ? value.details : null) ??
      (isRecord(value.changes) ? value.changes : null),
    timestamp: getString(value.timestamp),
    timestamp_local: getString(value.timestamp_local) ?? getString(value.timestamp)
  }
}

export function useAuditLogs () {
  /**
   * Insert a new audit log entry
   * @param logData - The audit log data to insert
   * @returns The created audit log or null if failed
   */
  const insertAuditLog = async (
    logData: CreateAuditLogInput
  ): Promise<AuditLog | null> => {
    try {
      const data = await adminApiService.insertAuditLog({
        userId: logData.user_id,
        action: logData.action_type,
        tableName: 'audit_table',
        recordId: logData.user_id,
        changes: logData.details || {}
      })

      return {
        log_id: data.audit_id,
        user_id: logData.user_id,
        user_name: null,
        email: null,
        profile_picture_url: null,
        action_type: logData.action_type,
        details: isRecord(logData.details) ? logData.details : null,
        timestamp: null,
        timestamp_local: null
      }
    } catch (error) {
      console.error('Exception inserting audit log:', error)
      return null
    }
  }

  /**
   * Read a single audit log by log_id
   * @param logId - The UUID of the audit log
   * @returns The audit log or null if not found
   */
  const readAuditLog = async (logId: string): Promise<AuditLog | null> => {
    try {
      const data = await adminApiService.getAuditLog(logId)
      return normalizeAuditLog(data)
    } catch (error) {
      console.error('Exception reading audit log:', error)
      return null
    }
  }

  /**
   * Read all audit logs
   * @param limit - Optional limit for number of records (default: 100)
   * @param offset - Optional offset for pagination (default: 0)
   * @returns Array of audit logs or empty array if failed
   */
  const readAllAuditLogs = async (
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> => {
    try {
      const data = await adminApiService.getAuditLogs(limit, offset)
      return (data ?? []).flatMap(log => {
        const normalized = normalizeAuditLog(log)
        return normalized ? [normalized] : []
      })
    } catch (error) {
      console.error('Exception reading all audit logs:', error)
      return []
    }
  }

  /**
   * Read all audit logs for a specific user
   * @param userId - The UUID of the user
   * @param limit - Optional limit for number of records (default: 100)
   * @param offset - Optional offset for pagination (default: 0)
   * @returns Array of audit logs or empty array if failed
   */
  const readAuditLogsByUser = async (
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> => {
    try {
      const data = await adminApiService.getAuditLogsByUser(userId, limit, offset)
      return (data ?? []).flatMap(log => {
        const normalized = normalizeAuditLog(log)
        return normalized ? [normalized] : []
      })
    } catch (error) {
      console.error('Exception reading user audit logs:', error)
      return []
    }
  }

  /**
   * Read audit logs by action type
   * @param actionType - The action type to filter by
   * @param limit - Optional limit for number of records (default: 100)
   * @param offset - Optional offset for pagination (default: 0)
   * @returns Array of audit logs or empty array if failed
   */
  const readAuditLogsByAction = async (
    actionType: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> => {
    try {
      const data = await adminApiService.getAuditLogsByAction(actionType, limit, offset)
      return (data ?? []).flatMap(log => {
        const normalized = normalizeAuditLog(log)
        return normalized ? [normalized] : []
      })
    } catch (error) {
      console.error('Exception reading audit logs by action:', error)
      return []
    }
  }

  return {
    insertAuditLog,
    readAuditLog,
    readAllAuditLogs,
    readAuditLogsByUser,
    readAuditLogsByAction
  }
}
