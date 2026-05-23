"""
Motif Parser Service — NLP médical en français, extraction stricte, zéro hallucination.

Règles :
- N'extrait QUE ce qui est explicitement écrit.
- Détecte les négations et les place dans symptomes_absents.
- Détecte la temporalité (aiguë / chronique / inconnue).
- Retourne un dict structuré utilisable par le moteur de diagnostic.
"""
import re
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _c(pattern: str) -> re.Pattern:
    return re.compile(pattern, re.IGNORECASE | re.UNICODE)


# ── Temporalité ────────────────────────────────────────────────────────────────

_ACUTE_RE = _c(
    r'(?:'
    r'depuis\s+(?:quelques?\s+)?(?:heures?|minutes?|jours?|24\s*h|48\s*h)'
    r'|depuis\s+(?:hier|ce\s+(?:matin|soir|midi)|aujourd\'hui)'
    r'|(?:brutal(?:ement)?|soudain(?:ement)?|subit(?:ement)?|d\'embl[eé]e)'
    r'|ce\s+(?:matin|soir|midi)'
    r'|depuis\s+[1-7]\s+(?:jours?|heures?)'
    r'|apparition\s+(?:soudaine|brutale|r[eé]cente)'
    r'|d[eé]but\s+(?:brutal|soudain|r[eé]cent|aigu|aiguë)'
    r'|aigu[eë]?\b'
    r')'
)

_CHRONIC_RE = _c(
    r'(?:'
    r'depuis\s+(?:plusieurs?\s+)?(?:mois|ann[eé]es?|semaines?)'
    r'|depuis\s+(?:longtemps|toujours|des\s+(?:mois|ans|ann[eé]es?))'
    r'|depuis\s+(?:[3-9]|[12][0-9])\s+(?:mois|ans?|ann[eé]es?)'
    r'|chronique\b|habituell?e?(?:ment)?\b|r[eé]current[e]?\b'
    r'|[eé]volution\s+(?:progressive|lente|chronique)'
    r'|ancien(?:ne)?\b'
    r')'
)


# ── Zones de négation ──────────────────────────────────────────────────────────
# Après un marqueur de négation, les N prochains caractères sont "niés"

_NEG_MARKER_RE = _c(
    r'(?:pas\s+d[e\']|sans\s+|absence\s+de\s+|nie\s+(?:tout[e]?\s+)?'
    r'|aucun[e]?\s+|n\'a\s+pas\s+d[e\']|ne\s+présente\s+pas\s+d[e\']'
    r'|n[eé]gatif\s+pour\s+|exclu\s+|[eé]cart[eé]\s+)'
)
_NEG_WINDOW = 65  # chars après le marqueur


def _neg_zones(text: str) -> List[Tuple[int, int]]:
    zones = []
    for m in _NEG_MARKER_RE.finditer(text):
        end = min(len(text), m.end() + _NEG_WINDOW)
        # Couper à la prochaine ponctuation forte (. ; !)
        for sep in '.;!':
            p = text.find(sep, m.end())
            if 0 < p < end:
                end = p
                break
        zones.append((m.start(), end))
    return zones


def _is_negated(pos: int, zones: List[Tuple[int, int]]) -> bool:
    return any(s <= pos <= e for s, e in zones)


# ── Règles d'extraction de symptômes ──────────────────────────────────────────
# Format : (Pattern compilé, nom_canonique)
# STRICT : seulement ce qui est explicitement présent dans le texte.

