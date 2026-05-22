/**
 * Application Constants
 * Centralized configuration and constant values
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api/v1',
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
}

// Authentication
export const AUTH_CONFIG = {
  TOKEN_KEY: 'medical_auth_token',
  REFRESH_TOKEN_KEY: 'medical_refresh_token',
  USER_KEY: 'medical_user',
  TOKEN_EXPIRY_KEY: 'medical_token_expiry',
}

// User Roles
export const USER_ROLES = {
  ADMIN: 'administrateur',
  DOCTOR: 'medecin',
  NURSE: 'infirmier',
}

// Role Permissions
export const PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['all'],
  [USER_ROLES.DOCTOR]: ['read', 'write', 'diagnose', 'prescribe'],
  [USER_ROLES.NURSE]: ['read', 'write'],
}

// Urgency Levels
export const URGENCY_LEVELS = {
  CRITIQUE: 'critique',
  ELEVEE: 'élevée',
  MODEREE: 'modérée',
  FAIBLE: 'faible',
}

// Urgency Colors
export const URGENCY_COLORS = {
  [URGENCY_LEVELS.CRITIQUE]: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800',
  },
  [URGENCY_LEVELS.ELEVEE]: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-800',
  },
  [URGENCY_LEVELS.MODEREE]: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  [URGENCY_LEVELS.FAIBLE]: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800',
  },
}

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
]

// Common Symptoms (for autocomplete)
export const COMMON_SYMPTOMS = [
  'Fièvre',
  'Fatigue',
  'Maux de tête',
  'Toux',
  'Douleur abdominale',
  'Nausées',
  'Vomissements',
  'Diarrhée',
  'Douleur thoracique',
  'Essoufflement',
  'Vertiges',
  'Perte d\'appétit',
  'Sueurs nocturnes',
  'Perte de poids',
  'Douleurs musculaires',
  'Douleurs articulaires',
  'Éruption cutanée',
  'Démangeaisons',
  'Gonflement',
  'Saignements',
]

// Biological Analyses
export const BIOLOGICAL_ANALYSES = {
  HEMOGLOBINE: { name: 'Hémoglobine', unit: 'g/dL', normalRange: '12-16' },
  LEUCOCYTES: { name: 'Leucocytes', unit: '/mm³', normalRange: '4000-10000' },
  PLAQUETTES: { name: 'Plaquettes', unit: '/mm³', normalRange: '150000-400000' },
  GLYCEMIE: { name: 'Glycémie', unit: 'g/L', normalRange: '0.7-1.1' },
  CREATININE: { name: 'Créatinine', unit: 'mg/L', normalRange: '7-13' },
  TRANSAMINASES: { name: 'Transaminases', unit: 'UI/L', normalRange: '10-40' },
  CRP: { name: 'CRP', unit: 'mg/L', normalRange: '<5' },
  VS: { name: 'VS', unit: 'mm/h', normalRange: '<20' },
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
}

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_TIME: "yyyy-MM-dd'T'HH:mm:ss",
}

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT_DETAILS: '/patients/:id',
  CONSULTATION: '/consultation',
  NEW_CONSULTATION: '/consultation/new',
  DIAGNOSTICS: '/diagnostics',
  DIAGNOSTIC_DETAILS: '/diagnostics/:id',
  STATISTICS: '/statistics',
  SETTINGS: '/settings',
  PROFILE: '/profile',
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  UNAUTHORIZED: 'Session expirée. Veuillez vous reconnecter',
  FORBIDDEN: 'Vous n\'avez pas les permissions nécessaires',
  NOT_FOUND: 'Ressource non trouvée',
  VALIDATION_ERROR: 'Erreur de validation des données',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite',
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Connexion réussie',
  LOGOUT: 'Déconnexion réussie',
  PATIENT_CREATED: 'Patient créé avec succès',
  PATIENT_UPDATED: 'Patient mis à jour avec succès',
  CONSULTATION_CREATED: 'Consultation créée avec succès',
  DIAGNOSTIC_COMPLETED: 'Diagnostic effectué avec succès',
}

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
}

// Chart Colors
export const CHART_COLORS = {
  primary: '#0ea5e9',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
  gray: '#6b7280',
}

// Medical Disclaimer
export const MEDICAL_DISCLAIMER = 
  "⚠️ Cet outil est une aide à la décision médicale et ne remplace pas un diagnostic médical professionnel. Toujours consulter un professionnel de santé qualifié."

export default {
  API_CONFIG,
  AUTH_CONFIG,
  USER_ROLES,
  PERMISSIONS,
  URGENCY_LEVELS,
  URGENCY_COLORS,
  GENDER_OPTIONS,
  COMMON_SYMPTOMS,
  BIOLOGICAL_ANALYSES,
  PAGINATION,
  DATE_FORMATS,
  ROUTES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  CHART_COLORS,
  MEDICAL_DISCLAIMER,
}
