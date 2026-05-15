import { useState } from 'react'
import { IonCard, IonCardContent, IonIcon } from '@ionic/react'
import { chevronDown } from 'ionicons/icons'
import type {
  StudentCustodyHistoryEntry,
  StudentCustodyHistoryResponse
} from '@/shared/lib/api-types'
import ExpandableImage from '@/shared/components/ExpandableImage'

function formatDateTime (value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

function getEventAccentColor (event: StudentCustodyHistoryEntry): string {
  switch (event.event_type) {
    case 'guard_accepted':
    case 'claimed_by_student':
      return 'bg-green-500'
    case 'guard_rejected':
    case 'attempt_cancelled':
    case 'session_timed_out':
    case 'discarded':
      return 'bg-umak-red'
    case 'handover_attempted':
      return 'bg-amber-500'
    default:
      return 'bg-umak-blue'
  }
}

function hasExpandableAttemptDetails (entry: StudentCustodyHistoryEntry): boolean {
  return (
    entry.event_type === 'handover_attempted' &&
    Boolean(
      entry.attempt_number ||
        entry.guard_post_name ||
        entry.full_location_name ||
        entry.actor_name ||
        entry.handover_image_url
    )
  )
}

function CustodyTimelineEntry ({
  entry
}: {
  entry: StudentCustodyHistoryEntry
}) {
  const [expanded, setExpanded] = useState(false)
  const canExpand = hasExpandableAttemptDetails(entry)

  return (
    <div
      className='rounded-xl border border-slate-200 p-4'
      data-testid={`user-custody-history-${entry.event_type}`}
    >
      <div className='flex items-start gap-3'>
        <span
          className={`mt-1 h-3 w-3 rounded-full ${getEventAccentColor(entry)}`}
        />
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-semibold text-slate-900'>
                {entry.message}
              </p>
              <p className='mt-1 text-xs text-slate-500'>
                {formatDateTime(entry.occurred_at)}
              </p>
              {entry.guard_post_name && (
                <p className='mt-2 text-xs text-slate-600'>
                  Guard post: {entry.full_location_name ?? entry.guard_post_name}
                </p>
              )}
              {entry.discard_reason && (
                <div className='mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-800'>
                  <span className='font-semibold'>Discarded reason:</span>{' '}
                  {entry.discard_reason}
                </div>
              )}
            </div>

            {canExpand ? (
              <button
                type='button'
                aria-expanded={expanded}
                aria-label={
                  expanded ? 'Hide handover details' : 'Show handover details'
                }
                onClick={() => setExpanded(current => !current)}
                className='rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700'
              >
                <IonIcon
                  icon={chevronDown}
                  className={`text-lg transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
            ) : null}
          </div>

          {expanded ? (
            <div className='mt-4 rounded-xl bg-slate-50 p-4'>
              <div className='grid gap-2 text-xs text-slate-600'>
                {entry.attempt_number ? (
                  <p>
                    <span className='font-semibold text-slate-700'>
                      Attempt:
                    </span>{' '}
                    #{entry.attempt_number}
                  </p>
                ) : null}
                {entry.guard_post_name ? (
                  <p>
                    <span className='font-semibold text-slate-700'>
                      Handover location:
                    </span>{' '}
                    {entry.full_location_name ?? entry.guard_post_name}
                  </p>
                ) : null}
                {entry.actor_name ? (
                  <p>
                    <span className='font-semibold text-slate-700'>
                      Recorded by:
                    </span>{' '}
                    {entry.actor_name}
                  </p>
                ) : null}
              </div>

              {entry.handover_image_url ? (
                <div className='mt-4'>
                  <p className='mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
                    Handover Image
                  </p>
                  <ExpandableImage
                    src={entry.handover_image_url}
                    alt='Handover evidence'
                    className='w-full overflow-hidden rounded-xl border border-slate-200 bg-white'
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

interface CustodyTimelineCardProps {
  history: StudentCustodyHistoryResponse
  isLoading?: boolean
}

export default function CustodyTimelineCard ({
  history,
  isLoading = false
}: CustodyTimelineCardProps) {
  if (isLoading) {
    return (
      <IonCard className='my-4 border border-slate-200/70 shadow-sm'>
        <IonCardContent>
          <div className='animate-pulse space-y-3'>
            <div className='h-4 w-40 rounded bg-slate-200' />
            <div className='h-16 rounded-xl bg-slate-100' />
            <div className='h-16 rounded-xl bg-slate-100' />
          </div>
        </IonCardContent>
      </IonCard>
    )
  }

  return (
    <IonCard
      className='my-4 border border-slate-200/70 shadow-sm'
      data-testid='user-custody-history-card'
    >
      <IonCardContent>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-lg font-extrabold text-umak-blue'>
              Custody Record
            </p>
            <p className='text-sm text-slate-600'>
              Poster-facing custody trail for this found item.
            </p>
          </div>
          <span
            className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600'
            data-testid='user-custody-current-status'
          >
            {history.custody_status.replaceAll('_', ' ')}
          </span>
        </div>

        <div className='mt-4 space-y-3'>
          {history.history.length === 0 && (
            <div className='rounded-xl bg-slate-50 p-4 text-sm text-slate-600'>
              No custody events recorded yet.
            </div>
          )}

          {history.history.map(entry => (
            <CustodyTimelineEntry
              key={entry.history_id}
              entry={entry}
            />
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  )
}
