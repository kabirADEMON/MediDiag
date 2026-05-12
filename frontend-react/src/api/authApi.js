/**
 * Authentication API
 * Handles all authentication-related API calls
 */

import { post, get } from './axios'

/**
 * Login user
 */
export async function login(credentials) {
  return post('/auth/login', credentials)
}

/**
 * Logout user
 */
export async function logout() {
  return post('/auth/logout')
}

/**
 * Register new user
 */
export async function register(userData) {
  return post('/auth/register', userData)
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken) {
  return post('/auth/refresh', { refresh_token: refreshToken })
}

/**
 * Get current user profile
 */
export async function getCurrentUser() {
  return get('/auth/me')
}

/**
 * Update user profile
 */
export async function updateProfile(profileData) {
  return post('/auth/profile', profileData)
}

/**
 * Change password
 */
export async function changePassword(passwordData) {
  return post('/auth/change-password', passwordData)
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email) {
  return post('/auth/forgot-password', { email })
}

/**
 * Reset password with token
 */
export async function resetPassword(token, newPassword) {
  return post('/auth/reset-password', { token, new_password: newPassword })
}

/**
 * Verify email
 */
export async function verifyEmail(token) {
  return post('/auth/verify-email', { token })
}

export default {
  login,
  logout,
  register,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
}
