"""
Matching service - Core diagnostic matching engine
"""
import pandas as pd
from typing import List, Dict, Optional, Tuple
import logging
from math import log

from rapidfuzz import fuzz

from app.services.motif_parser_service import CHRONIC_DISEASE_NAME_RE, ACUTE_DISEASE_NAME_RE

from app.utils.similarity import (
    calculate_symptom_match_score,
    find_matching_symptoms
)
from app.utils.text_processing import clean_symptom_list
from app.services.preprocessing_service import get_dataset_loader

logger = logging.getLogger(__name__)

# Sex-specific symptom blacklists (cleaned/normalized: lowercase, no accents)
_FEMALE_ONLY = frozenset([
    'ecoulement vaginal', 'pertes vaginales', 'leucorrhees', 'leucorrhee',
    'pertes blanches', 'regles douloureuses', 'dysmenorrhee', 'menstruations',
    'amenorrhee', 'menorragies', 'metrorragies', 'prurit vulvaire',
    'grossesse', 'contractions uterines', 'spotting',
    'saignements vaginaux', 'secheresse vaginale',
    'pertes genitales', 'ecoulements vaginaux',
])
_MALE_ONLY = frozenset([
    'douleur testiculaire', 'gonflement testiculaire', 'ecoulement uretral',
    'torsion testiculaire', 'douleur au niveau du testicule',
    'orchite', 'epididymite',
])

_SEX_MATCH_THRESHOLD = 68.0  # fuzzy score to consider a symptom "in the blacklist"


def _is_sex_incompatible(symptom: str, sex: str) -> bool:
    """Return True if the (cleaned) symptom is biologically impossible for the given sex."""
    from rapidfuzz import process as _proc
    blacklist = _FEMALE_ONLY if sex == 'M' else _MALE_ONLY if sex == 'F' else frozenset()
    if not blacklist:
        return False
    return _proc.extractOne(symptom, blacklist, scorer=fuzz.token_sort_ratio, score_cutoff=_SEX_MATCH_THRESHOLD) is not None


