import { useEffect, useState, useCallback } from 'react'
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardContent,
  IonText,
  IonButton,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/react'
import { megaphone } from 'ionicons/icons'
import { chevronDown, documentText } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import AccordionList from '@/shared/components/AccordionList'
import api from '@/shared/lib/api'
import { formatTimestamp } from '@/shared/utils/formatTimeStamp'
import CardHeader from '@/shared/components/CardHeader'
import ExpandableImage from '@/shared/components/ExpandableImage'
import {
  onAppScrollToTop,
  scrollToTopElement
} from '@/shared/utils/scrollToTop'
import { useNavigation } from '@/shared/hooks/useNavigation'

const PAGE_SIZE = 30

export default function Announcement () {
  const { navigate } = useNavigation()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [offset, setOffset] = useState<number>(0)
  const [expandedAccordion, setExpandedAccordion] = useState<
    string | undefined
  >()

  const goToForm = () => {
    navigate('/admin/generate-announcement')
  }

  const fetchAnnouncements = useCallback(
    async (isInitial = false) => {
      if (isInitial) {
        setLoading(true)
        setOffset(0)
      }

      try {
        const currentOffset = isInitial ? 0 : offset
        const { announcements: data, count } = await api.announcements.list({
          limit: PAGE_SIZE,
          offset: currentOffset
        })

        const newData = data ?? []

        if (isInitial) {
          setAnnouncements(newData)
          setOffset(PAGE_SIZE)
        } else {
          setAnnouncements(prev => [...prev, ...newData])
          setOffset(prev => prev + PAGE_SIZE)
        }

        // Check if there are more items to load
        setHasMore(count ? currentOffset + PAGE_SIZE < count : false)
      } catch (e) {
        console.error('Error loading announcements', e)
        if (isInitial) setAnnouncements([])
      } finally {
        if (isInitial) setLoading(false)
      }
    },
    [offset]
  )

  useEffect(() => {
    void fetchAnnouncements(true)
  }, [])

  const handleRefresh = async (ev: any) => {
    try {
      await fetchAnnouncements(true)
      setExpandedAccordion(undefined)
    } catch (e) {
    } finally {
      ev.detail && ev.detail.complete && ev.detail.complete()
    }
  }

  useEffect(() => {
    const off = onAppScrollToTop(async route => {
      try {
        if (route === '/admin/announcement') {
          // scroll to top and refresh list
          scrollToTopElement(undefined)
          await fetchAnnouncements(true)
        }
      } catch (e) {
        // swallow
      }
    })
    return () => off()
  }, [fetchAnnouncements])

  const loadMore = async (ev: any) => {
    await fetchAnnouncements(false)
    ev.target.complete()
  }

  return (
    <>
      <Header logoShown={true} />
      <IonContent className='bg-default-bg'>
        <IonRefresher slot='fixed' onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <div>
          <IonCard className='mb-4'>
            <IonCardContent>
              <CardHeader
                icon={megaphone}
                title='Create Announcement'
                hasLineBelow
                titleClass='text-sm'
              />

              <hr className='mb-4 border-gray-300' />
              <div className='text-center'>
                <IonButton
                  expand='block'
                  onClick={goToForm}
                  className='bg-umak-blue text-white -mt-3'
                  style={{ '--background': 'var(--color-umak-blue)' } as any}
                >
                  GO TO ANNOUNCEMENT FORM →
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
          <IonCard className='mb-4'>
            <IonCardContent>
              <CardHeader
                icon={documentText}
                title='Announcement History'
                hasLineBelow={false}
                titleClass='text-sm'
              />
            </IonCardContent>
          </IonCard>
          {loading ? (
            <div className='space-y-3 py-4' aria-hidden>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`ion-padding flex items-center w-full border-b-1 border-gray-400 ${
                    i === 0 ? 'border-t-1 border-gray-400' : ''
                  } animate-pulse`}
                >
                  <div className='flex-1'>
                    <div className='h-3 w-24 rounded bg-gray-200 mb-2' />
                    <div className='h-4 w-3/4 rounded bg-gray-200' />
                  </div>
                  <div className='ml-2'>
                    <div className='h-6 w-6 rounded-full bg-gray-200' />
                  </div>
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <IonCard>
              <IonCardContent className='text-center py-10'>
                <IonText color='medium'>No announcements found</IonText>
              </IonCardContent>
            </IonCard>
          ) : (
            <>
              <AccordionList
                items={announcements}
                value={expandedAccordion}
                onChange={val => setExpandedAccordion(val)}
                getKey={(a: any, i) => a.id || `ann-${i}`}
                renderHeader={(a: any, index: number) => {
                  const accordionId = a.id || `ann-${index}`
                  const isOpen = expandedAccordion === accordionId
                  return (
                    <div
                      className={`ion-padding flex items-center w-full border-b-1 border-gray-400 ${
                        index === 0 ? 'border-t-1 border-gray-400' : ''
                      }`}
                    >
                      <div className='flex-1'>
                        <p className='text-xs text-gray-500 mb-1'>
                          {formatTimestamp(a.created_at)}
                        </p>
                        <p className='font-semibold text-sm'>
                          {a.message && a.message.length > 100
                            ? `${a.message.substring(0, 100)}...`
                            : a.message}
                        </p>
                      </div>
                      <IonIcon
                        icon={chevronDown}
                        className={`min-w-12 text-[20px] text-umak-blue transition-transform duration-300 ml-2 ${
                          isOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                      />
                    </div>
                  )
                }}
                renderContent={(a: any) => (
                  <div className='ion-padding pb-4 border-b-1 border-gray-400'>
                    {a.image_url && (
                      <div className='mb-3 w-full'>
                        <ExpandableImage
                          src={a.image_url}
                          alt='announcement'
                          className='w-full aspect-video rounded'
                        />
                      </div>
                    )}
                    <div>
                      <p className='text-xs text-gray-500 font-semibold mb-1'>
                        Title:
                      </p>
                      <p className='text-sm text-gray-4000'>{a.message}</p>
                    </div>
                    {a.description && (
                      <div className='mb-2'>
                        <p className='text-xs text-gray-500 font-semibold mb-1'>
                          Description:
                        </p>
                        <p className='text-sm text-gray-4000'>
                          {a.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              />

              <div className='my-3 pb-8'>
                <IonInfiniteScroll
                  onIonInfinite={loadMore}
                  threshold='100px'
                  disabled={!hasMore}
                >
                  <IonInfiniteScrollContent
                    loadingSpinner='crescent'
                    loadingText='Loading more announcements...'
                  />
                </IonInfiniteScroll>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </>
  )
}
