import { IonCard, IonCardContent } from '@ionic/react'

interface AnalyticsCardProps {
  title: string
  value: number
  color: string
  textColor: string
  loading?: boolean
}

export default function AnalyticsCard ({
  title,
  value,
  color,
  textColor,
  loading
}: AnalyticsCardProps) {
  return (
    <IonCard className={`${color} rounded-lg flex flex-col justify-center`}>
      <IonCardContent>
        {loading ? (
          <div className='space-y-2'>
            <div className='h-4 w-28 bg-gray-200 rounded animate-pulse' />
            <div className='h-10 w-24 bg-gray-200 rounded animate-pulse' />
          </div>
        ) : (
          <>
            <p className='text-sm! font-semibold! text-slate-900 mb-2'>
              {title}
            </p>
            <p className={`text-3xl! font-bold ${textColor}`}>{value}</p>
          </>
        )}
      </IonCardContent>
    </IonCard>
  )
}
