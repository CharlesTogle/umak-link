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
}

const LastSeenModal: React.FC<LastSeenModalProps> = ({
  date,
  handleDateChange,
  isRequired = false,
  showTime = true
}) => {
  const datetime = useRef<null | HTMLIonDatetimeElement>(null)
  const modalRef = useRef<null | HTMLIonModalElement>(null)
  const reset = () => {
    datetime.current?.reset()
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
      <FormSectionHeader header='Last Seen' isRequired={isRequired} />
      <div className='flex flex-col space-x-3'>
        {/* Date & Time Picker */}
        <div className='flex flex-row justify-start space-x-5 items-center'>
          <IonDatetimeButton datetime='datetime' />
          <IonModal keepContentsMounted={true} ref={modalRef}>
            <IonDatetime
              id='datetime'
              presentation={showTime ? 'date-time' : 'date'}
              value={date}
              onIonChange={handleDateChange}
              ref={datetime}
              formatOptions={
                showTime
                  ? {
                      date: { month: 'short', day: '2-digit', year: 'numeric' },
                      time: { hour: '2-digit', minute: '2-digit' }
                    }
                  : {
                      date: { month: 'short', day: '2-digit', year: 'numeric' }
                    }
              }
            >
              <IonButtons slot='buttons'>
                <IonButton color='danger' onClick={reset}>
                  Reset
                </IonButton>
                <IonButton color='primary' onClick={cancel}>
                  Never mind
                </IonButton>
                <IonButton color='primary' onClick={confirm}>
                  All Set
                </IonButton>
              </IonButtons>
            </IonDatetime>
          </IonModal>
        </div>
      </div>
    </div>
  )
}

export default LastSeenModal
