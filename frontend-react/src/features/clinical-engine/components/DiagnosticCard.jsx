import { useState } from 'react'
import { ChevronDown, ChevronUp, Info, AlertTriangle, Zap, Shield, Activity } from 'lucide-react'
import { formatScore } from '@/utils/helpers'

const DISEASE_DESCRIPTIONS = {
  'Hypertension artérielle': 'Pression trop élevée dans les artères. Souvent sans symptômes au début, mais peut endommager le cœur et les reins à long terme.',
  'Diabète de type 2': 'Taux de sucre trop élevé dans le sang. Le corps ne produit plus assez d\'insuline ou ne l\'utilise pas bien.',
  'Diabète de type 1': 'Le pancréas ne produit plus d\'insuline. Nécessite des injections d\'insuline tous les jours.',
  'Pneumonie': 'Infection des poumons causée par des bactéries ou virus. Provoque fièvre, toux et difficultés à respirer.',
  'Appendicite': 'Inflammation de l\'appendice (petit organe en bas à droite du ventre). Douleur intense nécessitant une opération.',
  'Tuberculose pulmonaire': 'Infection grave des poumons par une bactérie. Se transmet par l\'air. Traitement long mais efficace.',
  'Paludisme': 'Infection transmise par les moustiques. Provoque des fièvres cycliques, frissons et fatigue intense.',
  'Anémie ferriprive': 'Manque de fer dans le sang. Les globules rouges ne transportent pas assez d\'oxygène dans le corps.',
  'Asthme': 'Les voies respiratoires se rétrécissent par crise, rendant la respiration difficile. Se contrôle avec des inhalateurs.',
  'Bronchite aiguë': 'Inflammation des bronches (tubes respiratoires) souvent suite à un rhume ou grippe. Toux pendant 2-3 semaines.',
  'Infarctus du myocarde': 'Crise cardiaque : une artère du cœur est bouchée. Urgence absolue — appeler le 15 immédiatement.',
  'Embolie pulmonaire': 'Caillot de sang qui bloque une artère des poumons. Urgence grave — douleur thoracique et essoufflement soudain.',
  'AVC ischémique': 'Arrêt du sang dans une partie du cerveau. Paralysie, trouble de la parole. Urgence absolue.',
  'Méningite bactérienne': 'Infection grave des enveloppes du cerveau. Raideur de la nuque, fièvre haute, sensibilité à la lumière.',
  'Grippe': 'Infection virale saisonnière. Fièvre élevée, courbatures, fatigue intense pendant une semaine.',
  'COVID-19': 'Infection respiratoire due au coronavirus. Fièvre, toux, perte de goût et odorat.',
  'Dengue': 'Maladie transmise par les moustiques sous les tropiques. Fièvre haute, douleurs articulaires intenses.',
  'Paludisme': 'Infection transmise par les moustiques. Provoque des fièvres cycliques, frissons et fatigue intense.',
  'Septicémie': 'Infection grave dans le sang. L\'organisme entier est touché. Urgence vitale.',
  'Gastro-entérite': 'Infection de l\'estomac et des intestins. Diarrhée, vomissements et douleurs abdominales.',
  'Cystite': 'Infection de la vessie, plus fréquente chez la femme. Brûlures en urinant, envies fréquentes.',
  'Pharyngite': 'Infection de la gorge. Mal de gorge, difficultés à avaler, souvent virale.',
  'Angine': 'Infection des amygdales avec mal de gorge intense. Peut nécessiter des antibiotiques.',
  'Sinusite': 'Infection des sinus. Douleur au visage, nez bouché, maux de tête.',
  'Otite': 'Infection de l\'oreille. Douleur, parfois fièvre. Plus fréquente chez l\'enfant.',
  'Migraine': 'Maux de tête intenses et pulsatiles, souvent d\'un seul côté. Avec nausées et photophobie.',
  'Hypothyroïdie': 'La glande thyroïde fonctionne trop lentement. Fatigue, prise de poids, frilosité.',
  'Hyperthyroïdie': 'La glande thyroïde fonctionne trop vite. Nervosité, perte de poids, tachycardie.',
  'Goutte': 'Dépôt de cristaux dans les articulations. Crise de douleur intense et soudaine.',
  'Dépression': 'Tristesse persistante, perte d\'énergie et de plaisir, troubles du sommeil.',
  'Anxiété généralisée': 'Inquiétude excessive et persistante. Tension musculaire, troubles du sommeil.',
}

const URGENCY_CONFIG = {
  critique: {
    bar:    'bg-red-500',
    badge:  'bg-red-100 text-red-700 border-red-200',
    dot:    'bg-red-500',
    icon:   AlertTriangle,
    glow:   'shadow-red-100',
    border: 'border-red-200',
  },
  élevée: {
    bar:    'bg-orange-400',
    badge:  'bg-orange-100 text-orange-700 border-orange-200',
    dot:    'bg-orange-400',
    icon:   Zap,
    glow:   'shadow-orange-100',
    border: 'border-orange-200',
  },
  modérée: {
    bar:    'bg-amber-400',
    badge:  'bg-amber-100 text-amber-700 border-amber-200',
    dot:    'bg-amber-400',
    icon:   Activity,
    glow:   'shadow-amber-100',
    border: 'border-amber-200',
  },
  faible: {
    bar:    'bg-emerald-400',
    badge:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot:    'bg-emerald-400',
    icon:   Shield,
    glow:   'shadow-emerald-100',
    border: 'border-emerald-200',
  },
}

