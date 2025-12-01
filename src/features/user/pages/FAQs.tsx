import {
  IonContent,
  IonIcon,
  IonCard,
  IonCardContent,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel
} from '@ionic/react'
import CardHeader from '@/shared/components/CardHeader'
import type React from 'react'
import { helpCircleOutline } from 'ionicons/icons'
import umakOhsoLogo from '@/shared/assets/umak-ohso.svg'
import Header from '@/shared/components/Header'
import { FAQData } from '../data/FAQs'

type FAQItem = {
  id?: string // optional stable key
  question: string
  content: React.ReactNode // string or JSX
}

type FAQCategory = {
  name: string
  items: FAQItem[]
}

const OHSOCard = (): React.ReactNode => (
  <IonCard>
    <IonCardContent class='ion-padding'>
      <CardHeader title='About' icon={helpCircleOutline} />
      <div className='display flex items-start px-2 mt-4'>
        <div className='min-w-1/4'>
          <IonIcon
            icon={umakOhsoLogo}
            className=' text-[64px] border-3 border-umak-blue rounded-full'
          />
        </div>
        <div className='flex flex-col'>
          <p className='text-umak-blue text-lg! font-bold!'>
            Occupational Health <br />
            and Safety Office (OHSO)
          </p>
          <p className='text-black! text-justify!'>
            OHSO deals with all aspects of health and safety in the University
            and has a strong focus on the primary prevention of hazards. Our
            goal is to prevent/mitigate accidents to our employees, students and
            clients within the campus.
          </p>
        </div>
      </div>
    </IonCardContent>
  </IonCard>
)

const FAQAccordion = ({
  categories
}: {
  categories: FAQCategory[]
}): React.ReactNode => {
  return (
    <div className=''>
      {categories.map((cat, ci) => (
        <section key={cat.name ?? ci} className='mb-4'>
          {/* Category heading */}
          <IonCard>
            <IonCardContent>
              <div className='flex items-center gap-3 px-1 py-2'>
                <span className='text-orange-600 font-bold'>{cat.name}</span>
                <div className='flex-1 border-t-2 border-black/20' />
              </div>
            </IonCardContent>
          </IonCard>

          {/* Accordions */}
          <IonAccordionGroup expand='inset'>
            {cat.items.map((q, qi) => {
              const value = q.id ?? `${ci}-${qi}`
              return (
                <IonAccordion key={value} value={value}>
                  <IonItem slot='header' lines='full'>
                    <IonLabel className='text-base font-semibold! py-2! mr-1!'>
                      {q.question}
                    </IonLabel>
                  </IonItem>
                  <div slot='content' className='p-4'>
                    {typeof q.content === 'string' ? (
                      <p className='m-0 leading-relaxed'>{q.content}</p>
                    ) : (
                      q.content
                    )}
                    <div className='h-px w-full mt-2 bg-gray-300' />
                  </div>
                </IonAccordion>
              )
            })}
          </IonAccordionGroup>
        </section>
      ))}
    </div>
  )
}

export default function FAQs () {
  return (
    <IonContent>
      <div className='w-full fixed z-10'>
        <Header logoShown isProfileAndNotificationShown />
      </div>
      <div className='mt-16 mb-20'>
        <OHSOCard />
        <IonCard className='my-6'>
          <IonCardContent>
            <CardHeader
              title='Frequently Asked Questions'
              icon={helpCircleOutline}
              hasLineBelow={false}
            />
          </IonCardContent>
        </IonCard>
        <FAQAccordion categories={FAQData} />
      </div>
    </IonContent>
  )
}
