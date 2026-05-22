/**
 * Diagnostic API
 * Handles all diagnostic-related API calls
 */

import { get, post } from '@/api/axios'

/**
 * Perform full diagnostic
 */
export async function performDiagnostic(diagnosticData) {
  return post('/diagnostic/', diagnosticData)
}

/**
 * Perform quick diagnostic (top 5)
 */
export async function performQuickDiagnostic(diagnosticData) {
  return post('/diagnostic/quick', diagnosticData)
}

/**
 * Get diagnostic summary
 */
export async function getDiagnosticSummary(diagnosticData) {
  return post('/diagnostic/summary', diagnosticData)
}

/**
 * Get recommended examinations
 */
export async function getRecommendedExaminations(diagnosticData) {
  return post('/diagnostic/examinations', diagnosticData)
}

/**
 * Get all diagnostics with pagination
 */
export async function getDiagnostics(params = {}) {
  const { page = 1, limit = 10, ...filters } = params
  
  return get('/diagnostics', {
    params: {
      skip: (page - 1) * limit,
      limit,
      ...filters,
    },
  })
}

/**
 * Get diagnostic by ID
 */
export async function getDiagnosticById(id) {
  return get(`/diagnostics/${id}`)
}

/**
 * Get diagnostic statistics
 */
export async function getDiagnosticStats() {
  return get('/diagnostic/stats')
}

/**
 * Get system health
 */
export async function getSystemHealth() {
  return get('/diagnostic/health')
}

/**
 * Get all diseases
 */
export async function getDiseases(params = {}) {
  return get('/maladies', { params })
}

/**
 * Get disease by ID
 */
export async function getDiseaseById(id) {
  return get(`/maladies/${id}`)
}

/**
 * Search diseases
 */
export async function searchDiseases(query) {
  return get(`/maladies/search/${query}`)
}

/**
 * Filter diseases by age
 */
export async function filterDiseasesByAge(age) {
  return get(`/maladies/filter/age/${age}`)
}

/**
 * Get disease categories stats
 */
export async function getDiseaseCategoriesStats() {
  return get('/maladies/categories/stats')
}

export default {
  performDiagnostic,
  performQuickDiagnostic,
  getDiagnosticSummary,
  getRecommendedExaminations,
  getDiagnostics,
  getDiagnosticById,
  getDiagnosticStats,
  getSystemHealth,
  getDiseases,
  getDiseaseById,
  searchDiseases,
  filterDiseasesByAge,
  getDiseaseCategoriesStats,
}
