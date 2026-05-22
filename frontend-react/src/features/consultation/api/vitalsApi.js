import { post, get } from '@/api/axios'

export async function saveVitals(data) {
  return post('/vitals/', data)
}

export async function getPatientVitals(patientId, limit = 10) {
  return get(`/vitals/patient/${patientId}`, { params: { limit } })
}
