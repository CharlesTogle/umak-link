import type { FraudReportPublic } from '@/features/staff/hooks/useFraudReports'

export type ReportStatus = 'All' | 'Under Review' | 'Verified' | 'Rejected'

export const STATUS_MAP: Record<Exclude<ReportStatus, 'All'>, string> = {
  'Under Review': 'under_review',
  Verified: 'verified',
  Rejected: 'rejected'
}

export type SortDirection = 'asc' | 'desc'

/**
 * Filter reports based on active filters
 * @param items - Array of fraud reports to filter
 * @param activeFilters - Set of active filter labels
 * @returns Filtered array of reports
 */
export const filterReports = (
  items: FraudReportPublic[],
  activeFilters: Set<ReportStatus>
): FraudReportPublic[] => {
  if (activeFilters.has('All')) return items

  const expectedValues = Array.from(activeFilters)
    .filter(f => f !== 'All')
    .map(f => STATUS_MAP[f as Exclude<ReportStatus, 'All'>])

  return items.filter(report => {
    const reportStatus = report.report_status || ''
    return expectedValues.includes(reportStatus)
  })
}

/**
 * Sort reports by date
 * @param items - Array of fraud reports to sort
 * @param sortDirection - Sort direction ('asc' or 'desc')
 * @returns Sorted array of reports
 */
export const sortReports = (
  items: FraudReportPublic[],
  sortDirection: SortDirection = 'desc'
): FraudReportPublic[] => {
  return [...items].sort((a, b) => {
    const as = a.date_reported || ''
    const bs = b.date_reported || ''
    if (!as && !bs) return 0
    if (!as) return 1
    if (!bs) return -1
    return sortDirection === 'desc'
      ? (bs as string).localeCompare(as as string)
      : (as as string).localeCompare(bs as string)
  })
}

/**
 * Apply both filtering and sorting to reports
 * @param items - Array of fraud reports
 * @param activeFilters - Set of active filter labels
 * @param sortDirection - Sort direction
 * @returns Filtered and sorted array of reports
 */
export const applyFiltersAndSort = (
  items: FraudReportPublic[],
  activeFilters: Set<ReportStatus>,
  sortDirection: SortDirection = 'desc'
): FraudReportPublic[] => {
  return sortReports(filterReports(items, activeFilters), sortDirection)
}
