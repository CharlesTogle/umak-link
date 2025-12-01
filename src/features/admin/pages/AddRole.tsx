import CardHeader from '@/shared/components/CardHeader'
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonIcon,
  IonSpinner,
  IonText,
  IonButton,
  IonToast
} from '@ionic/react'
import { peopleCircle, personCircle, alertCircle, close } from 'ionicons/icons'
import { HeaderWithButtons } from '@/shared/components/HeaderVariants'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useState, useRef, useEffect } from 'react'
import { useStaffSearch } from '../hooks/useStaffSearch'
import { useAdminServices } from '../hooks/useAdminServices'

// Simple card component for selected users
const SelectedUserCard = ({
  name,
  email,
  image,
  role,
  onRemove
}: {
  name: string
  email: string
  image?: string | null
  role: string
  onRemove: () => void
  isDisabled?: boolean
}) => (
  <IonCard className='rounded-2xl shadow-sm border border-slate-200/70 mb-3'>
    <IonCardContent className='p-4'>
      <div className='flex items-center gap-4'>
        <IonAvatar className='w-16 h-16 shrink-0'>
          {image ? (
            <img src={image} alt={name} className='object-cover' />
          ) : (
            <div className='w-full h-full grid place-items-center bg-slate-100 text-slate-500'>
              <IonIcon icon={personCircle} className='text-5xl' />
            </div>
          )}
        </IonAvatar>

        <div className='flex-1 min-w-0'>
          <div className='text-sm text-indigo-700 font-medium'>{role}</div>
          <div className='text-lg font-extrabold text-slate-900 truncate'>
            {name}
          </div>
          <div className='text-sm text-slate-500 truncate'>{email}</div>
        </div>

        <IonButton
          onClick={onRemove}
          disabled={Boolean(onRemove && (onRemove as any) && false)}
          fill='clear'
          className='text-slate-500 hover:text-red-600'
          aria-label='Remove user'
        >
          <IonIcon slot='icon-only' icon={close} className='text-2xl' />
        </IonButton>
      </div>
    </IonCardContent>
  </IonCard>
)