_SYMPTOM_RULES: List[Tuple[re.Pattern, str]] = [

    # ── Douleurs par localisation ──────────────────────────────────────────
    (_c(r'\bdouleurs?\s+pelvienn[e]?s?\b|\bdouleur\s+(?:au\s+niveau\s+du\s+)?pelvis\b'), 'douleur pelvienne'),
    (_c(r'\bdouleurs?\s+abdominal[e]?s?\b|\bdouleurs?\s+(?:de\s+l\'|au\s+)?(?:abdomen|ventre)\b'), 'douleur abdominale'),
    (_c(r'\bdouleurs?\s+thoraciques?\b|\bdouleurs?\s+(?:dans\s+la\s+|de\s+la\s+)?poitrine\b'), 'douleur thoracique'),
    (_c(r'\bc[eé]phal[eé]es?\b|\bmaux?\s+de\s+t[eê]te\b|\bdouleurs?\s+(?:à\s+la\s+)?t[eê]te\b'), 'céphalées'),
    (_c(r'\bmigraines?\b'), 'migraine'),
    (_c(r'\bdouleurs?\s+(?:au\s+)?dos\b|\bdorsalgie\b|\blombalgies?\b|\bdouleurs?\s+lombaires?\b'), 'douleur dorsale'),
    (_c(r'\bdouleurs?\s+(?:au\s+|dans\s+le\s+)?(?:flanc|rein|fosse\s+lombaire)\b|\bn[eé]phralgie\b'), 'douleur lombaire'),
    (_c(r'\braideur\s+(?:de\s+la\s+)?nuque\b|\bdouleurs?\s+(?:à\s+la\s+)?nuque\b|\bnucalgie\b'), 'raideur de la nuque'),
    (_c(r'\bdouleurs?\s+(?:au[x]?\s+)?(?:genou[x]?)\b'), 'douleur genou'),
    (_c(r'\bdouleurs?\s+(?:à\s+l\')?[eé]paule\b'), 'douleur épaule'),
    (_c(r'\bdouleurs?\s+articulaires?\b|\bdouleurs?\s+(?:des|aux)\s+articulations?\b|\barthralgie\b'), 'douleurs articulaires'),
    (_c(r'\bdouleurs?\s+musculaires?\b|\bmyalgies?\b|\bcourbatures?\b'), 'douleurs musculaires'),
    (_c(r'\bbrûlures?\s+mictionnelles?\b|\bdysurie\b|\bdouleurs?\s+(?:en\s+|lors\s+de\s+la\s+)?(?:miction|urinant)\b'), 'brûlures mictionnelles'),
    (_c(r'\bmal\s+(?:à\s+la\s+|de\s+)?gorge\b|\bodynophagie\b|\bdouleurs?\s+(?:à\s+la\s+)?gorge\b'), 'mal de gorge'),
    (_c(r'\botalgie\b|\bdouleurs?\s+(?:à\s+l\'|de\s+l\')?oreille\b'), 'otalgie'),
    (_c(r'\bdouleurs?\s+(?:au\s+)?sein\b|\bmastalgies?\b'), 'douleur mammaire'),
    (_c(r'\bdouleurs?\s+(?:à\s+l\')?aine\b|\binguinodynie\b'), 'douleur inguinale'),
    (_c(r'\bdouleurs?\s+(?:à\s+la\s+)?mâchoire\b'), 'douleur mâchoire'),

    # ── Saignements / hémorragies ──────────────────────────────────────────
    # RÈGLE STRICTE : métrorragies seulement si "saignement vaginal" ou "métrorragie" est ÉCRIT
    (_c(r'\bsaignements?\s+vaginaux?\b|\bm[eé]trorragies?\b|\bpertes?\s+(?:de\s+)?sang\s+(?:vaginal|par\s+(?:le\s+)?vagin)\b'), 'métrorragies'),
    (_c(r'\bm[eé]norragies?\b|\bsaignements?\s+(?:abondants?\s+)?(?:pendant\s+(?:les\s+)?)?r[eè]gles\b'), 'ménorragies'),
    (_c(r'\bsaignements?\s+(?:de\s+)?nez\b|\b[eé]pistaxis\b'), 'épistaxis'),
    (_c(r'\br[eé]ctorragies?\b|\bsaignements?\s+(?:rectaux?|(?:dans\s+les\s+)?selles)\b|\bselles?\s+noires?\b'), 'rectorragie'),
    (_c(r'\bh[eé]mat[eé]m[eè]se\b|\bvomissements?\s+(?:de\s+)?sang\b'), 'hématémèse'),
    (_c(r'\bh[eé]maturie\b|\bsang\s+dans\s+(?:les\s+)?urines?\b|\burines?\s+(?:roses?|rouges?|sanglantes?)\b'), 'hématurie'),
    (_c(r'\bh[eé]moptysie\b|\bsang\s+dans\s+(?:les\s+)?crachats?\b'), 'hémoptysie'),

    # ── Écoulements — RÈGLE ABSOLUTEMENT STRICTE ──────────────────────────
    # Interdit formel d'extrapoler : ces symptômes ne sont activés QUE si le mot
    # "écoulement" ou "pertes" (+ qualificatif féminin/urétral) est EXPLICITEMENT ÉCRIT.
    (_c(r'\b[eé]coulements?\s+vaginaux?\b|\bpertes?\s+vaginales?\b|\bleucorhh?[eé]es?\b|\bpertes?\s+blanches?\b'), 'écoulement vaginal'),
    (_c(r'\b[eé]coulements?\s+ur[eé]traux?\b|\b[eé]coulement\s+(?:par\s+le\s+|du\s+)?p[eé]nis\b|\b[eé]coulement\s+ur[eé]tral\b'), 'écoulement urétral'),
    (_c(r'\b[eé]coulements?\s+nasaux?\b|\brhino(?:rrhée?|rrhee?)\b|\bnez\s+qui\s+coule\b'), 'rhinorrhée'),
    (_c(r'\b[eé]coulements?\s+(?:de\s+l\')?oreille\b|\botorrhée?\b'), 'otorrhée'),

    # ── Fièvre / température ──────────────────────────────────────────────
    (_c(r'\bfi[eè]vre\b|\bhyperthermie\b|\bf[eé]bricule\b|\bt[eé]mp[eé]rature\s+[eé]lev[eé]e\b'), 'fièvre'),
    (_c(r'\bfrissons?\b'), 'frissons'),
    (_c(r'\bsueurs?\s+(?:nocturnes?|froides?|profuses?)\b'), 'sueurs nocturnes'),

    # ── Respiratoire ──────────────────────────────────────────────────────
    (_c(r'\btoux\b'), 'toux'),
    (_c(r'\bexpectorations?\b|\bcrachats?\b'), 'expectorations'),
    (_c(r'\bessouffle?ment\b|\bdysn[eé]e\b|\bpolypn[eé]e\b|\bdifficult[eé]s?\s+(?:à\s+)?respirer\b'), 'essoufflement'),
    (_c(r'\bsibilances?\b|\bsifflements?\s+(?:respiratoires?)?\b|\bwh?[eé]zing\b'), 'sibilances'),

    # ── Digestif ──────────────────────────────────────────────────────────
    (_c(r'\bnaus[eé]es?\b'), 'nausées'),
    (_c(r'\bvomissements?\b'), 'vomissements'),
    (_c(r'\bdiarrh[eé]e\b|\bselles?\s+(?:liquides?|molles?|diarrhéiques?)\b'), 'diarrhée'),
    (_c(r'\bconstipation\b|\bselles?\s+dures?\b|\bconstip[eé]\b'), 'constipation'),
    (_c(r'\bbrûlures?\s+(?:gastriques?|[eé]pigastriques?|(?:d\')?estomac)\b|\bpyrose\b|\breflux\b'), 'brûlures gastriques'),
    (_c(r'\bballonnements?\b|\bm[eé]t[eé]orisme\b'), 'ballonnements'),
    (_c(r'\bperte\s+(?:de\s+)?(?:l\')?app[eé]tit\b|\banorexie\b'), "perte d'appétit"),
    (_c(r'\bict[eè]re\b|\bjaunisse\b|\bjaunissement\b'), 'ictère'),

    # ── Neurologique ──────────────────────────────────────────────────────
    (_c(r'\bvertiges?\b|\b[eé]tourdissements?\b'), 'vertiges'),
    (_c(r'\bperte\s+de\s+connaissance\b|\bmalaise\b|\bsyncopes?\b'), 'malaise'),
    (_c(r'\bconvulsions?\b|\bcrises?\s+[eé]pileptiques?\b'), 'convulsions'),
    (_c(r'\bparalysie\b|\bh[eé]mipl[eé]gie\b|\bpar[eé]sie\b'), 'paralysie'),
    (_c(r'\btroubles?\s+(?:de\s+la\s+)?vision\b|\bbaisse\s+(?:de\s+la\s+)?vision\b|\bflou\s+visuel\b'), 'troubles visuels'),
    (_c(r'\btroubles?\s+(?:de\s+la\s+)?parole\b|\baphasie\b|\bdysarthrie\b'), 'troubles de la parole'),
    (_c(r'\btremblements?\b'), 'tremblements'),
    (_c(r'\bparest[hé][eé]sies?\b|\bfourmiements?\b|\bpicotements?\b|\bengourdissements?\b'), 'paresthésies'),

    # ── Urinaire ──────────────────────────────────────────────────────────
    (_c(r'\bpollakiurie\b|\benvies?\s+fr[eé]quentes?\s+(?:d\')?uriner\b'), 'pollakiurie'),
    (_c(r'\b(?:sang\s+dans\s+(?:les\s+)?)?urines?\s+(?:roses?|rouges?|sanglantes?)\b'), 'hématurie'),

    # ── Général / constitutionnel ─────────────────────────────────────────
    (_c(r'\bfatigue\b|\basth[eé]nie\b|\b[eé]puisement\b'), 'fatigue'),
    (_c(r'\bperte\s+(?:de\s+)?poids\b|\bam[eé]grissement\b|\bcachexie\b'), 'perte de poids'),
    (_c(r'\bgonflement\b|\b[oœ]d[eè]me\b|\btumefaction\b|\bnodule\b|\bmasse\s+(?:palp[eé]e|visible)\b'), 'gonflement'),
    (_c(r'\bprurit\b|\bd[eé]mangeaisons?\b'), 'prurit'),
    (_c(r'\b[eé]ruption\s+(?:cutan[eé]e?|cutan[eé]s?)\b|\brash\b|\burticaire\b'), 'éruption cutanée'),
    (_c(r'\bpâleur\b'), 'pâleur'),
    (_c(r'\bpalpitations?\b|\btachycardie\b'), 'palpitations'),
    (_c(r'\badn[eé]nopathies?\b|\bganglia?\s+(?:gonfl[eé]s?|douloureux)\b'), 'adénopathies'),

    # ── Gynécologique / menstruel ─────────────────────────────────────────
    (_c(r'\br[eè]gles?\s+(?:douloureuses?|irrégulières?|absentes?|retard(?:ées?)?)\b|\bdysm[eé]norrh[eé]e\b'), 'règles douloureuses'),
    (_c(r'\bam[eé]norrh[eé]e\b|\babsence\s+(?:de\s+)?r[eè]gles?\b|\bretard\s+(?:de\s+)?r[eè]gles?\b'), 'aménorrhée'),
    (_c(r'\bgrossesse\b|\benceinte\b|\bgravide\b'), 'grossesse'),
]


