import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react'

interface ToolbarItem {
  icon: any
  route: string
  text: string
  active?: boolean
}

type ToolbarProps = {
  toolbarItems: ToolbarItem[]
}

export default function Toolbar ({ toolbarItems }: ToolbarProps) {
  const location = useLocation()
  const { navigate } = useNavigation()
  // ------------------ HIDE TOOLBAR ON CERTAIN ROUTES ------------------
  const noToolbarRoutes = [
    '/user/search',
    '/user/new-post',
    '/user/post/report',
    '/staff/fraud-report/view'
  ] // add any routes you want to hide the toolbar
  const isNoToolbar = noToolbarRoutes.some(
    route =>
      location.pathname === route || location.pathname.startsWith(route + '/')
  )

  // ------------------ NAVIGATION HANDLER ------------------
  const handleClick = useCallback(
    (route: string) => {
      if (location.pathname === route) {
        window.dispatchEvent(
          new CustomEvent('app:scrollToTop', { detail: { route } })
        )
        return
      }
      navigate(route)
    },
    [location.pathname, navigate]
  )

  // ------------------ CONDITIONAL RENDER ------------------
  if (isNoToolbar) return null

  // ------------------ TOOLBAR UI ------------------
  return (
    <>
      <IonTabBar slot='bottom' className='app-toolbar'>
        {toolbarItems.map((item, idx) => {
          const path = item.route
          const matched =
            location.pathname === path ||
            location.pathname.startsWith(path + '/') ||
            location.pathname.startsWith(path)
          const isActive = !!item.active || matched

          return (
            <IonTabButton
              key={item.route ?? `tab-${idx}`}
              tab={item.route ?? `tab-${idx}`}
              onClick={() => handleClick(item.route)}
              href={item.route}
              style={{
                backgroundColor: isActive ? 'white' : 'var(--color-toolbar-bg)'
              }}
            >
              <IonIcon
                icon={item.icon}
                style={{
                  color: isActive
                    ? 'var(--color-amber-400)'
                    : 'var(--color-inactive-button)'
                }}
              />
              <IonLabel
                style={{
                  color: 'var(--color-inactive-button)'
                }}
              >
                {item.text}
              </IonLabel>
            </IonTabButton>
          )
        })}
      </IonTabBar>
    </>
  )
}
