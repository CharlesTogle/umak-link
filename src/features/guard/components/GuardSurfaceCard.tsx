import type { GuardSurfaceCardProps } from '@/features/guard/types/guard-custody'

export default function GuardSurfaceCard ({
  title,
  subtitle,
  children,
  testId
}: GuardSurfaceCardProps) {
  return (
    <section
      className='rounded-2xl border border-gray-200 bg-white p-4 shadow-md font-default-font'
      data-testid={testId}
    >
      <header className='mb-3'>
        <h2 className='text-base font-extrabold text-umak-blue'>{title}</h2>
        {subtitle ? (
          <p className='mt-1 text-sm leading-relaxed text-slate-600'>{subtitle}</p>
        ) : null}
      </header>
      <div className='mb-4 h-px w-full bg-slate-200' />
      {children}
    </section>
  )
}
