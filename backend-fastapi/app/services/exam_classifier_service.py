"""
Exam Classifier Service
Classifies medical exams as numeric (with reference norms) or qualitative (with option lists).
Uses RapidFuzz for fuzzy matching against a reference norm table, supplemented by dataset parsing.
"""
import re
import logging
from typing import Optional

from rapidfuzz import process, fuzz

logger = logging.getLogger(__name__)

# ── Reference norms table ────────────────────────────────────────────────────
# Keys are lowercase French exam names.
# Numeric entries: type_saisie="numerique", unite, norme_min, norme_max, valeur_defaut_pathologique
# Qualitative entries: type_saisie="qualitatif", options_selection list

REFERENCE_NORMS: dict[str, dict] = {
    # ── Hématologie ────────────────────────────────────────────────────────
    "hémoglobine":           {"type_saisie": "numerique", "unite": "g/dL",    "norme_min": 12.0,  "norme_max": 17.5,  "valeur_defaut_pathologique": 7.5},
    "hematocrite":           {"type_saisie": "numerique", "unite": "%",       "norme_min": 36.0,  "norme_max": 50.0,  "valeur_defaut_pathologique": 25.0},
    "hématocrite":           {"type_saisie": "numerique", "unite": "%",       "norme_min": 36.0,  "norme_max": 50.0,  "valeur_defaut_pathologique": 25.0},
    "globules rouges":       {"type_saisie": "numerique", "unite": "T/L",     "norme_min": 3.8,   "norme_max": 5.8,   "valeur_defaut_pathologique": 2.5},
    "leucocytes":            {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 4.0,   "norme_max": 10.0,  "valeur_defaut_pathologique": 15.0},
    "globules blancs":       {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 4.0,   "norme_max": 10.0,  "valeur_defaut_pathologique": 15.0},
    "plaquettes":            {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 150.0, "norme_max": 400.0, "valeur_defaut_pathologique": 50.0},
    "thrombocytes":          {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 150.0, "norme_max": 400.0, "valeur_defaut_pathologique": 50.0},
    "neutrophiles":          {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 1.8,   "norme_max": 7.5,   "valeur_defaut_pathologique": 12.0},
    "lymphocytes":           {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 1.0,   "norme_max": 4.0,   "valeur_defaut_pathologique": 0.4},
    "éosinophiles":          {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 0.0,   "norme_max": 0.5,   "valeur_defaut_pathologique": 1.5},
    "eosinophiles":          {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 0.0,   "norme_max": 0.5,   "valeur_defaut_pathologique": 1.5},
    "monocytes":             {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 0.2,   "norme_max": 1.0,   "valeur_defaut_pathologique": 1.8},
    "vgm":                   {"type_saisie": "numerique", "unite": "fL",      "norme_min": 80.0,  "norme_max": 100.0, "valeur_defaut_pathologique": 115.0},
    "volume globulaire moyen": {"type_saisie": "numerique", "unite": "fL",   "norme_min": 80.0,  "norme_max": 100.0, "valeur_defaut_pathologique": 115.0},
    "tcmh":                  {"type_saisie": "numerique", "unite": "pg",      "norme_min": 27.0,  "norme_max": 33.0,  "valeur_defaut_pathologique": 20.0},
    "réticulocytes":         {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 20.0,  "norme_max": 100.0, "valeur_defaut_pathologique": 5.0},
    "reticulocytes":         {"type_saisie": "numerique", "unite": "G/L",     "norme_min": 20.0,  "norme_max": 100.0, "valeur_defaut_pathologique": 5.0},
    # ── Biochimie générale ─────────────────────────────────────────────────
    "glycémie":              {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.7,   "norme_max": 1.1,   "valeur_defaut_pathologique": 2.5},
    "glycemie":              {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.7,   "norme_max": 1.1,   "valeur_defaut_pathologique": 2.5},
    "glucose":               {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.7,   "norme_max": 1.1,   "valeur_defaut_pathologique": 2.5},
    "créatinine":            {"type_saisie": "numerique", "unite": "mg/L",    "norme_min": 6.0,   "norme_max": 12.0,  "valeur_defaut_pathologique": 30.0},
    "creatinine":            {"type_saisie": "numerique", "unite": "mg/L",    "norme_min": 6.0,   "norme_max": 12.0,  "valeur_defaut_pathologique": 30.0},
    "urée":                  {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.15,  "norme_max": 0.45,  "valeur_defaut_pathologique": 1.5},
    "uree":                  {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.15,  "norme_max": 0.45,  "valeur_defaut_pathologique": 1.5},
    "acide urique":          {"type_saisie": "numerique", "unite": "mg/L",    "norme_min": 20.0,  "norme_max": 60.0,  "valeur_defaut_pathologique": 90.0},
    "cholestérol total":     {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.0,   "norme_max": 2.0,   "valeur_defaut_pathologique": 2.8},
    "cholesterol total":     {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.0,   "norme_max": 2.0,   "valeur_defaut_pathologique": 2.8},
    "cholestérol":           {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.0,   "norme_max": 2.0,   "valeur_defaut_pathologique": 2.8},
    "ldl":                   {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.0,   "norme_max": 1.6,   "valeur_defaut_pathologique": 2.2},
    "hdl":                   {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.4,   "norme_max": 2.0,   "valeur_defaut_pathologique": 0.25},
    "triglycérides":         {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.0,   "norme_max": 1.5,   "valeur_defaut_pathologique": 3.0},
    "triglycerides":         {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 0.0,   "norme_max": 1.5,   "valeur_defaut_pathologique": 3.0},
    "sodium":                {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 135.0, "norme_max": 145.0, "valeur_defaut_pathologique": 122.0},
    "natrémie":              {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 135.0, "norme_max": 145.0, "valeur_defaut_pathologique": 122.0},
    "potassium":             {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 3.5,   "norme_max": 5.0,   "valeur_defaut_pathologique": 6.5},
    "kaliémie":              {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 3.5,   "norme_max": 5.0,   "valeur_defaut_pathologique": 6.5},
    "kalieme":               {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 3.5,   "norme_max": 5.0,   "valeur_defaut_pathologique": 6.5},
    "calcium":               {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 2.15,  "norme_max": 2.60,  "valeur_defaut_pathologique": 3.2},
    "calcémie":              {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 2.15,  "norme_max": 2.60,  "valeur_defaut_pathologique": 3.2},
    "calcemie":              {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 2.15,  "norme_max": 2.60,  "valeur_defaut_pathologique": 3.2},
    "magnésium":             {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 0.70,  "norme_max": 1.05,  "valeur_defaut_pathologique": 0.4},
    "magnesium":             {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 0.70,  "norme_max": 1.05,  "valeur_defaut_pathologique": 0.4},
    "phosphore":             {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 0.8,   "norme_max": 1.5,   "valeur_defaut_pathologique": 2.2},
    "bicarbonates":          {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 22.0,  "norme_max": 29.0,  "valeur_defaut_pathologique": 14.0},
    "chlore":                {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 95.0,  "norme_max": 105.0, "valeur_defaut_pathologique": 85.0},
    # ── Enzymes hépatiques ─────────────────────────────────────────────────
    "alat":                  {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 7.0,   "norme_max": 56.0,  "valeur_defaut_pathologique": 250.0},
    "asat":                  {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 10.0,  "norme_max": 40.0,  "valeur_defaut_pathologique": 250.0},
    "transaminases":         {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 7.0,   "norme_max": 56.0,  "valeur_defaut_pathologique": 250.0},
    "ggt":                   {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 0.0,   "norme_max": 61.0,  "valeur_defaut_pathologique": 200.0},
    "gamma-gt":              {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 0.0,   "norme_max": 61.0,  "valeur_defaut_pathologique": 200.0},
    "phosphatase alcaline":  {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 44.0,  "norme_max": 147.0, "valeur_defaut_pathologique": 500.0},
    "pal":                   {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 44.0,  "norme_max": 147.0, "valeur_defaut_pathologique": 500.0},
    "bilirubine totale":     {"type_saisie": "numerique", "unite": "mg/L",    "norme_min": 0.0,   "norme_max": 10.0,  "valeur_defaut_pathologique": 60.0},
    "bilirubine":            {"type_saisie": "numerique", "unite": "mg/L",    "norme_min": 0.0,   "norme_max": 10.0,  "valeur_defaut_pathologique": 60.0},
    "albumine":              {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 35.0,  "norme_max": 50.0,  "valeur_defaut_pathologique": 20.0},
    "protides totaux":       {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 60.0,  "norme_max": 80.0,  "valeur_defaut_pathologique": 45.0},
    "protéines totales":     {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 60.0,  "norme_max": 80.0,  "valeur_defaut_pathologique": 45.0},
    "proteines totales":     {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 60.0,  "norme_max": 80.0,  "valeur_defaut_pathologique": 45.0},
    # ── Coagulation ────────────────────────────────────────────────────────
    "tp":                    {"type_saisie": "numerique", "unite": "%",       "norme_min": 70.0,  "norme_max": 100.0, "valeur_defaut_pathologique": 35.0},
    "taux de prothrombine":  {"type_saisie": "numerique", "unite": "%",       "norme_min": 70.0,  "norme_max": 100.0, "valeur_defaut_pathologique": 35.0},
    "inr":                   {"type_saisie": "numerique", "unite": "",        "norme_min": 0.8,   "norme_max": 1.2,   "valeur_defaut_pathologique": 4.0},
    "tca":                   {"type_saisie": "numerique", "unite": "s",       "norme_min": 25.0,  "norme_max": 40.0,  "valeur_defaut_pathologique": 80.0},
    "fibrinogène":           {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 2.0,   "norme_max": 4.0,   "valeur_defaut_pathologique": 0.8},
    "fibrinogene":           {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 2.0,   "norme_max": 4.0,   "valeur_defaut_pathologique": 0.8},
    "d-dimères":             {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 500.0, "valeur_defaut_pathologique": 2500.0},
    "d-dimeres":             {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 500.0, "valeur_defaut_pathologique": 2500.0},
    # ── Inflammation / infection ───────────────────────────────────────────
    "crp":                   {"type_saisie": "numerique", "unite": "mg/L",    "norme_min": 0.0,   "norme_max": 5.0,   "valeur_defaut_pathologique": 100.0},
    "protéine c réactive":   {"type_saisie": "numerique", "unite": "mg/L",    "norme_min": 0.0,   "norme_max": 5.0,   "valeur_defaut_pathologique": 100.0},
    "proteine c reactive":   {"type_saisie": "numerique", "unite": "mg/L",    "norme_min": 0.0,   "norme_max": 5.0,   "valeur_defaut_pathologique": 100.0},
    "vs":                    {"type_saisie": "numerique", "unite": "mm/h",    "norme_min": 0.0,   "norme_max": 20.0,  "valeur_defaut_pathologique": 90.0},
    "vitesse de sédimentation": {"type_saisie": "numerique", "unite": "mm/h", "norme_min": 0.0,  "norme_max": 20.0,  "valeur_defaut_pathologique": 90.0},
    "procalcitonine":        {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 0.5,   "valeur_defaut_pathologique": 15.0},
    "ferritine":             {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 12.0,  "norme_max": 300.0, "valeur_defaut_pathologique": 1200.0},
    "fer sérique":           {"type_saisie": "numerique", "unite": "µmol/L",  "norme_min": 10.0,  "norme_max": 30.0,  "valeur_defaut_pathologique": 4.0},
    "transferrine":          {"type_saisie": "numerique", "unite": "g/L",     "norme_min": 2.0,   "norme_max": 3.6,   "valeur_defaut_pathologique": 1.0},
    "lactates":              {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 0.5,   "norme_max": 2.0,   "valeur_defaut_pathologique": 6.0},
    "acide lactique":        {"type_saisie": "numerique", "unite": "mmol/L",  "norme_min": 0.5,   "norme_max": 2.0,   "valeur_defaut_pathologique": 6.0},
    # ── Thyroïde / hormones ────────────────────────────────────────────────
    "tsh":                   {"type_saisie": "numerique", "unite": "mUI/L",   "norme_min": 0.4,   "norme_max": 4.0,   "valeur_defaut_pathologique": 12.0},
    "t4 libre":              {"type_saisie": "numerique", "unite": "pmol/L",  "norme_min": 12.0,  "norme_max": 22.0,  "valeur_defaut_pathologique": 5.0},
    "t3 libre":              {"type_saisie": "numerique", "unite": "pmol/L",  "norme_min": 3.5,   "norme_max": 6.5,   "valeur_defaut_pathologique": 2.0},
    "hcg":                   {"type_saisie": "numerique", "unite": "mUI/mL",  "norme_min": 0.0,   "norme_max": 5.0,   "valeur_defaut_pathologique": 1000.0},
    "bêta-hcg":              {"type_saisie": "numerique", "unite": "mUI/mL",  "norme_min": 0.0,   "norme_max": 5.0,   "valeur_defaut_pathologique": 1000.0},
    "beta-hcg":              {"type_saisie": "numerique", "unite": "mUI/mL",  "norme_min": 0.0,   "norme_max": 5.0,   "valeur_defaut_pathologique": 1000.0},
    "psa":                   {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 4.0,   "valeur_defaut_pathologique": 20.0},
    "cortisol":              {"type_saisie": "numerique", "unite": "µg/dL",   "norme_min": 7.0,   "norme_max": 25.0,  "valeur_defaut_pathologique": 3.0},
    "insuline":              {"type_saisie": "numerique", "unite": "µUI/mL",  "norme_min": 2.0,   "norme_max": 25.0,  "valeur_defaut_pathologique": 100.0},
    "hba1c":                 {"type_saisie": "numerique", "unite": "%",       "norme_min": 4.0,   "norme_max": 5.7,   "valeur_defaut_pathologique": 10.0},
    "hémoglobine glyquée":   {"type_saisie": "numerique", "unite": "%",       "norme_min": 4.0,   "norme_max": 5.7,   "valeur_defaut_pathologique": 10.0},
    "vitamine d":            {"type_saisie": "numerique", "unite": "nmol/L",  "norme_min": 50.0,  "norme_max": 150.0, "valeur_defaut_pathologique": 20.0},
    "vitamine b12":          {"type_saisie": "numerique", "unite": "pmol/L",  "norme_min": 148.0, "norme_max": 740.0, "valeur_defaut_pathologique": 80.0},
    "folates":               {"type_saisie": "numerique", "unite": "nmol/L",  "norme_min": 7.0,   "norme_max": 45.0,  "valeur_defaut_pathologique": 3.0},
    "acide folique":         {"type_saisie": "numerique", "unite": "nmol/L",  "norme_min": 7.0,   "norme_max": 45.0,  "valeur_defaut_pathologique": 3.0},
    # ── Cardiologie ────────────────────────────────────────────────────────
    "troponine":             {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 0.04,  "valeur_defaut_pathologique": 2.0},
    "troponine i":           {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 0.04,  "valeur_defaut_pathologique": 2.0},
    "troponine t":           {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 0.1,   "valeur_defaut_pathologique": 2.0},
    "bnp":                   {"type_saisie": "numerique", "unite": "pg/mL",   "norme_min": 0.0,   "norme_max": 100.0, "valeur_defaut_pathologique": 800.0},
    "nt-probnp":             {"type_saisie": "numerique", "unite": "pg/mL",   "norme_min": 0.0,   "norme_max": 300.0, "valeur_defaut_pathologique": 3000.0},
    "ck":                    {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 0.0,   "norme_max": 170.0, "valeur_defaut_pathologique": 800.0},
    "ck-mb":                 {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 0.0,   "norme_max": 24.0,  "valeur_defaut_pathologique": 120.0},
    "ldh":                   {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 120.0, "norme_max": 240.0, "valeur_defaut_pathologique": 600.0},
    "myoglobine":            {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 85.0,  "valeur_defaut_pathologique": 600.0},
    # ── Gaz du sang ───────────────────────────────────────────────────────
    "ph sanguin":            {"type_saisie": "numerique", "unite": "",        "norme_min": 7.35,  "norme_max": 7.45,  "valeur_defaut_pathologique": 7.18},
    "pao2":                  {"type_saisie": "numerique", "unite": "mmHg",    "norme_min": 80.0,  "norme_max": 100.0, "valeur_defaut_pathologique": 50.0},
    "paco2":                 {"type_saisie": "numerique", "unite": "mmHg",    "norme_min": 35.0,  "norme_max": 45.0,  "valeur_defaut_pathologique": 70.0},
    "saturation o2":         {"type_saisie": "numerique", "unite": "%",       "norme_min": 95.0,  "norme_max": 100.0, "valeur_defaut_pathologique": 82.0},
    "spo2":                  {"type_saisie": "numerique", "unite": "%",       "norme_min": 95.0,  "norme_max": 100.0, "valeur_defaut_pathologique": 82.0},
    # ── Pneumologie ────────────────────────────────────────────────────────
    "vems":                  {"type_saisie": "numerique", "unite": "L",       "norme_min": 2.5,   "norme_max": 5.0,   "valeur_defaut_pathologique": 1.2},
    "peak flow":             {"type_saisie": "numerique", "unite": "L/min",   "norme_min": 350.0, "norme_max": 700.0, "valeur_defaut_pathologique": 180.0},
    # ── Urines ────────────────────────────────────────────────────────────
    "protéinurie":           {"type_saisie": "numerique", "unite": "g/24h",   "norme_min": 0.0,   "norme_max": 0.15,  "valeur_defaut_pathologique": 3.0},
    "proteinurie":           {"type_saisie": "numerique", "unite": "g/24h",   "norme_min": 0.0,   "norme_max": 0.15,  "valeur_defaut_pathologique": 3.0},
    "microalbuminurie":      {"type_saisie": "numerique", "unite": "mg/24h",  "norme_min": 0.0,   "norme_max": 30.0,  "valeur_defaut_pathologique": 300.0},
    "créatininurie":         {"type_saisie": "numerique", "unite": "g/24h",   "norme_min": 0.5,   "norme_max": 1.8,   "valeur_defaut_pathologique": 0.1},
    "diurèse":               {"type_saisie": "numerique", "unite": "mL/24h",  "norme_min": 800.0, "norme_max": 2500.0,"valeur_defaut_pathologique": 200.0},
    # ── Pancréas ──────────────────────────────────────────────────────────
    "amylase":               {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 30.0,  "norme_max": 110.0, "valeur_defaut_pathologique": 600.0},
    "lipase":                {"type_saisie": "numerique", "unite": "UI/L",    "norme_min": 0.0,   "norme_max": 60.0,  "valeur_defaut_pathologique": 400.0},
    # ── Marqueurs tumoraux ─────────────────────────────────────────────────
    "ace":                   {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 5.0,   "valeur_defaut_pathologique": 30.0},
    "afp":                   {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 7.0,   "valeur_defaut_pathologique": 150.0},
    "alpha-foetoprotéine":   {"type_saisie": "numerique", "unite": "µg/L",    "norme_min": 0.0,   "norme_max": 7.0,   "valeur_defaut_pathologique": 150.0},
    "ca 125":                {"type_saisie": "numerique", "unite": "UI/mL",   "norme_min": 0.0,   "norme_max": 35.0,  "valeur_defaut_pathologique": 200.0},
    "ca 19-9":               {"type_saisie": "numerique", "unite": "UI/mL",   "norme_min": 0.0,   "norme_max": 37.0,  "valeur_defaut_pathologique": 200.0},
    # ── Examens qualitatifs ────────────────────────────────────────────────
    "ecbu": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif", "E. coli", "Klebsiella pneumoniae", "Staphylocoque", "Streptocoque", "Pseudomonas", "Entérocoque", "Proteus mirabilis", "Autre germe"],
    },
    "hémoculture": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négative", "Positive - Staphylocoque aureus", "Positive - Streptocoque", "Positive - E. coli", "Positive - Klebsiella", "Positive - autre germe"],
    },
    "hemoculture": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négative", "Positive - Staphylocoque aureus", "Positive - Streptocoque", "Positive - E. coli", "Positive - Klebsiella", "Positive - autre germe"],
    },
    "coproculture": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normale", "Salmonelle", "Shigelle", "Campylobacter", "E. coli pathogène", "Clostridium difficile", "Autre pathogène"],
    },
    "examen parasitologique des selles": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif", "Positif - Entamoeba histolytica", "Positif - Giardia", "Positif - Helminthes", "Positif - autre parasite"],
    },
    "frottis sanguin": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normal", "Plasmodium falciparum", "Plasmodium vivax", "Plasmodium malariae", "Trypanosomes", "Anomalie morphologique"],
    },
    "goutte épaisse": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négative", "Positive - Plasmodium falciparum", "Positive - autre Plasmodium"],
    },
    "ponction lombaire": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normale", "Méningite bactérienne", "Méningite virale", "Méningite fongique", "Hémorragie méningée", "Autre anomalie"],
    },
    "radiographie thoracique": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normale", "Condensation alvéolaire", "Épanchement pleural", "Cardiomégalie", "Pneumothorax", "Infiltrats bilatéraux", "Autre anomalie"],
    },
    "rx thorax": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normal", "Condensation alvéolaire", "Épanchement pleural", "Cardiomégalie", "Pneumothorax", "Infiltrats", "Autre anomalie"],
    },
    "ecg": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normal", "Sus-décalage ST (STEMI)", "Sous-décalage ST", "Fibrillation auriculaire", "Bloc auriculo-ventriculaire", "Tachycardie sinusale", "Bradycardie", "Autre anomalie"],
    },
    "électrocardiogramme": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normal", "Sus-décalage ST (STEMI)", "Sous-décalage ST", "Fibrillation auriculaire", "Bloc auriculo-ventriculaire", "Tachycardie sinusale", "Bradycardie", "Autre anomalie"],
    },
    "électrocardiogramme (ecg)": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normal", "Sus-décalage ST (STEMI)", "Sous-décalage ST", "Fibrillation auriculaire", "Bloc auriculo-ventriculaire", "Tachycardie sinusale", "Bradycardie", "Autre anomalie"],
    },
    "échographie abdominale": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normale", "Lithiases biliaires", "Dilatation voies biliaires", "Épanchement péritonéal", "Masse abdominale", "Hépatomégalie", "Splénomégalie", "Autre anomalie"],
    },
    "échographie cardiaque": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normale", "Altération fonction systolique", "Péricardite", "Valvulopathie", "Épanchement péricardique", "Hypertrophie ventriculaire", "Autre anomalie"],
    },
    "scanner thoracique": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normal", "Embolie pulmonaire", "Condensation", "Épanchement", "Masse pulmonaire", "Adénopathies", "Autre anomalie"],
    },
    "scanner cérébral": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normal", "Lésion ischémique", "Hémorragie cérébrale", "Masse intracrânienne", "Œdème cérébral", "Autre anomalie"],
    },
    "irm cérébrale": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normale", "Lésion ischémique", "Démyélinisation", "Masse", "Atrophie", "Autre anomalie"],
    },
    "sérologie": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif", "Positif IgM (infection aiguë)", "Positif IgG (immunité)", "Douteux"],
    },
    "antigène hbs": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif", "Positif"],
    },
    "anticorps anti-hbs": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif", "Positif (immunité)"],
    },
    "anticorps anti-hvc": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif", "Positif"],
    },
    "sérologie vih": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif", "Positif"],
    },
    "test rapide (tdr)": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif", "Positif"],
    },
    "test de grossesse": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif", "Positif"],
    },
    "bilan lipidique": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normal", "Hypercholestérolémie isolée", "Hypertriglycéridémie isolée", "Dyslipidémie mixte", "HDL bas isolé"],
    },
    "biopsie": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normale - pas de malignité", "Inflammation chronique", "Dysplasie", "Malignité confirmée", "Non contributive"],
    },
    "endoscopie": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normale", "Gastrite", "Ulcère gastrique", "Ulcère duodénal", "Œsophagite", "Varices", "Masse / tumeur", "Autre anomalie"],
    },
    "fibroscopie bronchique": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Normale", "Inflammation", "Sténose", "Masse endobronchique", "Sécrétions purulentes", "Autre anomalie"],
    },
    "test tuberculinique": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif (< 5 mm)", "Positif faible (5-9 mm)", "Positif (10-14 mm)", "Fortement positif (≥ 15 mm)"],
    },
    "igra": {
        "type_saisie": "qualitatif", "unite": None, "norme_min": None, "norme_max": None, "valeur_defaut_pathologique": None,
        "options_selection": ["Négatif", "Positif", "Indéterminé"],
    },
}

