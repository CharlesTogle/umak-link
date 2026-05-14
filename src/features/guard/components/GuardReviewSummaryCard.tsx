import ExpandableImage from '@/shared/components/ExpandableImage'
import GuardSurfaceCard from '@/features/guard/components/GuardSurfaceCard'
import type {
  GuardReviewImagePanelProps,
  GuardReviewSummaryCardProps
} from '@/features/guard/types/guard-custody'

function formatDateTime (value: string | null): string {
  if (!value) return 'Not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return date.toLocaleString()
}

function GuardReviewImagePanel ({
  title,
  imageAlt,
  imageUrl,
  emptyState,
  testId
}: GuardReviewImagePanelProps) {
  return (
    <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
      <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
        {title}
      </p>
      <div className='mt-3' data-testid={testId}>
        {imageUrl ? (
          <ExpandableImage
            src={imageUrl}
            alt={imageAlt}
            className='h-52 w-full rounded-2xl object-cover'
          />
        ) : (
          <div className='flex h-52 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500'>
            {emptyState}
          </div>
        )}
      </div>
    </div>
  )
}

export default function GuardReviewSummaryCard ({
  scan
}: GuardReviewSummaryCardProps) {
  return (
    <GuardSurfaceCard
      title={scan.item_name}
      subtitle='Guard-facing review of the student handover session.'
      testId='guard-review-summary'
    >
      <div className='space-y-4'>
        <div className='space-y-3 text-sm text-slate-700'>
          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
              Guard Post
            </p>
            <p
              className='mt-2 font-semibold text-slate-900'
              data-testid='guard-review-post-name'
            >
              {scan.guard_post_name || 'Unassigned'}
            </p>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
              Attempt
            </p>
            <p className='mt-2 font-semibold text-slate-900'>
              #{scan.attempt_number}
            </p>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
              Last Seen
            </p>
            <p className='mt-2 font-semibold text-slate-900'>
              {scan.last_seen_location || 'Not available'}
            </p>
            <p className='mt-1 text-xs text-slate-500'>
              {formatDateTime(scan.last_seen_at)}
            </p>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
              Reported
            </p>
            <p className='mt-2 font-semibold text-slate-900'>
              {formatDateTime(scan.submission_date)}
            </p>
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-white p-4'>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
            Description
          </p>
          <p
            className='mt-2 text-sm leading-6 text-slate-700'
            data-testid='guard-review-description'
          >
            {scan.item_description || 'No description provided.'}
          </p>
        </div>

        <div className='space-y-4'>
          <GuardReviewImagePanel
            title='Item Photo'
            imageAlt={`${scan.item_name} item photo`}
            imageUrl={scan.item_image_url}
            emptyState='No item image uploaded.'
            testId='guard-item-image'
          />
          <GuardReviewImagePanel
            title='Handover Evidence'
            imageAlt='Student handover evidence'
            imageUrl={scan.handover_image_url}
            emptyState='No handover image available.'
            testId='guard-handover-image'
          />
        </div>
      </div>
    </GuardSurfaceCard>
  )
}
