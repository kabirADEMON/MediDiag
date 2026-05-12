/**
 * Metadata API
 * Handles symptoms and analyses metadata
 */

import { get } from './axios'

/**
 * Get all symptoms
 */
export async function getSymptoms(search = '') {
  return get('/metadata/symptoms', {
    params: search ? { search } : {},
  })
}

/**
 * Get popular symptoms
 */
export async function getPopularSymptoms(limit = 20) {
  return get('/metadata/symptoms/popular', {
    params: { limit },
  })
}

/**
 * Get all analyses
 */
export async function getAnalyses(search = '') {
  return get('/metadata/analyses', {
    params: search ? { search } : {},
  })
}

/**
 * Get popular analyses
 */
export async function getPopularAnalyses(limit = 20) {
  return get('/metadata/analyses/popular', {
    params: { limit },
  })
}

export default {
  getSymptoms,
  getPopularSymptoms,
  getAnalyses,
  getPopularAnalyses,
}
