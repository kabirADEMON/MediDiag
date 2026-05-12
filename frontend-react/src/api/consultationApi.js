/**
 * Consultation API
 * Handles all consultation-related API calls
 */

import { get, post, put, del } from './axios'

/**
 * Get all consultations with pagination
 */
export async function getConsultations(params = {}) {
  const { page = 1, limit = 10, ...filters } = params
  
  return get('/consultations', {
    params: {
      skip: (page - 1) * limit,
      limit,
      ...filters,
    },
  })
}

/**
 * Get consultation by ID
 */
export async function getConsultationById(id) {
  return get(`/consultations/${id}`)
}

/**
 * Create new consultation
 */
export async function createConsultation(consultationData) {
  return post('/consultations', consultationData)
}

/**
 * Update consultation
 */
export async function updateConsultation(id, consultationData) {
  return put(`/consultations/${id}`, consultationData)
}

/**
 * Delete consultation
 */
export async function deleteConsultation(id) {
  return del(`/consultations/${id}`)
}

/**
 * Get consultations by patient
 */
export async function getConsultationsByPatient(patientId, params = {}) {
  return get(`/consultations/patient/${patientId}`, { params })
}

/**
 * Get consultations by doctor
 */
export async function getConsultationsByDoctor(doctorId, params = {}) {
  return get(`/consultations/doctor/${doctorId}`, { params })
}

/**
 * Get consultation statistics
 */
export async function getConsultationStats(params = {}) {
  return get('/consultations/stats', { params })
}

/**
 * Add diagnostic to consultation
 */
export async function addDiagnosticToConsultation(consultationId, diagnosticData) {
  return post(`/consultations/${consultationId}/diagnostic`, diagnosticData)
}

/**
 * Add prescription to consultation
 */
export async function addPrescriptionToConsultation(consultationId, prescriptionData) {
  return post(`/consultations/${consultationId}/prescription`, prescriptionData)
}

/**
 * Complete consultation
 */
export async function completeConsultation(consultationId) {
  return post(`/consultations/${consultationId}/complete`)
}

export default {
  getConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  getConsultationsByPatient,
  getConsultationsByDoctor,
  getConsultationStats,
  addDiagnosticToConsultation,
  addPrescriptionToConsultation,
  completeConsultation,
}
