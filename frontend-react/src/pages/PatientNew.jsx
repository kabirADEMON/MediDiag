/**
 * New Patient Page
 * Form to create a new patient
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { patientSchema } from '@/utils/validators'
import * as patientApi from '@/api/patientApi'

export function PatientNew() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [patientCode, setPatientCode] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      date_naissance: '',
      sexe: 'M',
      telephone: '',
      email: '',
      adresse: '',
      antecedents_medicaux: '',
      allergies: '',
      groupe_sanguin: '',
    },
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)

      const response = await patientApi.createPatient(data)

      if (response.success) {
        setSuccess(true)
        setPatientCode(response.data.code_patient)
        setTimeout(() => {
          navigate('/patients')
        }, 2500)
      } else {
        setError(response.error || 'Échec de la création du patient')
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la création du patient')
      console.error('Create patient error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/patients')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Nouveau patient</h1>
          <p className="text-gray-600 mt-1">Enregistrer un nouveau patient</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <div>
            <p className="font-medium">Patient créé avec succès !</p>
            <p className="mt-1">
              Code patient : <span className="font-mono font-bold text-green-900">{patientCode}</span>
            </p>
            <p className="text-sm mt-1">Redirection...</p>
          </div>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                placeholder="Dupont"
                error={errors.nom?.message}
                required
                {...register('nom')}
              />

              <Input
                label="Prénom"
                placeholder="Jean"
                error={errors.prenom?.message}
                required
                {...register('prenom')}
              />

              <Input
                label="Date de naissance"
                type="date"
                error={errors.date_naissance?.message}
                required
                {...register('date_naissance')}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexe <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="M"
                      {...register('sexe')}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2">Masculin</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="F"
                      {...register('sexe')}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2">Féminin</span>
                  </label>
                </div>
                {errors.sexe && (
                  <p className="mt-1 text-sm text-red-600">{errors.sexe.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coordonnées */}
        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Téléphone"
                type="tel"
                placeholder="0612345678"
                helperText="Format: 10 chiffres"
                error={errors.telephone?.message}
                {...register('telephone')}
              />

              <Input
                label="Email"
                type="email"
                placeholder="patient@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Adresse"
                  placeholder="123 Rue de la Santé, 75000 Paris"
                  rows={3}
                  error={errors.adresse?.message}
                  {...register('adresse')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations médicales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations médicales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                label="Groupe sanguin"
                placeholder="Sélectionner un groupe sanguin"
                error={errors.groupe_sanguin?.message}
                options={[
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' },
                ]}
                {...register('groupe_sanguin')}
              />

              <Textarea
                label="Antécédents médicaux"
                placeholder="Diabète, hypertension, chirurgies antérieures..."
                rows={4}
                error={errors.antecedents_medicaux?.message}
                {...register('antecedents_medicaux')}
              />

              <Textarea
                label="Allergies"
                placeholder="Pénicilline, arachides, pollen..."
                rows={3}
                error={errors.allergies?.message}
                {...register('allergies')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/patients')}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            <Save className="w-4 h-4" />
            Enregistrer le patient
          </Button>
        </div>
      </form>
    </div>
  )
}

export default PatientNew
