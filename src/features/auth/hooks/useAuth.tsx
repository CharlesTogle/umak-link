import { authServices, type GoogleProfile } from '../services/authServices'

/**
 * Hook to access auth services.
 * Wraps authServices to provide a cleaner API for components.
 */
export function useAuth () {
  /**
   * Get or register an account using Google authentication
   */
  const getOrRegisterAccount = async (profile: GoogleProfile) => {
    return await authServices.GetOrRegisterAccount(profile)
  }

  /**
   * Logout the current user
   */
  const logout = async () => {
    return await authServices.Logout()
  }

  return {
    getOrRegisterAccount,
    logout
  }
}
