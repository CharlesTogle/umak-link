import { useMemo } from 'react'
import type { AuditLog } from '@/shared/hooks/useAuditLogs'

interface FilterParsed {
  actionTypes: Set<string>
  userNames: Set<string>
}

export function useAuditLogsFilter (
  logs: AuditLog[],
  activeFilters: Set<string>,
  startDate: string,
  endDate: string
) {
  const parseFilters = (filters: Set<string>): FilterParsed => {
    const actionTypes = new Set<string>()
    const userNames = new Set<string>()

    filters.forEach(filter => {
      if (filter.startsWith('action:')) {
        actionTypes.add(filter.replace('action:', ''))
      } else if (filter.startsWith('user:')) {
        userNames.add(filter.replace('user:', ''))
      }
    })

    return { actionTypes, userNames }
  }

  const filteredLogs = useMemo(() => {
    const { actionTypes, userNames } = parseFilters(activeFilters)

    return logs.filter(log => {
      // Filter by action type
      if (
        actionTypes.size > 0 &&
        (!log.action_type || !actionTypes.has(log.action_type))
      ) {
        return false
      }

      // Filter by user names
      if (
        userNames.size > 0 &&
        log.user_name &&
        !userNames.has(log.user_name)
      ) {
        return false
      }

      // Filter by date range
      if (log.timestamp) {
        const logDate = new Date(log.timestamp)
        if (startDate) {
          const start = new Date(startDate)
          if (logDate < start) return false
        }
        if (endDate) {
          const end = new Date(endDate)
          if (logDate > end) return false
        }
      }

      return true
    })
  }, [logs, activeFilters, startDate, endDate])

  return filteredLogs
}
