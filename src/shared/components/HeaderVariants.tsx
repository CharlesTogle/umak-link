import { IonSearchbar, IonButton, IonSpinner } from '@ionic/react'
import { type MouseEventHandler, memo, useRef } from 'react'
import Header from './Header'

const HeaderWithSearchBar = memo(
  ({ handleClick }: { handleClick: MouseEventHandler }) => {
    const searchRef = useRef<HTMLIonSearchbarElement>(null)
    return (
      <Header logoShown={true}>
        <IonSearchbar
          ref={searchRef}
          onClick={handleClick}
          placeholder='Search'
          showClearButton='never'
          style={
            {
              ['--border-radius']: '0.5rem'
            } as React.CSSProperties
          }
        />
      </Header>
    )
  }
)

const HeaderWithButtons = memo(
  ({
    loading,
    onCancel,
    onSubmit,
    withSubmit = true
  }: {
    loading: boolean
    onCancel?: () => void
    onSubmit?: () => void
    withSubmit?: boolean
  }) => {
    return (
      <Header logoShown={false} isProfileAndNotificationShown={false}>
        <div className='flex justify-between items-center bg-[#1e2b87] ion-padding-start ion-padding-end'>
          <IonButton
            style={{
              '--background': 'var(--color-umak-red)',
              '--box-shadow': 'none'
            }}
            onClick={() => onCancel?.()}
          >
            Cancel
          </IonButton>
          {withSubmit && (
            <div className='flex items-center space-x-2 w-fit h-fit border-1 border-white rounded-md'>
              <IonButton
                style={{
                  '--background': 'transparent',
                  '--box-shadow': 'none'
                }}
                onClick={() => onSubmit?.()}
                disabled={loading}
              >
                {loading ? <IonSpinner name='crescent' /> : 'Submit'}
              </IonButton>
            </div>
          )}
        </div>
      </Header>
    )
  }
)

export { HeaderWithButtons, HeaderWithSearchBar }
