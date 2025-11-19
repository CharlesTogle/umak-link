import { supabase } from '@/shared/lib/supabase'

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
      const { data, error } = await supabase.rpc(INSERT_AUDIT_LOG_RPC, {
        p_user_id: logData.user_id,
        p_action_type: logData.action_type,
        p_details: logData.details || null
      })

      if (error) {
        console.error('Error inserting audit log:', error)
        return null
      }

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
      const { data, error } = await supabase
        .from('audit_table')
        .select('*')
        .eq('log_id', logId)
        .single()

      if (error) {
        console.error('Error reading audit log:', error)
        return null
      }

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
      const { data, error } = await supabase
        .from('view_audit_logs_with_user_details')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error reading all audit logs:', error)
        return []
      }

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
      const { data, error } = await supabase
        .from('audit_table')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error reading user audit logs:', error)
        return []
      }

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
      const { data, error } = await supabase
        .from('audit_table')
        .select('*')
        .eq('action_type', actionType)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error reading audit logs by action:', error)
        return []
      }

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
