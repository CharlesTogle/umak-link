import { memo, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigation } from '@/shared/hooks/useNavigation'
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonIcon,
  IonToast,
  IonSpinner,
  IonActionSheet
} from '@ionic/react'
import { personCircle } from 'ionicons/icons'
import LazyImage from '@/shared/components/LazyImage'
import Header from '@/shared/components/Header'
import Post from '@/features/posts/components/Post'
import { supabase } from '@/shared/lib/supabase'
import { sharePost } from '@/shared/utils/shareUtils'

interface PostRecordDetails {
  // Post details
  post_id: string
  poster_id: string
  post_status: string
  item_id: string
  is_anonymous: boolean
  submitted_on_date_local: string | null
  accepted_on_date_local: string | null
  last_seen_date: string | null
  last_seen_time: string | null
  last_seen_at: string | null
  last_seen_location: string | null

  // Item details
  item_name: string
  item_description: string | null
  image_id: string | null
  item_image_url: string | null
  item_status: string
  item_type: string
  category: string | null

  // Poster details
  poster_name: string
  poster_email: string
  poster_profile_picture_url: string | null

  // Claim details
  claimer_name: string | null
  claimer_school_email: string | null
  claimer_contact_num: string | null
  claimed_at: string | null
  claim_processed_by_name: string | null
  claim_processed_by_email: string | null
  claim_processed_by_profile_picture_url: string | null
}

