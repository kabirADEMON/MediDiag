"""
Symptom Normalizer Service
Maps colloquial / imprecise user symptom expressions to the canonical medical
terms used in the dataset and the ML model's TF-IDF vocabulary.

Pipeline per symptom:
  1. Exact match in curated synonym table
  2. Partial / substring match in synonym table
  3. Fuzzy match against synonym table keys (token_sort_ratio ≥ 70)
  4. Fuzzy match against dataset vocabulary   (token_sort_ratio ≥ 65)
  5. No match — keep original, optionally emit a suggestion to the frontend
"""
import logging
from typing import Optional

from rapidfuzz import process, fuzz

logger = logging.getLogger(__name__)

# ── Curated synonym table ─────────────────────────────────────────────────────
# key: colloquial / variant French expression (lowercase)
# value: canonical medical term matching dataset vocabulary

SYNONYM_TABLE: dict[str, str] = {
    # ── Tête / neurologie ─────────────────────────────────────────────────
    "mal de tête":                   "céphalées",
    "maux de tête":                  "céphalées",
    "migraine":                      "céphalées",
    "tête qui fait mal":             "céphalées",
    "mal à la tête":                 "céphalées",
    "mal de crane":                  "céphalées",
    "céphalée":                      "céphalées",
    "bourdonnements":                "acouphènes",
    "oreilles qui sifflent":         "acouphènes",
    "bruits dans les oreilles":      "acouphènes",
    "sifflements oreilles":          "acouphènes",
    "tête qui tourne":               "vertiges",
    "j'ai la tête qui tourne":       "vertiges",
    "vertige":                       "vertiges",
    "étourdissements":               "vertiges",
    "étourdissement":                "vertiges",
    "perte de connaissance":         "syncope",
    "perte de conscience":           "syncope",
    "évanouissement":                "syncope",
    "s'est évanoui":                 "syncope",
    "s'évanouit":                    "syncope",
    "convulsion":                    "convulsions",
    "crise d'épilepsie":             "convulsions",
    "crise convulsive":              "convulsions",
    "fourmillements":                "paresthésies",
    "engourdissements":              "paresthésies",
    "engourdissement":               "paresthésies",
    "picotements":                   "paresthésies",
    "membres engourdis":             "paresthésies",
    "bras engourdi":                 "paresthésies",
    "paralysie du bras":             "paralysie",
    "bras paralysé":                 "paralysie",
    "n'arrive pas à bouger":         "paralysie",
    "trouble de la mémoire":         "confusion mentale",
    "perte de mémoire":              "confusion mentale",
    "confusion":                     "confusion mentale",
    "désorientation":                "confusion mentale",
    "n'arrive pas à parler":         "aphasie",
    "ne parle plus":                 "aphasie",
    "trouble du langage":            "aphasie",
    "perd le fil":                   "confusion mentale",
    # ── Yeux ──────────────────────────────────────────────────────────────
    "yeux jaunes":                   "ictère conjonctival",
    "jaunisse":                      "ictère cutanéo-muqueux",
    "peau jaune":                    "ictère cutanéo-muqueux",
    "teint jaune":                   "ictère cutanéo-muqueux",
    "vue trouble":                   "troubles visuels",
    "vision floue":                  "troubles visuels",
    "voit flou":                     "troubles visuels",
    "mal aux yeux":                  "douleur oculaire",
    "yeux qui font mal":             "douleur oculaire",
    "yeux rouges":                   "conjonctivite",
    "yeux qui coulent":              "larmoiement",
    "yeux qui pleurent":             "larmoiement",
    # ── Gorge / bouche ───────────────────────────────────────────────────
    "mal de gorge":                  "douleur pharyngée",
    "gorge en feu":                  "douleur pharyngée",
    "gorge qui gratte":              "douleur pharyngée",
    "gorge irritée":                 "douleur pharyngée",
    "mal à la gorge":                "douleur pharyngée",
    "avale mal":                     "dysphagie",
    "difficultés à avaler":          "dysphagie",
    "douleur quand il avale":        "dysphagie",
    "du mal à avaler":               "dysphagie",
    "ne peut pas avaler":            "dysphagie",
    "aphtes":                        "ulcérations buccales",
    "bouche sèche":                  "sécheresse buccale",
    "lèvres sèches":                 "sécheresse buccale",
    # ── Appareil respiratoire ─────────────────────────────────────────────
    "essoufflement":                 "dyspnée",
    "souffle coupé":                 "dyspnée",
    "respiration difficile":         "dyspnée",
    "mal à respirer":                "dyspnée",
    "manque de souffle":             "dyspnée",
    "respire mal":                   "dyspnée",
    "halète":                        "dyspnée",
    "ne peut pas respirer":          "dyspnée",
    "difficultés à respirer":        "dyspnée",
    "pas de souffle":                "dyspnée",
    "crache du sang":                "hémoptysie",
    "sang dans les crachats":        "hémoptysie",
    "respiration sifflante":         "sibilants",
    "souffle sifflant":              "sibilants",
    "siffle quand il respire":       "sibilants",
    "sifflements respiratoires":     "sibilants",
    "crachat":                       "expectoration",
    "crachats":                      "expectoration",
    "crache":                        "expectoration",
    "mucus":                         "expectoration",
    "douleur poitrine":              "douleur thoracique",
    "mal à la poitrine":             "douleur thoracique",
    "oppression dans la poitrine":   "douleur thoracique",
    "serrement dans la poitrine":    "douleur thoracique",
    "douleur dans la poitrine":      "douleur thoracique",
    "douleur dans le thorax":        "douleur thoracique",
    "poitrine qui fait mal":         "douleur thoracique",
    "brûlure dans la poitrine":      "douleur thoracique",
    "tousse beaucoup":               "toux",
    "toux persistante":              "toux chronique",
    "toux grasse":                   "toux productive",
    "toux sèche":                    "toux sèche",
    # ── Cardiovasculaire ──────────────────────────────────────────────────
    "cœur qui bat vite":             "tachycardie",
    "coeur qui bat vite":            "tachycardie",
    "cœur qui s'emballe":            "palpitations",
    "coeur qui s'emballe":           "palpitations",
    "palpitation":                   "palpitations",
    "tension élevée":                "hypertension artérielle",
    "tension haute":                 "hypertension artérielle",
    "hypertendu":                    "hypertension artérielle",
    "tension basse":                 "hypotension",
    "hypotendu":                     "hypotension",
    "jambes qui gonflent":           "œdème des membres inférieurs",
    "jambes gonflées":               "œdème des membres inférieurs",
    "chevilles gonflées":            "œdème des membres inférieurs",
    "pieds gonflés":                 "œdème des membres inférieurs",
    "gonflement des jambes":         "œdème des membres inférieurs",
    "gonflement des chevilles":      "œdème des membres inférieurs",
    # ── Digestif ──────────────────────────────────────────────────────────
    "mal au ventre":                 "douleur abdominale",
    "ventre qui fait mal":           "douleur abdominale",
    "douleur au ventre":             "douleur abdominale",
    "crampes au ventre":             "douleur abdominale",
    "crampes abdominales":           "douleur abdominale",
    "douleur abdominale":            "douleur abdominale",
    "mal à l'estomac":               "épigastralgie",
    "estomac qui brûle":             "pyrosis",
    "brûlures d'estomac":            "pyrosis",
    "remontées acides":              "pyrosis",
    "reflux acide":                  "pyrosis",
    "reflux":                        "pyrosis",
    "envie de vomir":                "nausées",
    "coeur au lèvres":               "nausées",
    "haut le cœur":                  "nausées",
    "nausée":                        "nausées",
    "vomi":                          "vomissements",
    "a vomi":                        "vomissements",
    "vomissement":                   "vomissements",
    "vomi du sang":                  "hématémèse",
    "sang dans les vomissements":    "hématémèse",
    "selles liquides":               "diarrhée",
    "dérangement":                   "diarrhée",
    "gastro":                        "diarrhée",
    "n'arrive pas à aller à la selle": "constipation",
    "pas de selles depuis":          "constipation",
    "sang dans les selles":          "rectorragie",
    "saignement rectal":             "rectorragie",
    "selles noires":                 "méléna",
    "selles de goudron":             "méléna",
    "ventre gonflé":                 "distension abdominale",
    "ballonnement":                  "ballonnement abdominal",
    "ballonnements":                 "ballonnement abdominal",
    "liquide dans le ventre":        "ascite",
    "ventre dur":                    "défense abdominale",
    # ── Urinaire ──────────────────────────────────────────────────────────
    "pipi permanent":                "polyurie",
    "urine beaucoup":                "polyurie",
    "boit et urine beaucoup":        "polyurie",
    "va souvent aux toilettes":      "pollakiurie",
    "urine souvent":                 "pollakiurie",
    "envies fréquentes d'uriner":    "pollakiurie",
    "douleur quand il urine":        "dysurie",
    "brûlures en urinant":           "dysurie",
    "brûlures pipi":                 "dysurie",
    "ça brûle pour uriner":          "dysurie",
    "sang dans les urines":          "hématurie",
    "urine rouge":                   "hématurie",
    "urine rosée":                   "hématurie",
    "pisse peu":                     "oligurie",
    "urine peu":                     "oligurie",
    "n'urine plus":                  "anurie",
    "ne fait plus pipi":             "anurie",
    "pas d'urine":                   "anurie",
    "pipi trouble":                  "pyurie",
    "urine trouble":                 "pyurie",
    # ── Fièvre / état général ─────────────────────────────────────────────
    "a de la fièvre":                "fièvre",
    "température élevée":            "fièvre",
    "fébricule":                     "fièvre",
    "chaud froid":                   "frissons",
    "tremble de froid":              "frissons",
    "claque des dents":              "frissons",
    "transpire la nuit":             "sueurs nocturnes",
    "sueurs la nuit":                "sueurs nocturnes",
    "très fatigué":                  "asthénie",
    "épuisé":                        "asthénie",
    "n'a plus de forces":            "asthénie",
    "faiblesse générale":            "asthénie",
    "fatigue intense":               "asthénie",
    "fatigue":                       "asthénie",
    "faiblesse":                     "asthénie",
    "perte de poids":                "amaigrissement",
    "maigrit":                       "amaigrissement",
    "a maigri":                      "amaigrissement",
    "n'a plus faim":                 "anorexie",
    "perte d'appétit":               "anorexie",
    "ne mange plus":                 "anorexie",
    "a très soif":                   "polydipsie",
    "boit beaucoup":                 "polydipsie",
    "soif intense":                  "polydipsie",
    # ── Peau ──────────────────────────────────────────────────────────────
    "boutons":                       "éruption cutanée",
    "rougeurs sur la peau":          "éruption cutanée",
    "rash":                          "éruption cutanée",
    "éruption":                      "éruption cutanée",
    "plaques rouges":                "éruption cutanée",
    "ça gratte":                     "prurit",
    "gratte":                        "prurit",
    "peau qui gratte":               "prurit",
    "démangeaisons intenses":        "prurit",
    "ganglions gonflés":             "adénopathies",
    "ganglions":                     "adénopathies",
    "boules dans le cou":            "adénopathies",
    "gonflement":                    "œdème",
    "enflure":                       "œdème",
    "peau bleue":                    "cyanose",
    "lèvres bleues":                 "cyanose",
    "doigts bleus":                  "cyanose",
    "plaies qui ne cicatrisent pas": "ulcérations cutanées",
    # ── Ostéo-articulaire ─────────────────────────────────────────────────
    "mal aux muscles":               "myalgies",
    "douleur musculaire":            "myalgies",
    "courbatures":                   "myalgies",
    "corps qui fait mal":            "myalgies",
    "douleur articulaire":           "arthralgies",
    "articulations douloureuses":    "arthralgies",
    "mal aux articulations":         "arthralgies",
    "articulations enflées":         "arthrite",
    "genou gonflé":                  "arthrite",
    "mal au dos":                    "lombalgie",
    "douleur lombaire":              "lombalgie",
    "dos qui fait mal":              "lombalgie",
    "mal dans le bas du dos":        "lombalgie",
    "nuque raide":                   "raideur méningée",
    "cou raide":                     "raideur méningée",
    "raideur de la nuque":           "raideur méningée",
    "mal au cou":                    "cervicalgie",
    # ── Santé mentale ─────────────────────────────────────────────────────
    "très triste":                   "dépression",
    "ne veut plus rien faire":       "dépression",
    "angoisse":                      "anxiété",
    "stress intense":                "anxiété",
    "attaque de panique":            "attaque de panique",
    "n'arrive pas à dormir":         "insomnie",
    "dort mal":                      "insomnie",
    "réveils nocturnes":             "insomnie",
    "entend des voix":               "hallucinations",
    "voit des choses":               "hallucinations",
    # ── ORL ───────────────────────────────────────────────────────────────
    "nez bouché":                    "obstruction nasale",
    "nez qui coule":                 "rhinorrhée",
    "écoulement nasal":              "rhinorrhée",
    "saignement du nez":             "épistaxis",
    "sang par le nez":               "épistaxis",
    "perd l'odorat":                 "anosmie",
    "ne sent plus rien":             "anosmie",
    "perd le goût":                  "agueusie",
    "ne goûte plus rien":            "agueusie",
    "mal aux oreilles":              "otalgie",
    "oreilles qui font mal":         "otalgie",
    "entend mal":                    "hypoacousie",
    "surdité":                       "hypoacousie",
    "voix enrouée":                  "dysphonie",
    "voix rauque":                   "dysphonie",
    "a perdu la voix":               "dysphonie",
}

