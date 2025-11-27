import { useState } from 'react'
import {
  IonSearchbar,
  IonSpinner,
  IonIcon,
  IonText,
  IonCard,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonButton,
  IonInput
} from '@ionic/react'
import { alertCircle, personCircle, search, create } from 'ionicons/icons'
import FormSectionHeader from '@/shared/components/FormSectionHeader'

interface SearchUser {
  user_id: string
  user_name: string
  email: string
  profile_picture_url?: string | null
}

interface ClaimerEmailSearchProps {
  searchText: string
  onSearchChange: (e: CustomEvent) => void
  searchResults: SearchUser[]
  searchLoading: boolean
  searchError: string | null
  onUserSelect: (user: SearchUser) => void
}

interface ManualInput {
  name: string
  email: string
}

export default function ClaimerEmailSearch ({
  searchText,
  onSearchChange,
  searchResults,
  searchLoading,
  searchError,
  onUserSelect
}: ClaimerEmailSearchProps) {
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualInput, setManualInput] = useState<ManualInput>({
    name: '',
    email: ''
  })
  const [emailError, setEmailError] = useState<string>('')

  const validateUmakEmail = (email: string): boolean => {
    const umakEmailPattern = /^[a-zA-Z0-9._-]+@umak\.edu\.ph$/
    return umakEmailPattern.test(email)
  }

  const handleManualSubmit = () => {
    // Validate email
    if (!validateUmakEmail(manualInput.email)) {
      setEmailError('Please enter a valid UMak email (e.g., user@umak.edu.ph)')
      return
    }

    // Validate name
    if (!manualInput.name.trim()) {
      setEmailError("Please enter the user's name")
      return
    }

    // Create user object and submit
    const manualUser: SearchUser = {
      user_id: `manual-${Date.now()}`,
      user_name: manualInput.name.trim(),
      email: manualInput.email.trim(),
      profile_picture_url: null
    }

    onUserSelect(manualUser)

    // Reset form
    setManualInput({ name: '', email: '' })
    setEmailError('')
    setIsManualMode(false)
  }

  const handleEmailChange = (value: string) => {
    setManualInput(prev => ({ ...prev, email: value }))
    setEmailError('')
  }

  const toggleMode = () => {
    setIsManualMode(!isManualMode)
    setEmailError('')
    setManualInput({ name: '', email: '' })
  }

  const showManualOption =
    !searchLoading &&
    searchText.length >= 2 &&
    searchResults.length === 0 &&
    !searchError

  return (
    <div className='mb-6'>
      <FormSectionHeader header='Claimer UMak Email' isRequired={true} />

      {/* Toggle Button */}
      <div className='flex justify-end mb-2'>
        <IonButton
          fill='clear'
          size='small'
          onClick={toggleMode}
          className='text-sm'
          style={{
            '--background': 'var(--color-umak-blue)',
            '--border-radius': '4px'
          }}
        >
          <IonIcon
            slot='start'
            icon={isManualMode ? search : create}
            className='text-base text-white mr-2'
          />
          <span className='text-white font-default-font! font-regular! py-1'>
            {isManualMode ? 'Switch to Search' : 'Manual Input'}
          </span>
        </IonButton>
      </div>

      {isManualMode ? (
        /* Manual Input Mode */
        <div className='space-y-4'>
          <div>
            <IonText className='text-sm font-medium text-slate-700'>
              Full Name
            </IonText>
            <IonInput
              value={manualInput.name}
              onIonInput={e =>
                setManualInput(prev => ({
                  ...prev,
                  name: e.detail.value || ''
                }))
              }
              placeholder='Enter full name'
              className='border border-slate-300 rounded-lg mt-1'
              style={{
                '--padding-start': '12px',
                '--padding-end': '12px'
              }}
            />
          </div>

          <div>
            <IonText className='text-sm font-medium text-slate-700'>
              UMak Email
            </IonText>
            <IonInput
              type='email'
              value={manualInput.email}
              onIonInput={e => handleEmailChange(e.detail.value || '')}
              placeholder='user@umak.edu.ph'
              className='border border-slate-300 rounded-lg mt-1'
              style={{
                '--padding-start': '12px',
                '--padding-end': '12px'
              }}
            />
            {emailError && (
              <div className='mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2'>
                <IonIcon
                  icon={alertCircle}
                  className='text-red-600 text-base flex-shrink-0 mt-0.5'
                />
                <IonText color='danger' className='text-xs'>
                  {emailError}
                </IonText>
              </div>
            )}
            <IonText className='text-xs text-slate-500 mt-1 block'>
              Must be a valid UMak email address
            </IonText>
          </div>

          <IonButton
            expand='block'
            onClick={handleManualSubmit}
            disabled={!manualInput.name.trim() || !manualInput.email.trim()}
            style={{ '--background': 'var(--color-umak-blue)' }}
          >
            Add Claimer
          </IonButton>
        </div>
      ) : (
        /* Search Mode */
        <div className='relative'>
          <IonSearchbar
            value={searchText}
            onIonInput={onSearchChange}
            placeholder='Start typing to search users...'
            debounce={0}
            className='ion-no-padding relative'
            showClearButton={searchLoading ? 'never' : 'focus'}
          />

          {searchLoading && (
            <div className='absolute right-2.5 top-2 '>
              <IonSpinner name='crescent' />
            </div>
          )}

          {searchError && (
            <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2'>
              <IonIcon
                icon={alertCircle}
                className='text-red-600 text-xl flex-shrink-0 mt-0.5'
              />
              <IonText color='danger' className='text-sm'>
                {searchError}
              </IonText>
            </div>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <IonCard className='absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg'>
              <IonList>
                {searchResults.map((user: SearchUser) => (
                  <IonItem
                    key={user.user_id}
                    button
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      onUserSelect(user)
                    }}
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

          {showManualOption && (
            <div className='mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg'>
              <IonText className='text-sm text-slate-600 block mb-2'>
                No users found matching &quot;{searchText}&quot;
              </IonText>
              <IonButton
                size='small'
                fill='outline'
                onClick={toggleMode}
                className='text-sm'
              >
                <IonIcon slot='start' icon={create} />
                Add Manually
              </IonButton>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
