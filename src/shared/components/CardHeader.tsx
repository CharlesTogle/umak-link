import { IonIcon } from '@ionic/react'

export default function CardHeader ({
  icon,
  title,
  iconSize = '32px',
  hasLineBelow = true,
  titleClass = ''
}: {
  icon: string
  title: string
  iconSize?: string
  hasLineBelow?: boolean
  titleClass?: string
}) {
  return (
    <>
      <div className='flex items-center space-x-2'>
        <IonIcon
          icon={icon}
          className='text-[#1e2b87]'
          style={{ fontSize: iconSize, ['--ionicon-stroke-width']: '40px' }}
        />
        <div
          className={`text-umak-blue font-default-font ${titleClass} font-light`}
        >
          {title}
        </div>
      </div>
      {hasLineBelow && <div className='h-px w-full bg-black my-3'> </div>}
    </>
  )
}
