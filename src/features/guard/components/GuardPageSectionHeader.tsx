import { IonIcon } from '@ionic/react'

interface GuardPageSectionHeaderProps {
  title: string
  subtitle: string
  icon: string
  testId?: string
}

export default function GuardPageSectionHeader ({
  title,
  subtitle,
  icon,
  testId
}: GuardPageSectionHeaderProps) {
  return (
    <div
      className='border-y border-slate-200 bg-white px-4 py-3 font-default-font'
      data-testid={testId}
    >
      <div className='flex items-center gap-3'>
        <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1e2b87]/10'>
          <IonIcon icon={icon} className='text-2xl text-[#1e2b87]' />
        </div>
        <div className='min-w-0'>
          <p className='text-base font-extrabold text-umak-blue'>{title}</p>
          <p className='text-xs leading-5 text-slate-500'>{subtitle}</p>
        </div>
      </div>
    </div>
  )
}
