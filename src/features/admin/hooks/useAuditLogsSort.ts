import { useMemo } from 'react'
import type { AuditLog } from '@/shared/hooks/useAuditLogs'

export function useAuditLogsSort (logs: AuditLog[], sortType: string) {
  const sortedLogs = useMemo(() => {
    const sorted = [...logs]

    if (sortType === 'oldest') {
      sorted.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
        return timeA - timeB
      })
    } else {
      // newest
      sorted.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
        return timeB - timeA
      })
    }

    return sorted
  }, [logs, sortType])

  return sortedLogs
}
