import { useState, useEffect, useRef } from 'react'
import ApexCharts from 'apexcharts'
import api from '@/shared/lib/api'
import { IonIcon } from '@ionic/react'
import { downloadOutline } from 'ionicons/icons'
import { IonButton } from '@ionic/react'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'

interface ChartData {
  labels: string[]
  series: number[][] // [missing, found, reports, pending]
}

// Skeleton loader component with line graph
function ChartSkeleton () {
  return (
    <div className='w-full rounded-3xl animate-pulse'>
      <div className='mb-2 flex items-center justify-between'>
        <div className='h-4 w-32 bg-gray-300 rounded' />
      </div>

      <div className='w-full rounded-xl p-4'>
        {/* Chart area */}
        <div className='relative h-[260px] flex items-end'>
          {/* Y-axis simulation */}
          <div className='absolute left-0 top-0 bottom-8 flex flex-col justify-between'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='h-3 w-6 bg-gray-200 rounded' />
            ))}
          </div>

          {/* Graph area with simulated line paths */}
          <div className='flex-1 ml-10 relative h-full'>
            {/* Horizontal grid lines */}
            <div className='absolute inset-0 flex flex-col justify-between pb-8'>
              {[...Array(6)].map((_, i) => (
                <div key={i} className='w-full h-px bg-gray-200' />
              ))}
            </div>

            {/* Simulated line graphs */}
            <svg
              className='absolute inset-0 w-full h-full'
              style={{ paddingBottom: '32px' }}
            >
              {/* Line 1 - wavy path */}
              <path
                d='M 10,180 Q 50,160 90,170 T 170,150 T 250,160 T 330,140 T 410,150'
                fill='none'
                stroke='#e5e7eb'
                strokeWidth='3'
                opacity='0.6'
              />
              {/* Line 2 - different wave */}
              <path
                d='M 10,200 Q 50,185 90,190 T 170,175 T 250,180 T 330,165 T 410,170'
                fill='none'
                stroke='#d1d5db'
                strokeWidth='3'
                opacity='0.6'
              />
              {/* Line 3 - another wave */}
              <path
                d='M 10,190 Q 50,175 90,180 T 170,165 T 250,170 T 330,155 T 410,160'
                fill='none'
                stroke='#9ca3af'
                strokeWidth='3'
                opacity='0.6'
              />

              {/* Animated moving dots */}
              <circle r='4' fill='#9ca3af' opacity='0.8'>
                <animateMotion
                  dur='3s'
                  repeatCount='indefinite'
                  path='M 10,180 Q 50,160 90,170 T 170,150 T 250,160 T 330,140 T 410,150'
                />
              </circle>
            </svg>

            {/* X-axis labels */}
            <div className='absolute bottom-0 left-0 right-0 flex justify-between px-2'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-3 w-12 bg-gray-200 rounded' />
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className='mt-3 flex justify-start gap-4'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='flex items-center gap-2'>
              <div className='h-3 w-3 bg-gray-300 rounded-full' />
              <div className='h-3 w-16 bg-gray-200 rounded' />
            </div>
          ))}
        </div>
      </div>

      <div className='flex justify-end mt-4'>
        <div className='h-9 w-20 bg-gray-200 rounded' />
      </div>
    </div>
  )
}