class MatchingEngine:
    """Engine for matching patient symptoms to diseases"""
    
    def __init__(self):
        self.dataset_loader = get_dataset_loader()
    
    def match_diseases(
        self,
        age: int,
        sex: str,
        symptoms: List[str],
        top_n: int = 10,
        temporalite: Optional[str] = None,
        symptomes_absents: Optional[List[str]] = None,
    ) -> List[Dict]:
        """
        Match patient symptoms to diseases
        
        Args:
            age: Patient age
            sex: Patient sex (M or F)
            symptoms: List of patient symptoms
            top_n: Number of top results to return
            
        Returns:
            List of matched diseases with scores
        """
        # Step 1: Filter by age and sex
        filtered_df = self.dataset_loader.filter_by_age_and_sex(age, sex)
        
        if filtered_df.empty:
            logger.warning(f"No diseases found for age={age}, sex={sex}")
            return []
        
        logger.info(f"Filtered to {len(filtered_df)} diseases by age/sex")

        # Step 2: Clean patient symptoms
        cleaned_patient_symptoms = clean_symptom_list(symptoms)

        if not cleaned_patient_symptoms:
            logger.warning("No valid symptoms provided")
            return []

        # Step 2b: Filter sex-incompatible symptoms
        compatible_symptoms = [
            s for s in cleaned_patient_symptoms if not _is_sex_incompatible(s, sex)
        ]
        removed = len(cleaned_patient_symptoms) - len(compatible_symptoms)
        if removed:
            logger.info(
                f"Removed {removed} sex-incompatible symptom(s) for sex={sex}: "
                f"{[s for s in cleaned_patient_symptoms if _is_sex_incompatible(s, sex)]}"
            )
        if not compatible_symptoms:
            logger.warning(f"All {len(cleaned_patient_symptoms)} symptom(s) are sex-incompatible for sex={sex} — aborting")
            return []
        cleaned_patient_symptoms = compatible_symptoms

        if not cleaned_patient_symptoms:
            logger.warning("No valid symptoms after sex filtering")
            return []

        # Step 2c: Word-overlap pre-filter — skip diseases with zero shared words.
        # This fast O(n) substring check eliminates most irrelevant diseases before
        # any fuzzy computation, reducing the candidate pool by 60-80 %.
        patient_words = {
            w for s in cleaned_patient_symptoms for w in s.split() if len(w) >= 4
        }
        if patient_words and len(filtered_df) > 30:
            def _has_overlap(syms):
                return any(
                    any(pw in ds for pw in patient_words)
                    for ds in syms
                )
            mask = filtered_df['cleaned_symptoms'].apply(_has_overlap)
            pre_filtered = filtered_df[mask]
            if len(pre_filtered) >= 15:
                logger.info(f"Word pre-filter: {len(pre_filtered)}/{len(filtered_df)} diseases kept")
                filtered_df = pre_filtered

        # Step 3: Calculate match scores for each disease.
        # We also collect zero-score diseases as diversity fallbacks so
        # anti-anchoring always has at least 3 distinct pathological roots.
        results = []
        fallbacks: list[dict] = []   # score == 0, different root families

        for idx, row in filtered_df.iterrows():
            disease_symptoms = row['cleaned_symptoms']

            if not disease_symptoms:
                continue

            # Fast screening score (no detailed matching yet)
            score = calculate_symptom_match_score(
                cleaned_patient_symptoms,
                disease_symptoms
            )

            if score > 0:
                # Detailed matching only for positive candidates
                matched_symptoms = find_matching_symptoms(
                    cleaned_patient_symptoms,
                    disease_symptoms,
                    threshold=65.0
                )

                # IDF-based specificity bonus
                if matched_symptoms:
                    idf_values = [
                        self.dataset_loader.get_symptom_idf(m['disease_symptom'])
                        for m in matched_symptoms
                    ]
                    avg_idf = sum(idf_values) / len(idf_values)
                    specificity = min(1.30, max(0.70, avg_idf / 4.5))
                    score = min(100.0, round(score * specificity, 2))

                # Exclusionary logic: key mandatory symptom (IDF > 4.5) absent
                KEY_IDF_THRESHOLD = 4.5
                key_candidates = [
                    sym for sym in disease_symptoms[:15]
                    if self.dataset_loader.get_symptom_idf(sym) > KEY_IDF_THRESHOLD
                ]
                matched_texts = {m['disease_symptom'] for m in matched_symptoms}
                key_symptom_absent = bool(key_candidates) and not any(
                    any(fuzz.ratio(k, mt) >= 70 for mt in matched_texts)
                    for k in key_candidates
                )

                # Absent symptom reinforcement from motif NLP
                if not key_symptom_absent and symptomes_absents:
                    cleaned_absent = [
                        s.lower().strip() for s in symptomes_absents if s.strip()
                    ]
                    for dsym in disease_symptoms[:20]:
                        for neg in cleaned_absent:
                            if fuzz.token_sort_ratio(dsym, neg) >= 72:
                                key_symptom_absent = True
                                logger.info(
                                    f"Absent symptom override '{neg}' matched "
                                    f"'{dsym}' in {row['Maladie']}"
                                )
                                break
                        if key_symptom_absent:
                            break

                results.append({
                    'disease_id': int(row['N°']),
                    'disease_name': row['Maladie'],
                    'score': score,
                    'age_min': int(row['Age_Min']),
                    'age_max': int(row['Age_Max']),
                    'age_typical': int(row['Age_Typique']),
                    'sex_predominant': row['Sexe_Predominant'],
                    'matched_symptoms': matched_symptoms,
                    'all_disease_symptoms': row['all_symptoms'],
                    'analyses': row['analyses_list'],
                    'expected_results': row['resultats_list'],
                    'key_symptom_absent': key_symptom_absent,
                })
            else:
                # Zero-score disease: keep as potential diversity fallback
                fallbacks.append({
                    'disease_id': int(row['N°']),
                    'disease_name': row['Maladie'],
                    'score': 0.0,
                    'age_min': int(row['Age_Min']),
                    'age_max': int(row['Age_Max']),
                    'age_typical': int(row['Age_Typique']),
                    'sex_predominant': row['Sexe_Predominant'],
                    'matched_symptoms': [],
                    'all_disease_symptoms': row.get('all_symptoms', []),
                    'analyses': row.get('analyses_list', []),
                    'expected_results': row.get('resultats_list', []),
                    'key_symptom_absent': False,
                })
        
        # Step 4: Temporality filter
        if temporalite == 'aiguë':
            for r in results:
                if CHRONIC_DISEASE_NAME_RE.search(r['disease_name']):
                    old = r['score']
                    r['score'] = round(r['score'] * 0.25, 2)
                    logger.info(
                        f"Temporality malus (aiguë→chronique): "
                        f"{r['disease_name']} {old} → {r['score']}"
                    )
        elif temporalite == 'chronique':
            for r in results:
                if ACUTE_DISEASE_NAME_RE.search(r['disease_name']):
                    old = r['score']
                    r['score'] = round(r['score'] * 0.4, 2)
                    logger.info(
                        f"Temporality malus (chronique→aigu): "
                        f"{r['disease_name']} {old} → {r['score']}"
                    )

        # Step 5: Sort primary results by score
        results.sort(key=lambda x: x['score'], reverse=True)

        # Step 5b: Diversity guarantee — if the primary results don't cover at
        # least 6 distinct pathological roots, pad with zero-score fallbacks from
        # different families.  This ensures anti-anchoring always has enough
        # distinct roots to surface a Top 3/4 even for very specific symptoms.
        MIN_DISTINCT_ROOTS = 6
        seen_roots: set[str] = {
            r['disease_name'].split('(')[0].strip() for r in results
        }
        for fb in fallbacks:
            if len(seen_roots) >= MIN_DISTINCT_ROOTS:
                break
            root = fb['disease_name'].split('(')[0].strip()
            if root not in seen_roots:
                results.append(fb)
                seen_roots.add(root)

        # Re-sort to place fallbacks at the bottom (their score == 0)
        results.sort(key=lambda x: x['score'], reverse=True)

        logger.info(
            f"Found {len(results)} candidates "
            f"({len(seen_roots)} distinct roots), returning top {top_n}"
        )

        return results[:top_n]
    
    def calculate_age_compatibility(
        self,
        patient_age: int,
        age_min: int,
        age_max: int,
        age_typical: int
    ) -> Tuple[bool, float]:
        """
        Calculate age compatibility score
        
        Args:
            patient_age: Patient's age
            age_min: Disease minimum age
            age_max: Disease maximum age
            age_typical: Disease typical age
            
        Returns:
            Tuple of (is_compatible, compatibility_score)
        """
        # Check if age is in range
        is_compatible = age_min <= patient_age <= age_max
        
        if not is_compatible:
            return (False, 0.0)
        
        # Calculate proximity to typical age
        age_range = age_max - age_min
        if age_range == 0:
            return (True, 100.0)
        
        distance_from_typical = abs(patient_age - age_typical)
        max_distance = max(age_typical - age_min, age_max - age_typical)
        
        if max_distance == 0:
            compatibility_score = 100.0
        else:
            compatibility_score = max(0, 100 - (distance_from_typical / max_distance * 50))
        
        return (True, compatibility_score)
    
    def calculate_sex_compatibility(
        self,
        patient_sex: str,
        disease_sex: str
    ) -> Tuple[bool, float]:
        """
        Calculate sex compatibility
        
        Args:
            patient_sex: Patient's sex (M or F)
            disease_sex: Disease predominant sex (M, F, or Both)
            
        Returns:
            Tuple of (is_compatible, compatibility_score)
        """
        if disease_sex == 'Both':
            return (True, 100.0)
        
        if patient_sex == disease_sex:
            return (True, 100.0)

        # Sex mismatch — still possible but penalize more heavily
        return (True, 0.0)
    
    def get_disease_details(self, disease_id: int) -> Dict:
        """Get detailed information about a disease"""
        return self.dataset_loader.get_disease_by_id(disease_id)


# Global matching engine instance
matching_engine = MatchingEngine()


def get_matching_engine() -> MatchingEngine:
    """Get the global matching engine instance"""
    return matching_engine
