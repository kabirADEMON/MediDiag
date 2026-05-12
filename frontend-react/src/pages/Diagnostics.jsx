/**
 * Diagnostics Page
 * View diagnostic history
 */

import { useState, useEffect } from 'react'
import { FileText, Calendar, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import * as diagnosticApi from '@/api/diagnosticApi'
import { formatDate, formatScore } from '@/utils/helpers'

export function Diagnostics() {
  const [diagnostics, setDiagnostics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDiagnostics()
  }, [])

  const loadDiagnostics = async () => {
    try {
      setLoading(true)
      const response = await diagnosticApi.getDiagnostics()

      if (response.success) {
        setDiagnostics(response.data.diagnostics || [])
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Historique des diagnostics</h1>
        <p className="text-gray-600 mt-1">Consultez les diagnostics effectués</p>
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
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {diagnostic.maladie_principale}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{diagnostic.patient_nom}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(diagnostic.date)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="info">{formatScore(diagnostic.score)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun diagnostic enregistré</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Diagnostics
