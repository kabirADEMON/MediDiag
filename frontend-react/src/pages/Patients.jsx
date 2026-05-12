/**
 * Patients Page
 * List and manage patients
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import * as patientApi from '@/api/patientApi'
import { formatDate, calculateAge } from '@/utils/helpers'

export function Patients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  })

  useEffect(() => {
    loadPatients()
  }, [pagination.page])

  const loadPatients = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading patients...', {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
      })
      
      const response = await patientApi.getPatients({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
      })

      console.log('📦 API Response:', response)

      if (response.success && response.data) {
        // response.data contient la réponse du backend { success, message, data }
        const backendData = response.data.data || {}
        const patientsData = backendData.patients || []
        console.log('✅ Patients loaded:', patientsData.length, patientsData)
        
        setPatients(patientsData)
        setPagination((prev) => ({
          ...prev,
          total: backendData.total || 0,
        }))
      } else {
        console.error('❌ API returned success=false:', response)
      }
    } catch (error) {
      console.error('❌ Failed to load patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadPatients()
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

      {/* Search and filters */}
      <Card>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un patient..."
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Code
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Patient
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Âge
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Sexe
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Dernière visite
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
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
                        <span className="text-gray-900">{patient.telephone}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">
                          {patient.derniere_visite
                            ? formatDate(patient.derniere_visite)
                            : 'Aucune'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/patients/${patient.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
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
      {patients.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} sur{' '}
            {Math.ceil(pagination.total / pagination.limit)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              disabled={
                pagination.page >= Math.ceil(pagination.total / pagination.limit)
              }
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
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
