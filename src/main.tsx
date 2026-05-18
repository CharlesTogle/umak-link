import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserProvider } from '@/features/auth/contexts/UserContext'

import App from '@/app/App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <App />
    </UserProvider>
  </QueryClientProvider>
)
