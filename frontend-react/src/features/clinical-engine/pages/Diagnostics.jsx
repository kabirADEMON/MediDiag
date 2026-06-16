import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Stethoscope, ExternalLink, AlertTriangle, Activity, BarChart2, CheckCircle } from 'lucide-react'
import { get } from '@/api/axios'
import { formatDate } from '@/utils/helpers'

const URGENCY_STYLE = {
  critique: { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',       bar: 'bg-red-500'    },
  élevée:   { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', bar: 'bg-orange-400' },
  modérée:  { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',   bar: 'bg-amber-400'  },
  faible:   { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-400' },
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

function patientInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function avatarColor(id) {
  return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length]
}

function UrgenceBadge({ urgence }) {
  const s = URGENCY_STYLE[urgence] || { dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {urgence || '—'}
    </span>
  )
}

function ScoreBar({ score }) {
  const v = Math.min(Math.round(score || 0), 100)
  const color = v >= 75 ? 'bg-blue-500' : v >= 55 ? 'bg-indigo-400' : v >= 35 ? 'bg-violet-400' : 'bg-slate-400'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-700 tabular-nums w-8 text-right">{v}%</span>
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="skeleton w-0.5 h-8 rounded-full" />
          <div>
            <div className="skeleton h-4 w-40 rounded mb-1.5" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="skeleton w-8 h-8 rounded-xl" />
          <div>
            <div className="skeleton h-4 w-28 rounded mb-1" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5"><div className="skeleton h-4 w-20 rounded" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-5 w-20 rounded-full" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-3 w-20 rounded" /></td>
      <td className="px-4 py-3.5"><div className="skeleton h-6 w-6 rounded-lg ml-auto" /></td>
    </tr>
  )
}

function StatChip({ icon: Icon, label, value, color }) {
  const colors = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: 'text-blue-500'    },
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     icon: 'text-red-500'     },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: 'text-amber-500'   },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${c.bg} border-${color}-100`}>
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm ${c.icon}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className={`text-lg font-extrabold leading-none ${c.text} tabular-nums`}>{value}</p>
        <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">{label}</p>
      </div>
    </div>
  )
}

export function Diagnostics() {
  const [diagnostics, setDiagnostics] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ skip: 0, limit: 15, total: 0 })

  useEffect(() => { loadDiagnostics() }, [pagination.skip])

  const loadDiagnostics = async () => {
    try {
      setLoading(true)
      const response = await get('/diagnostics', {
        params: { skip: pagination.skip, limit: pagination.limit },
      })
      if (response.success && response.data) {
        const data = response.data.data || response.data
        setDiagnostics(data.diagnostics || [])
        setPagination(prev => ({ ...prev, total: data.total || 0 }))
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1
  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1

  const critiques = diagnostics.filter(d => d.urgence === 'critique').length
  const elevees   = diagnostics.filter(d => d.urgence === 'élevée').length
  const moderees  = diagnostics.filter(d => !['critique', 'élevée'].includes(d.urgence)).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Historique des diagnostics</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? '…' : pagination.total} diagnostic{pagination.total !== 1 ? 's' : ''} enregistré{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/consultation">
          <button className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Stethoscope className="w-4 h-4" />
            Nouvelle consultation
          </button>
        </Link>
      </div>

      {/* Mini stats strip */}
      {!loading && diagnostics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip icon={BarChart2}    label="Cette page"        value={diagnostics.length} color="blue"    />
          <StatChip icon={AlertTriangle} label="Urgence critique"  value={critiques}           color="red"     />
          <StatChip icon={Activity}     label="Urgence élevée"    value={elevees}             color="amber"   />
          <StatChip icon={CheckCircle}  label="Modérée / faible"  value={moderees}            color="emerald" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <span className="text-sm font-bold text-slate-700">Diagnostics IA enregistrés</span>
          <span className="text-xs text-slate-400 tabular-nums">Page {currentPage} / {totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Diagnostic principal</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Urgence</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Date</th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : diagnostics.length > 0
                  ? diagnostics.map(diag => {
                    const urg = URGENCY_STYLE[diag.urgence]
                    const initials = patientInitials(diag.patient_nom)
                    const aColor = avatarColor(diag.patient_id)
                    return (
                      <tr key={diag.id} className="hover:bg-blue-50/30 transition-colors group">
                        {/* Diagnostic */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {urg && <span className={`w-0.5 h-9 rounded-full shrink-0 ${urg.bar}`} />}
                            <div>
                              <p className="text-sm font-semibold text-slate-900 leading-none">
                                {diag.maladie_principale || 'Diagnostic inconnu'}
                              </p>
                              {diag.nb_diagnostics > 1 && (
                                <p className="text-xs text-slate-400 mt-0.5">{diag.nb_diagnostics} hypothèses analysées</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Patient avec avatar */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${aColor}`}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800 leading-none">
                                {diag.patient_nom || <span className="text-slate-400">—</span>}
                              </p>
                              {diag.code_patient && (
                                <p className="text-xs font-mono text-slate-400 mt-0.5">{diag.code_patient}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Score */}
                        <td className="px-5 py-3.5">
                          <ScoreBar score={diag.score} />
                        </td>
                        {/* Urgence */}
                        <td className="px-5 py-3.5">
                          <UrgenceBadge urgence={diag.urgence} />
                        </td>
                        {/* Date */}
                        <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(diag.date || diag.created_at)}
                        </td>
                        {/* Action */}
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            {diag.patient_id && (
                              <Link to={`/patients/${diag.patient_id}`}>
                                <button
                                  title="Voir le dossier"
                                  className="p-1.5 rounded-lg text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                  : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <FileText className="w-7 h-7 text-slate-300" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-600">Aucun diagnostic enregistré</p>
                            <p className="text-xs text-slate-400 mt-1">Les diagnostics apparaissent ici après validation d'une consultation</p>
                          </div>
                          <Link to="/consultation">
                            <button className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                              <Stethoscope className="w-4 h-4" />
                              Créer une consultation
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.total > pagination.limit && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30">
            <span className="text-xs text-slate-500 tabular-nums">
              {pagination.skip + 1}–{Math.min(pagination.skip + pagination.limit, pagination.total)} sur {pagination.total}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.skip === 0}
                onClick={() => setPagination(p => ({ ...p, skip: Math.max(0, p.skip - p.limit) }))}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPagination(p => ({ ...p, skip: p.skip + p.limit }))}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Diagnostics
