/**
 * Helper Utilities
 * Reusable utility functions
 */

import { format, parseISO, isValid } from 'date-fns'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with proper precedence
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format date for display
 */
export function formatDate(date, formatStr = 'dd/MM/yyyy') {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    return format(dateObj, formatStr)
  } catch (error) {
    console.error('Date formatting error:', error)
    return ''
  }
}

/**
 * Format date with time
 */
export function formatDateTime(date) {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate) {
  if (!birthDate) return null
  
  const today = new Date()
  const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate
  
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Format score as percentage
 */
export function formatScore(score) {
  if (score === null || score === undefined) return 'N/A'
  return `${Math.round(score)}%`
}

/**
 * Get urgency level color classes
 */
export function getUrgencyColor(urgency) {
  const colors = {
    critique: 'bg-red-100 text-red-800 border-red-200',
    élevée: 'bg-orange-100 text-orange-800 border-orange-200',
    modérée: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    faible: 'bg-green-100 text-green-800 border-green-200',
  }
  
  return colors[urgency?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Get urgency level icon
 */
export function getUrgencyIcon(urgency) {
  const icons = {
    critique: '🔴',
    élevée: '🟠',
    modérée: '🟡',
    faible: '🟢',
  }
  
  return icons[urgency?.toLowerCase()] || '⚪'
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
  let timeout
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle(func, limit = 300) {
  let inThrottle
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
  if (obj === null || obj === undefined) return true
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

/**
 * Generate unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/)
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`
  }
  return phone
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return '??'
  
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Sleep/delay function
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry async function
 */
export async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) throw error
    await sleep(delay)
    return retry(fn, retries - 1, delay * 2)
  }
}

/**
 * Safe JSON parse
 */
export function safeJsonParse(json, fallback = null) {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Group array by key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key]
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {})
}

/**
 * Sort array by key
 */
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Remove duplicates from array
 */
export function unique(array, key = null) {
  if (!key) {
    return [...new Set(array)]
  }
  
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

/**
 * Download file from blob
 */
export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

/**
 * Check if user has permission
 */
export function hasPermission(userRole, requiredPermission) {
  const rolePermissions = {
    administrateur: ['all'],
    medecin: ['read', 'write', 'diagnose', 'prescribe'],
    infirmier: ['read', 'write'],
  }
  
  const permissions = rolePermissions[userRole] || []
  return permissions.includes('all') || permissions.includes(requiredPermission)
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html) {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Get contrast color (black or white) for background
 */
export function getContrastColor(hexColor) {
  const r = parseInt(hexColor.substr(1, 2), 16)
  const g = parseInt(hexColor.substr(3, 2), 16)
  const b = parseInt(hexColor.substr(5, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#000000' : '#FFFFFF'
}

export default {
  cn,
  formatDate,
  formatDateTime,
  calculateAge,
  truncate,
  capitalize,
  formatScore,
  getUrgencyColor,
  getUrgencyIcon,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  generateId,
  formatPhoneNumber,
  isValidEmail,
  getInitials,
  formatFileSize,
  sleep,
  retry,
  safeJsonParse,
  groupBy,
  sortBy,
  unique,
  downloadFile,
  copyToClipboard,
  hasPermission,
  sanitizeHtml,
  getContrastColor,
}