# ── Localisation anatomique ────────────────────────────────────────────────────

_LOCALIZATION_RULES: List[Tuple[re.Pattern, str]] = [
    (_c(r'\bpelvien(?:ne)?\b|\bpelvis\b'), 'pelvienne'),
    (_c(r'\babdominal[e]?\b|\bventre\b|\babdomen\b'), 'abdominale'),
    (_c(r'\bthoracique\b|\bpoitrine\b|\bthorax\b'), 'thoracique'),
    (_c(r'\bcranien(?:ne)?\b|\bc[eé]phalique\b|\btête\b'), 'crânienne'),
    (_c(r'\blombaire\b|\bdors(?:al[e]?|algie)\b|\bdos\b'), 'lombaire'),
    (_c(r'\bcervical[e]?\b|\bcou\b|\bnuque\b'), 'cervicale'),
    (_c(r'\bpulmonaire\b|\bpoumons?\b'), 'pulmonaire'),
    (_c(r'\bcardiaque\b|\bc[œo]ur\b'), 'cardiaque'),
    (_c(r'\br[eé]nal[e]?\b|\breins?\b'), 'rénale'),
    (_c(r'\bh[eé]patique\b|\bfoie\b'), 'hépatique'),
    (_c(r'\bg[eé]nital[e]?\b|\bvaginal[e]?\b|\but[eé]rin[e]?\b'), 'génitale'),
    (_c(r'\burinaire\b|\bvessie\b'), 'urinaire'),
    (_c(r'\barticulaire\b|\barticulations?\b'), 'articulaire'),
]


