import { useState, useEffect } from 'react'
import { useAuditLogs, type AuditLog } from '@/shared/hooks/useAuditLogs'

const LOGS_LIMIT = 20

export function useAuditLogsFetch () {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const { readAllAuditLogs } = useAuditLogs()

  useEffect(() => {
    loadAuditLogs()
  }, [])

  const loadAuditLogs = async () => {
    setLoading(true)
    const logs = await readAllAuditLogs(LOGS_LIMIT, offset)

    if (logs.length > 0) {
      const mergedIds = new Set(auditLogs.map(log => log.log_id))
      const uniqueLogs = [
        ...auditLogs,
        ...logs.filter(log => !mergedIds.has(log.log_id))
      ]

      setAuditLogs(uniqueLogs)

      setOffset(prevOffset => prevOffset + logs.length)
      setHasMore(logs.length === LOGS_LIMIT)
    } else {
      setHasMore(false)
    }

    setLoading(false)
  }

  const handleRefresh = async () => {
    const logs = await readAllAuditLogs(LOGS_LIMIT, 0)
    if (logs.length > 0) {
      setAuditLogs(logs)
      setOffset(0 + logs.length)
      setHasMore(logs.length === LOGS_LIMIT)
    }
  }

  const handleLoadMore = async () => {
    await loadAuditLogs()
  }

  return {
    auditLogs,
    loading,
    hasMore,
    handleRefresh,
    handleLoadMore
  }
}
