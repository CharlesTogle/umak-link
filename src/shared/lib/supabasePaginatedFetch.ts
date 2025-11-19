import type { SupabaseClient } from '@supabase/supabase-js'

export type PaginateOptions = {
  supabase: SupabaseClient
  table?: string
  select?: string
  dateField?: string
  gte: string
  lte: string
  batchSize?: number
  onBatch: (rows: any[]) => Promise<void> | void
}

/**
 * Fetch rows from Supabase in pages using offset-range paging.
 * Calls `onBatch` for each page so callers can stream/process results
 * without keeping the entire dataset in memory.
 */
export async function fetchPaginatedRows (options: PaginateOptions) {
  const {
    supabase,
    table = 'post_public_view',
    select = '*',
    dateField = 'submission_date',
    gte,
    lte,
    batchSize = 10000,
    onBatch
  } = options

  let offset = 0

  while (true) {
    const from = offset
    const to = offset + batchSize - 1

    const { data, error } = await supabase
      .from(table)
      .select(select)
      .gte(dateField, gte)
      .lte(dateField, lte)
      .order(dateField, { ascending: true })
      .range(from, to)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    await onBatch(data)

    if (data.length < batchSize) {
      break
    }

    offset += batchSize
  }
}

export default fetchPaginatedRows
