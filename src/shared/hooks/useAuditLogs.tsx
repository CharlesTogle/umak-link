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

const INSERT_AUDIT_LOG_RPC = 'insert_audit_log'

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

      return data
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
      return data
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
      return data || []
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
      return data || []
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
      return data || []
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
