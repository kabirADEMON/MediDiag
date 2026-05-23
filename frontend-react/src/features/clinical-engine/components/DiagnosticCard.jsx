import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
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
  'Bronchopneumopathie chronique obstructive': 'Maladie des poumons liée au tabac. Les poumons sont abîmés et la respiration devient de plus en plus difficile.',
  'BPCO': 'Maladie des poumons liée au tabac. Les poumons sont abîmés et la respiration devient de plus en plus difficile.',
  'Infarctus du myocarde': 'Crise cardiaque : une artère du cœur est bouchée. Urgence absolue — appeler le 15 immédiatement.',
  'Angine de poitrine': 'Douleur dans la poitrine quand le cœur manque d\'oxygène à l\'effort. Signe d\'artères rétrécies.',
  'Insuffisance cardiaque': 'Le cœur ne pompe plus assez fort. Provoque essoufflement et jambes gonflées.',
  'Arythmie cardiaque': 'Le cœur bat irrégulièrement — trop vite, trop lentement ou de façon désordonnée.',
  'Embolie pulmonaire': 'Caillot de sang qui bloque une artère des poumons. Urgence grave — douleur thoracique et essoufflement soudain.',
  'Phlébite': 'Caillot de sang dans une veine, souvent dans la jambe. Jambe rouge, chaude et douloureuse.',
  'Thrombose veineuse profonde': 'Caillot de sang dans une veine profonde de la jambe. Risque de migration vers les poumons.',
  'AVC ischémique': 'Arrêt du sang dans une partie du cerveau. Paralysie, trouble de la parole. Urgence absolue.',
  'AVC hémorragique': 'Saignement dans le cerveau. Maux de tête violents et soudains. Urgence absolue.',
  'Méningite bactérienne': 'Infection grave des enveloppes du cerveau. Raideur de la nuque, fièvre haute, sensibilité à la lumière.',
  'Méningite virale': 'Inflammation des enveloppes du cerveau par un virus. Moins grave que la méningite bactérienne.',
  'Migraine': 'Maux de tête intenses et pulsatiles, souvent d\'un seul côté. Avec nausées et sensibilité à la lumière.',
  'Épilepsie': 'Crises dues à une activité électrique anormale dans le cerveau. Se traite avec des médicaments.',
  'Gastro-entérite': 'Infection de l\'estomac et des intestins. Diarrhée, vomissements et douleurs abdominales pendant quelques jours.',
  'Ulcère gastrique': 'Plaie dans la paroi de l\'estomac. Douleur à l\'estomac, souvent soulagée ou aggravée en mangeant.',
  'Reflux gastro-œsophagien': 'L\'acide de l\'estomac remonte dans la gorge. Brûlures et goût acide dans la bouche.',
  'Appendicite aiguë': 'Inflammation soudaine de l\'appendice. Douleur vive en bas à droite du ventre, nécessite une opération urgente.',
  'Péritonite': 'Infection grave du ventre, souvent suite à une appendicite ou ulcère percé. Urgence chirurgicale.',
  'Pancréatite aiguë': 'Inflammation soudaine du pancréas. Douleur intense dans le ventre, souvent due à l\'alcool ou calculs biliaires.',
  'Cirrhose hépatique': 'Cicatrisation progressive du foie, souvent due à l\'alcool ou hépatite. Le foie fonctionne de moins en moins.',
  'Hépatite A': 'Infection du foie par un virus transmis par l\'eau ou aliments contaminés. Guérit généralement seule.',
  'Hépatite B': 'Infection du foie par un virus transmis par le sang ou contacts sexuels. Peut devenir chronique.',
  'Hépatite C': 'Infection chronique du foie transmise par le sang. Traitement efficace disponible aujourd\'hui.',
  'Cholécystite': 'Inflammation de la vésicule biliaire, souvent due à des calculs. Douleur en haut à droite du ventre.',
  'Insuffisance rénale': 'Les reins ne filtrent plus bien le sang. Accumulation de déchets dans l\'organisme.',
  'Pyélonéphrite': 'Infection grave des reins. Fièvre haute, douleur dans le dos et brûlures en urinant.',
  'Cystite': 'Infection de la vessie, plus fréquente chez la femme. Brûlures en urinant, envies fréquentes.',
  'Lithiase rénale': 'Calculs (pierres) dans les reins. Douleur très intense dans le dos ou le ventre, diffusant vers l\'aine.',
  'Hypothyroïdie': 'La glande thyroïde fonctionne trop lentement. Fatigue, prise de poids, frilosité excessive.',
  'Hyperthyroïdie': 'La glande thyroïde fonctionne trop vite. Nervosité, perte de poids, cœur qui bat vite.',
  'Ostéoporose': 'Les os deviennent fragiles et poreux. Risque élevé de fractures, surtout chez les femmes après la ménopause.',
  'Polyarthrite rhumatoïde': 'Maladie auto-immune qui attaque les articulations. Douleurs et gonflement des articulations, surtout le matin.',
  'Goutte': 'Dépôt de cristaux dans les articulations, surtout le gros orteil. Crise de douleur intense et soudaine.',
  'Lupus érythémateux': 'Maladie auto-immune qui peut toucher la peau, les reins et les articulations. Evolution par poussées.',
  'VIH/SIDA': 'Virus qui affaiblit le système immunitaire. Traitements modernes permettent une vie normale.',
  'Septicémie': 'Infection grave dans le sang. L\'organisme entier est touché. Urgence vitale.',
  'Choc septique': 'Septicémie très sévère avec chute de la pression artérielle. Urgence vitale en réanimation.',
  'Cancer du poumon': 'Tumeur maligne des poumons. Toux persistante, perte de poids, souvent lié au tabac.',
  'Cancer du sein': 'Tumeur maligne du sein. Détecté tôt, traitement très efficace.',
  'Cancer colorectal': 'Tumeur du côlon ou du rectum. Sang dans les selles, changements du transit. Dépistage important.',
  'Pharyngite': 'Infection de la gorge. Mal de gorge, difficultés à avaler, souvent virale.',
  'Angine': 'Infection des amygdales avec mal de gorge intense. Peut être bactérienne et nécessiter des antibiotiques.',
  'Sinusite': 'Infection des sinus (cavités autour du nez). Douleur au visage, nez bouché, maux de tête.',
  'Otite': 'Infection de l\'oreille. Douleur de l\'oreille, parfois fièvre. Plus fréquente chez l\'enfant.',
  'Grippe': 'Infection virale saisonnière. Fièvre élevée, courbatures, fatigue intense pendant une semaine.',
  'COVID-19': 'Infection respiratoire due au coronavirus. Fièvre, toux, perte de goût et odorat.',
  'Dengue': 'Maladie transmise par les moustiques sous les tropiques. Fièvre haute, douleurs articulaires intenses.',
  'Typhoïde': 'Infection bactérienne transmise par l\'eau ou aliments contaminés. Fièvre prolongée, mal au ventre.',
  'Cholera': 'Infection intestinale grave avec diarrhée aqueuse massive. Déshydratation rapide et dangereuse.',
  'Leptospirose': 'Infection bactérienne transmise par l\'urine de rongeurs. Fièvre, douleurs musculaires, jaunisse.',
  'Drépanocytose': 'Maladie héréditaire des globules rouges qui se déforment. Crises douloureuses et anémie.',
  'Thalassémie': 'Maladie héréditaire du sang. Anémie chronique nécessitant parfois des transfusions.',
  'Sclérose en plaques': 'Maladie auto-immune du système nerveux. Troubles de la vision, de l\'équilibre et de la sensibilité.',
  'Maladie de Parkinson': 'Maladie neurologique progressive. Tremblements, raideur musculaire, mouvements lents.',
  'Alzheimer': 'Maladie neurologique dégénérative. Perte de mémoire progressive et troubles du comportement.',
  'Dépression': 'Maladie psychologique. Tristesse persistante, perte d\'énergie et de plaisir, troubles du sommeil.',
  'Anxiété généralisée': 'Inquiétude excessive et persistante au quotidien. Tension musculaire, troubles du sommeil.',
  'Syndrome de Cushing': 'Trop de cortisol dans le sang. Prise de poids au niveau du ventre et du visage, vergetures.',
  'Insuffisance surrénalienne': 'Les glandes surrénales ne produisent pas assez d\'hormones. Fatigue, perte de poids, hypotension.',
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
  const [showDesc, setShowDesc] = useState(false)
  const hasVariants = Array.isArray(result.variantes) && result.variantes.length > 0
  const description = getDiseaseDescription(result.maladie)

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
            {description && (
              <button
                onClick={() => setShowDesc(v => !v)}
                className="text-slate-400 hover:text-blue-500 transition-colors"
                title="Qu'est-ce que c'est ?"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={urgencyBadge(result.urgence)}>{result.urgence || 'faible'}</Badge>
            <span className="font-bold text-slate-900 text-sm">{formatScore(result.score)}</span>
          </div>
        </div>

        {showDesc && description && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800 leading-relaxed">
            {description}
          </div>
        )}

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
