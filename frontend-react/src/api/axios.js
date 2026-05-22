/**
 * Axios Configuration
 * Centralized HTTP client with interceptors
 */

import axios from 'axios'
import { API_CONFIG, AUTH_CONFIG, HTTP_STATUS, ERROR_MESSAGES } from '@/utils/constants'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Try to refresh token
      const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          
          const payload = response.data?.data || response.data
          const { access_token } = payload
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, access_token)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          // Refresh failed - logout user
          localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
          localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)
          localStorage.removeItem(AUTH_CONFIG.USER_KEY)
          
          // Redirect to login
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token - logout user
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
        localStorage.removeItem(AUTH_CONFIG.USER_KEY)
        window.location.href = '/login'
      }
    }
    
    // Handle other errors
    const errorMessage = getErrorMessage(error)
    return Promise.reject({
      ...error,
      message: errorMessage,
    })
  }
)

/**
 * Extract error message from error response
 */
function getErrorMessage(error) {
  if (!error.response) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }
  
  const { status, data } = error.response
  
  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return ERROR_MESSAGES.UNAUTHORIZED
    case HTTP_STATUS.FORBIDDEN:
      return ERROR_MESSAGES.FORBIDDEN
    case HTTP_STATUS.NOT_FOUND:
      return ERROR_MESSAGES.NOT_FOUND
    case HTTP_STATUS.BAD_REQUEST:
      return data?.detail || data?.message || ERROR_MESSAGES.VALIDATION_ERROR
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return ERROR_MESSAGES.SERVER_ERROR
    default:
      return data?.detail || data?.message || ERROR_MESSAGES.UNKNOWN_ERROR
  }
}

/**
 * API request wrapper with error handling
 */
export async function apiRequest(config) {
  try {
    const response = await axiosInstance(config)
    return {
      success: true,
      data: response.data,
      status: response.status,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    }
  }
}

/**
 * GET request
 */
export async function get(url, config = {}) {
  return apiRequest({ method: 'GET', url, ...config })
}

/**
 * POST request
 */
export async function post(url, data, config = {}) {
  return apiRequest({ method: 'POST', url, data, ...config })
}

/**
 * PUT request
 */
export async function put(url, data, config = {}) {
  return apiRequest({ method: 'PUT', url, data, ...config })
}

/**
 * PATCH request
 */
export async function patch(url, data, config = {}) {
  return apiRequest({ method: 'PATCH', url, data, ...config })
}

/**
 * DELETE request
 */
export async function del(url, config = {}) {
  return apiRequest({ method: 'DELETE', url, ...config })
}

export default axiosInstance
