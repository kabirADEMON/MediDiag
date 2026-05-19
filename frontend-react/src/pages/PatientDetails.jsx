/**
 * Patient Details Page
 * View and manage individual patient information
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, User, Calendar, Phone, Mail, FileText,
  Stethoscope, Clock, AlertCircle, Activity,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import * as patientApi from '@/api/patientApi'
import * as consultationApi from '@/api/consultationApi'
import { formatDate, calculateAge, formatScore, getUrgencyColor } from '@/utils/helpers'

export function PatientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingConsultations, setLoadingConsultations] = useState(false)

  useEffect(() => {
    loadPatient()
  }, [id])

  const loadPatient = async () => {
    try {
      setLoading(true)
      const response = await patientApi.getPatientById(id)

      if (response.success && response.data?.data) {
        setPatient(response.data.data)
        loadConsultations(id)
      } else if (response.success && response.data) {
        // Fallback if backend returns data directly
        const data = response.data
        if (data.id) {
          setPatient(data)
          loadConsultations(id)
        } else if (data.data?.id) {
          setPatient(data.data)
          loadConsultations(id)
        }
      }
    } catch (error) {
      console.error('Failed to load patient:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConsultations = async (patientId) => {
    try {
      setLoadingConsultations(true)
      const response = await consultationApi.getConsultationsByPatient(patientId)
      if (response.success && response.data?.data) {
        const data = response.data.data
        setConsultations(data.consultations || [])
      }
    } catch (error) {
      console.error('Failed to load consultations:', error)
    } finally {
      setLoadingConsultations(false)
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
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Patient non trouvé</p>
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
        <Link to="/consultation" state={{ patientCode: patient.code_patient }}>
          <Button variant="primary">
            <Stethoscope className="w-4 h-4" />
            Nouvelle consultation
          </Button>
        </Link>
      </div>

      {/* Patient info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Nom complet</p>
                <p className="font-medium">
                  {patient.prenom} {patient.nom}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Date de naissance</p>
                <p className="font-medium">
                  {formatDate(patient.date_naissance)}{' '}
                  <span className="text-gray-500">
                    ({calculateAge(patient.date_naissance)} ans)
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Sexe</p>
                <Badge variant={patient.sexe === 'M' ? 'info' : 'default'}>
                  {patient.sexe === 'M' ? 'Homme' : 'Femme'}
                </Badge>
              </div>
            </div>

            {patient.telephone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{patient.telephone}</p>
                </div>
              </div>
            )}

            {patient.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{patient.email}</p>
                </div>
              </div>
            )}

            {patient.derniere_visite && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Dernière visite</p>
                  <p className="font-medium">{formatDate(patient.derniere_visite)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations médicales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.groupe_sanguin && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Groupe sanguin</h4>
                <Badge variant="danger">{patient.groupe_sanguin}</Badge>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">Antécédents médicaux</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {patient.antecedents_medicaux || 'Aucun antécédent médical renseigné'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">Allergies</h4>
              {patient.allergies ? (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{patient.allergies}</p>
                </div>
              ) : (
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">Aucune allergie connue</p>
              )}
            </div>

            {patient.adresse && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Adresse</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{patient.adresse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consultations history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historique des consultations ({consultations.length})</CardTitle>
            <Link to="/consultation" state={{ patientCode: patient.code_patient }}>
              <Button variant="primary" size="sm">
                <Stethoscope className="w-4 h-4" />
                Nouvelle consultation
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loadingConsultations ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="md" text="Chargement des consultations..." />
            </div>
          ) : consultations.length > 0 ? (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-primary-600" />
                        <h3 className="font-semibold text-gray-900">
                          {consultation.diagnostic || 'Diagnostic en attente'}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(consultation.date_consultation)}</span>
                        </div>
                        {consultation.motif && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{consultation.motif}</span>
                          </div>
                        )}
                        {consultation.medecin_nom && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>
                              Dr. {consultation.medecin_prenom} {consultation.medecin_nom}
                            </span>
                          </div>
                        )}
                      </div>
                      {consultation.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          {consultation.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Aucune consultation enregistrée</p>
              <Link to="/consultation" state={{ patientCode: patient.code_patient }}>
                <Button variant="primary" className="mt-4" size="sm">
                  <Stethoscope className="w-4 h-4" />
                  Créer une consultation
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientDetails
