/**
 * Patients Page
 * List and manage patients
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Search, Plus, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import * as patientApi from '@/api/patientApi'
import { formatDate, calculateAge } from '@/utils/helpers'

export function Patients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadPatients()
  }, [pagination.page])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const response = await patientApi.getPatients({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
      })

      if (response.success && response.data) {
        const backendData = response.data.data || response.data
        const patientsData = backendData.patients || []
        setPatients(patientsData)
        setPagination((prev) => ({
          ...prev,
          total: backendData.total || 0,
        }))
      }
    } catch (error) {
      console.error('Failed to load patients:', error)
      setErrorMsg('Erreur lors du chargement des patients')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadPatients()
  }

  const handleDeleteConfirm = (patient) => {
    setDeleteConfirm(patient)
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm(null)
  }

  const handleDeletePatient = async () => {
    if (!deleteConfirm) return

    try {
      setDeleting(true)
      const response = await patientApi.deletePatient(deleteConfirm.id)

      if (response.success) {
        setSuccessMsg(`Patient ${deleteConfirm.prenom} ${deleteConfirm.nom} supprimé avec succès`)
        setDeleteConfirm(null)
        loadPatients()
        setTimeout(() => setSuccessMsg(''), 4000)
      } else {
        setErrorMsg(response.error || 'Erreur lors de la suppression')
        setDeleteConfirm(null)
      }
    } catch (error) {
      setErrorMsg('Erreur lors de la suppression du patient')
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Chargement des patients..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">Gérez vos patients</p>
        </div>
        <Link to="/patients/new">
          <Button variant="primary">
            <Plus className="w-4 h-4" />
            Nouveau patient
          </Button>
        </Link>
      </div>

      {successMsg && (
        <Alert variant="success" onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert variant="error" onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Supprimer le patient
                </h3>
                <p className="text-gray-600 mt-2">
                  Êtes-vous sûr de vouloir supprimer{' '}
                  <strong>
                    {deleteConfirm.prenom} {deleteConfirm.nom}
                  </strong>{' '}
                  ({deleteConfirm.code_patient}) ? Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={handleDeleteCancel} disabled={deleting}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleDeletePatient}
                loading={deleting}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, prénom, email ou code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="primary" onClick={handleSearch}>
              <Search className="w-4 h-4" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patients table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des patients ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Patient</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Âge</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Sexe</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Dernière visite</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-primary-600 font-medium">
                          {patient.code_patient || `PAT-${String(patient.id).padStart(6, '0')}`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {patient.prenom} {patient.nom}
                          </p>
                          <p className="text-sm text-gray-500">{patient.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">
                          {calculateAge(patient.date_naissance)} ans
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={patient.sexe === 'M' ? 'info' : 'default'}>
                          {patient.sexe === 'M' ? 'Homme' : 'Femme'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">{patient.telephone || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">
                          {patient.derniere_visite
                            ? formatDate(patient.derniere_visite)
                            : 'Aucune'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/patients/${patient.id}`}>
                            <Button variant="ghost" size="sm" title="Voir le dossier">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={`/patients/${patient.id}`}>
                            <Button variant="ghost" size="sm" title="Modifier">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Supprimer"
                            onClick={() => handleDeleteConfirm(patient)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun patient trouvé</p>
              <Link to="/patients/new">
                <Button variant="primary" className="mt-4">
                  <Plus className="w-4 h-4" />
                  Ajouter un patient
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)} •{' '}
            {pagination.total} patient(s) au total
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Patients
