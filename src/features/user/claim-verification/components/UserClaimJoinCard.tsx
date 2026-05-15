import { IonButton, IonInput, IonSpinner } from '@ionic/react'

interface UserClaimJoinCardProps {
  isJoining: boolean
  joinCode: string
  onJoin: () => void
  onJoinCodeChange: (value: string) => void
  onResume?: () => void
  hasActiveSession: boolean
}

export default function UserClaimJoinCard ({
  isJoining,
  joinCode,
  onJoin,
  onJoinCodeChange,
  onResume,
  hasActiveSession
}: UserClaimJoinCardProps) {
  return (
    <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-md'>
      <p className='text-lg font-extrabold text-umak-blue'>Join Claim Session</p>
      <p className='mt-3 text-sm leading-relaxed text-slate-700'>
        Enter the join code shown on the guard or staff claim screen. UMak-LINK
        will generate your unique claim QR for this verification session.
      </p>

      <div className='mt-4'>
        <IonInput
          value={joinCode}
          fill='outline'
          label='Join Code'
          labelPlacement='stacked'
          placeholder='Enter the join code'
          onIonInput={event => onJoinCodeChange(event.detail.value ?? '')}
        />
      </div>

      <IonButton
        className='mt-4'
        expand='block'
        disabled={isJoining || !joinCode.trim()}
        onClick={onJoin}
        style={{
          '--background': 'var(--color-umak-blue)'
        }}
      >
        {isJoining ? <IonSpinner name='crescent' /> : 'Generate Claim QR'}
      </IonButton>

      {hasActiveSession && onResume ? (
        <IonButton
          className='mt-2'
          expand='block'
          fill='outline'
          onClick={onResume}
        >
          Resume Active Session
        </IonButton>
      ) : null}
    </div>
  )
}
