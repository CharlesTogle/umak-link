import React from 'react'
import { IonDatetimeButton, IonModal, IonDatetime } from '@ionic/react'
import FormSectionHeader from './FormSectionHeader'

interface DateTimeSelectorProps {
  header: string
  dateTimeButtonClassName?: string
  isRequired?: boolean
  datetimeId: string
  value?: string
  onChange?: (value: string) => void
  className?: string
  max?: string
  min?: string
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  header,
  isRequired = false,
  datetimeId,
  value,
  onChange,
  className = '',
  dateTimeButtonClassName = '',
  max,
  min
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <FormSectionHeader header={header} isRequired={isRequired} />
      <IonDatetimeButton datetime={datetimeId} className={`flex justify-start ${dateTimeButtonClassName}`} />

      <IonModal keepContentsMounted={true}>
        <IonDatetime
          id={datetimeId}
          value={value}
          onIonChange={e => onChange?.(e.detail.value as string)}
          max={max}
          min={min}
        />
      </IonModal>
    </div>
  )
}

export default DateTimeSelector
