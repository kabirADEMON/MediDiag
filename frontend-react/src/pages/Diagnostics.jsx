/**
 * Diagnostics Page
 * View saved diagnostic history from consultations
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Calendar, User, Activity, Stethoscope } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { get } from '@/api/axios'
import { formatDate, formatScore, getUrgencyColor } from '@/utils/helpers'

export function Diagnostics() {
  const [diagnostics, setDiagnostics] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ skip: 0, limit: 10, total: 0 })

  useEffect(() => {
    loadDiagnostics()
  }, [pagination.skip])

  const loadDiagnostics = async () => {
    try {
      setLoading(true)
      const response = await get('/diagnostics', {
        params: { skip: pagination.skip, limit: pagination.limit },
      })

      if (response.success && response.data) {
        const data = response.data.data || response.data
        setDiagnostics(data.diagnostics || [])
        setPagination((prev) => ({ ...prev, total: data.total || 0 }))
      }
    } catch (error) {
      console.error('Failed to load diagnostics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Chargement des diagnostics..." />
      </div>
    )
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historique des diagnostics</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total} diagnostic(s) enregistré(s)
          </p>
        </div>
        <Link to="/consultation">
          <Button variant="primary">
            <Stethoscope className="w-4 h-4" />
            Nouvelle consultation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostics récents</CardTitle>
        </CardHeader>
        <CardContent>
          {diagnostics.length > 0 ? (
            <div className="space-y-4">
              {diagnostics.map((diagnostic) => (
                <div
                  key={diagnostic.id}
                  className={`p-4 border-2 rounded-lg transition-colors ${getUrgencyColor(diagnostic.urgence)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">
                          {diagnostic.maladie_principale || 'Diagnostic inconnu'}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm mt-2">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span className="font-medium">
                            {diagnostic.patient_nom || 'Patient inconnu'}
                          </span>
                          {diagnostic.code_patient && (
                            <span className="font-mono text-xs text-gray-500">
                              ({diagnostic.code_patient})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(diagnostic.date || diagnostic.created_at)}</span>
                        </div>
                        {diagnostic.urgence && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Urgence :</span>
                            <span className="capitalize">{diagnostic.urgence}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          (diagnostic.score || 0) >= 80
                            ? 'danger'
                            : (diagnostic.score || 0) >= 60
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {formatScore(diagnostic.score)}
                      </Badge>
                      {diagnostic.patient_id && (
                        <Link to={`/patients/${diagnostic.patient_id}`}>
                          <Button variant="ghost" size="sm">
                            Dossier patient
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Aucun diagnostic enregistré</p>
              <p className="text-gray-500 text-sm mt-2">
                Les diagnostics apparaissent ici après avoir enregistré une consultation
              </p>
              <Link to="/consultation">
                <Button variant="primary" className="mt-6">
                  <Stethoscope className="w-4 h-4" />
                  Créer une consultation
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
            Page {currentPage} sur {totalPages} • {pagination.total} résultats
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={pagination.skip === 0}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  skip: Math.max(0, prev.skip - prev.limit),
                }))
              }
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, skip: prev.skip + prev.limit }))
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

export default Diagnostics
