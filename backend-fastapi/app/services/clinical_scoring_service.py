"""
Clinical Scoring Service — Alvarado, Wells (TVP/EP), Mac Isaac.
Computes validated clinical scores from patient symptoms and returns a
score boost (0-20) to add to the final diagnostic score.
"""
from typing import List
import logging
from rapidfuzz import fuzz

logger = logging.getLogger(__name__)

_FUZZY_THRESHOLD = 65.0


def _matches(keyword: str, symptoms: List[str]) -> bool:
    """True if keyword fuzzy-matches any symptom in the list."""
    kw = keyword.lower()
    for s in symptoms:
        if fuzz.token_sort_ratio(kw, s.lower()) >= _FUZZY_THRESHOLD:
            return True
    return False


class ScoreCliniqueManager:
    """Calculate validated clinical scores and return a boost for matched diseases."""

    # ── Alvarado (appendicite) ─────────────────────────────────────────────
    _ALVARADO_TRIGGERS = ['appendicite', 'appendicite aiguë', 'appendicite aigue']

    def _alvarado(self, symptoms: List[str]) -> int:
        score = 0
        if _matches('douleur fosse iliaque droite', symptoms) or _matches('migration douleur', symptoms):
            score += 1
        if _matches('anorexie', symptoms) or _matches('nausée', symptoms) or _matches('nausee', symptoms):
            score += 1
        if _matches('vomissement', symptoms):
            score += 1
        if _matches('sensibilite fosse iliaque droite', symptoms) or _matches('point mcburney', symptoms):
            score += 2
        if _matches('rebond douloureux', symptoms) or _matches('signe de blumberg', symptoms):
            score += 1
        if _matches('fièvre', symptoms) or _matches('fievre', symptoms) or _matches('hyperthermie', symptoms):
            score += 1
        return score

    # ── Wells TVP ──────────────────────────────────────────────────────────
    _WELLS_TVP_TRIGGERS = ['thrombose veineuse profonde', 'tvp', 'phlebite', 'phlébite']

    def _wells_tvp(self, symptoms: List[str]) -> int:
        score = 0
        if _matches('paralysie membre inferieur', symptoms) or _matches('paresie jambe', symptoms):
            score += 1
        if _matches('immobilisation', symptoms) or _matches('chirurgie recente', symptoms) or _matches('alitement', symptoms):
            score += 1
        if _matches('douleur trajet veineux', symptoms) or _matches('sensibilite veineuse', symptoms):
            score += 1
        if _matches('oedeme membre entier', symptoms) or _matches('gonflement membre', symptoms):
            score += 1
        if _matches('asymetrie mollets', symptoms) or _matches('gonflement mollet', symptoms):
            score += 1
        if _matches('circulation collaterale', symptoms) or _matches('veines superficielles dilatees', symptoms):
            score += 1
        return score

    # ── Wells EP ───────────────────────────────────────────────────────────
    _WELLS_EP_TRIGGERS = ['embolie pulmonaire', 'thromboembolie pulmonaire']

    def _wells_ep(self, symptoms: List[str]) -> float:
        score = 0.0
        if _matches('thrombose veineuse', symptoms) or _matches('signe tvp', symptoms):
            score += 3.0
        if _matches('tachycardie', symptoms) or _matches('pouls rapide', symptoms):
            score += 1.5
        if _matches('immobilisation', symptoms) or _matches('chirurgie recente', symptoms):
            score += 1.5
        if _matches('hemoptysie', symptoms) or _matches('crachat sanglant', symptoms):
            score += 1.0
        if _matches('douleur thoracique pleurale', symptoms) or _matches('douleur respiratoire', symptoms):
            score += 1.0
        return score

    # ── Mac Isaac (pharyngite streptococcique) ─────────────────────────────
    _MAC_ISAAC_TRIGGERS = [
        'pharyngite', 'angine', 'amygdalite',
        'pharyngite streptococcique', 'angine streptococcique',
    ]

    def _mac_isaac(self, symptoms: List[str], age: int) -> int:
        score = 0
        if _matches('fièvre', symptoms) or _matches('fievre', symptoms) or _matches('hyperthermie', symptoms):
            score += 1
        if not _matches('toux', symptoms):
            score += 1
        if _matches('exsudat amygdalien', symptoms) or _matches('amygdales purulentes', symptoms) or _matches('depot amygdalien', symptoms):
            score += 1
        if _matches('adenopathie cervicale', symptoms) or _matches('ganglion cervical', symptoms):
            score += 1
        if 3 <= age <= 14:
            score += 1
        elif age >= 45:
            score -= 1
        return score

    # ── Main ───────────────────────────────────────────────────────────────
    def compute_boost(self, disease_name: str, symptoms: List[str], age: int) -> float:
        """Return a score boost (0.0–20.0) if a validated clinical score is elevated."""
        dn = disease_name.lower()

        if any(t in dn for t in self._ALVARADO_TRIGGERS):
            sc = self._alvarado(symptoms)
            logger.debug(f"Alvarado score for '{disease_name}': {sc}")
            if sc >= 7:
                return 20.0
            if sc >= 5:
                return 10.0

        if any(t in dn for t in self._WELLS_TVP_TRIGGERS):
            sc = self._wells_tvp(symptoms)
            logger.debug(f"Wells TVP score for '{disease_name}': {sc}")
            if sc >= 3:
                return 15.0
            if sc >= 1:
                return 7.0

        if any(t in dn for t in self._WELLS_EP_TRIGGERS):
            sc = self._wells_ep(symptoms)
            logger.debug(f"Wells EP score for '{disease_name}': {sc}")
            if sc >= 5.0:
                return 15.0
            if sc >= 2.0:
                return 7.0

        if any(t in dn for t in self._MAC_ISAAC_TRIGGERS):
            sc = self._mac_isaac(symptoms, age)
            logger.debug(f"Mac Isaac score for '{disease_name}': {sc}")
            if sc >= 4:
                return 15.0
            if sc >= 2:
                return 7.0

        return 0.0


_manager = ScoreCliniqueManager()


def get_clinical_scoring_manager() -> ScoreCliniqueManager:
    return _manager
