import {
  IonSearchbar,
  IonSpinner,
  IonIcon,
  IonText,
  IonCard,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar
} from '@ionic/react'
import { alertCircle, personCircle } from 'ionicons/icons'
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

export default function ClaimerEmailSearch ({
  searchText,
  onSearchChange,
  searchResults,
  searchLoading,
  searchError,
  onUserSelect
}: ClaimerEmailSearchProps) {
  return (
    <div className='mb-6'>
      <FormSectionHeader header='Claimer UMak Email' isRequired={true} />

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
                  onClick={() => onUserSelect(user)}
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

        {!searchLoading &&
          searchText.length >= 2 &&
          searchResults.length === 0 &&
          !searchError && (
            <div className='mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg'>
              <IonText className='text-sm text-slate-600'>
                No users found matching &quot;{searchText}&quot;
              </IonText>
            </div>
          )}
      </div>
    </div>
  )
}
