import type {
  GuardSessionSummaryProps
} from '@/features/guard/types/guard-custody'

function formatDateTime (value: string | null): string {
  if (!value) return 'Not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return date.toLocaleString()
}

export default function GuardSessionSummary ({
  activeSession,
  latestDecision,
  onLatestDecisionClick
}: GuardSessionSummaryProps) {
  return (
    <div className='space-y-4'>
      {activeSession ? (
        <div
          className='rounded-2xl border border-slate-200 bg-slate-50 p-4'
          data-testid='guard-active-session'
        >
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
            Active Review
          </p>
          <h3 className='mt-2 text-base font-extrabold text-slate-900'>
            {activeSession.scan.item_name}
          </h3>
          <dl className='mt-3 space-y-3 text-sm text-slate-600'>
            <div className='flex items-start justify-between gap-3 border-b border-slate-200 pb-3'>
              <dt className='font-semibold text-slate-800'>Guard Post</dt>
              <dd className='text-right'>
                {activeSession.scan.guard_post_name || 'Unassigned'}
              </dd>
            </div>
            <div className='flex items-start justify-between gap-3 border-b border-slate-200 pb-3'>
              <dt className='font-semibold text-slate-800'>Attempt Number</dt>
              <dd>{activeSession.scan.attempt_number}</dd>
            </div>
            <div className='flex items-start justify-between gap-3 border-b border-slate-200 pb-3'>
              <dt className='font-semibold text-slate-800'>Scanned</dt>
              <dd className='max-w-[12rem] text-right'>
                {formatDateTime(activeSession.scanned_at)}
              </dd>
            </div>
            <div className='flex items-start justify-between gap-3'>
              <dt className='font-semibold text-slate-800'>Status</dt>
              <dd className='capitalize'>{activeSession.scan.attempt_status}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div
          className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600'
          data-testid='guard-no-active-session'
        >
          No custody review is active yet. Start from the scan screen when a student presents a handover QR.
        </div>
      )}

      {latestDecision ? (
        <button
          type='button'
          onClick={onLatestDecisionClick}
          disabled={!onLatestDecisionClick}
          className='w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left disabled:cursor-default'
          data-testid='guard-latest-decision'
        >
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
            Latest Decision
          </p>
          <h3 className='mt-2 text-base font-extrabold text-slate-900'>
            {latestDecision.item_name}
          </h3>
          <p className='mt-2 text-sm text-slate-600'>
            {latestDecision.attempt_status === 'accepted'
              ? 'Accepted'
              : 'Rejected'} at {formatDateTime(latestDecision.decision_at)}
          </p>
          <p className='mt-1 text-sm text-slate-600'>
            Guard post: {latestDecision.guard_post_name || 'Unassigned'}
          </p>
          {onLatestDecisionClick ? (
            <p className='mt-3 text-xs font-medium text-umak-blue'>
              Tap to open the full post record.
            </p>
          ) : null}
        </button>
      ) : null}
    </div>
  )
}
