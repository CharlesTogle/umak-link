import type { GuardStatusBannerProps } from '@/features/guard/types/guard-custody'

const toneClasses: Record<GuardStatusBannerProps['tone'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800'
}

export default function GuardStatusBanner ({
  tone,
  title,
  description,
  testId
}: GuardStatusBannerProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm font-default-font ${toneClasses[tone]}`}
      data-testid={testId}
    >
      <p className='text-sm font-extrabold'>{title}</p>
      <p className='mt-1 text-sm leading-relaxed'>{description}</p>
    </div>
  )
}