# ── Regex patterns for dataset result parsing ─────────────────────────────────
_NUMERIC_RE = re.compile(
    r'\b\d+[\.,]\d+\b|\b\d{2,}\b|[><]\s*\d+|\d+\s*[-–]\s*\d+|élevé|augment|diminué|accru|réduit',
    re.IGNORECASE,
)
_QUAL_OPTIONS_RE = re.compile(r'positif|négatif|présent|absent|normale?|anormale?', re.IGNORECASE)

_DEFAULT_QUAL_OPTIONS = ["Normal", "Anormal", "Positif", "Négatif"]

# Keywords that strongly indicate qualitative exam
_QUAL_KW = (
    'radio', 'rx ', 'scanner', 'irm', 'échograph', 'echograph',
    'ecbu', 'hémoculture', 'hemoculture', 'coproculture',
    'sérolog', 'serolog', 'biopsie', 'endoscop', 'fibroscop',
    'frottis', 'cytolog', 'test rapid', 'tdr', 'ponction',
    'culture', 'ecg', 'électrocard', 'electrocard',
    'goutte', 'parasitolog', 'antigène', 'anticorps',
)

# Keywords that strongly indicate numeric exam
_NUM_KW = (
    'taux', 'dosage', 'dosag', 'niveau', 'concentration',
    'numération', 'ionogramm', 'glycémie', 'glycemie',
    'créatinin', 'creatinin', 'bilirubine',
    'troponine', 'ferritine', 'protéine c', 'proteine c',
)


