/**
 * Validation Schemas using Zod
 * Centralized validation logic for forms
 */

import { z } from 'zod'

// Common validation rules
const requiredString = z.string().min(1, 'Ce champ est requis')
const optionalString = z.string().optional()
const requiredEmail = z.string().email('Email invalide')
const requiredNumber = z.number().min(0, 'Doit être un nombre positif')

// Login Schema
export const loginSchema = z.object({
  email: requiredEmail,
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

// Patient Schema
export const patientSchema = z.object({
  nom: requiredString,
  prenom: requiredString,
  date_naissance: z.string().min(1, 'Date de naissance requise'),
  sexe: z.enum(['M', 'F'], {
    errorMap: () => ({ message: 'Sélectionnez un sexe' }),
  }),
  telephone: z.string()
    .regex(/^[0-9]{10}$/, 'Numéro de téléphone invalide (10 chiffres)')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: optionalString,
  antecedents_medicaux: optionalString,
  allergies: optionalString,
  groupe_sanguin: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''], {
    errorMap: () => ({ message: 'Groupe sanguin invalide' }),
  }).optional(),
})

// Diagnostic Request Schema
export const diagnosticSchema = z.object({
  patient_id: z.number().positive('Patient requis').optional(),
  age: z.number()
    .min(0, 'L\'âge doit être positif')
    .max(150, 'L\'âge doit être inférieur à 150'),
  sexe: z.enum(['M', 'F'], {
    errorMap: () => ({ message: 'Sélectionnez un sexe' }),
  }),
  symptomes: z.array(z.string())
    .min(1, 'Au moins un symptôme est requis')
    .max(20, 'Maximum 20 symptômes'),
  analyses: z.record(z.number()).optional(),
  notes: optionalString,
})

// Consultation Schema
export const consultationSchema = z.object({
  patient_id: z.number().positive('Patient requis'),
  motif: requiredString,
  symptomes: z.array(z.string()).min(1, 'Au moins un symptôme est requis'),
  examen_clinique: optionalString,
  diagnostic_principal: optionalString,
  traitement: optionalString,
  notes: optionalString,
})

// Biological Analysis Schema
export const biologicalAnalysisSchema = z.object({
  hemoglobine: z.number().min(0).max(25).optional(),
  leucocytes: z.number().min(0).max(100000).optional(),
  plaquettes: z.number().min(0).max(1000000).optional(),
  glycemie: z.number().min(0).max(10).optional(),
  creatinine: z.number().min(0).max(50).optional(),
  transaminases: z.number().min(0).max(500).optional(),
  crp: z.number().min(0).max(500).optional(),
  vs: z.number().min(0).max(200).optional(),
})

// User Registration Schema
export const registerSchema = z.object({
  nom: requiredString,
  prenom: requiredString,
  email: requiredEmail,
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirm_password: z.string(),
  role: z.enum(['administrateur', 'medecin', 'infirmier']),
  specialite: optionalString,
  telephone: z.string().regex(/^[0-9]{10}$/, 'Numéro invalide').optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

// Profile Update Schema
export const profileSchema = z.object({
  nom: requiredString,
  prenom: requiredString,
  email: requiredEmail,
  telephone: z.string().regex(/^[0-9]{10}$/, 'Numéro invalide').optional().or(z.literal('')),
  specialite: optionalString,
  bio: optionalString,
})

// Password Change Schema
export const passwordChangeSchema = z.object({
  current_password: requiredString,
  new_password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

// Search Schema
export const searchSchema = z.object({
  query: z.string().min(2, 'Minimum 2 caractères'),
  filters: z.object({
    age_min: z.number().optional(),
    age_max: z.number().optional(),
    sexe: z.enum(['M', 'F', '']).optional(),
    date_debut: z.string().optional(),
    date_fin: z.string().optional(),
  }).optional(),
})

// Custom validators
export const validators = {
  /**
   * Validate French phone number
   */
  phoneNumber: (value) => {
    if (!value) return true
    const cleaned = value.replace(/\s/g, '')
    return /^0[1-9][0-9]{8}$/.test(cleaned)
  },

  /**
   * Validate age range
   */
  ageRange: (age, min = 0, max = 150) => {
    return age >= min && age <= max
  },

  /**
   * Validate date is not in future
   */
  notFutureDate: (date) => {
    const inputDate = new Date(date)
    const today = new Date()
    return inputDate <= today
  },

  /**
   * Validate biological analysis value
   */
  biologicalValue: (value, min, max) => {
    if (value === null || value === undefined || value === '') return true
    const num = parseFloat(value)
    return !isNaN(num) && num >= min && num <= max
  },

  /**
   * Validate symptom list
   */
  symptomList: (symptoms) => {
    if (!Array.isArray(symptoms)) return false
    if (symptoms.length === 0) return false
    if (symptoms.length > 20) return false
    return symptoms.every(s => typeof s === 'string' && s.trim().length > 0)
  },

  /**
   * Validate score (0-100)
   */
  score: (value) => {
    const num = parseFloat(value)
    return !isNaN(num) && num >= 0 && num <= 100
  },
}

// Error message formatter
export function formatZodError(error) {
  if (!error?.errors) return 'Erreur de validation'
  
  return error.errors.map(err => {
    const field = err.path.join('.')
    return `${field}: ${err.message}`
  }).join(', ')
}

// Validate data against schema
export function validateData(schema, data) {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated, errors: null }
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors.reduce((acc, err) => {
        const field = err.path.join('.')
        acc[field] = err.message
        return acc
      }, {}),
    }
  }
}

export default {
  loginSchema,
  patientSchema,
  diagnosticSchema,
  consultationSchema,
  biologicalAnalysisSchema,
  registerSchema,
  profileSchema,
  passwordChangeSchema,
  searchSchema,
  validators,
  formatZodError,
  validateData,
}
