/**
 * Authentication Context
 * Manages user authentication state and operations
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { AUTH_CONFIG, USER_ROLES } from '@/utils/constants'
import * as authApi from '@/api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  /**
   * Initialize auth state from localStorage
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
        const storedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY)

        if (token && storedUser && storedUser !== 'undefined') {
          try {
            const userData = JSON.parse(storedUser)
            setUser(userData)
            setIsAuthenticated(true)
          } catch (parseError) {
            console.error('Failed to parse user data:', parseError)
            // Clear invalid data
            localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
            localStorage.removeItem(AUTH_CONFIG.USER_KEY)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  /**
   * Login user
   */
  const login = useCallback(async (credentials) => {
    try {
      const response = await authApi.login(credentials)

      if (response.success) {
        // axios wrapper: response.data = backend response {success, message, data: {tokens, user}}
        const payload = response.data?.data || response.data
        const { access_token, refresh_token, user: userData } = payload

        // Store tokens and user data
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, access_token)
        if (refresh_token) {
          localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refresh_token)
        }
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData))

        setUser(userData)
        setIsAuthenticated(true)

        return { success: true, user: userData }
      }

      return { success: false, error: response.error }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Call logout API (optional)
      await authApi.logout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)
      localStorage.removeItem(AUTH_CONFIG.USER_KEY)
      localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRY_KEY)

      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  /**
   * Register new user
   */
  const register = useCallback(async (userData) => {
    try {
      const response = await authApi.register(userData)

      if (response.success) {
        // Auto-login after registration
        const { access_token, user: newUser } = response.data

        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, access_token)
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(newUser))

        setUser(newUser)
        setIsAuthenticated(true)

        return { success: true, user: newUser }
      }

      return { success: false, error: response.error }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await authApi.updateProfile(profileData)

      if (response.success) {
        const updatedUser = { ...user, ...response.data }
        setUser(updatedUser)
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(updatedUser))

        return { success: true, user: updatedUser }
      }

      return { success: false, error: response.error }
    } catch (error) {
      console.error('Profile update error:', error)
      return { success: false, error: error.message }
    }
  }, [user])

  /**
   * Change password
   */
  const changePassword = useCallback(async (passwordData) => {
    try {
      const response = await authApi.changePassword(passwordData)
      return response
    } catch (error) {
      console.error('Password change error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role) => {
    if (!user) return false
    return user.role === role
  }, [user])

  /**
   * Check if user has permission
   */
  const hasPermission = useCallback((permission) => {
    if (!user) return false

    const rolePermissions = {
      [USER_ROLES.ADMIN]: ['all'],
      [USER_ROLES.DOCTOR]: ['read', 'write', 'diagnose', 'prescribe'],
      [USER_ROLES.NURSE]: ['read', 'write'],
    }

    const permissions = rolePermissions[user.role] || []
    return permissions.includes('all') || permissions.includes(permission)
  }, [user])

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback(() => {
    return hasRole(USER_ROLES.ADMIN)
  }, [hasRole])

  /**
   * Check if user is doctor
   */
  const isDoctor = useCallback(() => {
    return hasRole(USER_ROLES.DOCTOR)
  }, [hasRole])

  /**
   * Check if user is nurse
   */
  const isNurse = useCallback(() => {
    return hasRole(USER_ROLES.NURSE)
  }, [hasRole])

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    hasRole,
    hasPermission,
    isAdmin,
    isDoctor,
    isNurse,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

export default AuthContext
