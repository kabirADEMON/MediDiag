/**
 * Consultation Page
 * Workflow: symptômes → diagnostic préliminaire → analyses → diagnostic final → validation → PDF
 */

import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Stethoscope, Search, CheckCircle, AlertCircle, ChevronRight,
  ChevronDown, Plus, X, RotateCcw, FileDown, Save, ThumbsUp,
  ThumbsDown, Loader2,
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

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Patient & Symptômes', 'Diagnostic préliminaire', 'Analyses & Affinage', 'Validation finale']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className={`flex items-center gap-2 ${i < steps.length - 1 ? 'flex-1' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              i < step ? 'bg-blue-600 text-white' :
              i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
              'bg-slate-100 text-slate-400'
            }`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 mx-2 ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── PDF generation ──────────────────────────────────────────────────────────
function generatePDF({ patient, motif, symptoms, analyses, diagnostics, finalDiag, notes, medecin, validated }) {
  const printWin = window.open('', '_blank', 'width=800,height=900')
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const top3 = (diagnostics || []).slice(0, 4)

  printWin.document.write(`<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8">
<title>Rapport médical</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size:13px; color:#1e293b; padding:40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:20px; border-bottom:2px solid #2563eb; margin-bottom:24px; }
  .logo { font-size:22px; font-weight:800; color:#2563eb; }
  .logo-sub { font-size:11px; color:#64748b; margin-top:2px; }
  .date-block { text-align:right; font-size:12px; color:#64748b; }
  h2 { font-size:15px; font-weight:700; color:#1e293b; margin-bottom:12px; border-left:3px solid #2563eb; padding-left:10px; }
  .section { margin-bottom:20px; }
  .field { display:flex; gap:8px; margin-bottom:6px; font-size:13px; }
  .field-label { font-weight:600; color:#475569; min-width:120px; }
  .pill { display:inline-block; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:20px; padding:2px 10px; font-size:12px; margin:2px; }
  .diag-card { border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:8px; }
  .diag-card.first { border-color:#bfdbfe; background:#eff6ff; }
  .diag-name { font-weight:700; font-size:14px; }
  .diag-meta { display:flex; gap:12px; font-size:12px; color:#64748b; margin-top:4px; }
  .score-bar { height:6px; background:#e2e8f0; border-radius:3px; margin-top:8px; }
  .score-fill { height:100%; background:#2563eb; border-radius:3px; }
  .final-box { background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:14px; margin-bottom:16px; }
  .final-title { font-weight:700; color:#16a34a; font-size:15px; }
  .notes-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; font-size:13px; }
  .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:12px; color:#94a3b8; }
  .warning { background:#fffbeb; border:1px solid #fcd34d; border-radius:6px; padding:10px 14px; font-size:12px; color:#92400e; margin-top:16px; }
  @media print { body { padding:20px; } }
</style>
</head><body>
<div class="header">
  <div>
    <div class="logo">MediDiag</div>
    <div class="logo-sub">Système de diagnostic médical assisté par IA</div>
  </div>
  <div class="date-block">
    <div style="font-weight:700;font-size:14px">RAPPORT DE CONSULTATION</div>
    <div>${date}</div>
    ${medecin ? `<div>Dr. ${medecin.prenom} ${medecin.nom}</div>` : ''}
    ${medecin?.specialite ? `<div>${medecin.specialite}</div>` : ''}
  </div>
</div>

<div class="section">
  <h2>Informations patient</h2>
  ${patient ? `
  <div class="field"><span class="field-label">Nom complet</span><span>${patient.prenom} ${patient.nom}</span></div>
  <div class="field"><span class="field-label">Code patient</span><span style="font-family:monospace">${patient.code_patient || '—'}</span></div>
  <div class="field"><span class="field-label">Date de naissance</span><span>${patient.date_naissance ? new Date(patient.date_naissance).toLocaleDateString('fr-FR') : '—'}</span></div>
  <div class="field"><span class="field-label">Sexe</span><span>${patient.sexe === 'M' ? 'Masculin' : 'Féminin'}</span></div>
  ${patient.allergies ? `<div class="field"><span class="field-label" style="color:#dc2626">⚠ Allergies</span><span style="color:#dc2626;font-weight:600">${patient.allergies}</span></div>` : ''}
  ` : '<p style="color:#64748b">Consultation anonyme</p>'}
</div>

<div class="section">
  <h2>Motif de consultation</h2>
  <p>${motif || 'Non renseigné'}</p>
</div>

<div class="section">
  <h2>Symptômes présentés</h2>
  <div>${(symptoms || []).map(s => `<span class="pill">${s}</span>`).join('')}</div>
</div>

${Object.keys(analyses || {}).length > 0 ? `
<div class="section">
  <h2>Analyses biologiques</h2>
  <div>${Object.keys(analyses).map(a => `<span class="pill">${a}</span>`).join('')}</div>
</div>` : ''}

<div class="section">
  <h2>Résultats du diagnostic IA (top ${top3.length})</h2>
  ${top3.map((d, i) => `
  <div class="diag-card ${i === 0 ? 'first' : ''}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        ${i === 0 ? '<span style="font-size:10px;font-weight:700;background:#2563eb;color:white;padding:2px 8px;border-radius:10px;margin-right:6px">PRINCIPAL</span>' : ''}
        <span class="diag-name">${d.maladie}</span>
      </div>
      <span style="font-weight:700;font-size:14px">${formatScore(d.score)}</span>
    </div>
    <div class="diag-meta">
      <span>Urgence : ${d.urgence || 'faible'}</span>
      ${d.examens_recommandes?.length ? `<span>Examens : ${d.examens_recommandes.slice(0, 3).join(', ')}</span>` : ''}
    </div>
    <div class="score-bar"><div class="score-fill" style="width:${Math.min(d.score, 100)}%"></div></div>
  </div>`).join('')}
</div>

${finalDiag ? `
<div class="section">
  <div class="final-box">
    <div class="final-title">✓ Diagnostic final validé par le médecin</div>
    <div style="margin-top:6px;font-size:14px">${finalDiag.maladie} — Score : ${formatScore(finalDiag.score)}</div>
    <div style="font-size:12px;color:#16a34a;margin-top:2px">${validated ? 'Confirmé (dans la marge IA ±15%)' : 'Diagnostic alternatif proposé'}</div>
  </div>
</div>` : ''}

${notes ? `
<div class="section">
  <h2>Notes du médecin</h2>
  <div class="notes-box">${notes}</div>
</div>` : ''}

<div class="warning">
  ⚠️ Avertissement : Ce rapport est une aide à la décision médicale basée sur l'intelligence artificielle. Il ne remplace
  pas un examen clinique complet ni le jugement d'un professionnel de santé qualifié.
</div>

<div class="footer">
  <span>MediDiag — Rapport généré le ${new Date().toLocaleString('fr-FR')}</span>
  <span>Confidentiel — Dossier médical</span>
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

  // Form data
  const [motif, setMotif] = useState('')
  const [symptoms, setSymptoms] = useState([])
  const [analyses, setAnalyses] = useState({})
  const [age, setAge] = useState(0)
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

  const loadSuggestions = async () => {
    try {
      const [sr, ar] = await Promise.all([metadataApi.getSymptoms(), metadataApi.getAnalyses()])
      if (sr.success) {
        const d = sr.data?.data || sr.data
        setSymptomsSuggestions(d?.symptoms || [])
      }
      if (ar.success) {
        const d = ar.data?.data || ar.data
        setAnalysesSuggestions(Array.isArray(d?.analyses) ? d.analyses : [])
      }
    } finally {
      setLoadingSuggestions(false)
    }
  }

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
    setLoading(true)
    setError('')
    try {
      const res = await diagnosticApi.performDiagnostic({ age, sexe, symptomes: symptoms, analyses: {} })
      if (res.success) {
        const data = res.data?.data || res.data
        // Backend may return success=true but empty diagnostics (insufficient symptoms)
        if (!data.diagnostics || data.diagnostics.length === 0) {
          setError(data.message || 'Symptômes insuffisants pour établir un diagnostic. Ajoutez plus de symptômes.')
          return
        }
        setPrelimResults(data)
        setStep(1)

        // Auto-load recommended analyses
        setLoadingReco(true)
        try {
          const reco = await diagnosticApi.getRecommendedExaminations({ age, sexe, symptomes: symptoms, analyses: {} })
          if (reco.success) {
            const rd = reco.data?.data || reco.data
            setRecommendedAnalyses(rd?.analyses || [])
          }
        } finally {
          setLoadingReco(false)
        }
      } else {
        setError(res.error || 'Erreur lors du diagnostic')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

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
      })
      if (res.success) {
        const data = res.data?.data || res.data
        if (!data.diagnostics || data.diagnostics.length === 0) {
          setError(data.message || 'Aucun diagnostic concluant. Complétez les analyses ou ajoutez des symptômes.')
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

  // Add symptom with sex-coherence check
  const addSymptom = (s) => {
    if (!s || symptoms.includes(s)) return
    const sLower = s.toLowerCase().trim()
    if (sexe === 'M' && FEMALE_ONLY_SYMPTOMS.has(sLower)) {
      setSymptomWarning(`⚠ "${s}" est un symptôme typiquement féminin — vérifiez le sexe du patient.`)
      setTimeout(() => setSymptomWarning(''), 6000)
    } else if (sexe === 'F' && MALE_ONLY_SYMPTOMS.has(sLower)) {
      setSymptomWarning(`⚠ "${s}" est un symptôme typiquement masculin — vérifiez le sexe du patient.`)
      setTimeout(() => setSymptomWarning(''), 6000)
    } else {
      setSymptomWarning('')
    }
    setSymptoms(prev => [...prev, s])
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
    setSelectedPatient(null); setPatientCode(''); setAge(0); setSexe('M')
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
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
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
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">Patient</h2>
              {!selectedPatient ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Code patient (PAT-...)"
                      value={patientCode}
                      onChange={e => setPatientCode(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchPatient()}
                    />
                    <Button variant="primary" size="sm" onClick={searchPatient} loading={searchingPatient}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {patientError && <p className="text-xs text-red-600">{patientError}</p>}
                  <p className="text-xs text-slate-400">
                    Ou laissez vide pour un diagnostic anonyme
                  </p>
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
                    onClick={() => { setSelectedPatient(null); setPatientCode(''); setAge(0); setSexe('M') }}
                    className="text-slate-400 hover:text-slate-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Age + sexe if no patient */}
            {!selectedPatient && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-800 mb-4">Données patient</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Âge</label>
                    <input
                      type="number" min="0" max="120"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={age}
                      onChange={e => setAge(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Sexe</label>
                    <div className="flex gap-3 mt-2">
                      {['M', 'F'].map(s => (
                        <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" value={s} checked={sexe === s} onChange={() => setSexe(s)} className="accent-blue-600" />
                          <span className="text-sm">{s === 'M' ? 'Masculin' : 'Féminin'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Motif */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Motif de consultation <span className="text-red-500">*</span></h2>
              <textarea
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                rows={2}
                placeholder="Ex : Fièvre persistante depuis 3 jours, douleurs abdominales..."
                value={motif}
                onChange={e => setMotif(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-5">
            {/* Symptoms */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">
                Symptômes <span className="text-red-500">*</span>
                {symptoms.length > 0 && <span className="ml-1 text-blue-600">({symptoms.length})</span>}
              </h2>
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
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
                      {s}
                      <button onClick={() => setSymptoms(symptoms.filter(x => x !== s))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

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
          <div className="bg-white rounded-xl border border-slate-200">
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
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">Résultats des analyses</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Saisissez les valeurs du laboratoire</p>
                  </div>
                  {Object.keys(analyses).length > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
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
                        className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Résultat..."
                        value={customAnalyseValue}
                        onChange={e => setCustomAnalyseValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomAnalyse()}
                        className="w-32 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <button
                        onClick={addCustomAnalyse}
                        disabled={!customAnalyseName.trim()}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {Object.keys(analyses).length > 0 ? (
                  <div className="border-t border-slate-100">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_120px_80px_90px_36px] gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <span>Analyse</span>
                      <span>Résultat</span>
                      <span>Unité</span>
                      <span className="text-center">Statut</span>
                      <span />
                    </div>
                    <div className="divide-y divide-slate-50">
                      {Object.entries(analyses).map(([name, value]) => {
                        const norm = findNorm(name)
                        const abnormal = isAbnormal(name, value)
                        const hasValue = value.trim() !== ''
                        return (
                          <div
                            key={name}
                            className={`grid grid-cols-[1fr_120px_80px_90px_36px] gap-2 items-center px-4 py-3 transition-colors ${
                              abnormal ? 'bg-red-50/60' : 'hover:bg-slate-50/60'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                              {norm && (
                                <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                                  {norm.min} – {norm.max}{norm.unit ? ` ${norm.unit}` : ''}
                                </p>
                              )}
                            </div>
                            <input
                              type="text"
                              value={value}
                              onChange={e => setAnalyses({ ...analyses, [name]: e.target.value })}
                              placeholder="Valeur..."
                              className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors ${
                                abnormal
                                  ? 'border-red-300 bg-red-50 text-red-800 focus:ring-red-200 placeholder-red-300'
                                  : 'border-slate-200 bg-white text-slate-800 focus:ring-blue-100 focus:border-blue-300'
                              }`}
                            />
                            <span className="text-xs text-slate-400 truncate">
                              {norm?.unit || '—'}
                            </span>
                            <div className="flex justify-center">
                              {!hasValue ? (
                                <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-400">
                                  En attente
                                </span>
                              ) : abnormal ? (
                                <span className="px-2 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700">
                                  Anormal
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700">
                                  Normal
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => { const n = { ...analyses }; delete n[name]; setAnalyses(n) }}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                      <Stethoscope className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Aucune analyse ajoutée</p>
                    <p className="text-xs text-slate-400">Utilisez le champ ci-dessus ou les suggestions de l'IA</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right — IA suggestions */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Suggestions de l'IA</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Basées sur le diagnostic préliminaire</p>
                </div>
                {recommendedAnalyses.length > 0 && (
                  <button
                    onClick={() => {
                      const toAdd = {}
                      recommendedAnalyses.slice(0, 12).forEach(a => {
                        if (!(a.name in analyses)) toAdd[a.name] = ''
                      })
                      setAnalyses({ ...analyses, ...toAdd })
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Tout ajouter
                  </button>
                )}
              </div>

              <div className="p-3">
                {loadingReco ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Génération...
                  </div>
                ) : recommendedAnalyses.length > 0 ? (
                  <div className="space-y-1 max-h-[420px] overflow-y-auto pr-0.5">
                    {recommendedAnalyses.slice(0, 12).map((a, i) => {
                      const pct = a.percentage ?? (a.priority === 'high' ? 70 : a.priority === 'medium' ? 40 : 20)
                      const added = a.name in analyses
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            added ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <p className="text-sm font-medium text-slate-800 truncate">{a.name}</p>
                              <span className={`text-xs font-bold shrink-0 tabular-nums ${
                                pct >= 60 ? 'text-red-600' : pct >= 40 ? 'text-amber-600' : 'text-slate-400'
                              }`}>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${pct >= 60 ? 'bg-red-400' : pct >= 40 ? 'bg-amber-400' : 'bg-blue-300'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => { if (!added) setAnalyses({ ...analyses, [a.name]: '' }) }}
                            disabled={added}
                            className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                              added
                                ? 'bg-emerald-100 text-emerald-600 cursor-default'
                                : 'border border-blue-200 text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {added ? '✓' : '+'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-8 text-center">Aucune suggestion disponible</p>
                )}
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
              {/* Final diagnostic results */}
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">Diagnostic final affiné</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Avec analyses biologiques — top {Math.min(currentDiags.length, 4)}</p>
                  </div>
                  <Badge variant="success" dot>Analyses intégrées</Badge>
                </div>
                <div className="p-4 space-y-2">
                  {currentDiags.slice(0, 4).map((d, i) => (
                    <DiagnosticCard key={i} result={d} index={i} />
                  ))}
                </div>
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
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Nom de la maladie diagnostiquée"
                      value={alternativeDiag}
                      onChange={e => setAlternativeDiag(e.target.value)}
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes complémentaires (optionnel)</label>
                  <textarea
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    rows={2}
                    placeholder="Observations cliniques, traitement envisagé..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                {!selectedPatient && (
                  <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs">
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
