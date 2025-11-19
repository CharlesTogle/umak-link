import React, { useMemo } from 'react'
import { IonSelect, IonSelectOption } from '@ionic/react'
import { locationsData } from '@/features/user/configs/locationsData'
import type { Level1, Level2 } from '@/features/user/configs/locationsData'
import FormSectionHeader from '@/shared/components/FormSectionHeader'

interface LocationDetails {
  level1: string
  level2: string
  level3: string
}

interface LocationDetailsSelectorProps {
  locationDetails: LocationDetails
  setLocationDetails: React.Dispatch<React.SetStateAction<LocationDetails>>
  className?: string
  isRequired?: boolean
}

const LocationDetailsSelector: React.FC<LocationDetailsSelectorProps> = ({
  locationDetails,
  setLocationDetails,
  className = '',
  isRequired = false
}) => {
  // ------------------ DYNAMIC OPTIONS ------------------
  const level1Options: string[] = locationsData.map(
    (level1: Level1) => level1.name
  )

  const level2Options: string[] = useMemo(() => {
    const level1: Level1 | undefined = locationsData.find(
      (l1: Level1) => l1.name === locationDetails.level1
    )
    return level1 ? level1.level2.map((level2: Level2) => level2.name) : []
  }, [locationDetails.level1])

  const level3Options: string[] = useMemo(() => {
    const level1: Level1 | undefined = locationsData.find(
      (l1: Level1) => l1.name === locationDetails.level1
    )
    const level2: Level2 | undefined = level1?.level2.find(
      (l2: Level2) => l2.name === locationDetails.level2
    )
    const level3: string[] = level2 ? level2.level3 : []
    return level3.length ? level3 : ['Not Applicable']
  }, [locationDetails.level1, locationDetails.level2])

  // ------------------ UI ------------------
  return (
    <div className={`mb-4 ${className}`}>
      <FormSectionHeader header='Location' isRequired={isRequired} />
      {/* Building / Area */}
      <IonSelect
        placeholder='Building/Area'
        value={locationDetails.level1}
        onIonChange={e =>
          setLocationDetails(prev => ({
            ...prev,
            level1: e.detail.value,
            level2: '',
            level3: ''
          }))
        }
      >
        {level1Options.map((b: string) => (
          <IonSelectOption key={b} value={b}>
            {b}
          </IonSelectOption>
        ))}
      </IonSelect>

      {/* Floor / Side */}
      <IonSelect
        placeholder='Floor/Side'
        disabled={!locationDetails.level1}
        value={locationDetails.level2}
        onIonChange={e =>
          setLocationDetails(prev => ({
            ...prev,
            level2: e.detail.value,
            level3: ''
          }))
        }
      >
        {level2Options.map((f: string) => (
          <IonSelectOption key={f} value={f}>
            {f}
          </IonSelectOption>
        ))}
      </IonSelect>

      {/* Place / Room */}
      <IonSelect
        placeholder='Room/Place'
        disabled={!locationDetails.level2}
        value={locationDetails.level3}
        onIonChange={e =>
          setLocationDetails(prev => ({
            ...prev,
            level3: e.detail.value
          }))
        }
      >
        {level3Options.map((p: string) => (
          <IonSelectOption key={p} value={p}>
            {p}
          </IonSelectOption>
        ))}
      </IonSelect>
    </div>
  )
}

export default LocationDetailsSelector
