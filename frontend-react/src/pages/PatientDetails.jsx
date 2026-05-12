/**
 * Patient Details Page
 * View and manage individual patient information
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, Phone, Mail, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import * as patientApi from '@/api/patientApi'
import { formatDate, calculateAge } from '@/utils/helpers'

export function PatientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatient()
  }, [id])

  const loadPatient = async () => {
    try {
      setLoading(true)
      const response = await patientApi.getPatientById(id)

      if (response.success) {
        setPatient(response.data)
      }
    } catch (error) {
      console.error('Failed to load patient:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Chargement du patient..." />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Patient non trouvé</p>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/patients')}>
          Retour à la liste
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/patients')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.prenom} {patient.nom}
            </h1>
            <Badge variant="info" className="font-mono">
              {patient.code_patient || `PAT-${String(patient.id).padStart(6, '0')}`}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">Dossier patient</p>
        </div>
        <Button variant="primary">Nouvelle consultation</Button>
      </div>

      {/* Patient info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Nom complet</p>
                <p className="font-medium">
                  {patient.prenom} {patient.nom}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Date de naissance</p>
                <p className="font-medium">
                  {formatDate(patient.date_naissance)} ({calculateAge(patient.date_naissance)} ans)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Sexe</p>
                <Badge variant={patient.sexe === 'M' ? 'info' : 'default'}>
                  {patient.sexe === 'M' ? 'Homme' : 'Femme'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium">{patient.telephone || 'Non renseigné'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{patient.email || 'Non renseigné'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Antécédents médicaux</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {patient.antecedents_medicaux || 'Aucun antécédent médical renseigné'}
            </p>

            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Allergies</h4>
              <p className="text-gray-700">
                {patient.allergies || 'Aucune allergie connue'}
              </p>
            </div>

            {patient.groupe_sanguin && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Groupe sanguin</h4>
                <Badge variant="info">{patient.groupe_sanguin}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consultations history */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des consultations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Aucune consultation enregistrée</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientDetails
