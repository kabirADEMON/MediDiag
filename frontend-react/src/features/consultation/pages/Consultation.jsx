/**
 * Consultation Page
 * Workflow: symptômes → diagnostic préliminaire → analyses → diagnostic final → validation → PDF
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Stethoscope, Search, CheckCircle, AlertCircle, ChevronRight,
  ChevronDown, Plus, X, RotateCcw, FileDown, Save, ThumbsUp,
  ThumbsDown, Loader2, Sparkles, Clock, Ban, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Autocomplete } from '@/components/ui/Autocomplete'
import { diagnosticSchema } from '@/utils/validators'
import { formatScore, calculateAge } from '@/utils/helpers'
import { useAuth } from '@/features/auth/context/AuthContext'
import * as diagnosticApi from '@/features/clinical-engine/api/diagnosticApi'
import { DiagnosticCard } from '@/features/clinical-engine'
import * as metadataApi from '@/api/metadataApi'
import * as patientApi from '@/features/patients/api/patientApi'
import * as consultationApi from '@/features/consultation/api/consultationApi'
import { post } from '@/api/axios'

// ─── Session persistence ─────────────────────────────────────────────────────
const SESSION_KEY = 'medidag_consultation_session'

// ─── Sex-specific symptom lists ──────────────────────────────────────────────
const FEMALE_ONLY_SYMPTOMS = new Set([
  'écoulement vaginal', 'pertes vaginales', 'leucorrhées', 'leucorrhée',
  'pertes blanches', 'règles douloureuses', 'dysménorrhée', 'menstruations',
  'aménorrhée', 'ménorragies', 'métrorragies', 'prurit vulvaire',
  'douleur pelvienne féminine', 'grossesse', 'contractions utérines',
  'spotting', 'saignements vaginaux', 'sécheresse vaginale',
])
const MALE_ONLY_SYMPTOMS = new Set([
  'douleur testiculaire', 'gonflement testiculaire', 'écoulement urétral',
  'douleur au niveau du testicule', 'torsion testiculaire',
])

// ─── Biological norms reference table ────────────────────────────────────────
const ANALYSES_NORMS = {
  'Glycémie':             { min: 0.70, max: 1.10, unit: 'g/L' },
  'Glycémie à jeun':      { min: 0.70, max: 1.00, unit: 'g/L' },
  'Créatinine':           { min: 60,   max: 110,  unit: 'µmol/L' },
  'Créatininémie':        { min: 60,   max: 110,  unit: 'µmol/L' },
  'Globules blancs':      { min: 4.0,  max: 10.0, unit: 'G/L' },
  'Leucocytes':           { min: 4.0,  max: 10.0, unit: 'G/L' },
  'Hémoglobine':          { min: 12.0, max: 17.5, unit: 'g/dL' },
  'Hématocrite':          { min: 36,   max: 54,   unit: '%' },
  'Plaquettes':           { min: 150,  max: 400,  unit: 'G/L' },
  'Thrombocytes':         { min: 150,  max: 400,  unit: 'G/L' },
  'CRP':                  { min: 0,    max: 5,    unit: 'mg/L' },
  'Protéine C réactive':  { min: 0,    max: 5,    unit: 'mg/L' },
  'PCT':                  { min: 0,    max: 0.5,  unit: 'ng/mL' },
  'Sodium':               { min: 136,  max: 145,  unit: 'mmol/L' },
  'Natrémie':             { min: 136,  max: 145,  unit: 'mmol/L' },
  'Potassium':            { min: 3.5,  max: 5.0,  unit: 'mmol/L' },
  'Kaliémie':             { min: 3.5,  max: 5.0,  unit: 'mmol/L' },
  'Calcium':              { min: 2.20, max: 2.65, unit: 'mmol/L' },
  'Calcémie':             { min: 2.20, max: 2.65, unit: 'mmol/L' },
  'Phosphorémie':         { min: 0.80, max: 1.45, unit: 'mmol/L' },
  'Urée':                 { min: 2.5,  max: 7.5,  unit: 'mmol/L' },
  'Urée sanguine':        { min: 2.5,  max: 7.5,  unit: 'mmol/L' },
  'Uricémie':             { min: 150,  max: 420,  unit: 'µmol/L' },
  'Acide urique':         { min: 150,  max: 420,  unit: 'µmol/L' },
  'ASAT':                 { min: 0,    max: 40,   unit: 'UI/L' },
  'ALAT':                 { min: 0,    max: 41,   unit: 'UI/L' },
  'ASAT/ALAT':            { min: 0,    max: 40,   unit: 'UI/L' },
  'Transaminases ASAT':   { min: 0,    max: 40,   unit: 'UI/L' },
  'Transaminases ALAT':   { min: 0,    max: 41,   unit: 'UI/L' },
  'GGT':                  { min: 0,    max: 55,   unit: 'UI/L' },
  'Gamma-GT':             { min: 0,    max: 55,   unit: 'UI/L' },
  'Phosphatases alcalines': { min: 40, max: 130,  unit: 'UI/L' },
  'PAL':                  { min: 40,   max: 130,  unit: 'UI/L' },
  'Bilirubine':           { min: 0,    max: 17,   unit: 'µmol/L' },
  'Bilirubine totale':    { min: 0,    max: 17,   unit: 'µmol/L' },
  'Bilirubinémie':        { min: 0,    max: 17,   unit: 'µmol/L' },
  'LDH':                  { min: 120,  max: 240,  unit: 'UI/L' },
  'Lacticodéhydrogénase': { min: 120,  max: 240,  unit: 'UI/L' },
  'Ferritine':            { min: 20,   max: 250,  unit: 'µg/L' },
  'Ferritinémie':         { min: 20,   max: 250,  unit: 'µg/L' },
  'TSH':                  { min: 0.4,  max: 4.0,  unit: 'mUI/L' },
  'TSH us':               { min: 0.4,  max: 4.0,  unit: 'mUI/L' },
  'T4L':                  { min: 10,   max: 20,   unit: 'pmol/L' },
  'T4 libre':             { min: 10,   max: 20,   unit: 'pmol/L' },
  'T3L':                  { min: 3.1,  max: 6.8,  unit: 'pmol/L' },
  'Cholestérol total':    { min: 0,    max: 5.2,  unit: 'mmol/L' },
  'Cholestérol LDL':      { min: 0,    max: 3.4,  unit: 'mmol/L' },
  'Cholestérol HDL':      { min: 1.0,  max: 3.0,  unit: 'mmol/L' },
  'Triglycérides':        { min: 0,    max: 1.7,  unit: 'mmol/L' },
  'Triglycéridémie':      { min: 0,    max: 1.7,  unit: 'mmol/L' },
  'Albumine':             { min: 35,   max: 50,   unit: 'g/L' },
  'Albuminémie':          { min: 35,   max: 50,   unit: 'g/L' },
  'Protéines totales':    { min: 60,   max: 80,   unit: 'g/L' },
  'INR':                  { min: 0.8,  max: 1.2,  unit: '' },
  'TP':                   { min: 70,   max: 100,  unit: '%' },
  'Taux de prothrombine': { min: 70,   max: 100,  unit: '%' },
  'TCA':                  { min: 25,   max: 35,   unit: 's' },
  'VS':                   { min: 0,    max: 20,   unit: 'mm/h' },
  'Vitesse de sédimentation': { min: 0, max: 20,  unit: 'mm/h' },
  'Folates':              { min: 3.0,  max: 17.0, unit: 'nmol/L' },
  'B12':                  { min: 148,  max: 740,  unit: 'pmol/L' },
  'Vitamine B12':         { min: 148,  max: 740,  unit: 'pmol/L' },
  'Vitamine D':           { min: 50,   max: 125,  unit: 'nmol/L' },
  '25-OH Vitamine D':     { min: 50,   max: 125,  unit: 'nmol/L' },
  'Troponine':            { min: 0,    max: 0.04, unit: 'µg/L' },
  'Troponine I':          { min: 0,    max: 0.04, unit: 'µg/L' },
  'Troponine T':          { min: 0,    max: 0.014, unit: 'µg/L' },
  'CPK':                  { min: 24,   max: 195,  unit: 'UI/L' },
  'Créatine kinase':      { min: 24,   max: 195,  unit: 'UI/L' },
  'Amylase':              { min: 28,   max: 100,  unit: 'UI/L' },
  'Amylasémie':           { min: 28,   max: 100,  unit: 'UI/L' },
  'Lipase':               { min: 13,   max: 60,   unit: 'UI/L' },
  'Lipasémie':            { min: 13,   max: 60,   unit: 'UI/L' },
  'D-dimères':            { min: 0,    max: 0.5,  unit: 'µg/mL' },
  'D-Dimères':            { min: 0,    max: 0.5,  unit: 'µg/mL' },
  'Fibrinogène':          { min: 2.0,  max: 4.0,  unit: 'g/L' },
  'PSA':                  { min: 0,    max: 4.0,  unit: 'ng/mL' },
  'PSA total':            { min: 0,    max: 4.0,  unit: 'ng/mL' },
  'HbA1c':               { min: 4.0,  max: 5.7,  unit: '%' },
  'Hémoglobine glyquée':  { min: 4.0,  max: 5.7,  unit: '%' },
  'Insuline':             { min: 3,    max: 25,   unit: 'µUI/mL' },
  'Insulinémie':          { min: 3,    max: 25,   unit: 'µUI/mL' },
  'Cortisol':             { min: 138,  max: 690,  unit: 'nmol/L' },
  'Cortisolémie':         { min: 138,  max: 690,  unit: 'nmol/L' },
  'Magnésium':            { min: 0.75, max: 1.05, unit: 'mmol/L' },
  'Magnésémie':           { min: 0.75, max: 1.05, unit: 'mmol/L' },
  'Chlore':               { min: 98,   max: 107,  unit: 'mmol/L' },
  'Chlorémie':            { min: 98,   max: 107,  unit: 'mmol/L' },
  'pH artériel':          { min: 7.38, max: 7.42, unit: '' },
  'PaO2':                 { min: 80,   max: 100,  unit: 'mmHg' },
  'PaCO2':                { min: 35,   max: 45,   unit: 'mmHg' },
  'SpO2':                 { min: 95,   max: 100,  unit: '%' },
  'Saturation en oxygène': { min: 95,  max: 100,  unit: '%' },
  'Numération formule sanguine': { min: 4.0, max: 10.0, unit: 'G/L' },
  'NFS':                  { min: 4.0,  max: 10.0, unit: 'G/L' },
  'Numération globulaire': { min: 4.0, max: 10.0, unit: 'G/L' },
  'Hémoculture':          null,
  'ECBU':                 null,
  'Coproculture':         null,
}

// ─── Analysis guide: type + description + options for qualitative tests ──────
// type: 'numerique' | 'qualitatif' | 'imagerie' | 'microbiologie'
const ANALYSES_GUIDE = {
  // ── Microbiologie / cultures ─────────────────────────────────────────────
  'Hémoculture':            { type: 'microbiologie', desc: 'Recherche de bactéries dans le sang. Négatif = pas d\'infection dans le sang.', options: ['Négatif (stérile)', 'Positif (bactérie identifiée)', 'Non réalisé'] },
  'ECBU':                   { type: 'microbiologie', desc: 'Analyse des urines pour détecter une infection urinaire (cystite, pyélonéphrite).', options: ['Négatif (stérile)', 'Positif (bactérie ≥10³ UFC/mL)', 'Non réalisé'] },
  'Coproculture':           { type: 'microbiologie', desc: 'Recherche de bactéries dans les selles (gastro-entérite infectieuse).', options: ['Négatif', 'Positif (pathogène identifié)', 'Non réalisé'] },
  'Frottis':                { type: 'microbiologie', desc: 'Examen microscopique d\'un prélèvement pour identifier des bactéries ou cellules anormales.', options: ['Négatif (normal)', 'Positif (anomalie identifiée)', 'Non réalisé'] },
  'Frottis coloré':         { type: 'microbiologie', desc: 'Coloration du prélèvement pour visualiser les bactéries au microscope (cocci, bacilles...).', options: ['Négatif', 'Positif (bactéries présentes)', 'Non réalisé'] },
  'Antibiogramme':          { type: 'microbiologie', desc: 'Test pour savoir quels antibiotiques peuvent tuer la bactérie trouvée.', options: ['Sensible (antibiotique efficace)', 'Résistant', 'Non réalisé'] },
  'Prélèvement conjonctival': { type: 'microbiologie', desc: 'Prélèvement de l\'œil pour identifier une bactérie responsable d\'une conjonctivite.', options: ['Négatif', 'Positif (germe identifié)', 'Non réalisé'] },
  'Prélèvement vaginal':    { type: 'microbiologie', desc: 'Recherche de bactéries, champignons ou parasites responsables d\'une infection génitale.', options: ['Négatif (flore normale)', 'Positif (pathogène identifié)', 'Non réalisé'] },
  'Prélèvement urétral':    { type: 'microbiologie', desc: 'Recherche d\'IST (gonococcie, chlamydia...) dans l\'urètre.', options: ['Négatif', 'Positif (pathogène identifié)', 'Non réalisé'] },
  'Prélèvement de gorge':   { type: 'microbiologie', desc: 'Recherche du streptocoque ou autre bactérie responsable d\'une angine.', options: ['Négatif', 'Positif (Streptocoque A)', 'Positif (autre bactérie)', 'Non réalisé'] },

  // ── PCR / Tests moléculaires ──────────────────────────────────────────────
  'PCR':                    { type: 'qualitatif', desc: 'Test très précis qui détecte le matériel génétique d\'un virus ou bactérie.', options: ['Négatif (non détecté)', 'Positif (détecté)', 'Non réalisé'] },
  'PCR Chlamydia':          { type: 'qualitatif', desc: 'Détecte la bactérie Chlamydia (IST fréquente, souvent sans symptômes). Transmise sexuellement.', options: ['Négatif (non détecté)', 'Positif (Chlamydia détecté)', 'Non réalisé'] },
  'PCR Mycoplasme':         { type: 'qualitatif', desc: 'Détecte Mycoplasma pneumoniae, responsable de pneumonies atypiques.', options: ['Négatif', 'Positif', 'Non réalisé'] },
  'PCR BK':                 { type: 'qualitatif', desc: 'Détecte la bactérie de la tuberculose (Bacille de Koch).', options: ['Négatif', 'Positif (tuberculose)', 'Non réalisé'] },
  'PCR COVID':              { type: 'qualitatif', desc: 'Détecte le coronavirus SARS-CoV-2 responsable du COVID-19.', options: ['Négatif', 'Positif', 'Non réalisé'] },
  'PCR VIH':                { type: 'qualitatif', desc: 'Mesure la quantité de virus VIH dans le sang (charge virale).', options: ['Indétectable', 'Détectable (charge virale mesurée)', 'Non réalisé'] },
  'PCR Herpès':             { type: 'qualitatif', desc: 'Détecte le virus Herpès Simplex (HSV 1 ou 2).', options: ['Négatif', 'Positif (HSV-1)', 'Positif (HSV-2)', 'Non réalisé'] },
  'PCR paludisme':          { type: 'qualitatif', desc: 'Détecte le parasite du paludisme (Plasmodium) dans le sang.', options: ['Négatif', 'Positif', 'Non réalisé'] },

  // ── Tests rapides / sérologies ────────────────────────────────────────────
  'Test rapide':            { type: 'qualitatif', desc: 'Test rapide d\'orientation diagnostique (TROD). Résultat en quelques minutes.', options: ['Négatif', 'Positif', 'Non réalisé'] },
  'TDR paludisme':          { type: 'qualitatif', desc: 'Test rapide de détection du paludisme (antigène plasmodium). Résultat en 15 min.', options: ['Négatif', 'Positif', 'Non réalisé'] },
  'Sérologie':              { type: 'qualitatif', desc: 'Mesure les anticorps dans le sang. Indique si le corps a déjà rencontré un agent infectieux.', options: ['Négatif', 'Positif (anticorps détectés)', 'Non réalisé'] },
  'Test de Mantoux':        { type: 'qualitatif', desc: 'Test cutané pour détecter une exposition à la tuberculose (intradermoréaction). Lecture à 72h.', options: ['Négatif (induration < 5mm)', 'Positif (induration ≥ 10mm)', 'Non réalisé'] },
  'IDR tuberculine':        { type: 'qualitatif', desc: 'Injection sous-cutanée pour tester l\'exposition à la tuberculose.', options: ['Négatif (< 5mm)', 'Positif (≥ 10mm)', 'Non réalisé'] },
  'Sérologie Chlamydia':    { type: 'qualitatif', desc: 'Détecte les anticorps anti-Chlamydia dans le sang.', options: ['Négatif', 'Positif IgG', 'Positif IgM (infection récente)', 'Non réalisé'] },
  'Sérologie VIH':          { type: 'qualitatif', desc: 'Test de dépistage du VIH. Un résultat positif doit être confirmé par Western Blot.', options: ['Négatif', 'Positif (à confirmer)', 'Non réalisé'] },
  'AgHBs':                  { type: 'qualitatif', desc: 'Antigène de surface du virus Hépatite B — détecte une infection active par l\'hépatite B.', options: ['Négatif (pas d\'infection active)', 'Positif (hépatite B active)', 'Non réalisé'] },
  'Anticorps anti-HCV':     { type: 'qualitatif', desc: 'Détecte une exposition au virus de l\'hépatite C.', options: ['Négatif', 'Positif (à confirmer par PCR)', 'Non réalisé'] },
  'Widal':                  { type: 'qualitatif', desc: 'Recherche d\'anticorps contre la fièvre typhoïde (Salmonella Typhi).', options: ['Négatif (< 1/80)', 'Positif (≥ 1/160, typhoid probable)', 'Non réalisé'] },
  'Frottis sanguin':        { type: 'microbiologie', desc: 'Examen au microscope des globules rouges pour chercher un parasite (paludisme, anémie falciforme).', options: ['Négatif (pas de parasite)', 'Positif (Plasmodium détecté)', 'Drépanocytes présents', 'Non réalisé'] },
  'Goutte épaisse':         { type: 'microbiologie', desc: 'Technique de référence pour détecter le paludisme au microscope.', options: ['Négatif', 'Positif (Plasmodium présent)', 'Non réalisé'] },

  // ── Imagerie ──────────────────────────────────────────────────────────────
  'Radio':                  { type: 'imagerie', desc: 'Radiographie — image par rayons X des os ou organes.', options: ['Normal', 'Anomalie détectée', 'Non réalisé'] },
  'Radiographie':           { type: 'imagerie', desc: 'Image par rayons X. Montre les os, les poumons et certains organes.', options: ['Normal', 'Anomalie détectée', 'Non réalisé'] },
  'Radio pulmonaire':       { type: 'imagerie', desc: 'Radiographie des poumons. Détecte pneumonie, tuberculose, épanchement pleural.', options: ['Normal', 'Infiltrat (infection)', 'Épanchement pleural', 'Opacité suspecte', 'Non réalisé'] },
  'Radio thoracique':       { type: 'imagerie', desc: 'Radiographie du thorax pour évaluer les poumons et le cœur.', options: ['Normal', 'Cardiomégalie (cœur élargi)', 'Opacité pulmonaire', 'Anomalie détectée', 'Non réalisé'] },
  'Échographie':            { type: 'imagerie', desc: 'Examen par ultrasons, sans rayons X. Visualise les organes internes (foie, reins, vésicule...).', options: ['Normal', 'Anomalie détectée', 'Non réalisé'] },
  'Échographie abdominale': { type: 'imagerie', desc: 'Visualise les organes du ventre : foie, reins, vésicule biliaire, rate, pancréas.', options: ['Normal', 'Lithiase vésiculaire (calculs)', 'Hépatomégalie (foie gros)', 'Anomalie détectée', 'Non réalisé'] },
  'Échographie pelvienne':  { type: 'imagerie', desc: 'Visualise les organes du bassin : utérus, ovaires (femme), prostate (homme), vessie.', options: ['Normal', 'Masse détectée', 'Kyste ovarien', 'Anomalie utérine', 'Non réalisé'] },
  'Échographie pelvienne endo-vaginale': { type: 'imagerie', desc: 'Échographie interne par voie vaginale — image plus précise de l\'utérus et des ovaires. Indolore.', options: ['Normal', 'Endomètre épaissi', 'Kyste ovarien', 'Masse suspecte', 'Non réalisé'] },
  'Échographie cardiaque':  { type: 'imagerie', desc: 'Visualise le cœur en mouvement (échocardiographie). Évalue la fonction cardiaque.', options: ['Normal', 'Insuffisance valvulaire', 'Dilatation cardiaque', 'Anomalie détectée', 'Non réalisé'] },
  'Échographie thyroïdienne': { type: 'imagerie', desc: 'Visualise la glande thyroïde pour détecter nodules ou gonflements.', options: ['Normal', 'Nodule détecté', 'Goitre (thyroïde élargie)', 'Non réalisé'] },
  'Scanner':                { type: 'imagerie', desc: 'Tomodensitométrie (TDM) — images détaillées en coupe. Plus précis que la radio.', options: ['Normal', 'Anomalie détectée', 'Non réalisé'] },
  'TDM':                    { type: 'imagerie', desc: 'Scanner (tomodensitométrie). Images très détaillées des organes en coupes transversales.', options: ['Normal', 'Anomalie détectée', 'Non réalisé'] },
  'IRM':                    { type: 'imagerie', desc: 'Imagerie par résonance magnétique — très précise, sans rayons X. Idéale pour le cerveau, les articulations, les tissus mous.', options: ['Normal', 'Anomalie détectée', 'Non réalisé'] },
  'IRM pelvienne':          { type: 'imagerie', desc: 'IRM du bassin — examen de référence pour les maladies de l\'utérus, des ovaires et de la prostate.', options: ['Normal', 'Endométriose suspectée', 'Masse pelvienne', 'Anomalie détectée', 'Non réalisé'] },
  'IRM cérébrale':          { type: 'imagerie', desc: 'IRM du cerveau — détecte AVC, tumeurs, inflammation, sclérose en plaques.', options: ['Normal', 'Lésion ischémique (AVC)', 'Masse suspecte', 'Plaques de démyélinisation', 'Non réalisé'] },
  'IRM rachis':             { type: 'imagerie', desc: 'IRM de la colonne vertébrale — évalue hernie discale, compression médullaire.', options: ['Normal', 'Hernie discale', 'Compression nerveuse', 'Anomalie détectée', 'Non réalisé'] },
  'Coloscopie':             { type: 'imagerie', desc: 'Examen visuel de l\'intérieur du côlon avec une caméra. Recherche polypes, cancer, inflammation.', options: ['Normal', 'Polypes détectés', 'Inflammation (MICI)', 'Masse suspecte', 'Non réalisé'] },
  'Fibroscopie gastrique':  { type: 'imagerie', desc: 'Examen visuel de l\'estomac et de l\'œsophage. Détecte ulcères, gastrite, cancer.', options: ['Normal', 'Ulcère gastrique', 'Gastrite', 'Anomalie détectée', 'Non réalisé'] },
  'Fond d\'œil':            { type: 'imagerie', desc: 'Examen de la rétine — détecte complications du diabète, hypertension, glaucome.', options: ['Normal', 'Rétinopathie diabétique', 'Papillœdème (HTA)', 'Anomalie détectée', 'Non réalisé'] },
  'ECG':                    { type: 'imagerie', desc: 'Électrocardiogramme — enregistre l\'activité électrique du cœur. Détecte arythmies, infarctus.', options: ['Normal (rythme sinusal)', 'Fibrillation auriculaire', 'Bloc de branche', 'Sus-décalage ST (infarctus)', 'Anomalie détectée', 'Non réalisé'] },
  'EEG':                    { type: 'imagerie', desc: 'Électroencéphalogramme — enregistre l\'activité du cerveau. Utilisé pour l\'épilepsie.', options: ['Normal', 'Anomalie épileptiforme', 'Non réalisé'] },
  'Spirométrie':            { type: 'imagerie', desc: 'Mesure de la capacité pulmonaire. Confirme l\'asthme ou la BPCO.', options: ['Normal', 'Syndrome obstructif (asthme/BPCO)', 'Syndrome restrictif', 'Non réalisé'] },

  // ── Anatomopathologie / biopsies ──────────────────────────────────────────
  'Biopsie':                { type: 'qualitatif', desc: 'Prélèvement d\'un fragment de tissu analysé au microscope. Permet de confirmer ou exclure un cancer.', options: ['Bénin (non cancéreux)', 'Malin (cancéreux)', 'Inflammation', 'Non concluant', 'Non réalisé'] },
  'Cytologie':              { type: 'qualitatif', desc: 'Analyse des cellules (frottis cervical, expectoration...). Recherche de cellules anormales.', options: ['Normal (cellules saines)', 'Cellules atypiques', 'Cellules malignes suspectes', 'Non réalisé'] },
  'Frottis cervico-vaginal': { type: 'qualitatif', desc: 'Dépistage du cancer du col de l\'utérus. Analyse des cellules du col.', options: ['Normal', 'ASCUS (atypie légère)', 'Lésion de bas grade', 'Lésion de haut grade', 'Non réalisé'] },
  'Anatomopathologie':      { type: 'qualitatif', desc: 'Analyse microscopique d\'un tissu prélevé. Résultat définitif sur la nature d\'une lésion.', options: ['Bénin', 'Malin', 'Inflammation chronique', 'Non réalisé'] },
}

function findGuide(name) {
  if (!name) return null
  if (ANALYSES_GUIDE[name]) return ANALYSES_GUIDE[name]
  const norm = normalizeStr(name)
  for (const [key, guide] of Object.entries(ANALYSES_GUIDE)) {
    const kn = normalizeStr(key)
    if (norm === kn) return guide
    if (norm.includes(kn) || kn.includes(norm)) return guide
  }
  return null
}

function isQualitativeAbnormal(value) {
  if (!value) return false
  const v = value.toLowerCase()
  return v.includes('positif') || v.includes('présent') || v.includes('anormal') ||
    v.includes('anomalie') || v.includes('malin') || v.includes('pathogène') ||
    v.includes('bactérie') || v.includes('détecté') || v.includes('sus-décalage') ||
    v.includes('insuffisance') || v.includes('lésion') || v.includes('masse') ||
    v.includes('haut grade') || v.includes('fibrill') || v.includes('bloc de') ||
    v.includes('compression') || v.includes('hernie') || v.includes('épilept')
}

// Accent-normalisation helper
function normalizeStr(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Case-insensitive lookup with partial-match fallback
function findNorm(name) {
  if (!name) return null
  if (ANALYSES_NORMS[name] !== undefined) return ANALYSES_NORMS[name]
  const lower = name.toLowerCase()
  // Exact case-insensitive match
  const exactKey = Object.keys(ANALYSES_NORMS).find(k => k.toLowerCase() === lower)
  if (exactKey !== undefined) return ANALYSES_NORMS[exactKey]
  // Accent-normalized exact match
  const norm = normalizeStr(name)
  const normKey = Object.keys(ANALYSES_NORMS).find(k => normalizeStr(k) === norm)
  if (normKey !== undefined) return ANALYSES_NORMS[normKey]
  // Partial match: analysis name contains a known key or vice versa
  const partialKey = Object.keys(ANALYSES_NORMS).find(k => {
    const kn = normalizeStr(k)
    return norm.includes(kn) || kn.includes(norm)
  })
  return partialKey !== undefined ? ANALYSES_NORMS[partialKey] : null
}

function isAbnormal(name, value) {
  const norm = findNorm(name)
  if (!norm || value === '' || value === null || value === undefined) return false
  const v = parseFloat(value)
  return !isNaN(v) && (v < norm.min || v > norm.max)
}

// ─── Urgency helpers ──────────────────────────────────────────────────────────
const URGENCY_STYLE = {
  élevée: 'bg-red-50 border-red-200 text-red-800',
  modérée: 'bg-amber-50 border-amber-200 text-amber-800',
  faible: 'bg-emerald-50 border-emerald-200 text-emerald-800',
}
const URGENCY_BADGE = {
  élevée: 'danger',
  modérée: 'warning',
  faible: 'success',
}
function urgencyStyle(u) { return URGENCY_STYLE[u] || URGENCY_STYLE.faible }
function urgencyBadge(u) { return URGENCY_BADGE[u] || 'default' }

// ─── Exam grouping helper ─────────────────────────────────────────────────────
function buildGroupedExams(diagnostics) {
  if (!diagnostics?.length) return { commonExams: [], groups: [] }

  // Count how many diseases mention each exam
  const examCount = {}
  diagnostics.forEach(d => {
    ;(d.examens_recommandes || []).forEach(e => {
      examCount[e] = (examCount[e] || 0) + 1
    })
  })

  // Exams shared by 2+ diseases → common block
  const commonExamSet = new Set(
    Object.entries(examCount).filter(([, c]) => c >= 2).map(([e]) => e)
  )

  // Per-disease groups (only their exclusive exams)
  const groups = diagnostics
    .map(d => ({
      maladie: d.maladie,
      score: Math.round(d.score),
      urgence: d.urgence,
      exams: (d.examens_recommandes || []).filter(e => !commonExamSet.has(e)),
      isWeak: d.score < 10,
    }))
    .filter(g => g.exams.length > 0)

  return { commonExams: [...commonExamSet], groups }
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Patient & Symptômes', 'Diagnostic préliminaire', 'Analyses & Affinage', 'Validation finale']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className={`flex items-center gap-2 ${i < steps.length - 1 ? 'flex-1' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              i < step ? 'bg-indigo-600 text-white' :
              i === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
              'bg-slate-100 text-slate-400'
            }`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 mx-2 ${i < step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── PDF generation ──────────────────────────────────────────────────────────
function generatePDF({ patient, motif, symptoms, analyses, diagnostics, finalDiag, notes, medecin, validated }) {
  const printWin = window.open('', '_blank', 'width=860,height=1050')
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const URGENCY_COLORS = {
    critique: { bg:'#fef2f2', border:'#fca5a5', text:'#b91c1c', dot:'#ef4444' },
    élevée:   { bg:'#fff7ed', border:'#fdba74', text:'#c2410c', dot:'#f97316' },
    modérée:  { bg:'#fffbeb', border:'#fcd34d', text:'#b45309', dot:'#f59e0b' },
    faible:   { bg:'#f0fdf4', border:'#86efac', text:'#15803d', dot:'#22c55e' },
  }
  const urg  = URGENCY_COLORS[finalDiag?.urgence] || { bg:'#f8fafc', border:'#e2e8f0', text:'#475569', dot:'#94a3b8' }
  const initials = patient
    ? ((patient.prenom?.[0] || '') + (patient.nom?.[0] || '')).toUpperCase()
    : '?'

  printWin.document.write(`<!DOCTYPE html><html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport médical — ${patient ? patient.prenom + ' ' + patient.nom : 'Consultation'}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @page { size:A4; margin:0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter','Segoe UI',Arial,sans-serif; font-size:11px; color:#1a2332; background:#fff; }

  /* ── Header ── */
  .hdr { background:linear-gradient(135deg,#0f2557 0%,#1e3a8a 45%,#2563eb 100%); padding:22px 40px 18px; color:white; }
  .hdr-inner { display:flex; justify-content:space-between; align-items:center; }
  .brand { display:flex; align-items:center; gap:12px; }
  .brand-icon { width:40px; height:40px; background:rgba(255,255,255,0.13); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:900; color:white; border:1px solid rgba(255,255,255,0.15); }
  .brand-name { font-size:19px; font-weight:800; letter-spacing:-0.5px; }
  .brand-sub { font-size:8px; opacity:0.55; text-transform:uppercase; letter-spacing:2px; margin-top:1px; }
  .doc-meta { text-align:right; }
  .doc-type { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:2px; opacity:0.9; }
  .doc-date { font-size:10px; opacity:0.55; margin-top:3px; }
  .doc-dr   { font-size:11px; font-weight:700; margin-top:3px; opacity:0.8; }

  /* ── Info strip ── */
  .strip { background:#f8fafc; border-bottom:1px solid #e2e8f0; padding:8px 40px; display:flex; align-items:center; gap:22px; }
  .strip-item {}
  .sl { font-size:7.5px; text-transform:uppercase; letter-spacing:0.9px; color:#94a3b8; font-weight:700; margin-bottom:1px; }
  .sv { font-size:11px; font-weight:700; color:#1e293b; }
  .ssep { width:1px; height:24px; background:#e2e8f0; }

  /* ── Confidential banner ── */
  .confid { background:#fef3c7; border-bottom:1px solid #fde68a; padding:4px 40px; font-size:9px; color:#78350f; font-weight:700; letter-spacing:0.3px; }

  /* ── Body ── */
  .body { padding:20px 40px 8px; }
  .section { margin-bottom:16px; }
  .section-hd { display:flex; align-items:center; gap:7px; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #e2e8f0; }
  .accent { width:3px; height:14px; background:#2563eb; border-radius:2px; flex-shrink:0; }
  .section-hd h2 { font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:#1e40af; }

  /* ── Patient card ── */
  .pt-card { border:1.5px solid #dbeafe; border-radius:8px; overflow:hidden; }
  .pt-hd { background:linear-gradient(90deg,#eff6ff,#dbeafe); padding:10px 14px; border-bottom:1px solid #bfdbfe; display:flex; align-items:center; gap:10px; }
  .avatar { width:34px; height:34px; border-radius:50%; background:#2563eb; color:white; font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .pt-name { font-size:14px; font-weight:800; color:#1e3a8a; }
  .pt-code { font-family:monospace; font-size:9.5px; color:#3b82f6; margin-top:1px; }
  .pt-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; }
  .pg { padding:8px 14px; border-right:1px solid #e2e8f0; }
  .pg:nth-child(4n), .pg:last-child { border-right:none; }
  .pgl { font-size:7.5px; text-transform:uppercase; letter-spacing:0.8px; color:#94a3b8; font-weight:700; margin-bottom:2px; }
  .pgv { font-size:11px; font-weight:600; color:#1e293b; }
  .allergy { padding:7px 14px; background:#fef2f2; border-top:1px solid #fecaca; display:flex; align-items:center; gap:6px; font-size:10px; color:#dc2626; font-weight:700; }

  /* ── Motif ── */
  .motif-box { background:#f8fafc; border:1px solid #e2e8f0; border-left:3px solid #2563eb; border-radius:0 6px 6px 0; padding:9px 12px; font-size:11px; line-height:1.55; color:#334155; }

  /* ── Pills ── */
  .pills { display:flex; flex-wrap:wrap; gap:4px; }
  .pill { display:inline-flex; align-items:center; padding:3px 9px; border-radius:20px; font-size:9.5px; font-weight:600; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; }
  .pill-a { background:#f0fdf4; border-color:#86efac; color:#15803d; }

  /* ── Analyses table ── */
  .tbl { width:100%; border-collapse:collapse; font-size:10px; }
  .tbl th { background:#f8fafc; padding:5px 10px; text-align:left; font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#64748b; border-bottom:1px solid #e2e8f0; }
  .tbl td { padding:5px 10px; border-bottom:1px solid #f1f5f9; }
  .tbl tr:last-child td { border-bottom:none; }
  .ok  { color:#16a34a; font-weight:700; }
  .nok { color:#dc2626; font-weight:700; }

  /* ── Diagnostic principal ── */
  .diag-main { border-radius:10px; overflow:hidden; border:1.5px solid #bfdbfe; margin-bottom:10px; }
  .diag-hd { background:linear-gradient(90deg,#0f2557,#1e40af); padding:14px 18px; color:white; }
  .diag-rank { font-size:8px; text-transform:uppercase; letter-spacing:2px; opacity:0.55; margin-bottom:4px; font-weight:700; }
  .diag-name { font-size:17px; font-weight:800; letter-spacing:-0.3px; line-height:1.2; }
  .diag-badges { display:flex; align-items:center; gap:8px; margin-top:8px; flex-wrap:wrap; }
  .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:9.5px; font-weight:700; border:1px solid; }
  .badge-ok  { background:rgba(16,185,129,0.2); border-color:rgba(16,185,129,0.35); color:#6ee7b7; }
  .badge-alt { background:rgba(245,158,11,0.2);  border-color:rgba(245,158,11,0.35);  color:#fcd34d; }
  /* ── Notes ── */
  .notes-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 12px; font-size:10.5px; color:#334155; line-height:1.6; white-space:pre-wrap; }

  /* ── Disclaimer ── */
  .disclaimer { margin:14px 40px 0; background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:9px 14px; font-size:9.5px; color:#78350f; line-height:1.5; }

  /* ── Footer ── */
  .footer { margin-top:14px; padding:10px 40px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; font-size:9px; color:#94a3b8; }
  .sig { display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
  .sig-line { width:110px; height:1px; background:#e2e8f0; margin-bottom:3px; }

  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>

<div class="hdr">
  <div class="hdr-inner">
    <div class="brand">
      <div class="brand-icon">+</div>
      <div>
        <div class="brand-name">MediDiag</div>
        <div class="brand-sub">Système hospitalier de diagnostic assisté par IA</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Rapport de consultation</div>
      <div class="doc-date">${dateStr} &nbsp;·&nbsp; ${timeStr}</div>
      ${medecin ? `<div class="doc-dr">Dr. ${medecin.prenom} ${medecin.nom}</div>` : ''}
    </div>
  </div>
</div>

<div class="strip">
  ${medecin ? `<div class="strip-item"><div class="sl">Médecin traitant</div><div class="sv">Dr. ${medecin.prenom} ${medecin.nom}</div></div><div class="ssep"></div>` : ''}
  <div class="strip-item"><div class="sl">Date</div><div class="sv">${new Date().toLocaleDateString('fr-FR')}</div></div>
  <div class="ssep"></div>
  <div class="strip-item"><div class="sl">Référence patient</div><div class="sv">${patient?.code_patient || 'Anonyme'}</div></div>
  <div class="ssep"></div>
  <div class="strip-item"><div class="sl">Rapport généré</div><div class="sv">${new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</div></div>
</div>

<div class="confid">DOCUMENT CONFIDENTIEL — Réservé aux professionnels de santé autorisés — Ne pas diffuser</div>

<div class="body">

<!-- PATIENT -->
<div class="section">
  <div class="section-hd"><div class="accent"></div><h2>Identité du patient</h2></div>
  ${patient ? `
  <div class="pt-card">
    <div class="pt-hd">
      <div class="avatar">${initials}</div>
      <div>
        <div class="pt-name">${patient.prenom} ${patient.nom}</div>
        <div class="pt-code">${patient.code_patient || 'Code non assigné'}</div>
      </div>
    </div>
    <div class="pt-grid">
      <div class="pg"><div class="pgl">Date de naissance</div><div class="pgv">${patient.date_naissance ? new Date(patient.date_naissance).toLocaleDateString('fr-FR') : '—'}</div></div>
      <div class="pg"><div class="pgl">Sexe</div><div class="pgv">${patient.sexe === 'M' ? 'Masculin' : 'Féminin'}</div></div>
      <div class="pg"><div class="pgl">Groupe sanguin</div><div class="pgv">${patient.groupe_sanguin || '—'}</div></div>
      <div class="pg"><div class="pgl">Téléphone</div><div class="pgv">${patient.telephone || '—'}</div></div>
    </div>
    ${patient.allergies ? `<div class="allergy">ALLERGIE CONNUE &mdash; ${patient.allergies}</div>` : ''}
  </div>` : `<p style="font-size:11px;color:#64748b;font-style:italic">Consultation anonyme — aucun dossier patient associé</p>`}
</div>

<!-- MOTIF -->
<div class="section">
  <div class="section-hd"><div class="accent"></div><h2>Motif de consultation</h2></div>
  <div class="motif-box">${motif || 'Non renseigné'}</div>
</div>

<!-- SYMPTOMES -->
<div class="section">
  <div class="section-hd"><div class="accent"></div><h2>Symptômes présentés (${(symptoms || []).length})</h2></div>
  <div class="pills">
    ${(symptoms || []).map(s => `<span class="pill">${s}</span>`).join('')}
    ${(symptoms || []).length === 0 ? '<span style="font-size:11px;color:#94a3b8;font-style:italic">Aucun symptôme renseigné</span>' : ''}
  </div>
</div>

<!-- ANALYSES -->
${Object.keys(analyses || {}).length > 0 ? `
<div class="section">
  <div class="section-hd"><div class="accent"></div><h2>Résultats biologiques et examens (${Object.keys(analyses).length})</h2></div>
  <table class="tbl">
    <thead><tr><th>Examen / Analyse</th><th>Résultat</th><th>Interprétation</th></tr></thead>
    <tbody>
      ${Object.entries(analyses).map(([name, val]) => {
        const strVal = String(val || '').trim()
        const abnormal = strVal.toLowerCase().includes('positif') || strVal.toLowerCase().includes('anormal') || strVal.toLowerCase().includes('anomalie') || strVal.toLowerCase().includes('détecté')
        return `<tr><td style="font-weight:600">${name}</td><td>${strVal || '—'}</td><td class="${abnormal ? 'nok' : 'ok'}">${abnormal ? 'Anormal' : (strVal ? 'Normal / Renseigné' : 'Non réalisé')}</td></tr>`
      }).join('')}
    </tbody>
  </table>
</div>` : ''}

<!-- DIAGNOSTIC RETENU -->
<div class="section">
  <div class="section-hd"><div class="accent"></div><h2>Diagnostic retenu</h2></div>
  ${finalDiag ? `
  <div class="diag-main">
    <div class="diag-hd">
      <div class="diag-rank">Diagnostic principal retenu</div>
      <div class="diag-name">${finalDiag.maladie}</div>
      <div class="diag-badges">
        ${finalDiag.urgence ? `<span class="badge" style="background:${urg.bg}22;border-color:${urg.dot}50;color:${urg.dot}">Urgence : ${finalDiag.urgence}</span>` : ''}
        ${validated ? `<span class="badge badge-ok">Confirmé par le médecin</span>` : `<span class="badge badge-alt">Diagnostic alternatif proposé</span>`}
      </div>
    </div>
  </div>
  ` : `<p style="font-size:11px;color:#64748b;font-style:italic">Diagnostic non renseigné</p>`}
</div>

<!-- NOTES -->
${notes ? `
<div class="section">
  <div class="section-hd"><div class="accent"></div><h2>Observations et notes du médecin</h2></div>
  <div class="notes-box">${notes}</div>
</div>` : ''}

</div>

<div class="disclaimer">
  Avertissement médico-légal : Ce rapport est une aide à la décision clinique produite par un système d'intelligence artificielle (précision validée à 90,7 %). Il ne se substitue pas au jugement clinique du praticien, ni à un examen médical complet. Toute décision thérapeutique demeure sous la responsabilité exclusive du professionnel de santé.
</div>

<div class="footer">
  <div>
    <div>MediDiag &mdash; Rapport généré le ${new Date().toLocaleString('fr-FR')}</div>
    <div style="margin-top:2px">Réf. patient : ${patient?.code_patient || 'Anonyme'} &nbsp;|&nbsp; Usage professionnel uniquement</div>
  </div>
  <div class="sig">
    <div class="sig-line"></div>
    <div>Signature &amp; cachet du médecin</div>
    ${medecin ? `<div style="font-weight:700;color:#1e293b;margin-top:1px">Dr. ${medecin.prenom} ${medecin.nom}</div>` : ''}
  </div>
</div>

<script>window.onload = () => window.print()</script>
</body></html>`)
  printWin.document.close()
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Consultation() {
  const { user } = useAuth()
  const location = useLocation()

  // Step: 0=patient+symptômes, 1=diagnostic préliminaire, 2=analyses+affinage, 3=validation finale
  const [step, setStep] = useState(0)

  // Custom analyse entry (doctor's own)
  const [customAnalyseName, setCustomAnalyseName] = useState('')
  const [customAnalyseValue, setCustomAnalyseValue] = useState('')

  // Patient
  const [patientCode, setPatientCode] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [searchingPatient, setSearchingPatient] = useState(false)
  const [patientError, setPatientError] = useState('')
  const [patientsList, setPatientsList] = useState([])
  const [patientSearch, setPatientSearch] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const patientDropdownRef = useRef(null)

  // Form data
  const [motif, setMotif] = useState('')
  const [symptoms, setSymptoms] = useState([])
  const [analyses, setAnalyses] = useState({})
  const [age, setAge] = useState('')
  const [sexe, setSexe] = useState('M')

  // Suggestions
  const [symptomsSuggestions, setSymptomsSuggestions] = useState([])
  const [analysesSuggestions, setAnalysesSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)

  // Diagnostic results
  const [loading, setLoading] = useState(false)
  const [prelimResults, setPrelimResults] = useState(null) // step 1
  const [finalResults, setFinalResults] = useState(null)   // step 3 (after analyses)
  const [recommendedAnalyses, setRecommendedAnalyses] = useState([])
  const [loadingReco, setLoadingReco] = useState(false)
  const [analysesMetadata, setAnalysesMetadata] = useState({})

  // Validation
  const [validationChoice, setValidationChoice] = useState(null) // 'confirm' | 'alternative'
  const [alternativeDiag, setAlternativeDiag] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedData, setSavedData] = useState(null)
  const [error, setError] = useState('')
  const [symptomWarning, setSymptomWarning] = useState('')
  const [sessionRestored, setSessionRestored] = useState(false)
  const [showWeakExams, setShowWeakExams] = useState(false)

  // Motif NLP parsing
  const [parsedMotif, setParsedMotif] = useState(null)   // structured result from backend parser
  const [parsingMotif, setParsingMotif] = useState(false)
  const motifDebounceRef = useRef(null)

  useEffect(() => {
    loadSuggestions()

    // Restore previous session if any
    const sessionRaw = sessionStorage.getItem(SESSION_KEY)
    let restored = false
    if (sessionRaw) {
      try {
        const s = JSON.parse(sessionRaw)
        if (s.step > 0 || (s.symptoms && s.symptoms.length > 0) || s.motif) {
          setStep(s.step || 0)
          if (s.patientCode) setPatientCode(s.patientCode)
          if (s.selectedPatient) setSelectedPatient(s.selectedPatient)
          if (s.motif) setMotif(s.motif)
          if (s.symptoms) setSymptoms(s.symptoms)
          if (s.analyses) setAnalyses(s.analyses)
          if (s.age != null) setAge(s.age)
          if (s.sexe) setSexe(s.sexe)
          if (s.prelimResults) setPrelimResults(s.prelimResults)
          if (s.finalResults) setFinalResults(s.finalResults)
          if (s.recommendedAnalyses) setRecommendedAnalyses(s.recommendedAnalyses)
          if (s.validationChoice) setValidationChoice(s.validationChoice)
          if (s.alternativeDiag) setAlternativeDiag(s.alternativeDiag)
          if (s.notes) setNotes(s.notes)
          if (s.saved) setSaved(s.saved)
          if (s.savedData) setSavedData(s.savedData)
          restored = true
          setSessionRestored(true)
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY)
      }
    }

    if (!restored) {
      const navState = location.state
      if (navState?.patientCode) setPatientCode(navState.patientCode)
    }
  }, [])

  // Save session to sessionStorage on every meaningful state change
  useEffect(() => {
    if (step > 0 || symptoms.length > 0 || motif || selectedPatient) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        step, patientCode, selectedPatient, motif, symptoms, analyses,
        age, sexe, prelimResults, finalResults, recommendedAnalyses,
        validationChoice, alternativeDiag, notes, saved, savedData,
      }))
    }
  }, [step, symptoms, analyses, motif, selectedPatient, age, sexe,
      prelimResults, finalResults, recommendedAnalyses,
      validationChoice, alternativeDiag, notes, saved, savedData])

  useEffect(() => {
    if (patientCode && location.state?.patientCode === patientCode) {
      searchPatient()
    }
  }, [patientCode])

  // Debounced motif parsing (600 ms after last keystroke)
  useEffect(() => {
    if (motifDebounceRef.current) clearTimeout(motifDebounceRef.current)
    if (!motif || motif.trim().length < 8) {
      setParsedMotif(null)
      return
    }
    motifDebounceRef.current = setTimeout(async () => {
      setParsingMotif(true)
      try {
        const res = await diagnosticApi.parseMotif(motif.trim(), sexe)
        if (res.success) {
          const d = res.data?.data || res.data
          // Only show card if something meaningful was found
          if (d.temporalite !== 'inconnue' || d.symptomes_extraits.length > 0 || d.symptomes_absents.length > 0) {
            setParsedMotif(d)
          } else {
            setParsedMotif(null)
          }
        }
      } catch {
        // silent — parsing is best-effort
      } finally {
        setParsingMotif(false)
      }
    }, 600)
    return () => clearTimeout(motifDebounceRef.current)
  }, [motif, sexe])

  const loadSuggestions = async () => {
    try {
      const [sr, ar, pr] = await Promise.all([
        metadataApi.getSymptoms(),
        metadataApi.getAnalyses(),
        patientApi.getPatients({ limit: 200 }),
      ])
      if (sr.success) {
        const d = sr.data?.data || sr.data
        setSymptomsSuggestions(d?.symptoms || [])
      }
      if (ar.success) {
        const d = ar.data?.data || ar.data
        setAnalysesSuggestions(Array.isArray(d?.analyses) ? d.analyses : [])
      }
      if (pr.success) {
        const d = pr.data?.data || pr.data
        setPatientsList(d?.patients || [])
      }
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target)) {
        setShowPatientDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const searchPatient = async () => {
    if (!patientCode.trim()) { setPatientError('Entrez un code patient'); return }
    setSearchingPatient(true)
    setPatientError('')
    try {
      const res = await patientApi.getPatientByCode(patientCode.trim())
      if (res.success) {
        const p = res.data?.data || res.data
        if (p?.id) {
          setSelectedPatient(p)
          setAge(calculateAge(p.date_naissance))
          setSexe(p.sexe)
        } else {
          setPatientError('Patient non trouvé')
        }
      } else {
        setPatientError('Patient non trouvé')
      }
    } catch {
      setPatientError('Erreur lors de la recherche')
    } finally {
      setSearchingPatient(false)
    }
  }

  // Step 0 → Step 1: premier diagnostic
  const launchPreliminary = async () => {
    if (symptoms.length === 0) { setError('Ajoutez au moins un symptôme'); return }
    if (!motif.trim()) { setError('Le motif de consultation est requis'); return }
    if (!selectedPatient && (age === 0 || age === '' || age === null)) {
      setError("L'âge du patient est requis — entrez un âge valide ou recherchez un patient par code.")
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await diagnosticApi.performDiagnostic({
        age, sexe, symptomes: symptoms, analyses: {},
        temporalite: parsedMotif?.temporalite || undefined,
        symptomes_absents: parsedMotif?.symptomes_absents?.length ? parsedMotif.symptomes_absents : undefined,
      })
      if (res.success) {
        const data = res.data?.data || res.data
        if (!data.diagnostics || data.diagnostics.length === 0) {
          setError('Aucun résultat — vérifiez les symptômes saisis.')
          return
        }
        setPrelimResults(data)
        setRecommendedAnalyses(buildGroupedExams(data.diagnostics))
        setStep(1)
      } else {
        setError(res.error || 'Erreur lors du diagnostic')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Load exam classification metadata from the backend (best-effort, called when step 1 is reached)
  const loadExaminationsMetadata = useCallback(async () => {
    if (symptoms.length === 0) return
    try {
      const res = await diagnosticApi.getRecommendedExaminations({
        age: age || 30, sexe, symptomes: symptoms,
      })
      if (res.success) {
        const d = res.data?.data || res.data
        const meta = {}
        for (const a of (d.analyses || [])) {
          meta[a.name] = a
        }
        setAnalysesMetadata(meta)
      }
    } catch {
      // best-effort — UI still works without metadata
    }
  }, [age, sexe, symptoms])

  useEffect(() => {
    if (step === 1) loadExaminationsMetadata()
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // Step 2 → Step 3: diagnostic final avec analyses
  const launchFinal = async () => {
    setLoading(true)
    setError('')
    try {
      // Build cleaned analyses (numeric or text) + anomalies list
      const cleanedAnalyses = {}
      const anomalies = []
      for (const [name, rawValue] of Object.entries(analyses)) {
        if (rawValue === '' || rawValue === null || rawValue === undefined) continue
        const numVal = parseFloat(rawValue)
        const norm = findNorm(name)
        if (!isNaN(numVal)) {
          cleanedAnalyses[name] = numVal
          if (norm && (numVal < norm.min || numVal > norm.max)) anomalies.push(name)
        } else {
          // Text result (e.g. "Positif", "Négatif")
          const str = String(rawValue).trim()
          cleanedAnalyses[name] = str
          const low = str.toLowerCase()
          if (!norm && (low.includes('positif') || low.includes('présent') || low === '+' || low.includes('anormal'))) {
            anomalies.push(name)
          }
        }
      }
      const res = await diagnosticApi.performDiagnostic({
        age, sexe, symptomes: symptoms,
        analyses: cleanedAnalyses,
        analyses_anomalies: anomalies.length > 0 ? anomalies : undefined,
        temporalite: parsedMotif?.temporalite || undefined,
        symptomes_absents: parsedMotif?.symptomes_absents?.length ? parsedMotif.symptomes_absents : undefined,
      })
      if (res.success) {
        const data = res.data?.data || res.data
        if (!data.diagnostics || data.diagnostics.length === 0) {
          setError('Aucun résultat — vérifiez les données saisies.')
          return
        }
        setFinalResults(data)
        setStep(3)
      } else {
        setError(res.error || 'Erreur')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const addCustomAnalyse = () => {
    const name = customAnalyseName.trim()
    const value = customAnalyseValue.trim()
    if (!name) return
    setAnalyses(prev => ({ ...prev, [name]: value }))
    setCustomAnalyseName('')
    setCustomAnalyseValue('')
  }

  const _containsSexKeyword = (symptom, keywordSet) => {
    const sNorm = symptom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
    for (const kw of keywordSet) {
      const kwNorm = kw.normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (sNorm === kwNorm) return true
      // partial match: symptom contains a keyword fragment of 6+ chars
      const parts = kwNorm.split(' ').filter(p => p.length >= 6)
      if (parts.some(p => sNorm.includes(p))) return true
    }
    return false
  }

  // Add symptom with sex-coherence check
  const addSymptom = (s) => {
    if (!s || symptoms.includes(s)) return
    if (sexe === 'M' && _containsSexKeyword(s, FEMALE_ONLY_SYMPTOMS)) {
      setSymptomWarning(`⚠ "${s}" contient un terme féminin — vérifiez le sexe du patient.`)
      setTimeout(() => setSymptomWarning(''), 6000)
    } else if (sexe === 'F' && _containsSexKeyword(s, MALE_ONLY_SYMPTOMS)) {
      setSymptomWarning(`⚠ "${s}" contient un terme masculin — vérifiez le sexe du patient.`)
      setTimeout(() => setSymptomWarning(''), 6000)
    } else {
      setSymptomWarning('')
    }
    setSymptoms(prev => [...prev, s])
  }

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patientsList.slice(0, 8)
    const q = patientSearch.toLowerCase()
    return patientsList
      .filter(p =>
        `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
        (p.code_patient || '').toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [patientsList, patientSearch])

  const selectPatient = (p) => {
    setSelectedPatient(p)
    setAge(calculateAge(p.date_naissance))
    setSexe(p.sexe)
    setPatientCode(p.code_patient)
    setPatientSearch('')
    setShowPatientDropdown(false)
    setPatientError('')
  }

  const currentDiags = (step >= 3 ? finalResults : prelimResults)?.diagnostics || []
  const topDiag = currentDiags[0]

  // Final validation + save
  const handleValidate = async () => {
    if (!selectedPatient) { setError('Sélectionnez un patient pour enregistrer'); return }
    if (!validationChoice) { setError('Choisissez de valider ou proposer un diagnostic alternatif'); return }

    const isConfirmed = validationChoice === 'confirm'
    const finalDiagName = isConfirmed ? topDiag?.maladie : alternativeDiag
    const finalScore = isConfirmed ? topDiag?.score : null

    setSaving(true)
    setError('')
    try {
      // Save consultation
      const consultRes = await consultationApi.createConsultation({
        patient_id: selectedPatient.id,
        medecin_id: user?.id || 1,
        motif: motif || 'Consultation médicale',
        symptomes: symptoms,
        analyses,
        diagnostic_results: currentDiags,
        notes,
      })

      if (!consultRes.success) {
        setError(consultRes.error || 'Erreur lors de l\'enregistrement')
        return
      }

      const consultId = consultRes.data?.data?.consultation_id || consultRes.data?.consultation_id

      // Save feedback
      if (consultId) {
        await post('/feedback/diagnostic', {
          consultation_id: consultId,
          patient_id: selectedPatient.id,
          diagnostic_ia: topDiag?.maladie || '',
          score_ia: topDiag?.score || 0,
          valide: isConfirmed,
          diagnostic_final: finalDiagName,
          score_final: finalScore,
          commentaire: notes,
        })
      }

      setSavedData({
        consultId,
        finalDiag: { maladie: finalDiagName, score: finalScore },
        validated: isConfirmed,
      })
      setSaved(true)
    } catch {
      setError('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    generatePDF({
      patient: selectedPatient,
      motif,
      symptoms,
      analyses,
      diagnostics: currentDiags,
      finalDiag: savedData?.finalDiag || (topDiag ? { maladie: topDiag.maladie, score: topDiag.score } : null),
      notes,
      medecin: user,
      validated: savedData?.validated,
    })
  }

  const resetAll = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setStep(0); setPrelimResults(null); setFinalResults(null)
    setSymptoms([]); setAnalyses({}); setMotif(''); setNotes('')
    setValidationChoice(null); setAlternativeDiag(''); setSaved(false)
    setSavedData(null); setError(''); setRecommendedAnalyses([])
    setSymptomWarning(''); setSessionRestored(false)
    setSelectedPatient(null); setPatientCode(''); setAge(''); setSexe('M')
    setParsedMotif(null); setAnalysesMetadata({})
  }

  // Accept all extracted symptoms from motif parser
  const acceptExtractedSymptoms = () => {
    if (!parsedMotif?.symptomes_extraits?.length) return
    const toAdd = parsedMotif.symptomes_extraits.filter(s => !symptoms.includes(s))
    if (toAdd.length) setSymptoms(prev => [...prev, ...toAdd])
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Consultation médicale</h1>
        <p className="text-sm text-slate-400 mt-0.5">Diagnostic assisté par intelligence artificielle</p>
      </div>

      <StepBar step={step} />

      {sessionRestored && !saved && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm">
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span>Consultation précédente restaurée — vous reprenez là où vous vous étiez arrêté.</span>
          <button
            onClick={resetAll}
            className="ml-auto text-xs underline hover:no-underline shrink-0"
          >
            Recommencer
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── STEP 0: Patient + Symptômes ─────────────────────────────────── */}
      {step === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            {/* Patient selection */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5 rounded-t-2xl">
                <span className="w-1 h-4 rounded-full bg-blue-500 shrink-0" />
                <h2 className="text-sm font-bold text-slate-800">Patient</h2>
              </div>
              <div className="p-5">
              {!selectedPatient ? (
                <div className="space-y-3" ref={patientDropdownRef}>
                  {/* Combobox */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="Nom, prénom ou code PAT-..."
                          value={patientSearch}
                          onChange={e => { setPatientSearch(e.target.value); setShowPatientDropdown(true) }}
                          onFocus={() => setShowPatientDropdown(true)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && filteredPatients.length > 0) selectPatient(filteredPatients[0])
                            if (e.key === 'Escape') setShowPatientDropdown(false)
                          }}
                        />
                      </div>
                    </div>

                    {/* Dropdown */}
                    {showPatientDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
                        {filteredPatients.length > 0 ? (
                          <>
                            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                              <p className="text-xs text-slate-400">
                                {patientSearch ? `${filteredPatients.length} résultat(s)` : `${patientsList.length} patients — tapez pour filtrer`}
                              </p>
                            </div>
                            <div className="max-h-52 overflow-y-auto">
                              {filteredPatients.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onMouseDown={() => selectPatient(p)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors text-left"
                                >
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                                    {(p.prenom?.[0] || '?').toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                      {p.prenom} {p.nom}
                                    </p>
                                    <p className="text-xs text-slate-400 font-mono">{p.code_patient}</p>
                                  </div>
                                  <div className="text-xs text-slate-400 shrink-0">
                                    {p.sexe} · {calculateAge(p.date_naissance)} ans
                                  </div>
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="px-4 py-6 text-center text-sm text-slate-400">
                            {patientsList.length === 0 ? 'Chargement...' : 'Aucun patient trouvé'}
                          </div>
                        )}
                        <div className="border-t border-slate-100 px-4 py-2.5">
                          <p className="text-xs text-slate-400">
                            Laissez vide pour un diagnostic anonyme
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {patientError && <p className="text-xs text-red-600">{patientError}</p>}
                </div>
              ) : (
                <div className="flex items-start justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {selectedPatient.prenom} {selectedPatient.nom}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedPatient.code_patient} · {age} ans · {sexe === 'M' ? 'Homme' : 'Femme'}
                      </p>
                      {selectedPatient.allergies && (
                        <p className="text-xs text-red-600 font-medium mt-0.5">
                          ⚠ Allergies : {selectedPatient.allergies}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedPatient(null); setPatientCode(''); setAge(''); setSexe('M') }}
                    className="text-slate-400 hover:text-slate-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div></div>

            {/* Age + sexe if no patient */}
            {!selectedPatient && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
                  <span className="w-1 h-4 rounded-full bg-violet-500 shrink-0" />
                  <h2 className="text-sm font-bold text-slate-800">Données patient</h2>
                </div>
                <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Âge</label>
                    <input
                      type="number" min="1" max="120"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      placeholder="ex : 35"
                      value={age}
                      onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Sexe</label>
                    <div className="flex gap-3 mt-2">
                      {['M', 'F'].map(s => (
                        <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" value={s} checked={sexe === s} onChange={() => setSexe(s)} className="accent-indigo-600" />
                          <span className="text-sm">{s === 'M' ? 'Masculin' : 'Féminin'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div></div>
            )}

            {/* Motif */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
                <span className="w-1 h-4 rounded-full bg-emerald-500 shrink-0" />
                <h2 className="text-sm font-bold text-slate-800">
                  Motif de consultation <span className="text-red-500">*</span>
                  {parsingMotif && <Loader2 className="inline-block w-3 h-3 ml-2 animate-spin text-indigo-400" />}
                </h2>
              </div>
              <div className="p-5">
              <textarea
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                rows={3}
                placeholder="Ex : Douleurs pelviennes aiguës depuis 2 jours, saignements vaginaux de couleur sombre, sans fièvre ni écoulement..."
                value={motif}
                onChange={e => setMotif(e.target.value)}
              />

              {/* ── NLP Extraction Card ── */}
              {parsedMotif && (
                <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                      <Sparkles className="w-3.5 h-3.5" />
                      Analyse automatique du motif
                    </div>
                    <button onClick={() => setParsedMotif(null)} className="text-indigo-300 hover:text-indigo-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Temporalité */}
                  {parsedMotif.temporalite !== 'inconnue' && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="text-xs text-indigo-800">
                        Temporalité détectée :{' '}
                        <span className={`font-semibold ${parsedMotif.temporalite === 'aiguë' ? 'text-amber-700' : 'text-purple-700'}`}>
                          {parsedMotif.temporalite}
                        </span>
                        {parsedMotif.filtres_diagnostic?.exclure_chroniques && (
                          <span className="ml-1 text-amber-600">(maladies chroniques pénalisées dans le score)</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Symptômes détectés */}
                  {parsedMotif.symptomes_extraits?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-indigo-700 mb-1.5">
                        Symptômes détectés dans le motif :
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedMotif.symptomes_extraits.map(s => {
                          const alreadyAdded = symptoms.includes(s)
                          return (
                            <button
                              key={s}
                              disabled={alreadyAdded}
                              onClick={() => !alreadyAdded && addSymptom(s)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                                alreadyAdded
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default'
                                  : 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-100 cursor-pointer'
                              }`}
                            >
                              {alreadyAdded ? <CheckCircle className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              {s}
                            </button>
                          )
                        })}
                      </div>
                      {parsedMotif.symptomes_extraits.some(s => !symptoms.includes(s)) && (
                        <button
                          onClick={acceptExtractedSymptoms}
                          className="mt-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                        >
                          Ajouter tous
                        </button>
                      )}
                    </div>
                  )}

                  {/* Symptômes absents explicitement niés */}
                  {parsedMotif.symptomes_absents?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        <Ban className="inline w-3 h-3 mr-1 text-red-400" />
                        Explicitement niés (pris en compte dans le diagnostic) :
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {parsedMotif.symptomes_absents.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-red-50 border border-red-200 text-red-600 line-through">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div></div>
          </div>

          <div className="space-y-5">
            {/* Symptoms */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5 rounded-t-2xl">
                <span className="w-1 h-4 rounded-full bg-indigo-500 shrink-0" />
                <h2 className="text-sm font-bold text-slate-800">
                  Symptômes <span className="text-red-500">*</span>
                  {symptoms.length > 0 && <span className="ml-1 text-indigo-500 font-normal">({symptoms.length} saisis)</span>}
                </h2>
              </div>
              <div className="p-5">
              <Autocomplete
                placeholder="Rechercher un symptôme..."
                suggestions={symptomsSuggestions}
                onSelect={addSymptom}
                loading={loadingSuggestions}
                helperText={`${symptomsSuggestions.length} symptômes disponibles`}
              />
              {symptomWarning && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {symptomWarning}
                </div>
              )}
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {symptoms.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
                      {s}
                      <button onClick={() => setSymptoms(symptoms.filter(x => x !== s))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div></div>

            <Button
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading || symptoms.length === 0}
              onClick={launchPreliminary}
              iconLeft={<Stethoscope className="w-4 h-4" />}
            >
              Lancer le diagnostic préliminaire
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 1: Diagnostic préliminaire ─────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Diagnostic préliminaire</h2>
                <p className="text-xs text-slate-400 mt-0.5">Basé sur les symptômes — top {Math.min(currentDiags.length, 4)} résultats</p>
              </div>
              <Badge variant="info" dot>IA · {symptoms.length} symptôme{symptoms.length > 1 ? 's' : ''}</Badge>
            </div>
            <div className="p-4 space-y-2">
              {currentDiags.slice(0, 4).map((d, i) => (
                <DiagnosticCard key={i} result={d} index={i} />
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Pour affiner le diagnostic</p>
            <p>Le système suggère des analyses biologiques complémentaires. Vous pouvez les passer ou entrer directement les résultats d'analyses disponibles.</p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(0)} iconLeft={<ChevronRight className="w-4 h-4 rotate-180" />}>
              Retour
            </Button>
            <Button variant="primary" onClick={() => setStep(2)} iconLeft={<ChevronRight className="w-4 h-4" />}>
              Passer aux analyses
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Analyses + affinage ──────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

            {/* Left — results entry (wider) */}
            <div className="xl:col-span-3 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-xl">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">Résultats des analyses</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Saisissez les valeurs du laboratoire</p>
                  </div>
                  {Object.keys(analyses).length > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                      {Object.keys(analyses).length} analyse{Object.keys(analyses).length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <Autocomplete
                    placeholder="Rechercher et ajouter une analyse..."
                    suggestions={analysesSuggestions}
                    onSelect={a => { if (a && !(a in analyses)) setAnalyses({ ...analyses, [a]: '' }) }}
                    loading={loadingSuggestions}
                  />

                  {/* Doctor's own analyses */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Analyse du médecin
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nom de l'analyse..."
                        value={customAnalyseName}
                        onChange={e => setCustomAnalyseName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomAnalyse()}
                        className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Résultat..."
                        value={customAnalyseValue}
                        onChange={e => setCustomAnalyseValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomAnalyse()}
                        className="w-32 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <button
                        onClick={addCustomAnalyse}
                        disabled={!customAnalyseName.trim()}
                        className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {Object.keys(analyses).length > 0 ? (
                  <div className="border-t border-slate-100">
                    {/* Table header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <span>Analyse + résultat attendu</span>
                      <span>Statut</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {Object.entries(analyses).map(([name, value]) => {
                        const norm  = findNorm(name)
                        const guide = findGuide(name)
                        const meta  = analysesMetadata[name]

                        // Type resolution: API metadata wins over local lookup
                        const isNumeric = meta?.type_saisie === 'numerique'
                          || (!meta && !!norm && !(guide && guide.type !== 'numerique'))
                        const isQual = !isNumeric && (
                          meta?.type_saisie === 'qualitatif'
                          || (guide && guide.type !== 'numerique' && !norm)
                          || !!meta
                        )

                        // Norm values: prefer API meta, fall back to local table
                        const normeMin   = meta?.norme_min   ?? norm?.min
                        const normeMax   = meta?.norme_max   ?? norm?.max
                        const normeUnite = meta?.unite       || norm?.unit || ''
                        const defautPath = meta?.valeur_defaut_pathologique ?? null

                        // Options: prefer API meta, fall back to local guide
                        const qualOptions = meta?.options_selection || guide?.options || []

                        const abnormal = isQual ? isQualitativeAbnormal(value) : isAbnormal(name, value)
                        const hasValue = typeof value === 'string' ? value.trim() !== '' : value !== '' && value !== null && value !== undefined

                        return (
                          <div
                            key={name}
                            className={`px-4 py-3 transition-colors ${
                              abnormal ? 'bg-red-50/60' : 'hover:bg-slate-50/60'
                            }`}
                          >
                            {/* Name + norm badge */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-slate-800">{name}</p>
                                  {isNumeric && normeMin != null && normeMax != null && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 tabular-nums">
                                      Norme&nbsp;: {normeMin}–{normeMax}{normeUnite ? ` ${normeUnite}` : ''}
                                    </span>
                                  )}
                                </div>
                                {guide?.desc && (
                                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{guide.desc}</p>
                                )}
                              </div>
                              <button
                                onClick={() => { const n = { ...analyses }; delete n[name]; setAnalyses(n) }}
                                className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Input row */}
                            <div className="flex items-center gap-2">
                              {isQual && qualOptions.length > 0 ? (
                                <select
                                  value={value}
                                  onChange={e => setAnalyses({ ...analyses, [name]: e.target.value })}
                                  className={`flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors ${
                                    abnormal
                                      ? 'border-red-300 bg-red-50 text-red-800 focus:ring-red-200'
                                      : value && !abnormal
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-200'
                                        : 'border-slate-200 bg-white text-slate-500 focus:ring-indigo-100 focus:border-indigo-300'
                                  }`}
                                >
                                  <option value="">— Sélectionner le résultat —</option>
                                  {qualOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={isNumeric ? 'number' : 'text'}
                                  step={isNumeric ? 'any' : undefined}
                                  value={value}
                                  onChange={e => setAnalyses({ ...analyses, [name]: e.target.value })}
                                  placeholder={normeMin != null ? `Ex : ${normeMin}–${normeMax}${normeUnite ? ` ${normeUnite}` : ''}` : 'Valeur...'}
                                  className={`flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors ${
                                    abnormal
                                      ? 'border-red-300 bg-red-50 text-red-800 focus:ring-red-200 placeholder-red-300'
                                      : 'border-slate-200 bg-white text-slate-800 focus:ring-indigo-100 focus:border-indigo-300'
                                  }`}
                                />
                              )}
                              {isNumeric && normeUnite && (
                                <span className="text-xs text-slate-400 shrink-0">{normeUnite}</span>
                              )}
                              {isNumeric && defautPath != null && (
                                <button
                                  type="button"
                                  title={`Simuler valeur anormale (${defautPath} ${normeUnite})`}
                                  onClick={() => setAnalyses({ ...analyses, [name]: String(defautPath) })}
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors shrink-0"
                                >
                                  <Zap className="w-3 h-3" />
                                  Simuler
                                </button>
                              )}
                              <div className="shrink-0">
                                {!hasValue ? (
                                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-400 whitespace-nowrap">
                                    En attente
                                  </span>
                                ) : abnormal ? (
                                  <span className="px-2 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 whitespace-nowrap">
                                    Anormal
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 whitespace-nowrap">
                                    Normal
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                      <Stethoscope className="w-6 h-6 text-indigo-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Aucune analyse ajoutée</p>
                    <p className="text-xs text-slate-400">Utilisez le champ ci-dessus ou les suggestions de l'IA</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right — Examens groupés par maladie */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-800">Examens suggérés par l'IA</h2>
                <p className="text-xs text-slate-400 mt-0.5">Groupés par hypothèse diagnostique — cochez ceux à réaliser</p>
              </div>

              <div className="p-3 max-h-[520px] overflow-y-auto space-y-3">
                {(() => {
                  const grouped = recommendedAnalyses
                  if (!grouped || (!grouped.commonExams?.length && !grouped.groups?.length)) {
                    return <p className="text-sm text-slate-400 py-8 text-center">Aucune suggestion disponible</p>
                  }

                  const addExam = (name) => {
                    if (!(name in analyses)) setAnalyses(prev => ({ ...prev, [name]: '' }))
                  }
                  const addAll = (exams) => {
                    const toAdd = {}
                    exams.forEach(e => { if (!(e in analyses)) toAdd[e] = '' })
                    setAnalyses(prev => ({ ...prev, ...toAdd }))
                  }

                  const ExamChip = ({ name }) => {
                    const added = name in analyses
                    return (
                      <button
                        onClick={() => addExam(name)}
                        disabled={added}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          added
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                      >
                        <span>{added ? '✓' : '+'}</span>
                        <span className="truncate max-w-[140px]">{name}</span>
                      </button>
                    )
                  }

                  const mainGroups = grouped.groups?.filter(g => !g.isWeak) || []
                  const weakGroups = grouped.groups?.filter(g => g.isWeak) || []

                  return (
                    <>
                      {/* Examens communs */}
                      {grouped.commonExams?.length > 0 && (
                        <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                              Examens communs à plusieurs hypothèses
                            </span>
                            <button
                              onClick={() => addAll(grouped.commonExams)}
                              className="text-xs text-indigo-600 font-semibold hover:underline"
                            >
                              Tout ajouter
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {grouped.commonExams.map(e => <ExamChip key={e} name={e} />)}
                          </div>
                        </div>
                      )}

                      {/* Groupes principaux (score ≥ 10%) */}
                      {mainGroups.map((g, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-slate-800 truncate block">{g.maladie}</span>
                              <span className={`text-xs font-bold tabular-nums ${
                                g.score >= 60 ? 'text-red-600' : g.score >= 30 ? 'text-amber-600' : 'text-slate-400'
                              }`}>{g.score}%</span>
                            </div>
                            <button
                              onClick={() => addAll(g.exams)}
                              className="text-xs text-indigo-600 font-semibold hover:underline shrink-0 ml-2"
                            >
                              Tout
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {g.exams.map(e => <ExamChip key={e} name={e} />)}
                          </div>
                        </div>
                      ))}

                      {/* Groupes faibles (score < 10%) — masqués par défaut */}
                      {weakGroups.length > 0 && (
                        <div>
                          <button
                            onClick={() => setShowWeakExams(v => !v)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors"
                          >
                            <span>{showWeakExams ? '▲' : '▼'} Hypothèses différentielles faibles (&lt;10%) — {weakGroups.length} maladie(s)</span>
                          </button>
                          {showWeakExams && (
                            <div className="mt-2 space-y-2">
                              {weakGroups.map((g, i) => (
                                <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 opacity-75">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-600 truncate">{g.maladie}</span>
                                    <span className="text-xs text-slate-400 tabular-nums">{g.score}%</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {g.exams.map(e => <ExamChip key={e} name={e} />)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>Retour</Button>
            <Button
              variant="primary"
              loading={loading}
              onClick={launchFinal}
              iconLeft={<Stethoscope className="w-4 h-4" />}
              fullWidth
            >
              {Object.keys(analyses).length > 0 ? 'Affiner le diagnostic avec les analyses' : 'Confirmer sans analyses'}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Validation finale ────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          {saved ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-900 mb-1">Consultation enregistrée</h2>
              {selectedPatient && (
                <p className="text-sm text-slate-500 mb-6">
                  Dossier de {selectedPatient.prenom} {selectedPatient.nom} mis à jour
                </p>
              )}
              <div className="flex items-center justify-center gap-3">
                <Button variant="primary" onClick={handlePrint} iconLeft={<FileDown className="w-4 h-4" />}>
                  Télécharger le rapport PDF
                </Button>
                <Button variant="secondary" onClick={resetAll} iconLeft={<RotateCcw className="w-4 h-4" />}>
                  Nouvelle consultation
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Final diagnostic — 1 seule maladie à valider */}
              <div className="bg-white rounded-xl border border-indigo-200 shadow-sm">
                <div className="px-5 py-4 border-b border-indigo-100 flex items-center justify-between bg-indigo-50 rounded-t-xl">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">Diagnostic retenu par l'IA</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Le système a sélectionné la maladie la plus probable — à vous de valider</p>
                  </div>
                  <Badge variant="success" dot>Analyses intégrées</Badge>
                </div>
                {topDiag && (
                  <div className="p-4">
                    <DiagnosticCard result={topDiag} index={0} />
                  </div>
                )}
              </div>

              {/* Validation */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-800 mb-1">Validation du diagnostic</h2>
                <p className="text-xs text-slate-400 mb-4">
                  Confirmez le diagnostic de l'IA ou proposez une alternative (±15% de marge acceptée)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setValidationChoice('confirm')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      validationChoice === 'confirm'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 shrink-0 ${validationChoice === 'confirm' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Confirmer</p>
                      <p className="text-xs text-slate-500">
                        {topDiag ? `"${topDiag.maladie}" (${formatScore(topDiag.score)})` : ''}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setValidationChoice('alternative')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      validationChoice === 'alternative'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-amber-200'
                    }`}
                  >
                    <ThumbsDown className={`w-5 h-5 shrink-0 ${validationChoice === 'alternative' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Proposer une alternative</p>
                      <p className="text-xs text-slate-500">Aide à réentraîner le modèle</p>
                    </div>
                  </button>
                </div>

                {validationChoice === 'alternative' && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Diagnostic alternatif</label>
                    <input
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      placeholder="Nom de la maladie diagnostiquée"
                      value={alternativeDiag}
                      onChange={e => setAlternativeDiag(e.target.value)}
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes complémentaires (optionnel)</label>
                  <textarea
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    rows={2}
                    placeholder="Observations cliniques, traitement envisagé..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                {!selectedPatient && (
                  <div className="mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs">
                    Sélectionnez un patient à l'étape 1 pour enregistrer cette consultation dans son dossier.
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(2)}>Retour</Button>
                  {selectedPatient ? (
                    <Button
                      variant="primary"
                      loading={saving}
                      disabled={saving || !validationChoice || (validationChoice === 'alternative' && !alternativeDiag.trim())}
                      onClick={handleValidate}
                      iconLeft={<Save className="w-4 h-4" />}
                      fullWidth
                    >
                      Enregistrer et générer le rapport
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={handlePrint}
                      iconLeft={<FileDown className="w-4 h-4" />}
                      fullWidth
                    >
                      Télécharger le rapport (anonyme)
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Consultation
