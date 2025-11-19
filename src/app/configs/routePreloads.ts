export const routePreloads: Record<string, () => Promise<any>> = {
  '/auth': () => import('@/features/auth/pages/Auth'),
  '/user/home': () => import('@/features/user/pages/Home'),
  '/user/faqs': () => import('@/features/user/pages/FAQs'),
  '/user/history': () => import('@/features/user/pages/History'),
  '/user/search': () => import('@/features/user/pages/SearchItem'),
  '/user/new-post': () => import('@/features/user/pages/NewPost')
}