class ExamClassifierService:
    def __init__(self) -> None:
        self._index: dict[str, dict] = {}
        for name, meta in REFERENCE_NORMS.items():
            self._index[name] = meta

    def enrich_from_dataset(self, df) -> None:
        """Parse dataset columns 16-17 and add new exam entries to the index."""
        try:
            col_exam = df.columns[15]
            col_result = df.columns[16]
        except IndexError:
            logger.warning("Dataset columns 16-17 not available — skipping dataset enrichment")
            return

        added = 0
        for _, row in df.iterrows():
            exams_raw = str(row.get(col_exam, '') or '')
            results_raw = str(row.get(col_result, '') or '')

            exams = [e.strip() for e in exams_raw.split(';') if e.strip()]
            results = [r.strip() for r in results_raw.split(';') if r.strip()]

            for i, exam in enumerate(exams):
                key = exam.lower().strip()
                if key in self._index:
                    continue
                result_text = results[i] if i < len(results) else ''
                meta = self._infer_from_result_text(result_text)
                self._index[key] = meta
                added += 1

        logger.info(f"Exam classifier: {len(self._index)} entries ({added} from dataset)")

    def classify(self, exam_name: str) -> dict:
        """Return classification metadata for an exam name. Always returns a dict."""
        key = exam_name.lower().strip()

        # 1. Exact match
        if key in self._index:
            return self._safe(self._index[key])

        # 2. Fuzzy match (token sort ratio ≥ 82)
        if self._index:
            best = process.extractOne(key, list(self._index.keys()), scorer=fuzz.token_sort_ratio)
            if best and best[1] >= 82:
                return self._safe(self._index[best[0]])

        # 3. Keyword fallback
        return self._keyword_fallback(exam_name)

    def _infer_from_result_text(self, result_text: str) -> dict:
        if not result_text or result_text.lower() in ('nan', 'none', ''):
            return self._qual_meta(_DEFAULT_QUAL_OPTIONS)

        parts = [p.strip() for p in result_text.split(';') if p.strip()]
        has_numeric = bool(_NUMERIC_RE.search(result_text))
        has_qual_words = bool(_QUAL_OPTIONS_RE.search(result_text))

        if has_numeric and not has_qual_words:
            return {"type_saisie": "numerique", "unite": None, "norme_min": None,
                    "norme_max": None, "valeur_defaut_pathologique": None, "options_selection": None}

        options = parts if len(parts) >= 2 else _DEFAULT_QUAL_OPTIONS
        return self._qual_meta(options)

    def _keyword_fallback(self, name: str) -> dict:
        n = name.lower()
        for kw in _QUAL_KW:
            if kw in n:
                return self._qual_meta(_DEFAULT_QUAL_OPTIONS)
        for kw in _NUM_KW:
            if kw in n:
                return {"type_saisie": "numerique", "unite": None, "norme_min": None,
                        "norme_max": None, "valeur_defaut_pathologique": None, "options_selection": None}
        return self._qual_meta(_DEFAULT_QUAL_OPTIONS)

    @staticmethod
    def _qual_meta(options: list) -> dict:
        return {"type_saisie": "qualitatif", "unite": None, "norme_min": None,
                "norme_max": None, "valeur_defaut_pathologique": None, "options_selection": options}

    @staticmethod
    def _safe(meta: dict) -> dict:
        return {
            "type_saisie":              meta.get("type_saisie", "qualitatif"),
            "unite":                    meta.get("unite"),
            "norme_min":                meta.get("norme_min"),
            "norme_max":                meta.get("norme_max"),
            "valeur_defaut_pathologique": meta.get("valeur_defaut_pathologique"),
            "options_selection":        meta.get("options_selection"),
        }


_instance: Optional[ExamClassifierService] = None


def get_exam_classifier() -> ExamClassifierService:
    global _instance
    if _instance is None:
        _instance = ExamClassifierService()
    return _instance