# Normalised lookup (keys already lowercased)
_TABLE_LOWER: dict[str, str] = {k.lower().strip(): v for k, v in SYNONYM_TABLE.items()}


class SymptomNormalizerService:
    """
    Normalizes user-entered symptom strings to canonical dataset vocabulary.
    Must call `build_vocabulary(df)` once at startup so RapidFuzz can match
    against the full dataset symptom list.
    """

    def __init__(self) -> None:
        self._vocab: list[str] = []       # canonical terms from dataset
        self._vocab_lc: list[str] = []    # same, lowercased

    def build_vocabulary(self, df) -> None:
        """
        Extract symptom vocabulary from the loaded dataset DataFrame.
        Looks for a column whose name contains 'symptom' (case-insensitive),
        falling back to the 4th column by position.
        """
        sym_col = next(
            (c for c in df.columns if 'symptom' in c.lower() or 'symptome' in c.lower()),
            df.columns[3] if len(df.columns) > 3 else None,
        )
        seen: set[str] = set()
        vocab: list[str] = []

        if sym_col:
            for raw in df[sym_col].dropna():
                for part in str(raw).split(';'):
                    t = part.strip()
                    tl = t.lower()
                    if t and tl not in seen and len(t) > 2:
                        seen.add(tl)
                        vocab.append(t)

        # Also add all synonym target values
        for val in SYNONYM_TABLE.values():
            vl = val.lower()
            if vl not in seen:
                seen.add(vl)
                vocab.append(val)

        self._vocab = vocab
        self._vocab_lc = [v.lower() for v in vocab]
        logger.info(f"Symptom normalizer: vocabulary = {len(vocab)} terms")

    def normalize(self, symptom: str) -> tuple[str, Optional[str]]:
        """
        Normalize one symptom string.
        Returns (canonical_term, suggestion_or_None).
        `suggestion` is set when the input scored 50-64 against the vocabulary
        — the frontend can display "Vouliez-vous dire X ?".
        """
        raw = symptom.strip()
        raw_lc = raw.lower()

        # 1. Exact match in synonym table
        if raw_lc in _TABLE_LOWER:
            return _TABLE_LOWER[raw_lc], None

        # 2. Substring match in synonym table keys
        for key, val in _TABLE_LOWER.items():
            if raw_lc in key or key in raw_lc:
                return val, None

        # 3. Fuzzy match against synonym table keys (score ≥ 70)
        if _TABLE_LOWER:
            best = process.extractOne(raw_lc, list(_TABLE_LOWER.keys()), scorer=fuzz.token_sort_ratio)
            if best and best[1] >= 70:
                return _TABLE_LOWER[best[0]], None

        # 4. Fuzzy match against dataset vocabulary (score ≥ 65)
        if self._vocab_lc:
            best = process.extractOne(raw_lc, self._vocab_lc, scorer=fuzz.token_sort_ratio)
            if best and best[1] >= 65:
                idx = self._vocab_lc.index(best[0])
                return self._vocab[idx], None
            # Score 50-64: keep input, emit suggestion
            if best and best[1] >= 50:
                idx = self._vocab_lc.index(best[0])
                return raw, self._vocab[idx]

        # 5. No match — keep as-is
        return raw, None

    def normalize_list(self, symptoms: list[str]) -> tuple[list[str], list[dict]]:
        """
        Normalize a list of symptom strings.
        Returns:
          - normalized: list of canonical terms (deduped)
          - suggestions: [{original, suggestion}] for low-confidence matches
        """
        normalized: list[str] = []
        suggestions: list[dict] = []
        seen: set[str] = set()

        for sym in symptoms:
            if not sym or not sym.strip():
                continue
            canon, hint = self.normalize(sym)
            canon_lc = canon.lower()
            if canon_lc not in seen:
                normalized.append(canon)
                seen.add(canon_lc)
            if hint:
                suggestions.append({"original": sym, "suggestion": hint})

        return normalized, suggestions


# ── Singleton ─────────────────────────────────────────────────────────────────
_instance: Optional[SymptomNormalizerService] = None


def get_symptom_normalizer() -> SymptomNormalizerService:
    global _instance
    if _instance is None:
        _instance = SymptomNormalizerService()
    return _instance
