import FormSectionHeader from '@/shared/components/FormSectionHeader'
import type { UserCustodyGuardPostFieldProps } from '@/features/user/custody/types/user-custody'

export default function UserCustodyGuardPostField ({
  guardPosts,
  isLoading,
  errorMessage = null,
  selectedGuardPostId,
  onGuardPostChange
}: UserCustodyGuardPostFieldProps) {
  const hasNoGuardPosts =
    !isLoading &&
    !errorMessage &&
    guardPosts.length === 0

  const placeholderLabel = isLoading
    ? 'Loading guard posts...'
    : errorMessage
      ? 'Unable to load guard posts'
      : hasNoGuardPosts
        ? 'No active guard posts available'
        : 'Select guard post'

  return (
    <div className='mb-5'>
      <FormSectionHeader header='Guard Post' isRequired={true} />
      <label className='block'>
        <span className='sr-only'>Choose guard post</span>
        <select
          className='w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-umak-blue'
          data-testid='user-custody-guard-post-select'
          disabled={isLoading || Boolean(errorMessage) || hasNoGuardPosts}
          value={selectedGuardPostId}
          onChange={event => onGuardPostChange(event.target.value)}
        >
          <option value=''>{placeholderLabel}</option>
          {guardPosts.map(guardPost => (
            <option
              key={guardPost.guard_post_id}
              value={guardPost.guard_post_id}
            >
              {guardPost.full_location_name ?? guardPost.guard_post_name}
            </option>
          ))}
        </select>
      </label>
      {errorMessage && (
        <p className='mt-2 text-sm text-umak-red'>
          Unable to load guard posts right now. Try reopening this page after
          your connection stabilizes.
        </p>
      )}
      {hasNoGuardPosts && (
        <p className='mt-2 text-sm text-amber-700'>
          No active guard posts are configured yet. Staff must add at least one
          active guard post before handover can start.
        </p>
      )}
    </div>
  )
}