export default memo(function ExpandedPostRecord () {
  const { postId } = useParams<{ postId: string }>()
  const { navigate } = useNavigation()

  const [record, setRecord] = useState<PostRecordDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  })
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    if (!postId) return
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('v_post_records_details')
          .select('*')
          .eq('post_id', postId)
          .single()

        if (error) {
          console.error('Error fetching post record:', error)
          setToast({ show: true, message: 'Failed to load post record' })
          setLoading(false)
          return
        }

        if (!data) {
          setToast({ show: true, message: 'Post record not found' })
          setLoading(false)
          return
        }

        if (mounted) setRecord(data as PostRecordDetails)
      } catch (err) {
        console.error('Error loading post record', err)
        setToast({ show: true, message: 'Failed to load post record' })
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [postId])

  const formatDateTime = (value?: string | null) => {
    if (!value) return ''
    const d = new Date(value)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleActionSheetClick = async (action: string) => {
    setShowActions(false)
    if (!record) return

    switch (action) {
      case 'share':
        const result = await sharePost(record.post_id, 'user')
        if (result.success) {
          if (result.method === 'clipboard') {
            setToast({
              show: true,
              message: 'Link copied to clipboard'
            })
          }
        } else {
          setToast({
            show: true,
            message: 'Failed to share post'
          })
        }
        break
      case 'notify':
        setToast({
          show: true,
          message: 'Notify owner functionality coming soon'
        })
        break
      case 'claim':
        navigate(`/staff/post/claim/${record.post_id}`)
        break
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'text-green-600'
      case 'rejected':
      case 'unclaimed':
        return 'text-umak-red'
      case 'fraud':
        return 'text-red-700'
      case 'claimed':
      case 'returned':
        return 'text-blue-600'
      default:
        return 'text-amber-500'
    }
  }

  return (
    <IonContent>
      <Header logoShown isProfileAndNotificationShown />

      {loading && (
        <div className='w-full grid place-items-center py-16'>
          <IonSpinner />
        </div>
      )}

      {!loading && !record && (
        <p className='text-center py-8'>No record found.</p>
      )}

      {!loading && record && (
        <>
          {/* Post Status Card */}
          <IonCard className='my-4'>
            <IonCardContent>
              <div className='flex flex-col place-items-center text-center'>
                <div
                  className={`text-xl font-bold capitalize ${getStatusColor(
                    record.post_status
                  )}`}
                >
                  {record.post_status.replaceAll('_', ' ')}
                </div>
                <div className='text-base font-medium text-gray-600'>
                  This post has been {record.post_status.replaceAll('_', ' ')}
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Post Component */}
          <Post
            username={record.poster_name}
            user_profile_picture_url={record.poster_profile_picture_url}
            itemName={record.item_name}
            description={record.item_description}
            category={record.category}
            lastSeen={formatDateTime(
              record.last_seen_at || record.submitted_on_date_local
            )}
            imageUrl={record.item_image_url}
            locationLastSeenAt={record.last_seen_location}
            itemStatus={record.item_status}
            showAnonIndicator={record.is_anonymous}
            onKebabButtonClick={() => setShowActions(true)}
          />

          {/* Additional Details Card */}
          <IonCard className='mb-4 border border-slate-200/70 shadow-sm'>
            <IonCardContent className='p-7!'>
              {/* Post Details */}
              <div>
                <h3 className='text-lg! font-bold! text-gray-900 mb-2'>
                  Post Details
                </h3>
                <div className='space-y-1'>
                  <p className='text-sm text-gray-600'>
                    <span className='font-medium'>Item Type: </span>
                    <span className='capitalize'>{record.item_type}</span>
                  </p>
                  <p className='text-sm text-gray-600'>
                    <span className='font-medium'>Submitted: </span>
                    {formatDateTime(record.submitted_on_date_local) ||
                      'Unknown'}
                  </p>
                  {record.accepted_on_date_local && (
                    <p className='text-sm text-gray-600'>
                      <span className='font-medium'>Accepted: </span>
                      {formatDateTime(record.accepted_on_date_local)}
                    </p>
                  )}
                </div>
              </div>

              <div className='mt-4'>
                <h3 className='text-lg! font-bold! text-gray-900 mb-2'>
                  Poster Details
                </h3>
                <p className='text-sm! font-medium! text-gray-900'>
                  Name: {record.poster_name}
                </p>
                <p className='text-sm! text-gray-600'>
                  Email: {record.poster_email}
                </p>
              </div>

              {/* Claim Details */}
              {record.claimer_name && (
                <div className='mt-4 rounded-lg'>
                  <h3 className='text-lg! font-bold! text-gray-900 mb-3'>
                    Claim Details
                  </h3>

                  {/* Claimer */}
                  <div className='mb-4'>
                    <p className='text-base! font-semibold! text-gray-700 mb-1'>
                      Claimer
                    </p>
                    <p className='text-sm! font-medium! text-gray-900'>
                      Name: {record.claimer_name}
                    </p>
                    <p className='text-sm! text-gray-600'>
                      Email:{record.claimer_school_email || 'No email provided'}
                    </p>
                    {record.claimer_contact_num && (
                      <p className='text-sm! text-gray-600'>
                        Contact Number: {record.claimer_contact_num}
                      </p>
                    )}
                    <p className='text-xs text-gray-500'>
                      Claimed at:{' '}
                      {formatDateTime(record.claimed_at) || 'Unknown'}
                    </p>
                  </div>

                  {/* Claim Processed by */}
                  {record.claim_processed_by_name && (
                    <div>
                      <p className='text-base! font-semibold! text-gray-700 mb-1'>
                        Claim Processed by
                      </p>
                      <div className='flex items-center gap-2 mb-2'>
                        <IonAvatar className='w-8 h-8'>
                          {record.claim_processed_by_profile_picture_url ? (
                            <LazyImage
                              src={
                                record.claim_processed_by_profile_picture_url
                              }
                              alt={`${record.claim_processed_by_name} profile`}
                              className='w-full h-full object-cover rounded-full'
                            />
                          ) : (
                            <div className='w-full h-full grid place-items-center bg-slate-100 text-slate-500 rounded-full'>
                              <IonIcon
                                icon={personCircle}
                                className='text-2xl'
                              />
                            </div>
                          )}
                        </IonAvatar>
                        <div>
                          <p className='text-sm! font-medium! text-gray-900'>
                            {record.claim_processed_by_name}
                          </p>
                          <p className='text-sm! text-gray-600'>
                            {record.claim_processed_by_email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </>
      )}

      <IonToast
        isOpen={toast.show}
        message={toast.message}
        duration={3000}
        onDidDismiss={() => setToast({ show: false, message: '' })}
      />

      {/* Action Sheet for Post Records */}
      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        buttons={[
          {
            text: 'Share',
            handler: () => handleActionSheetClick('share')
          },
          {
            text: 'Notify the owner',
            handler: () => handleActionSheetClick('notify')
          },
          {
            text: 'Claim Item',
            handler: () => handleActionSheetClick('claim')
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />
    </IonContent>
  )
})
