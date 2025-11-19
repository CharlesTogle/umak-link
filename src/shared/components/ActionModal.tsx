import React from 'react'
import { IonModal, IonButton, IonIcon } from '@ionic/react'
import type { ReactNode } from 'react'

export type ActionItem = {
  text: string
  icon?: string
  onClick: (close: () => void) => void
  cssClass?: string | string[]
  iconColor?: string
}

interface ActionModalProps {
  isOpen: boolean
  onDidDismiss: () => void
  header?: string | ReactNode
  actions: ActionItem[]
  backdropDismiss?: boolean
  initialBreakpoint?: number
  breakpoints?: number[]
  className?: string
}

const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onDidDismiss,
  header = undefined,
  actions,
  backdropDismiss = true,
  initialBreakpoint = 0.25,
  breakpoints = [0, 0.25, 0.35],
  className = ''
}) => {
  const close = () => onDidDismiss()

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      backdropDismiss={backdropDismiss}
      initialBreakpoint={initialBreakpoint}
      breakpoints={breakpoints}
      className={`action-modal ${className}`}
      style={{ '--border-radius': '1.2rem' }}
    >
      <div className='p-4'>
        {header && (
          <div className='font-default-font text-base font-normal mb-3'>
            {header}
          </div>
        )}

        <div className='mt-5 flex flex-row justify-evenly font-default-font'>
          {actions.map((a, idx) => (
            <IonButton
              key={idx}
              fill='clear'
              onClick={() => {
                try {
                  a.onClick(close)
                } catch (e) {
                  console.error('ActionModal action error', e)
                }
              }}
              className={`justify-center items-center font-default-font text-slate-700 ${
                Array.isArray(a.cssClass)
                  ? a.cssClass.join(' ')
                  : a.cssClass ?? ''
              }`}
            >
              <div className='items-center flex flex-col '>
                {a.icon && (
                  <IonIcon
                    icon={a.icon as any}
                    className={` ${a.iconColor ?? 'text-umak-blue'}`}
                    size='large'
                  />
                )}
                <div className='mt-2 text-slate-900 font-extralight font-default-font normal-case'>
                  {a.text}
                </div>
              </div>
            </IonButton>
          ))}
        </div>
      </div>
    </IonModal>
  )
}

export default ActionModal
