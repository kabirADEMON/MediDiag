/**
 * Patient API
 * Handles all patient-related API calls
 */

import { get, post, put, del } from './axios'

/**
 * Get all patients with pagination
 */
export async function getPatients(params = {}) {
  const { page = 1, limit = 10, search = '', ...filters } = params
  
  return get('/patients', {
    params: {
      skip: (page - 1) * limit,
      limit,
      search,
      ...filters,
    },
  })
}

/**
 * Get patient by ID
 */
export async function getPatientById(id) {
  return get(`/patients/${id}`)
}

/**
 * Create new patient
 */
export async function createPatient(patientData) {
  return post('/patients', patientData)
}

/**
 * Update patient
 */
export async function updatePatient(id, patientData) {
  return put(`/patients/${id}`, patientData)
}

/**
 * Delete patient
 */
export async function deletePatient(id) {
  return del(`/patients/${id}`)
}

/**
 * Get patient by unique code
 */
export async function getPatientByCode(code) {
  return get(`/patients/code/${code}`)
}

/**
 * Search patients
 */
export async function searchPatients(query) {
  return get('/patients/search', {
    params: { q: query },
  })
}

/**
 * Get patient consultations
 */
export async function getPatientConsultations(patientId, params = {}) {
  return get(`/patients/${patientId}/consultations`, { params })
}

/**
 * Get patient diagnostics
 */
export async function getPatientDiagnostics(patientId, params = {}) {
  return get(`/patients/${patientId}/diagnostics`, { params })
}

/**
 * Get patient statistics
 */
export async function getPatientStats(patientId) {
  return get(`/patients/${patientId}/stats`)
}

export default {
  getPatients,
  getPatientById,
  getPatientByCode,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientConsultations,
  getPatientDiagnostics,
  getPatientStats,
}
