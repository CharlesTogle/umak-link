import {
  IonCard,
  IonCardContent,
  IonAvatar,
  IonButton,
  IonIcon
} from '@ionic/react'
import { personCircle, close } from 'ionicons/icons'

interface SelectedUser {
  id: string
  name: string
  email: string
  image?: string | null
}

interface SelectedUserCardProps {
  user: SelectedUser
  onRemove: () => void
}

export default function SelectedUserCard ({
  user,
  onRemove
}: SelectedUserCardProps) {
  return (
    <IonCard className='mb-6 rounded-2xl shadow-sm border border-slate-200/70'>
      <IonCardContent className='p-4'>
        <div className='flex items-center gap-4'>
          <IonAvatar className='w-16 h-16 shrink-0'>
            {user.image ? (
              <img src={user.image} alt={user.name} className='object-cover' />
            ) : (
              <div className='w-full h-full grid place-items-center bg-slate-100 text-slate-500'>
                <IonIcon icon={personCircle} className='text-5xl' />
              </div>
            )}
          </IonAvatar>

          <div className='flex-1 min-w-0'>
            <div className='text-sm text-indigo-700 font-medium'>Claimer</div>
            <div className='text-lg font-extrabold text-slate-900 truncate'>
              {user.name}
            </div>
            <div className='text-sm text-slate-500 truncate'>{user.email}</div>
          </div>

          <IonButton
            onClick={onRemove}
            fill='clear'
            className='text-slate-500 hover:text-red-600'
            aria-label='Remove user'
          >
            <IonIcon slot='icon-only' icon={close} className='text-2xl' />
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  )
}
