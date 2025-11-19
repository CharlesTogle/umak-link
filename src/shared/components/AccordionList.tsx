import React from 'react'
import { IonAccordionGroup, IonAccordion } from '@ionic/react'

type AccordionListProps<T> = {
  items: T[]
  getKey: (item: T, index: number) => string
  renderHeader: (item: T, index: number) => React.ReactNode
  renderContent: (item: T, index: number) => React.ReactNode
  value?: string | undefined
  onChange?: (value: string | undefined) => void
}

function AccordionList<T> ({
  items,
  getKey,
  renderHeader,
  renderContent,
  value,
  onChange
}: AccordionListProps<T>) {
  return (
    <IonAccordionGroup
      value={value}
      onIonChange={e => onChange?.(e.detail.value)}
    >
      {items.map((item, index) => (
        <IonAccordion key={getKey(item, index)} value={getKey(item, index)}>
          <div slot='header'>{renderHeader(item, index)}</div>
          <div slot='content'>{renderContent(item, index)}</div>
        </IonAccordion>
      ))}
    </IonAccordionGroup>
  )
}

export default AccordionList
