import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatScore } from '@/utils/helpers'

const URGENCY_BADGE = {
  élevée: 'danger',
  modérée: 'warning',
  faible: 'success',
}

function urgencyBadge(u) {
  return URGENCY_BADGE[u] || 'default'
}

/**
 * DiagnosticCard
 * Displays a single diagnostic result with an optional collapsible accordion
 * listing same-root severity variants embedded in result.variantes.
 *
 * Props:
 *   result  — DiagnosticResult object (with optional .variantes array)
 *   index   — position in the list (0 = principal)
 */
export function DiagnosticCard({ result, index = 0 }) {
  const [open, setOpen] = useState(false)
  const hasVariants = Array.isArray(result.variantes) && result.variantes.length > 0

  return (
    <div className={`rounded-xl border overflow-hidden ${
      index === 0 ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'
    }`}>
      {/* ── Main disease header ── */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {index === 0 && (
              <span className="px-2 py-0.5 text-2xs font-bold bg-blue-600 text-white rounded-full uppercase tracking-wide">
                Principal
              </span>
            )}
            <span className="font-semibold text-slate-900">{result.maladie}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={urgencyBadge(result.urgence)}>{result.urgence || 'faible'}</Badge>
            <span className="font-bold text-slate-900 text-sm">{formatScore(result.score)}</span>
          </div>
        </div>

        {result.examens_recommandes?.length > 0 && (
          <p className="text-xs text-slate-400 mt-1.5">
            Examens : {result.examens_recommandes.slice(0, 3).join(', ')}
            {result.examens_recommandes.length > 3 && ` +${result.examens_recommandes.length - 3}`}
          </p>
        )}

        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${Math.min(result.score, 100)}%` }}
          />
        </div>

        {/* Accordion trigger */}
        {hasVariants && (
          <button
            onClick={() => setOpen(o => !o)}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {open
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />
            }
            Modifier le niveau de sévérité
            <span className="ml-0.5 text-blue-400">
              ({result.variantes.length} variante{result.variantes.length > 1 ? 's' : ''})
            </span>
          </button>
        )}
      </div>

      {/* ── Accordion body — severity variants ── */}
      {hasVariants && open && (
        <div className="border-t border-slate-200 bg-white px-5 pb-4 pt-3">
          <p className="text-xs text-slate-400 mb-2">Niveaux de sévérité alternatifs :</p>
          <div className="space-y-1.5">
            {result.variantes.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200"
              >
                <span className="text-sm text-slate-700">{v.maladie}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={urgencyBadge(v.urgence)}>{v.urgence || 'faible'}</Badge>
                  <span className="text-xs font-semibold text-slate-600">{formatScore(v.score)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DiagnosticCard
