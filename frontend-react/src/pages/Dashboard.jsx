import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Stethoscope,
  AlertCircle,
  Calendar,
  UserCog,
  Shield,
  Plus,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button } from '@/components/ui/Button'
import * as patientApi from '@/features/patients/api/patientApi'
import { get } from '@/api/axios'
import { cn } from '@/utils/helpers'


function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-slate-600 mb-1.5">{label}</p>
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
          <span>{e.name === 'consultations' ? 'Consultations' : 'Diagnostics'}</span>
          <span className="font-bold ml-auto pl-4">{e.value}</span>
        </div>
      ))}
    </div>
  )
}

const KPI_THEMES = [
  {
    accent: 'bg-blue-600',
    iconBg: 'bg-blue-600',
    icon: 'text-white',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
    border: '#bfdbfe',
    trend: 'text-blue-600 bg-blue-50',
  },
  {
    accent: 'bg-violet-600',
    iconBg: 'bg-violet-600',
    icon: 'text-white',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
    border: '#ddd6fe',
    trend: 'text-violet-600 bg-violet-50',
  },
  {
    accent: 'bg-emerald-600',
    iconBg: 'bg-emerald-600',
    icon: 'text-white',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
    border: '#a7f3d0',
    trend: 'text-emerald-600 bg-emerald-50',
  },
  {
    accent: 'bg-amber-500',
    iconBg: 'bg-amber-500',
    icon: 'text-white',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
    border: '#fde68a',
    trend: 'text-amber-600 bg-amber-50',
  },
]

function KpiCard({ title, value, icon: Icon, sub, link, index = 0, trend }) {
  const theme = KPI_THEMES[index % KPI_THEMES.length]
  const isPositive = trend && !trend.startsWith('▼')
  const content = (
    <div
      className="group relative rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
      style={{ background: theme.gradient, border: `1.5px solid ${theme.border}` }}
    >
      <div className="flex items-start justify-between mb-5">
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl shadow-sm', theme.iconBg)}>
          <Icon className={cn('w-5 h-5', theme.icon)} />
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', theme.trend)}>
              {trend}
            </span>
          )}
          {link && (
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          )}
        </div>
      </div>

      <div className="text-3xl font-extrabold text-slate-900 tabular-nums leading-none mb-1.5">
        {value ?? '—'}
      </div>
      <p className="text-xs font-medium text-slate-400">{sub}</p>
      <p className="text-sm font-semibold text-slate-700 mt-1">{title}</p>
    </div>
  )
  if (link) return <Link to={link} className="block">{content}</Link>
  return content
}



