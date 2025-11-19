// Utility helpers to dispatch and listen for the app:scrollToTop event
// and to perform a safe scroll-to-top on various container types.

export function emitAppScrollToTop (route?: string) {
  try {
    window.dispatchEvent(
      new CustomEvent('app:scrollToTop', { detail: { route } })
    )
  } catch (e) {
    // ignore if dispatch fails
    // console.warn('emitAppScrollToTop failed', e)
  }
}

export function onAppScrollToTop (
  handler: (route?: string) => void | Promise<void>
) {
  const listener = (ev: Event) => {
    const custom = ev as CustomEvent
    const route = custom?.detail?.route
    void handler(route)
  }
  window.addEventListener('app:scrollToTop', listener as EventListener)
  return () =>
    window.removeEventListener('app:scrollToTop', listener as EventListener)
}

/**
 * Scroll a container (IonContent element, HTMLElement or window) to top.
 * Tries to call `scrollToTop` if present (IonContent), otherwise falls back
 * to `scrollTo({ top: 0, behavior: 'smooth' })`.
 */
export function scrollToTopElement (el?: any, duration = 300) {
  try {
    if (!el) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // IonContent exposes scrollToTop in some environments
    if (typeof el.scrollToTop === 'function') {
      try {
        // some IonContent implementations accept a duration
        el.scrollToTop(duration)
        return
      } catch (_) {
        // fallback
      }
    }

    // If it's an HTMLElement
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Fallback to window
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) {
    // ignore
  }
}
