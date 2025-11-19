import { IonList, IonItem, IonLabel, IonButton, IonIcon } from '@ionic/react'
import { closeOutline } from 'ionicons/icons'

interface SearchHistoryProps {
  searchHistory: string[]
  setSearchHistory: React.Dispatch<React.SetStateAction<string[]>>
}

export default function SearchHistory ({
  searchHistory,
  setSearchHistory
}: SearchHistoryProps) {
  const handleRemove = (term: string) => {
    setSearchHistory(prev => prev.filter(item => item !== term))
  }

  if (!searchHistory.length) return null

  const isNoResult =
    searchHistory.length === 1 && searchHistory[0] === 'No Result Found'

  return (
    <div className='border border-gray-200 rounded-md shadow-sm bg-white font-default-font'>
      <div className='px-4 py-2 border-b border-gray-200 text-sm font-extralight text-gray-600'>
        Search History
      </div>
      <div className='font-default-font'>
        <IonList className='!pl-3'>
          {searchHistory.map((term, idx) => (
            <IonItem
              key={`${term}-${idx}`}
              className='flex justify-between items-center text-gray-800'
              lines={idx === searchHistory.length - 1 ? 'none' : 'full'}
            >
              <IonLabel
                className={`text-sm  text-black ${
                  term === 'No Result Found' ? 'text-gray-400 italic' : ''
                }`}
              >
                {term}
              </IonLabel>

              {!isNoResult && term !== 'No Result Found' && (
                <IonButton
                  fill='clear'
                  size='small'
                  className='!m-0  !font-roboto'
                  onClick={() => handleRemove(term)}
                >
                  <IonIcon icon={closeOutline} className='text-gray-500' />
                </IonButton>
              )}
            </IonItem>
          ))}
        </IonList>
      </div>
    </div>
  )
}
