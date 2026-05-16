import { IonIcon } from '@ionic/react'
import {
  chevronForward,
  cubeOutline,
  locationOutline,
  personCircle
} from 'ionicons/icons'
import LazyImage from '@/shared/components/LazyImage'
import type { GuardActiveClaimReviewRecord } from '@/shared/lib/api-types'

interface GuardActiveClaimReviewListProps {
  posts: GuardActiveClaimReviewRecord[]
  isLoading: boolean
  errorMessage: string | null
  emptyMessage: string
  onPostClick: (postId: number) => void
}

function formatDateTime (value: string | null): string {
  if (!value) return 'Unknown'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'

  return parsed.toLocaleString()
}

function formatStatusLabel (value: string | null): string {
  if (!value) return 'With Guard'
  if (value === 'with_guard') return 'Accepted Handover'

  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function GuardActiveClaimReviewList ({
  posts,
  isLoading,
  errorMessage,
  emptyMessage,
  onPostClick
}: GuardActiveClaimReviewListProps) {
  return (
    <>
      {isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`guard-active-review-skeleton-${index}`}
              className='rounded-2xl border border-slate-200 bg-slate-50 p-4'
            >
              <div className='h-5 w-40 animate-pulse rounded-full bg-slate-200' />
              <div className='mt-3 h-4 w-full animate-pulse rounded-full bg-slate-100' />
              <div className='mt-2 h-4 w-3/4 animate-pulse rounded-full bg-slate-100' />
            </div>
          ))}
        </div>
      ) : null}

      {errorMessage ? (
        <div className='rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700'>
          {errorMessage}
        </div>
      ) : null}

      {!isLoading && !errorMessage && posts.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600'>
          {emptyMessage}
        </div>
      ) : null}

      <div className='space-y-3'>
        {posts.map(post => (
          <button
            key={post.post_id}
            type='button'
            onClick={() => onPostClick(post.post_id)}
            className='w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition active:scale-[0.99]'
            data-testid={`guard-custody-post-${post.post_id}`}
          >
            <div className='flex gap-4'>
              <div className='h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white'>
                {post.item_image_url ? (
                  <LazyImage
                    src={post.item_image_url}
                    alt={post.item_name ?? 'Guard custody item'}
                    className='h-full w-full'
                    overlay={false}
                  />
                ) : (
                  <div className='flex h-full items-center justify-center text-center text-xs text-slate-400'>
                    No image
                  </div>
                )}
              </div>

              <div className='min-w-0 flex-1'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='truncate text-base font-extrabold text-slate-900'>
                      {post.item_name ?? 'Untitled item'}
                    </p>
                    <p className='mt-1 line-clamp-2 text-sm leading-5 text-slate-600'>
                      {post.item_description ?? 'No description provided.'}
                    </p>
                  </div>
                  <IonIcon
                    icon={chevronForward}
                    className='mt-0.5 shrink-0 text-lg text-slate-400'
                  />
                </div>

                <div className='mt-3 flex items-center gap-3'>
                  {post.poster_profile_picture_url ? (
                    <img
                      src={post.poster_profile_picture_url}
                      alt={`${post.poster_name ?? 'Poster'} profile`}
                      className='h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover'
                    />
                  ) : (
                    <div className='grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-400'>
                      <IonIcon icon={personCircle} className='text-2xl' />
                    </div>
                  )}

                  <div className='min-w-0'>
                    <p className='truncate text-sm font-semibold text-slate-900'>
                      {post.poster_name ?? 'Unknown poster'}
                    </p>
                    <p className='text-xs text-slate-500'>Poster</p>
                  </div>
                </div>

                <div className='mt-3 flex flex-wrap gap-2 text-xs text-slate-600'>
                  <span className='rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700'>
                    {formatStatusLabel(post.custody_status)}
                  </span>
                  <span className='rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700'>
                    {post.category ?? 'No category'}
                  </span>
                </div>

                <div className='mt-3 space-y-2 text-sm text-slate-600'>
                  <p className='flex items-center gap-2'>
                    <IonIcon icon={locationOutline} className='text-base text-slate-400' />
                    <span className='truncate'>
                      {post.last_seen_location ?? 'Unknown location'}
                    </span>
                  </p>
                  <p className='flex items-center gap-2'>
                    <IonIcon icon={cubeOutline} className='text-base text-slate-400' />
                    <span>{formatDateTime(post.submitted_on_date_local)}</span>
                  </p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