export default function AddRole () {
  const [searchText, setSearchText] = useState<string>('')
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'Staff' | 'Admin'>('Staff')

  const { results, loading, error, search, clearResults } = useStaffSearch()
  const { updateUserRole } = useAdminServices()
  const addTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { navigate } = useNavigation()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  const handleSearchChange = async (e: CustomEvent) => {
    console.log('current usr')
    const value = e.detail.value || ''
    setSearchText(value)
    search(value)
  }

  const handleUserSelect = (user: any) => {
    // Check if user is already selected
    const isAlreadySelected = selectedUsers.some(
      selected => selected.id === user.user_id
    )

    if (isAlreadySelected) {
      setToastMessage('User already selected')
      setShowErrorToast(true)
      return
    }

    // Add user to selected users array
    setSelectedUsers(prev => [
      ...prev,
      {
        id: user.user_id,
        name: user.user_name,
        email: user.email,
        phone: '',
        image: user.profile_picture_url,
        role: selectedRole
      }
    ])
    setSearchText('')
    clearResults()
  }

  const handleAddStaff = async () => {
    if (selectedUsers.length === 0) return

    // Clear any existing timeout
    if (addTimeoutRef.current) {
      clearTimeout(addTimeoutRef.current)
    }

    addTimeoutRef.current = setTimeout(async () => {
      setIsAdding(true)
      let successCount = 0
      let failedCount = 0

      try {
        // Add each user one by one
        for (const user of selectedUsers) {
          const success = await updateUserRole({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: selectedRole
          })
          if (success) {
            successCount++
          } else {
            failedCount++
          }
        }

        // Show result message
        if (successCount > 0 && failedCount === 0) {
          setToastMessage(
            `Successfully added ${successCount} staff member${
              successCount > 1 ? 's' : ''
            }`
          )
          setShowSuccessToast(true)
          // Reset form
          setSelectedUsers([])
          setSearchText('')
          setTimeout(() => {
            navigate('/admin/staff-management')
          }, 1200)
        } else if (successCount > 0 && failedCount > 0) {
          setToastMessage(
            `Added ${successCount} successfully, ${failedCount} failed.`
          )
          setShowSuccessToast(true)
          // Remove successfully added users from selection
          setSelectedUsers([])
          // Navigate back to staff management after a short delay
          setTimeout(() => {
            navigate('/admin/staff-management')
          }, 1200)
        } else {
          setToastMessage('Failed to add staff members. Please try again.')
          setShowErrorToast(true)
        }
      } catch (error: any) {
        console.error('Failed to add staff:', error)
        setToastMessage(error.message || 'An error occurred. Please try again.')
        setShowErrorToast(true)
      } finally {
        setIsAdding(false)
      }

      if (addTimeoutRef.current) {
        clearTimeout(addTimeoutRef.current)
        addTimeoutRef.current = null
      }
    }, 500)
  }

  useEffect(() => {
    return () => {
      if (addTimeoutRef.current) {
        clearTimeout(addTimeoutRef.current)
        addTimeoutRef.current = null
      }
    }
  }, [])

  const handleClearSelection = () => {
    setSelectedUsers([])
    setSearchText('')
    clearResults()
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId))
  }

  const handleCancel = () => {
    if (selectedUsers.length > 0) {
      setShowCancelConfirm(true)
    } else {
      navigate('/admin/staff-management')
    }
  }

  const handleSubmitClick = () => {
    if (selectedUsers.length === 0) {
      setToastMessage('No users selected')
      setShowErrorToast(true)
      return
    }
    setShowSubmitConfirm(true)
  }

  return (
    <IonContent>
      <div className='fixed w-full top-0 z-10'>
        <HeaderWithButtons
          loading={isAdding}
          onCancel={handleCancel}
          onSubmit={handleSubmitClick}
        />
      </div>
      <IonCard className='shadow-none! mt-16'>
        <IonCardContent className='min-h-75!'>
          <CardHeader title='Add Role' icon={peopleCircle} />

          {/* Role Selection */}
          <div className='mb-5 ion-padding py-0!'>
            <label className='text-lg mb-3 block font-semibold text-slate-700'>
              Select Role to Assign:
            </label>
            <div className='flex gap-7'>
              <label className='flex items-center cursor-pointer'>
                <input
                  type='radio'
                  name='role'
                  value='Staff'
                  checked={selectedRole === 'Staff'}
                  onChange={e =>
                    setSelectedRole(e.target.value as 'Staff' | 'Admin')
                  }
                  className='appearance-none w-4 h-4 border border-gray-400 rounded-full checked:border-[5px] checked:border-[#1e2b87] transition-all cursor-pointer'
                />
                <span className='ml-1 text-gray-800'>Staff</span>
              </label>
              <label className='flex items-center cursor-pointer'>
                <input
                  type='radio'
                  name='role'
                  value='Admin'
                  checked={selectedRole === 'Admin'}
                  onChange={e =>
                    setSelectedRole(e.target.value as 'Staff' | 'Admin')
                  }
                  className='appearance-none w-4 h-4 border border-gray-400 rounded-full checked:border-[5px] checked:border-[#1e2b87] transition-all cursor-pointer'
                />
                <span className='ml-1 text-gray-800'>Admin</span>
              </label>
            </div>
          </div>

          <div className='relative mb-4'>
            <IonSearchbar
              value={searchText}
              onIonInput={handleSearchChange}
              placeholder='Start Typing to Search Users...'
              debounce={500}
              className='ion-no-padding relative'
              showClearButton={loading ? 'never' : 'focus'}
            />

            {loading && (
              <div className='absolute right-2.5 top-2'>
                <IonSpinner name='crescent' />
              </div>
            )}

            {error && (
              <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2'>
                <IonIcon
                  icon={alertCircle}
                  className='text-red-600 text-xl flex-shrink-0 mt-0.5'
                />
                <IonText color='danger' className='text-sm'>
                  {error}
                </IonText>
              </div>
            )}

            {!loading && results.length > 0 && (
              <IonCard className='absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg'>
                <IonList>
                  {results.map(user => (
                    <IonItem
                      key={user.user_id}
                      button
                      onClick={() => handleUserSelect(user)}
                      className='cursor-pointer hover:bg-slate-50'
                    >
                      <IonAvatar slot='start' className='w-10 h-10'>
                        {user.profile_picture_url ? (
                          <img
                            src={user.profile_picture_url}
                            alt={user.user_name}
                          />
                        ) : (
                          <div className='w-full h-full grid place-items-center bg-slate-100 text-slate-500'>
                            <IonIcon icon={personCircle} className='text-3xl' />
                          </div>
                        )}
                      </IonAvatar>
                      <IonLabel className='ml-2'>
                        <h2 className='font-semibold'>{user.user_name}</h2>
                        <p className='text-sm text-slate-500'>{user.email}</p>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              </IonCard>
            )}

            {!loading &&
              searchText.length >= 2 &&
              results.length === 0 &&
              !error && (
                <div className='mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg'>
                  <IonText className='text-sm text-slate-600'>
                    No users found matching &quot;{searchText}&quot;
                  </IonText>
                </div>
              )}
          </div>

          {selectedUsers.length > 0 && (
            <div className='mt-4'>
              <div className='flex justify-between items-center mb-3'>
                <h3 className='text-lg font-semibold'>
                  Selected Users ({selectedUsers.length}):
                </h3>
                <div className='flex gap-2'>
                  <IonButton
                    fill='clear'
                    onClick={handleClearSelection}
                    disabled={isAdding}
                  >
                    Clear All
                  </IonButton>
                  <IonButton
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={isAdding}
                    style={{ '--background': 'var(--color-umak-blue)' }}
                  >
                    {isAdding ? (
                      <>
                        <IonSpinner name='crescent' className='mr-2' />
                        Adding...
                      </>
                    ) : (
                      `Add as ${selectedRole}${
                        selectedUsers.length > 1 ? 's' : ''
                      }`
                    )}
                  </IonButton>
                </div>
              </div>
              {selectedUsers.map(user => (
                <SelectedUserCard
                  key={user.id}
                  name={user.name}
                  email={user.email}
                  image={user.image}
                  role={selectedRole}
                  onRemove={() => handleRemoveUser(user.id)}
                />
              ))}
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* Confirmation modal: Cancel (discard changes) */}
      <ConfirmationModal
        isOpen={showCancelConfirm}
        heading='Discard changes?'
        subheading='Are you sure you want to discard selected users? This action cannot be undone.'
        onSubmit={() => {
          setShowCancelConfirm(false)
          setSelectedUsers([])
          setSearchText('')
          clearResults()
          navigate('/admin/staff-management', 'back')
        }}
        onCancel={() => setShowCancelConfirm(false)}
        submitLabel='Discard'
        cancelLabel='Keep editing'
      />

      {/* Confirmation modal: Submit (confirm role change) */}
      <ConfirmationModal
        isOpen={showSubmitConfirm}
        heading='Confirm role assignment?'
        subheading={`Are you sure you want to make these users ${selectedRole}s? Their role can be revoked later.`}
        onSubmit={() => {
          setShowSubmitConfirm(false)
          handleAddStaff()
        }}
        onCancel={() => setShowSubmitConfirm(false)}
        submitLabel='Confirm'
        cancelLabel='Cancel'
      />

      {/* Success Toast */}
      <IonToast
        isOpen={showSuccessToast}
        onDidDismiss={() => setShowSuccessToast(false)}
        message={toastMessage}
        duration={3000}
        position='top'
        color='success'
      />

      {/* Error Toast */}
      <IonToast
        isOpen={showErrorToast}
        onDidDismiss={() => setShowErrorToast(false)}
        message={toastMessage}
        duration={4000}
        position='top'
        color='danger'
      />
    </IonContent>
  )
}