export function Dashboard() {
  const { user } = useAuth()
  const role = user?.role || 'medecin'
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalConsultations: 0,
    totalDiagnostics: 0,
    todayConsultations: 0,
    totalUsers: 0,
    patientsEnAttente: 0,
  })
  const [recentPatients, setRecentPatients] = useState([])
  const [weekData, setWeekData] = useState([])
  const [topMaladies, setTopMaladies] = useState([])

  useEffect(() => { loadDashboardData() }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const requests = [
        get('/diagnostics/stats'),
        patientApi.getPatients({ limit: 5 }),
        get('/diagnostics/weekly'),
        get('/diagnostics/top-maladies'),
      ]
      if (role === 'administrateur') requests.push(get('/auth/users'))

      const [statsRes, patientsRes, weeklyRes, topRes, usersRes] = await Promise.all(requests)

      if (statsRes.success) {
        const d = statsRes.data?.data || statsRes.data
        setStats((prev) => ({ ...prev, ...d }))
      }
      if (patientsRes.success) {
        const d = patientsRes.data?.data || patientsRes.data
        setRecentPatients(d?.patients || [])
      }
      if (weeklyRes.success) {
        const d = weeklyRes.data?.data || weeklyRes.data
        setWeekData(Array.isArray(d) ? d : [])
      }
      if (topRes?.success) {
        const d = topRes.data?.data || topRes.data
        setTopMaladies(Array.isArray(d) ? d : [])
      }
      if (usersRes?.success) {
        const d = usersRes.data?.data || usersRes.data
        setStats((prev) => ({ ...prev, totalUsers: d?.total || 0 }))
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    const skeletonCount = role === 'infirmier' ? 3 : 4
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="skeleton h-6 w-52 rounded mb-2" />
            <div className="skeleton h-4 w-36 rounded" />
          </div>
          <div className="skeleton h-9 w-40 rounded-lg" />
        </div>
        <div className={`grid gap-4 ${skeletonCount === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'}`}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="skeleton w-10 h-10 rounded-xl mb-5" />
              <div className="skeleton h-8 w-14 rounded mb-2" />
              <div className="skeleton h-3 w-24 rounded mb-1" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="skeleton h-4 w-44 rounded mb-2" />
          <div className="skeleton h-3 w-56 rounded mb-6" />
          <div className="skeleton h-52 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="skeleton h-4 w-36 rounded mb-5" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 mb-4">
                <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-32 rounded mb-1.5" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="skeleton h-4 w-32 rounded mb-5" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="skeleton h-12 w-full rounded-xl mb-2" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const greeting =
    role === 'medecin'
      ? `Bonjour, Dr. ${user?.nom}`
      : `Bonjour, ${user?.prenom} ${user?.nom}`

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const kpiCards =
    role === 'infirmier'
      ? [
          { title: 'Patients', value: stats.totalPatients, icon: Users, sub: 'Total enregistrés', link: '/patients', trend: '▲ actif' },
          { title: 'Consultations', value: stats.totalConsultations, icon: Stethoscope, sub: 'Ce mois', trend: '▲ ce mois' },
          { title: "Aujourd'hui", value: stats.todayConsultations, icon: Calendar, sub: 'Consultations du jour', trend: '→ aujourd\'hui' },
        ]
      : role === 'administrateur'
      ? [
          { title: 'Patients', value: stats.totalPatients, icon: Users, sub: 'Total enregistrés', link: '/patients', trend: '▲ total' },
          { title: 'Consultations', value: stats.totalConsultations, icon: Stethoscope, sub: 'Total effectuées', trend: '▲ cumulé' },
          { title: 'En attente', value: stats.patientsEnAttente, icon: AlertCircle, sub: 'Patients non consultés', link: '/patients', trend: stats.patientsEnAttente > 0 ? '⚠ en attente' : '✓ à jour' },
          { title: 'Utilisateurs', value: stats.totalUsers, icon: UserCog, sub: 'Comptes actifs', link: '/admin/users', trend: '▲ actifs' },
        ]
      : [
          { title: 'Patients', value: stats.totalPatients, icon: Users, sub: 'Total enregistrés', link: '/patients', trend: '▲ total' },
          { title: 'Consultations', value: stats.totalConsultations, icon: Stethoscope, sub: 'Total effectuées', link: '/consultation', trend: '▲ cumulé' },
          { title: 'En attente', value: stats.patientsEnAttente, icon: AlertCircle, sub: 'Patients non consultés', link: '/patients', trend: stats.patientsEnAttente > 0 ? '⚠ en attente' : '✓ à jour' },
          { title: "Aujourd'hui", value: stats.todayConsultations, icon: Calendar, sub: 'Consultations du jour', trend: '→ aujourd\'hui' },
        ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{greeting}</h1>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {role === 'administrateur' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
              <Shield className="w-3.5 h-3.5" />
              Administrateur
            </span>
          )}
          {role !== 'administrateur' && (
            <Link to={role === 'infirmier' ? '/patients/new' : '/consultation'}>
              <Button variant="primary" size="sm" iconLeft={<Plus className="w-4 h-4" />}>
                {role === 'infirmier' ? 'Admettre un patient' : 'Nouvelle consultation'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className={cn(
        'grid gap-4',
        kpiCards.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
      )}>
        {kpiCards.map((k, i) => <KpiCard key={k.title} {...k} index={i} />)}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Activité hebdomadaire</h2>
            <p className="text-xs text-slate-400 mt-0.5">Consultations et diagnostics — 7 derniers jours</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Consultations
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
              Diagnostics
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gViolet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="consultations" stroke="#3b82f6" strokeWidth={2} fill="url(#gBlue)" dot={false} activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
            <Area type="monotone" dataKey="diagnostics" stroke="#8b5cf6" strokeWidth={2} fill="url(#gViolet)" dot={false} activeDot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent patients */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Patients récents</h2>
              <p className="text-xs text-slate-400 mt-0.5">Derniers dossiers enregistrés</p>
            </div>
            <Link to="/patients" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Voir tous <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPatients.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {recentPatients.slice(0, 5).map((patient, idx) => {
                const initials = ((patient.prenom?.[0] || '') + (patient.nom?.[0] || '')).toUpperCase() || '?'
                const avatarColors = [
                  'bg-blue-100 text-blue-700',
                  'bg-violet-100 text-violet-700',
                  'bg-emerald-100 text-emerald-700',
                  'bg-amber-100 text-amber-700',
                  'bg-rose-100 text-rose-700',
                ]
                return (
                  <Link
                    key={patient.id}
                    to={`/patients/${patient.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0', avatarColors[idx % avatarColors.length])}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-none truncate">
                        {patient.prenom} {patient.nom}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{patient.code_patient}</p>
                    </div>
                    <span className={cn(
                      'text-2xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                      patient.a_ete_consulte
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    )}>
                      {patient.a_ete_consulte ? 'Consulté' : 'En attente'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center px-5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Aucun patient</p>
              <p className="text-xs text-slate-400 mb-4">Commencez par ajouter un dossier patient</p>
              <Link to="/patients/new">
                <Button variant="secondary" size="sm">
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Top maladies */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800">Top maladies diagnostiquées</h2>
            <p className="text-xs text-slate-400 mt-0.5">Pathologies les plus fréquentes — données réelles</p>
          </div>
          {topMaladies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-slate-400">Aucun diagnostic enregistré pour l'instant</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(topMaladies.length * 34, 120)}>
              <BarChart
                data={topMaladies}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                barSize={14}
              >
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="maladie"
                  width={140}
                  tick={{ fill: '#475569', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v.length > 18 ? v.slice(0, 17) + '…' : v}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
                        <p className="font-semibold text-slate-700 mb-0.5">{payload[0]?.payload?.maladie}</p>
                        <p className="text-blue-600 font-bold">{payload[0].value} cas</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
