import { Network } from '@capacitor/network'

/**
 * Check if the device is connected to the internet
 * @returns Promise<boolean> - true if connected, false otherwise
 */
export async function isConnected (): Promise<boolean> {
  try {
    const status = await Network.getStatus()
    return status.connected
  } catch (error) {
    console.error('Error checking network status:', error)
    // Assume connected if we can't check (e.g., on web)
    return true
  }
}

/**
 * Execute a function only if network is available
 * @param fn - Async function to execute
 * @param onOffline - Optional callback when offline
 * @returns Promise<T | null> - Result of fn or null if offline
 */
export async function executeIfOnline<T> (
  fn: () => Promise<T>,
  onOffline?: () => void
): Promise<T | null> {
  const connected = await isConnected()

  if (!connected) {
    if (onOffline) {
      onOffline()
    }
    return null
  }

  return await fn()
}

/**
 * Wrapper for Supabase operations with automatic network checking
 * @param operation - Async Supabase operation
 * @param errorMessage - Error message to return when offline
 * @returns Promise with success status and data or error
 */
export async function supabaseWithNetworkCheck<T> (
  operation: () => Promise<T>,
  errorMessage: string = 'No internet connection'
): Promise<{ success: boolean; data?: T; error?: string }> {
  const connected = await isConnected()

  if (!connected) {
    return { success: false, error: errorMessage }
  }

  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    console.error('Operation failed:', error)
    return { success: false, error: 'Operation failed' }
  }
}