export default function SystemStatsChart ({
  onLoad
}: { onLoad?: () => void } = {}) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<ApexCharts | null>(null)

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      setLoading(true)

      const stats = await api.admin.getWeeklyStats()

      // Trim leading zero weeks
      let firstNonZeroIndex = -1
      for (let idx = 0; idx < stats.weeks.length; idx++) {
        const anyNonZero =
          (stats.series.missing[idx] ?? 0) !== 0 ||
          (stats.series.found[idx] ?? 0) !== 0 ||
          (stats.series.reports[idx] ?? 0) !== 0 ||
          (stats.series.pending[idx] ?? 0) !== 0
        if (anyNonZero) {
          firstNonZeroIndex = idx
          break
        }
      }

      if (firstNonZeroIndex > 0) {
        setChartData({
          labels: stats.weeks.slice(firstNonZeroIndex),
          series: [
            stats.series.missing.slice(firstNonZeroIndex),
            stats.series.found.slice(firstNonZeroIndex),
            stats.series.reports.slice(firstNonZeroIndex),
            stats.series.pending.slice(firstNonZeroIndex)
          ]
        })
      } else {
        setChartData({
          labels: stats.weeks,
          series: [
            stats.series.missing,
            stats.series.found,
            stats.series.reports,
            stats.series.pending
          ]
        })
      }

      // notify parent that the system stats finished loading
      try {
        onLoad && onLoad()
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCsv = async () => {
    if (!chartData) return

    // Compute a conservative start/end range covering the displayed weeks
    const end = new Date()
    const weeksShown = chartData.labels.length
    const start = new Date()
    start.setDate(end.getDate() - weeksShown * 7)
    start.setHours(0, 0, 0, 0)

    try {
      const { rows } = await api.admin.getExportData(
        start.toISOString(),
        end.toISOString()
      )

      const header = [
        'poster_name',
        'item_name',
        'item_description',
        'last_seen_location',
        'accepted_by_staff_name',
        'submission_date',
        'claimed_by_name',
        'claimed_by_email',
        'accepted_on_date'
      ].join(',')

      const csvRows: string[] = []
      if (Array.isArray(rows)) {
        for (const r of rows) {
          const poster_name = (r as any).poster_name ?? ''
          const item_name = (r as any).item_name ?? ''
          const item_description = (r as any).item_description ?? ''
          const last_seen_location = (r as any).last_seen_location ?? ''
          const accepted_by_staff_name = (r as any).accepted_by_staff_name ?? ''
          const submission_date = (r as any).submission_date ?? ''
          const claimed_by_name = (r as any).claimed_by_name ?? ''
          const claimed_by_email = (r as any).claimed_by_email ?? ''
          const accepted_on_date = (r as any).accepted_on_date ?? ''

          const escaped = [
            poster_name,
            item_name,
            item_description,
            last_seen_location,
            accepted_by_staff_name,
            submission_date,
            claimed_by_name,
            claimed_by_email,
            accepted_on_date
          ]
            .map((c: any) => `"${String(c).replace(/"/g, '""')}"`)
            .join(',')

          csvRows.push(escaped)
        }
      }

      const csv = [header, ...csvRows].join('\n')

      const filename = `system-stats-detailed-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
      const platform = Capacitor.getPlatform()
      const toBase64 = (str: string) => {
        try {
          return btoa(unescape(encodeURIComponent(str)))
        } catch (e) {
          return btoa(str)
        }
      }

      if (platform !== 'web') {
        try {
          const base64 = toBase64(csv)
          await Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Documents
          })

          try {
            const uriResult = await Filesystem.getUri({
              directory: Directory.Documents,
              path: filename
            })
            if (uriResult?.uri) {
              const shareUrl = uriResult.uri
              try {
                await Share.share({ title: filename, url: shareUrl })
                return
              } catch (e) {
                console.warn(
                  'Share.share failed for fileUrl, falling back to text/blob share',
                  e
                )
              }
            }
          } catch (e) {
            console.warn('CSV written but could not open URI', e)
          }
          // Fallback: share CSV text (apps can receive text content)
          try {
            await Share.share({ title: filename, text: csv })
            return
          } catch (e) {
            console.warn(
              'Share.text fallback failed, will fall back to web download',
              e
            )
          }
        } catch (e) {
          console.warn(
            'Filesystem write failed, falling back to anchor download',
            e
          )
        }
      }

      // Web fallback
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Error generating detailed CSV', e)
    }
  }

  // Render chart when data changes
  useEffect(() => {
    if (!chartData || !chartRef.current) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const options: ApexCharts.ApexOptions = {
      chart: {
        type: 'line',
        height: 260,
        stacked: false,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit',
        animations: {
          enabled: true,
          speed: 700
        }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      colors: ['#df0020', '#fe9a00', '#8b5cf6', '#6b7280'],
      xaxis: {
        categories: chartData.labels,
        labels: {
          style: {
            fontSize: '11px',
            colors: '#6b7280'
          }
        },
        axisBorder: {
          show: true,
          color: '#9ca3af'
        },
        axisTicks: {
          show: true,
          color: '#9ca3af'
        }
      },
      yaxis: {
        title: {
          text: 'Number of Posts',
          style: {
            fontSize: '11px',
            fontWeight: 500,
            color: '#6b7280'
          }
        },
        min: 0,
        labels: {
          style: {
            fontSize: '11px',
            colors: '#6b7280'
          },
          formatter: (value: number) => Math.floor(value).toString()
        }
      },
      // Legend moved outside the chart for custom layout
      legend: { show: false },
      dataLabels: {
        enabled: false
      },
      grid: {
        borderColor: '#e5edf9',
        strokeDashArray: 0,
        row: {
          colors: ['#f4f8ff', 'transparent'],
          opacity: 1
        },
        xaxis: {
          lines: { show: false }
        },
        yaxis: {
          lines: { show: true }
        },
        padding: {
          top: 10,
          right: 10,
          bottom: 0,
          left: 10
        }
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        style: {
          fontSize: '11px'
        },
        y: {
          formatter: (value: number) => `${value} posts`
        }
      },
      markers: {
        size: 0,
        hover: {
          size: 5
        }
      }
    }

    const series = [
      {
        name: 'Missing',
        data: chartData.series[0]
      },
      {
        name: 'Found',
        data: chartData.series[1]
      },
      {
        name: 'Reports',
        data: chartData.series[2]
      },
      {
        name: 'Pending',
        data: chartData.series[3]
      }
    ]

    const chart = new ApexCharts(chartRef.current, {
      ...options,
      series
    })

    chart.render()
    chartInstance.current = chart

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [chartData])

  if (loading) {
    return <ChartSkeleton />
  }

  if (!chartData || chartData.labels.length === 0) {
    return (
      <div className='w-full rounded-3xl p-4'>
        <div className='bg-white rounded-xl border border-gray-200 p-8'>
          <div className='text-gray-500 text-center py-8'>
            No data available yet
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full rounded-3xl'>
      {/* Header */}
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-sm font-semibold text-[#1f2a66]'>
          Post Status Trend
        </span>
      </div>

      <div className='w-full rounded-xl'>
        <div ref={chartRef} className='w-full' />
      </div>

      {/* Custom legend - separated and left-aligned */}
      <div className='mt-3 flex justify-start gap-4 items-center'>
        <div className='flex items-center gap-2'>
          <span
            className='inline-block h-3 w-3 rounded-full'
            style={{ backgroundColor: '#df0020' }}
          />
          <span className='text-sm text-gray-800'>Missing</span>
        </div>
        <div className='flex items-center gap-2'>
          <span
            className='inline-block h-3 w-3 rounded-full'
            style={{ backgroundColor: '#fe9a00' }}
          />
          <span className='text-sm text-gray-800'>Found</span>
        </div>
        <div className='flex items-center gap-2'>
          <span
            className='inline-block h-3 w-3 rounded-full'
            style={{ backgroundColor: '#8b5cf6' }}
          />
          <span className='text-sm text-gray-800'>Reports</span>
        </div>
        <div className='flex items-center gap-2'>
          <span
            className='inline-block h-3 w-3 rounded-full'
            style={{ backgroundColor: '#6b7280' }}
          />
          <span className='text-sm text-gray-800'>Pending</span>
        </div>
      </div>

      {/* CSV download button */}
      <div className='flex justify-end mt-4'>
        <IonButton
          onClick={handleDownloadCsv}
          className='w-20 flex text-base text-[#1f2a66] hover:bg-[#1f2a66]/5 transition-colors'
          aria-label='Download CSV'
          fill='clear'
        >
          <IonIcon icon={downloadOutline} slot='icon-only' />
        </IonButton>
      </div>
    </div>
  )
}
