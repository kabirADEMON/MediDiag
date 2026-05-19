/**
 * Statistics Page
 * View medical statistics and charts
 */

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Activity, FileText, Stethoscope, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { get } from '@/api/axios'

export function Statistics() {
  const [loading, setLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState(null)
  const [datasetStats, setDatasetStats] = useState(null)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)

      const [globalRes, datasetRes] = await Promise.all([
        get('/diagnostics/stats'),
        get('/diagnostic/stats'),
      ])

      if (globalRes.success && globalRes.data) {
        const data = globalRes.data.data || globalRes.data
        setGlobalStats(data)
      }

      if (datasetRes.success && datasetRes.data) {
        const data = datasetRes.data.data || datasetRes.data
        setDatasetStats(data)
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

  const mainStats = [
    {
      title: 'Total patients',
      value: globalStats?.totalPatients || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Consultations',
      value: globalStats?.totalConsultations || 0,
      icon: Stethoscope,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Diagnostics enregistrés',
      value: globalStats?.totalDiagnostics || 0,
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: "Consultations aujourd'hui",
      value: globalStats?.todayConsultations || 0,
      icon: Calendar,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  const systemStats = [
    {
      title: 'Taux de précision IA',
      value: '90.7%',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      sub: 'Modèle Random Forest',
    },
    {
      title: 'Maladies référencées',
      value: datasetStats?.total_diseases || 1000,
      icon: Activity,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      sub: 'Dans la base de données',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-gray-600 mt-1">Analyse de l'activité médicale</p>
      </div>

      {/* Main activity stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System performance stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systemStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
                {stat.sub && <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>}
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dataset distribution */}
      {datasetStats?.sex_distribution && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution par sexe dans la base de données</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(datasetStats.sex_distribution).map(([sex, count]) => (
                <div
                  key={sex}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg flex-1 min-w-[150px]"
                >
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div>
                    <p className="font-medium text-gray-700">{sex === 'Both' ? 'Les deux sexes' : sex === 'M' ? 'Masculin' : sex === 'F' ? 'Féminin' : sex}</p>
                    <p className="text-sm text-gray-500">maladies</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Age range */}
      {datasetStats?.age_range && (
        <Card>
          <CardHeader>
            <CardTitle>Couverture d'âge dans la base de données</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-700">{datasetStats.age_range.min}</p>
                <p className="text-sm text-gray-600 mt-1">Âge minimum</p>
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-blue-200 to-blue-600 rounded-full" />
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-700">{datasetStats.age_range.max}</p>
                <p className="text-sm text-gray-600 mt-1">Âge maximum</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Version</p>
              <p className="font-semibold mt-1">MediDiag v1.0.0</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Algorithme</p>
              <p className="font-semibold mt-1">Hybrid ML + Fuzzy Matching</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Précision globale</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-semibold">90.7%</p>
                <Badge variant="success">Excellent</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Statistics
