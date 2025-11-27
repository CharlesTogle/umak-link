import { useIonRouter } from '@ionic/react'

const replaceFromAuthRoutes = ['auth']

export const useNavigation = () => {
  const router = useIonRouter()

  const navigate = (path: string, from?: string | 'back') => {
    if (from === 'back') {
      router.push(path, 'back')
    } else if (replaceFromAuthRoutes.includes(from || '')) {
      router.push(path, 'none', 'replace')
    } else {
      router.push(path, 'none')
    }
  }

  return { navigate }
}
