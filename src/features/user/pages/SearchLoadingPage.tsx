import { useEffect, useState } from 'react'
import { IonContent, IonSpinner } from '@ionic/react'

interface SearchLoadingPageProps {
  currentStep?: number
  totalSteps?: number
}

const LOADING_MESSAGES = [
  'Analyzing inputs...',
  'Generating keywords from image...',
  'Searching database for matches...',
  'Fetching results...'
]

export default function SearchLoadingPage ({
  currentStep = 0,
  totalSteps = LOADING_MESSAGES.length
}: SearchLoadingPageProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    // Cycle through messages every 2.5 seconds
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  // Calculate progress percentage if steps are provided
  const progressPercentage =
    totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : undefined

  return (
    <IonContent>
      <div className='flex flex-col items-center justify-center h-full bg-umak-blue px-6'>
        <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center'>
          {/* Spinner */}
          <div className='mb-6 flex justify-center'>
            <IonSpinner
              name='crescent'
              className='w-16 h-16'
              style={{ color: 'var(--color-umak-blue)' }}
            />
          </div>

          {/* Main heading */}
          <h2 className='text-2xl font-bold text-umak-blue mb-4'>
            Searching...
          </h2>

          {/* Animated message */}
          <p className='text-gray-700 text-base mb-6 min-h-[3rem] flex items-center justify-center animate-fade-in'>
            {LOADING_MESSAGES[messageIndex]}
          </p>

          {/* Progress bar (if steps are tracked) */}
          {progressPercentage !== undefined && (
            <div className='w-full'>
              <div className='flex justify-between text-xs text-gray-600 mb-2'>
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2.5 overflow-hidden'>
                <div
                  className='bg-umak-blue h-2.5 rounded-full transition-all duration-500 ease-out'
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className='text-xs text-gray-500 mt-2'>
                Step {currentStep} of {totalSteps}
              </div>
            </div>
          )}

          {/* Loading dots animation */}
          {progressPercentage === undefined && (
            <div className='flex justify-center space-x-2 mt-4'>
              <div
                className='w-3 h-3 bg-umak-blue rounded-full animate-bounce'
                style={{ animationDelay: '0ms' }}
              />
              <div
                className='w-3 h-3 bg-umak-blue rounded-full animate-bounce'
                style={{ animationDelay: '150ms' }}
              />
              <div
                className='w-3 h-3 bg-umak-blue rounded-full animate-bounce'
                style={{ animationDelay: '300ms' }}
              />
            </div>
          )}
        </div>

        {/* Bottom text */}
        <p className='text-white text-sm mt-6 opacity-90'>
          Please wait while we search for your item...
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
    </IonContent>
  )
}
