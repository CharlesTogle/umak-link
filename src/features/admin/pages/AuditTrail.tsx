import { useState, useEffect, useRef } from 'react'
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonLabel,
  IonAvatar,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonText,
  IonDatetime,
  IonDatetimeButton,
  IonModal
} from '@ionic/react'
import { personOutline, funnelOutline, chevronDown } from 'ionicons/icons'
import { newspaper, refresh } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import FilterSortBar from '@/shared/components/FilterSortBar'
import { useAuditLogsFetch } from '@/features/admin/hooks/useAuditLogsFetch'
import { useAuditLogsFilter } from '@/features/admin/hooks/useAuditLogsFilter'
import { useAuditLogsSort } from '@/features/admin/hooks/useAuditLogsSort'
import {
  formatActionType,
  getUniqueActionTypes,
  getUniqueUserNames
} from '@/features/admin/utils/auditTrailUtils'
import { formatTimestamp } from '@/shared/utils/formatTimeStamp'
import {
  onAppScrollToTop,
  scrollToTopElement
} from '@/shared/utils/scrollToTop'
import AccordionList from '@/shared/components/AccordionList'

export default function AuditTrail () {
  // State for filter and sort
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [activeSort, setActiveSort] = useState<string>('newest')
  const [expandedAccordion, setExpandedAccordion] = useState<
    string | undefined
  >()
  const { auditLogs, loading, hasMore, handleRefresh, handleLoadMore } =
    useAuditLogsFetch()
  const contentRef = useRef<HTMLIonContentElement | null>(null)

  useEffect(() => {
    const off = onAppScrollToTop(async route => {
      try {
        if (route === '/admin/audit-trail') {
          scrollToTopElement(contentRef.current)
          await handleRefresh()
        }
      } catch (err) {
        console.error('app:scrollToTop handler error', err)
      }
    })
    return () => off()
  }, [handleRefresh])
  const filteredLogs = useAuditLogsFilter(
    auditLogs,
    activeFilters,
    startDate,
    endDate
  )
  const displayLogs = useAuditLogsSort(filteredLogs, activeSort)

  return (
    <>
      <Header logoShown={true} />
      <IonContent ref={contentRef} className='bg-default-bg'>
        <IonRefresher
          slot='fixed'
          onIonRefresh={async (event: CustomEvent) => {
            await handleRefresh()
            event.detail.complete()
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <div className=''>
          {/* Filter/Sort Bar */}
          <FilterSortBar
            title='Audit Logs'
            icon={funnelOutline}
            filterCategories={[
              {
                categoryName: 'Action Type',
                options: getUniqueActionTypes(auditLogs).map(type => ({
                  value: `action:${type.value}`,
                  label: type.label
                }))
              },
              {
                categoryName: 'User Names',
                options: getUniqueUserNames(auditLogs).map(name => ({
                  value: `user:${name.value}`,
                  label: name.label
                }))
              }
            ]}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            filterSelectionType='multiple'
            filterModalTitle='Filter Audit Logs'
            sortOptions={[
              { value: 'newest', label: 'Newest First', icon: refresh },
              { value: 'oldest', label: 'Oldest First', icon: newspaper }
            ]}
            activeSort={activeSort}
            onSortChange={setActiveSort}
            sortModalTitle='Sort Logs'
          />
          {loading && auditLogs.length === 0 ? (
            <div className='flex justify-center items-center py-10'>
              <IonSpinner name='crescent' className='text-umak-blue' />
            </div>
          ) : auditLogs.length === 0 ? (
            <IonCard>
              <IonCardContent className='text-center py-10'>
                <IonText color='medium'>
                  <p>No audit logs found</p>
                </IonText>
              </IonCardContent>
            </IonCard>
          ) : (
            <>
              {/* Date Range Filters */}
              <IonCard className='px-4 mb-3'>
                <IonCardContent className='flex flex-col gap-4'>
                  <div className='flex gap-4 flex-wrap'>
                    {/* Start Date/Time */}
                    <div className='flex flex-col justify-start'>
                      <label className='text-sm font-semibold text-umak-blue block mb-2'>
                        Start Date & Time
                      </label>
                      <IonDatetimeButton datetime='start-datetime' />
                    </div>
                    {/* End Date/Time */}
                    <div className='flex flex-col justify-start'>
                      <label className='text-sm font-semibold text-umak-blue block mb-2'>
                        End Date & Time
                      </label>
                      <IonDatetimeButton datetime='end-datetime' />
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
              {displayLogs.length === 0 ? (
                <IonCard>
                  <IonCardContent className='text-center py-10'>
                    <IonText color='medium'>
                      <p>No audit logs match your filters</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              ) : (
                <AccordionList
                  items={displayLogs}
                  value={expandedAccordion}
                  onChange={val => setExpandedAccordion(val)}
                  getKey={(log: any, index) => log.log_id || `log-${index}`}
                  renderHeader={(log: any, index: number) => {
                    const accordionId = log.log_id || `log-${index}`
                    const isOpen = expandedAccordion === accordionId
                    return (
                      <div
                        className={`ion-padding py-4! flex flex-row items-center border-b-1 border-gray-400 shadow-none ${
                          index === 0 && 'border-t-1'
                        }`}
                      >
                        <IonAvatar
                          slot='start'
                          className='w-10 aspect-square flex items-center justify-center'
                        >
                          {log.profile_picture_url ? (
                            <img src={log.profile_picture_url} alt='actor' />
                          ) : (
                            <div className='w-full h-full grid place-items-center bg-slate-100 text-slate-500'>
                              <IonIcon
                                icon={personOutline}
                                className='text-2xl'
                              />
                            </div>
                          )}
                        </IonAvatar>
                        <IonLabel className='ml-4'>
                          <p className='text-xs! text-gray-500'>
                            {formatTimestamp(log.timestamp)}
                          </p>
                          <h2 className='font-semibold text-sm! max-w-9/10'>
                            {log.details?.message ||
                              formatActionType(log.action_type)}
                          </h2>
                        </IonLabel>
                        <IonIcon
                          icon={chevronDown}
                          className={`min-w-12 text-[20px] text-umak-blue transition-transform duration-300 ml-auto ${
                            isOpen ? 'rotate-180' : 'rotate-0'
                          }`}
                        />
                      </div>
                    )
                  }}
                  renderContent={(log: any) => (
                    <div className='px-4'>
                      {log.details && (
                        <div>
                          <div className='flex items-center gap-2 mb-1'></div>
                          <div className='mb-2 ml-6'>
                            <IonText className='text-sm'>
                              {log.details.message}
                            </IonText>
                          </div>
                          <div className='ml-6'>
                            {Object.entries(log.details).map(
                              ([key, value], idx) => {
                                if (key === 'message') return null
                                return (
                                  <div key={idx} className='mb-2'>
                                    <IonText className='text-sm'>
                                      <span className='font-semibold text-slate-900'>
                                        {key
                                          .split('_')
                                          .map(
                                            word =>
                                              word.charAt(0).toUpperCase() +
                                              word.slice(1)
                                          )
                                          .join(' ')}{' '}
                                      </span>
                                      <span className='text-gray-600 ml-1'>
                                        {String(value)}
                                      </span>
                                    </IonText>
                                  </div>
                                )
                              }
                            )}
                          </div>
                        </div>
                      )}
                      <div className='mb-2'>
                        <IonText className='text-sm text-gray-600 ml-6'>
                          <span className='text-sm mr-2 font-semibold text-gray-700'>
                            Timestamp:
                          </span>
                          {formatTimestamp(log.timestamp)}
                        </IonText>
                      </div>
                      <div className='h-px mb-4 bg-gray-400 pr-4'></div>
                    </div>
                  )}
                />
              )}
            </>
          )}

          {/* Infinite Scroll */}
          {hasMore && !loading && (
            <IonInfiniteScroll
              onIonInfinite={async (event: CustomEvent<void>) => {
                await handleLoadMore()
                const target =
                  event.target as HTMLIonInfiniteScrollElement | null
                if (target) target.complete()
              }}
              threshold='100px'
              className='my-2'
            >
              <IonInfiniteScrollContent loadingSpinner='crescent' />
            </IonInfiniteScroll>
          )}

          {/* End Message */}
          {!hasMore && auditLogs.length > 0 && (
            <div className='text-center text-gray-500 py-4'>
              <IonText>All audit logs loaded</IonText>
            </div>
          )}
        </div>
      </IonContent>

      {/* Start Date/Time Modal */}
      <IonModal keepContentsMounted={true}>
        <IonDatetime
          id='start-datetime'
          value={startDate || undefined}
          onIonChange={e => {
            const value = e.detail.value
            setStartDate(typeof value === 'string' ? value : '')
          }}
          presentation='date-time'
          showDefaultButtons
        />
      </IonModal>

      {/* End Date/Time Modal */}
      <IonModal keepContentsMounted={true}>
        <IonDatetime
          id='end-datetime'
          value={endDate || undefined}
          onIonChange={e => {
            const value = e.detail.value
            setEndDate(typeof value === 'string' ? value : '')
          }}
          presentation='date-time'
          showDefaultButtons
        />
      </IonModal>
    </>
  )
}
