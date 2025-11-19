import { useState, useEffect, useCallback } from 'react'
import { IonContent, IonCard, IonCardContent } from '@ionic/react'
import { barChart } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import { getDashboardStats } from '@/features/admin/data/dashboardStats'
import type { DashboardStats } from '@/features/admin/data/dashboardStats'
import AnalyticsCard from '../components/AnalyticsCard'
import DonutChart from '../components/DonutChart'
import SystemStatsChart from '../components/SystemStatsChart'
import CardHeader from '@/shared/components/CardHeader'

export default function Dashboard () {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [donutLoaded, setDonutLoaded] = useState(false)
  const [systemLoaded, setSystemLoaded] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const result: DashboardStats = await getDashboardStats()
      console.log(result)
      setStats(result)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [])

  return (
    <IonContent>
      <Header logoShown isProfileAndNotificationShown />
      <div>
        <IonCard className='mt-3'>
          <IonCardContent>
            <CardHeader
              title='Graphical Reports'
              icon={barChart}
              hasLineBelow={false}
            />
          </IonCardContent>
        </IonCard>

        {/* Analytics Cards Row */}
        <div className='px-4 py-4 grid grid-cols-2 gap-4'>
          <AnalyticsCard
            title='Pending Verifications'
            value={stats?.pendingVerifications ?? 0}
            color='bg-white'
            textColor='text-blue-700'
            loading={loading}
          />
          <AnalyticsCard
            title='Pending Fraud Reports'
            value={stats?.pendingFraudReports ?? 0}
            color='bg-white'
            textColor='text-red-700'
            loading={loading}
          />
        </div>

        {/* Donut Chart Card */}
        {/* Donut and System charts: render skeletons until each internal component reports ready via onLoad */}
        {stats && (
          <>
            <IonCard className='mx-4 mb-4'>
              <IonCardContent className='py-6'>
                {!donutLoaded ? (
                  <div className='p-4'>
                    <div className='h-6 w-40 bg-gray-200 rounded mb-3 animate-pulse' />
                    <div className='h-40 w-full bg-white rounded-xl border border-gray-200 animate-pulse' />
                  </div>
                ) : null}
                <DonutChart
                  data={{
                    claimed: stats.claimedCount ?? 0,
                    unclaimed: stats.unclaimedCount ?? 0,
                    toReview: stats.toReviewCount ?? 0,
                    lost: stats.lostCount ?? 0,
                    returned: stats.returnedCount ?? 0
                  }}
                  onLoad={() => setDonutLoaded(true)}
                />
              </IonCardContent>
            </IonCard>
            <IonCard className='mx-4 mb-4'>
              <IonCardContent className='py-6'>
                {!systemLoaded ? (
                  <div className='p-4'>
                    <div className='h-6 w-40 bg-gray-200 rounded mb-3 animate-pulse' />
                    <div className='h-64 w-full bg-white rounded-xl border border-gray-200 animate-pulse' />
                  </div>
                ) : null}
                <SystemStatsChart onLoad={() => setSystemLoaded(true)} />
              </IonCardContent>
            </IonCard>
          </>
        )}
      </div>
    </IonContent>
  )
}
