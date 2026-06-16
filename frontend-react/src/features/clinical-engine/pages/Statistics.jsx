import { useState, useEffect } from 'react'
import {
  Users, Stethoscope, FileText, Calendar,
  Activity, CheckCircle, XCircle, Database, Cpu, Target,
  TrendingUp, Thermometer, BrainCircuit, TrendingDown,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { get } from '@/api/axios'
import { cn } from '@/utils/helpers'

// ─── Tooltip commun ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-slate-600 mb-1.5">{label}</p>
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
          <span>{e.name === 'consultations' ? 'Consultations' : e.name === 'diagnostics' ? 'Diagnostics' : e.name}</span>
          <span className="font-bold ml-auto pl-4">{e.value}{unit}</span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KPI_THEMES = [
  { accent: 'bg-blue-600',    light: 'bg-blue-50',    icon: 'text-blue-600'    },
  { accent: 'bg-violet-600',  light: 'bg-violet-50',  icon: 'text-violet-600'  },
  { accent: 'bg-emerald-600', light: 'bg-emerald-50', icon: 'text-emerald-600' },
  { accent: 'bg-amber-500',   light: 'bg-amber-50',   icon: 'text-amber-600'   },
]

function KpiCard({ title, value, icon: Icon, sub, index = 0 }) {
  const theme = KPI_THEMES[index % KPI_THEMES.length]
  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${theme.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-start justify-between mb-5">
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', theme.light)}>
          <Icon className={cn('w-5 h-5', theme.icon)} />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 tabular-nums leading-none mb-1.5">
        {value ?? '—'}
      </div>
      <p className="text-xs font-medium text-slate-400">{sub}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{title}</p>
    </div>
  )
}

// ─── Couleurs urgence ─────────────────────────────────────────────────────────
const URGENCY_COLORS = {
  critique: '#ef4444',
  élevée:   '#f97316',
  modérée:  '#f59e0b',
  faible:   '#10b981',
  inconnue: '#94a3b8',
}

// Score distribution bucket colours
const SCORE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#10b981']

function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-slate-100 rounded', className)} />
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Statistics() {
  const [loading, setLoading]           = useState(true)
  const [globalStats, setGlobalStats]   = useState(null)
  const [datasetStats, setDatasetStats] = useState(null)
  const [monthlyData, setMonthlyData]   = useState([])
  const [topSymptoms, setTopSymptoms]   = useState([])
  const [scoreData, setScoreData]       = useState([])
  const [urgencyData, setUrgencyData]   = useState([])
  const [feedbackStats, setFeedbackStats] = useState(null)
  const [adjustments, setAdjustments]     = useState([])

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [globalRes, datasetRes, monthlyRes, symptomsRes, scoreRes, urgRes, feedRes, adjRes] = await Promise.all([
        get('/diagnostics/stats'),
        get('/diagnostic/stats'),
        get('/diagnostics/monthly'),
        get('/diagnostics/top-symptoms'),
        get('/diagnostics/score-distribution'),
        get('/diagnostics/urgency-distribution'),
        get('/feedback/stats'),
        get('/feedback/adjustments'),
      ])

      if (globalRes.success)   setGlobalStats(globalRes.data?.data || globalRes.data)
      if (datasetRes.success)  setDatasetStats(datasetRes.data?.data || datasetRes.data)
      if (monthlyRes.success)  setMonthlyData(monthlyRes.data?.data || [])
      if (symptomsRes.success) setTopSymptoms(symptomsRes.data?.data || [])
      if (scoreRes.success)    setScoreData(scoreRes.data?.data || [])
      if (urgRes.success)      setUrgencyData(urgRes.data?.data || [])
      if (feedRes.success)     setFeedbackStats(feedRes.data?.data || feedRes.data)
      if (adjRes.success)      setAdjustments((adjRes.data?.data || adjRes.data)?.adjustments || [])
    } catch (err) {
      console.error('Statistics load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-6 w-40 mb-1.5" /><Skeleton className="h-4 w-64" /></div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
              <Skeleton className="w-10 h-10 rounded-xl mb-5" /><Skeleton className="h-8 w-14 mb-2" /><Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6"><Skeleton className="h-4 w-44 mb-6" /><Skeleton className="h-52 w-full" /></div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6"><Skeleton className="h-4 w-36 mb-6" /><Skeleton className="h-52 w-full" /></div>
        </div>
      </div>
    )
  }

  const validationRate = feedbackStats?.validation_rate ?? 0
  const totalFeedback  = feedbackStats?.total ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Performances IA</h1>
        <p className="text-sm text-slate-400 mt-0.5">Analyse mensuelle — qualité diagnostique et tendances symptomatologiques</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Précision IA" value="90.7%" icon={Target}    sub="Random Forest validé"    index={0} />
        <KpiCard title="Diagnostics IA" value={globalStats?.totalDiagnostics ?? 0} icon={FileText} sub="Total enregistrés" index={1} />
        <KpiCard title="Taux validation" value={`${validationRate}%`} icon={CheckCircle} sub="Confirmés par médecins" index={2} />
        <KpiCard title="Maladies indexées" value={datasetStats?.total_diseases ?? 1006} icon={Database} sub="Dans le dataset actif" index={3} />
      </div>

      {/* Row 1: Monthly trend + Top symptoms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly activity */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Activité sur 30 jours</h2>
              <p className="text-xs text-slate-400 mt-0.5">Par semaine glissante</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Consultations</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />Diagnostics</span>
            </div>
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="consultations" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="diagnostics"   fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Aucune donnée ce mois</div>
          )}
        </div>

        {/* Top symptoms */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800">Top symptômes présentés</h2>
            <p className="text-xs text-slate-400 mt-0.5">Signes les plus fréquemment saisis en consultation</p>
          </div>
          {topSymptoms.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(topSymptoms.slice(0, 8).length * 30, 150)}>
              <BarChart
                data={topSymptoms.slice(0, 8)}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                barSize={12}
              >
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="symptome"
                  width={130}
                  tick={{ fill: '#475569', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v.length > 17 ? v.slice(0, 16) + '…' : v}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
                        <p className="font-semibold text-slate-700 mb-0.5">{payload[0]?.payload?.symptome}</p>
                        <p className="text-emerald-600 font-bold">{payload[0].value} occurrences</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {topSymptoms.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Aucun symptôme enregistré</div>
          )}
        </div>
      </div>

      {/* Row 2: Score distribution + Urgency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Score distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800">Distribution des scores de confiance</h2>
            <p className="text-xs text-slate-400 mt-0.5">Répartition par tranche de score (0 → 100)</p>
          </div>
          {scoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scoreData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
                        <p className="font-semibold text-slate-700 mb-0.5">Score {payload[0]?.payload?.range}</p>
                        <p className="text-blue-600 font-bold">{payload[0].value} diagnostic(s)</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {scoreData.map((_, i) => (
                    <Cell key={i} fill={SCORE_COLORS[i % SCORE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-slate-400">Aucun score disponible</div>
          )}
        </div>

        {/* Urgency distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800">Distribution des niveaux d'urgence</h2>
            <p className="text-xs text-slate-400 mt-0.5">Répartition des diagnostics par criticité</p>
          </div>
          {urgencyData.length > 0 ? (
            <div className="space-y-3">
              {urgencyData.map(({ urgence, total }) => {
                const color = URGENCY_COLORS[urgence] || '#94a3b8'
                const totalAll = urgencyData.reduce((s, d) => s + d.total, 0)
                const pct = totalAll > 0 ? Math.round((total / totalAll) * 100) : 0
                return (
                  <div key={urgence}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="font-medium text-slate-700 capitalize">{urgence}</span>
                      </div>
                      <span className="font-bold text-slate-600 tabular-nums">{total} cas ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-sm text-slate-400">Aucune donnée disponible</div>
          )}
        </div>
      </div>

      {/* Row 3: Feedback validation */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Validation médecin</h2>
            <p className="text-xs text-slate-400 mt-0.5">Taux de confirmation des diagnostics IA par les médecins</p>
          </div>
          {totalFeedback > 0 && (
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
              {totalFeedback} évaluations
            </span>
          )}
        </div>

        {totalFeedback > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            {/* Rate */}
            <div className="text-center sm:text-left">
              <span className="text-5xl font-bold text-slate-900 tabular-nums leading-none">{validationRate}%</span>
              <p className="text-xs text-slate-400 mt-2">de taux de validation</p>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${validationRate}%` }} />
              </div>
            </div>

            {/* Confirmed */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-emerald-700 leading-none">{feedbackStats?.validated ?? 0}</p>
                <p className="text-xs text-emerald-600 mt-0.5">Diagnostics confirmés</p>
              </div>
            </div>

            {/* Rejected */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
              <XCircle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-red-600 leading-none">{feedbackStats?.rejected ?? 0}</p>
                <p className="text-xs text-red-500 mt-0.5">Diagnostics alternatifs</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-sm text-slate-400">Aucun retour médecin enregistré</div>
        )}
      </div>

      {/* Learning adjustments */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-violet-500" />
              Boucle d'apprentissage — Ajustements par maladie
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Scores corrigés automatiquement d'après les validations médecin. Plafond ±15 pts.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
            {adjustments.length} maladie{adjustments.length !== 1 ? 's' : ''} apprise{adjustments.length !== 1 ? 's' : ''}
          </span>
        </div>
        {adjustments.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-sm text-slate-400">
            Aucun ajustement — validez des diagnostics pour démarrer l'apprentissage
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {adjustments.slice(0, 10).map((a) => {
              const pos = a.adjustment > 0
              const zero = a.adjustment === 0
              return (
                <div key={a.disease_name} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/60 transition-colors">
                  <div className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-lg shrink-0',
                    pos  ? 'bg-emerald-50' : zero ? 'bg-slate-50' : 'bg-red-50'
                  )}>
                    {pos  ? <TrendingUp   className="w-3.5 h-3.5 text-emerald-500" /> :
                     zero ? <Activity     className="w-3.5 h-3.5 text-slate-400"   /> :
                            <TrendingDown className="w-3.5 h-3.5 text-red-400"     />}
                  </div>
                  <span className="flex-1 text-sm text-slate-700 truncate">{a.disease_name}</span>
                  <span className="text-xs text-slate-400">
                    <span className="text-emerald-600 font-medium">{a.confirmations}✓</span>
                    {' / '}
                    <span className="text-red-500 font-medium">{a.rejections}✗</span>
                  </span>
                  <span className={cn(
                    'text-sm font-bold tabular-nums w-14 text-right',
                    pos  ? 'text-emerald-600' : zero ? 'text-slate-400' : 'text-red-500'
                  )}>
                    {a.adjustment > 0 ? '+' : ''}{a.adjustment.toFixed(1)} pts
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* System info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Informations système</h2>
          <p className="text-xs text-slate-400 mt-0.5">Caractéristiques du moteur d'intelligence artificielle</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="flex items-center gap-4 p-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 shrink-0">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">90.7%</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Précision IA</p>
              <p className="text-xs text-slate-400">Random Forest validé</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
              <Database className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{datasetStats?.total_diseases ?? 1006}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Maladies référencées</p>
              <p className="text-xs text-slate-400">Dataset actif en mémoire</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 shrink-0">
              <Cpu className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">Hybride</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Algorithme de scoring</p>
              <p className="text-xs text-slate-400">ML + Fuzzy + IDF + Scores cliniques</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics
