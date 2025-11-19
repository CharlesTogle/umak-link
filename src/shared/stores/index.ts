/**
 * Barrel export for search/notification hooks.
 * These now map to Context-based hooks so callers importing from
 * '@/shared/stores' continue to work while we migrate away from zustand.
 */
export { useSearchContext as useSearchStore } from '../contexts/SearchContext'
export { useNotificationContext as useNotificationStore } from '../contexts/NotificationContext'
