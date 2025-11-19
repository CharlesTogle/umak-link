import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UserProvider } from '@/features/auth/contexts/UserContext'

import App from '@/app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </StrictMode>
)