# ── Noms de maladies chroniques (filtre temporalité aiguë) ────────────────────

CHRONIC_DISEASE_NAME_RE = re.compile(
    r'\b(?:chronique|rhumatoïde|rhumatoide|progressi[fv](?:e)?'
    r'|d[eé]g[eé]n[eé]rati[fv](?:e)?|h[eé]r[eé]ditaire'
    r'|auto-immun(?:e)?|fibrose|scl[eé]rose\s+en\s+plaques'
    r'|polyarthrite|lupus|sjögren|psoriasis)\b',
    re.IGNORECASE | re.UNICODE
)

ACUTE_DISEASE_NAME_RE = re.compile(
    r'\baigu[eë]?\b',
    re.IGNORECASE | re.UNICODE
)


# ── Fonction principale ────────────────────────────────────────────────────────

def parse_motif_text(motif: str, sexe: str = 'M') -> Dict:
    """
    Analyse le texte libre du motif de consultation.
    Retourne un objet structuré sans hallucination.

    Args:
        motif: Texte libre du motif (ex: "Douleurs pelviennes aiguës depuis 2 jours")
        sexe: Sexe du patient pour vérification de cohérence

    Returns:
        Dict avec temporalite, localisation, symptomes_extraits, symptomes_absents, filtres_diagnostic
    """
    empty = {
        'temporalite': 'inconnue',
        'localisation': None,
        'symptomes_extraits': [],
        'symptomes_absents': [],
        'filtres_diagnostic': {'exclure_chroniques': False, 'exclure_aigus': False},
    }

    if not motif or not motif.strip():
        return empty

    # ── Temporalité ────────────────────────────────────────────────────────
    a = _ACUTE_RE.search(motif)
    c = _CHRONIC_RE.search(motif)

    if a and not c:
        temporalite = 'aiguë'
    elif c and not a:
        temporalite = 'chronique'
    elif a and c:
        temporalite = 'aiguë' if a.start() < c.start() else 'chronique'
    else:
        temporalite = 'inconnue'

    # ── Zones de négation ──────────────────────────────────────────────────
    neg_zones = _neg_zones(motif)

    # ── Extraction des symptômes ───────────────────────────────────────────
    present: List[str] = []
    absent: List[str] = []
    seen_p: set = set()
    seen_a: set = set()

    for pattern, canonical in _SYMPTOM_RULES:
        for m in pattern.finditer(motif):
            if _is_negated(m.start(), neg_zones):
                if canonical not in seen_a:
                    absent.append(canonical)
                    seen_a.add(canonical)
            else:
                if canonical not in seen_p:
                    present.append(canonical)
                    seen_p.add(canonical)

    # ── Localisation ───────────────────────────────────────────────────────
    localisation: Optional[str] = None
    for pattern, loc in _LOCALIZATION_RULES:
        if pattern.search(motif):
            localisation = loc
            break

    # ── Filtres diagnostic ─────────────────────────────────────────────────
    filtres = {
        'exclure_chroniques': temporalite == 'aiguë',
        'exclure_aigus': temporalite == 'chronique',
    }

    result = {
        'temporalite': temporalite,
        'localisation': localisation,
        'symptomes_extraits': present,
        'symptomes_absents': absent,
        'filtres_diagnostic': filtres,
    }

    logger.info(
        f"Motif parsé → temporalité={temporalite}, "
        f"extraits={present}, absents={absent}, localisation={localisation}"
    )
    return result
