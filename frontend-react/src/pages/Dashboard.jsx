/**
 * Dashboard Page
 * Main dashboard with statistics and overview
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Stethoscope,
  FileText,
  TrendingUp,
  Activity,
  AlertCircle,
  Calendar,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import * as diagnosticApi from '@/api/diagnosticApi'
import * as patientApi from '@/api/patientApi'
import { formatDate } from '@/utils/helpers'

export function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalConsultations: 0,
    totalDiagnostics: 0,
    todayConsultations: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load statistics
      const [statsResponse, patientsResponse] = await Promise.all([
        diagnosticApi.getDiagnosticStats(),
        patientApi.getPatients({ limit: 5 }),
      ])

      if (statsResponse.success) {
        setStats(statsResponse.data)
      }

      if (patientsResponse.success) {
        setRecentActivity(patientsResponse.data.patients || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Chargement du tableau de bord..." />
      </div>
    )
  }

  const statCards = [
    {
      title: 'Patients',
      value: stats.totalPatients || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/patients',
    },
    {
      title: 'Consultations',
      value: stats.totalConsultations || 0,
      icon: Stethoscope,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/consultation',
    },
    {
      title: 'Diagnostics',
      value: stats.totalDiagnostics || 0,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/diagnostics',
    },
    {
      title: "Aujourd'hui",
      value: stats.todayConsultations || 0,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour, Dr. {user?.nom} 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Voici un aperçu de votre activité médicale
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} hover className="cursor-pointer">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/consultation/new">
              <Button variant="primary" className="w-full">
                <Stethoscope className="w-4 h-4" />
                Nouvelle consultation
              </Button>
            </Link>
            <Link to="/patients/new">
              <Button variant="secondary" className="w-full">
                <Users className="w-4 h-4" />
                Ajouter un patient
              </Button>
            </Link>
            <Link to="/diagnostics">
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4" />
                Voir les diagnostics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {patient.prenom} {patient.nom}
                        </p>
                        <p className="text-sm text-gray-500">
                          {patient.age} ans • {patient.sexe === 'M' ? 'Homme' : 'Femme'}
                        </p>
                      </div>
                    </div>
                    <Link to={`/patients/${patient.id}`}>
                      <Button variant="ghost" size="sm">
                        Voir
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Aucune activité récente
              </p>
            )}
          </CardContent>
        </Card>

        {/* System status */}
        <Card>
          <CardHeader>
            <CardTitle>État du système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">API Backend</p>
                    <p className="text-sm text-gray-500">Opérationnel</p>
                  </div>
                </div>
                <Badge variant="success">En ligne</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Modèle IA</p>
                    <p className="text-sm text-gray-500">Prêt</p>
                  </div>
                </div>
                <Badge variant="success">Actif</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Base de données</p>
                    <p className="text-sm text-gray-500">1000 maladies</p>
                  </div>
                </div>
                <Badge variant="info">Chargée</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical disclaimer */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 font-medium mb-1">
              Avertissement médical
            </p>
            <p className="text-sm text-yellow-700">
              Cet outil est une aide à la décision médicale et ne remplace pas un
              diagnostic médical professionnel. Toujours consulter un professionnel de
              santé qualifié.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
