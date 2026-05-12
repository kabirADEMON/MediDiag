/**
 * Statistics Page
 * View medical statistics and charts
 */

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Activity } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import * as diagnosticApi from '@/api/diagnosticApi'

export function Statistics() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const response = await diagnosticApi.getDiagnosticStats()

      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Chargement des statistiques..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-gray-600 mt-1">Analyse de l'activité médicale</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total diagnostics</p>
              <p className="text-3xl font-bold">{stats?.totalDiagnostics || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Patients actifs</p>
              <p className="text-3xl font-bold">{stats?.activePatients || 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Taux de précision</p>
              <p className="text-3xl font-bold">90.7%</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Maladies</p>
              <p className="text-3xl font-bold">1000</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Graphiques et analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>Les graphiques détaillés seront disponibles prochainement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Statistics
