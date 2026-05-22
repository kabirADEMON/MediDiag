import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Stethoscope, ExternalLink } from 'lucide-react'
import { get } from '@/api/axios'
import { formatDate } from '@/utils/helpers'

const URGENCY_STYLE = {
  critique: { dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700 border-red-200',   bar: 'bg-red-500'    },
  élevée:   { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', bar: 'bg-orange-400' },
  modérée:  { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  bar: 'bg-amber-400'  },
  faible:   { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-400' },
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

function ScoreBadge({ score }) {
  const v = Math.round(score || 0)
  const cls = v >= 80
    ? 'bg-red-50 text-red-700 border-red-200'
    : v >= 60
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-blue-50 text-blue-700 border-blue-200'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border tabular-nums ${cls}`}>
      {v}%
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3"><div className="skeleton h-4 w-40 rounded mb-1.5" /><div className="skeleton h-3 w-28 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-24 rounded mb-1" /><div className="skeleton h-3 w-16 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-5 w-12 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-5 w-20 rounded-full" /></td>
      <td className="px-4 py-3"><div className="skeleton h-3 w-20 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-6 w-6 rounded-lg ml-auto" /></td>
    </tr>
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Historique des diagnostics</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? '…' : pagination.total} diagnostic{pagination.total !== 1 ? 's' : ''} enregistré{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/consultation">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            <Stethoscope className="w-4 h-4" />
            Nouvelle consultation
          </button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-sm font-semibold text-slate-700">Diagnostics IA enregistrés</span>
          <span className="text-xs text-slate-400">Page {currentPage} / {totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Diagnostic principal</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Urgence</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Date</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : diagnostics.length > 0
                  ? diagnostics.map(diag => {
                    const urg = URGENCY_STYLE[diag.urgence]
                    return (
                      <tr key={diag.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {urg && <span className={`w-0.5 h-8 rounded-full shrink-0 ${urg.bar}`} />}
                            <div>
                              <p className="text-sm font-semibold text-slate-900 leading-none">
                                {diag.maladie_principale || 'Diagnostic inconnu'}
                              </p>
                              {diag.nb_diagnostics > 1 && (
                                <p className="text-xs text-slate-400 mt-0.5">{diag.nb_diagnostics} hypothèses</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium text-slate-800 leading-none">
                            {diag.patient_nom || <span className="text-slate-400">—</span>}
                          </p>
                          {diag.code_patient && (
                            <p className="text-xs font-mono text-slate-400 mt-0.5">{diag.code_patient}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <ScoreBadge score={diag.score} />
                        </td>
                        <td className="px-4 py-2.5">
                          <UrgenceBadge urgence={diag.urgence} />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(diag.date || diag.created_at)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end">
                            {diag.patient_id && (
                              <Link to={`/patients/${diag.patient_id}`}>
                                <button
                                  title="Voir le dossier"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-500">Aucun diagnostic enregistré</p>
                        <p className="text-xs text-slate-400 mt-0.5">Les diagnostics apparaissent ici après validation d'une consultation</p>
                        <Link to="/consultation">
                          <button className="mt-4 flex items-center gap-2 mx-auto px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            <Stethoscope className="w-4 h-4" />
                            Créer une consultation
                          </button>
                        </Link>
                      </td>
                    </tr>
                  )
              }
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!loading && pagination.total > pagination.limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30">
            <span className="text-xs text-slate-500">
              {pagination.skip + 1}–{Math.min(pagination.skip + pagination.limit, pagination.total)} sur {pagination.total}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.skip === 0}
                onClick={() => setPagination(p => ({ ...p, skip: Math.max(0, p.skip - p.limit) }))}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPagination(p => ({ ...p, skip: p.skip + p.limit }))}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
