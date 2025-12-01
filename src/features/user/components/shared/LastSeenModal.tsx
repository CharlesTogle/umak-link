import { useRef } from 'react'
import {
  IonDatetimeButton,
  IonModal,
  IonDatetime,
  IonButtons,
  IonButton
} from '@ionic/react'
import './styles/lastSeenModal.css'
import FormSectionHeader from '@/shared/components/FormSectionHeader'

interface LastSeenModalProps {
  date?: string
  handleDateChange: (e: CustomEvent) => void
  isRequired?: boolean
  showTime?: boolean
  hasSelectedDate?: boolean
  onClear?: () => void
  text?: string
}

const LastSeenModal: React.FC<LastSeenModalProps> = ({
  date,
  handleDateChange,
  isRequired = false,
  showTime = true,
  hasSelectedDate = false,
  onClear,
  text
}) => {
  const datetime = useRef<null | HTMLIonDatetimeElement>(null)
  const modalRef = useRef<null | HTMLIonModalElement>(null)
  const reset = () => {
    datetime.current?.reset()
    onClear?.()
    modalRef.current?.dismiss()
  }
  const cancel = () => {
    datetime.current?.cancel()
    modalRef.current?.dismiss()
  }
  const confirm = () => {
    datetime.current?.confirm()
    modalRef.current?.dismiss()
  }

  return (
    <div className='mb-4'>
      <FormSectionHeader header={text || 'Last Seen'} isRequired={isRequired} />
      <div className='flex flex-col space-x-3'>
        {/* Date & Time Picker */}
        <div className='flex flex-row justify-start space-x-5 items-center'>
          {hasSelectedDate ? (
            <IonDatetimeButton datetime='datetime' />
          ) : (
            <button
              onClick={() => modalRef.current?.present()}
              className='px-4! py-2! text-umak-blue! border! border-umak-blue! rounded-md!'
            >
              Select Date
            </button>
          )}
          <IonModal
            keepContentsMounted={true}
            ref={modalRef}
            style={{
              '--ion-background-color': '#0000085'
            }}
          >
            <div className='flex justify-center items-center h-full'>
              <div
                className='w-full h-full bg-transparent z-1 absolute! top-0!'
                onClick={() => modalRef.current?.dismiss()}
              />
              <IonDatetime
                id='datetime'
                presentation={showTime ? 'date-time' : 'date'}
                value={date}
                max={new Date().toISOString()}
                onIonChange={handleDateChange}
                className='z-2'
                ref={datetime}
                formatOptions={
                  showTime
                    ? {
                        date: {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric'
                        },
                        time: { hour: '2-digit', minute: '2-digit' }
                      }
                    : {
                        date: {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric'
                        }
                      }
                }
              >
                <IonButtons slot='buttons'>
                  <IonButton color='danger' onClick={reset}>
                    {hasSelectedDate ? 'Clear' : 'Reset'}
                  </IonButton>
                  <IonButton color='primary' onClick={cancel}>
                    Never mind
                  </IonButton>
                  <IonButton color='primary' onClick={confirm}>
                    All Set
                  </IonButton>
                </IonButtons>
              </IonDatetime>
            </div>
          </IonModal>
        </div>
      </div>
    </div>
  )
}

export default LastSeenModal
