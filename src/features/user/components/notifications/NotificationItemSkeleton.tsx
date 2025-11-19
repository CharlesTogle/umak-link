export default function NotificationItemSkeleton () {
  return (
    <div className='flex items-start gap-3 px-3 py-3 border-b border-slate-200 animate-pulse'>
      <div className='w-6 h-6 rounded-full bg-gray-200 mt-0.5' />
      <div className='flex-1 min-w-0'>
        <div className='h-4 bg-gray-200 rounded w-3/5 mb-2' />
        <div className='h-3 bg-gray-200 rounded w-4/5' />
      </div>
      <div className='w-6 h-6 bg-gray-200 rounded' />
    </div>
  )
}