function getDiseaseDescription(name) {
  if (!name) return null
  if (DISEASE_DESCRIPTIONS[name]) return DISEASE_DESCRIPTIONS[name]
  const lower = name.toLowerCase()
  for (const [key, desc] of Object.entries(DISEASE_DESCRIPTIONS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return desc
  }
  return null
}

function scoreColor(score) {
  if (score >= 75) return 'from-blue-500 to-blue-600'
  if (score >= 55) return 'from-indigo-400 to-blue-500'
  if (score >= 35) return 'from-violet-400 to-indigo-500'
  return 'from-slate-400 to-slate-500'
}

export function DiagnosticCard({ result, index = 0 }) {
  const [open, setOpen] = useState(false)
  const [showDesc, setShowDesc] = useState(false)
  const hasVariants = Array.isArray(result.variantes) && result.variantes.length > 0
  const description = getDiseaseDescription(result.maladie)
  const urg = URGENCY_CONFIG[result.urgence] || URGENCY_CONFIG.faible
  const UrgIcon = urg.icon
  const score = Math.min(Math.round(result.score || 0), 100)

  if (index === 0) {
    return (
      <div className={`rounded-2xl overflow-hidden border ${urg.border} shadow-md ${urg.glow}`}>
        {/* ── Principal header ── */}
        <div style={{ background: 'linear-gradient(135deg, #0f2557 0%, #1e3a8a 50%, #1d4ed8 100%)' }}
          className="px-5 pt-5 pb-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 border border-white/20 text-white/90 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
              Diagnostic principal
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${urg.badge}`}>
              <UrgIcon className="w-3 h-3" />
              Urgence {result.urgence || 'faible'}
            </span>
          </div>
          <h3 className="text-xl font-extrabold leading-tight tracking-tight text-white">
            {result.maladie}
          </h3>
          {description && (
            <button
              onClick={() => setShowDesc(v => !v)}
              className="mt-1.5 flex items-center gap-1 text-xs text-blue-200/70 hover:text-white transition-colors"
            >
              <Info className="w-3 h-3" />
              {showDesc ? 'Masquer' : 'Qu\'est-ce que c\'est ?'}
            </button>
          )}
        </div>

        {/* ── Description ── */}
        {showDesc && description && (
          <div className="px-5 py-3 bg-blue-950/5 border-b border-blue-100 text-xs text-slate-600 leading-relaxed">
            {description}
          </div>
        )}

        {/* ── Score + examens ── */}
        <div className="px-5 py-4 bg-white">
          {result.examens_recommandes?.length > 0 && (
            <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
              Examens suggérés : {result.examens_recommandes.slice(0, 3).join(', ')}
              {result.examens_recommandes.length > 3 && ` +${result.examens_recommandes.length - 3}`}
            </p>
          )}

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indice de correspondance</span>
            <span className="text-sm font-extrabold text-slate-800 tabular-nums">{score}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${scoreColor(score)} transition-all duration-700`}
              style={{ width: `${score}%` }}
            />
          </div>

          {hasVariants && (
            <button
              onClick={() => setOpen(o => !o)}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Variantes de sévérité
              <span className="text-blue-400">({result.variantes.length})</span>
            </button>
          )}
        </div>

        {/* ── Variants ── */}
        {hasVariants && open && (
          <div className="border-t border-slate-100 bg-slate-50 px-5 pb-4 pt-3">
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Niveaux de sévérité alternatifs</p>
            <div className="space-y-1.5">
              {result.variantes.map((v, i) => {
                const vc = URGENCY_CONFIG[v.urgence] || URGENCY_CONFIG.faible
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-sm text-slate-700 font-medium">{v.maladie}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${vc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${vc.dot}`} />
                        {v.urgence || 'faible'}
                      </span>
                      <span className="text-xs font-bold text-slate-600 tabular-nums">{Math.round(v.score || 0)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Secondary cards (#2, #3, #4) ──
  const rankColors = [
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-slate-100 text-slate-600 border-slate-200',
    'bg-slate-100 text-slate-500 border-slate-200',
  ]
  const rankColor = rankColors[index - 1] || rankColors[2]

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-150">
      <div className={`w-full h-0.5 bg-gradient-to-r ${scoreColor(score)}`} />
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span className={`shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black border ${rankColor}`}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-800 leading-tight">{result.maladie}</span>
              {description && (
                <button onClick={() => setShowDesc(v => !v)} className="text-slate-300 hover:text-blue-500 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {result.examens_recommandes?.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                {result.examens_recommandes.slice(0, 2).join(', ')}
                {result.examens_recommandes.length > 2 && ` +${result.examens_recommandes.length - 2}`}
              </p>
            )}
            <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${scoreColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${urg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
              {result.urgence || 'faible'}
            </span>
            <span className="text-xs font-bold text-slate-500 tabular-nums">{score}%</span>
          </div>
        </div>

        {showDesc && description && (
          <div className="mt-2 ml-9 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
            {description}
          </div>
        )}

        {hasVariants && (
          <button
            onClick={() => setOpen(o => !o)}
            className="mt-2 ml-9 flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {result.variantes.length} variante{result.variantes.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {hasVariants && open && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 pb-3 pt-2">
          <div className="space-y-1">
            {result.variantes.map((v, i) => {
              const vc = URGENCY_CONFIG[v.urgence] || URGENCY_CONFIG.faible
              return (
                <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-100">
                  <span className="text-xs text-slate-700">{v.maladie}</span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${vc.badge}`}>{v.urgence}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DiagnosticCard
