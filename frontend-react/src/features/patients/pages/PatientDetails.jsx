/**
 * Patient Details — Dossier médical complet avec 4 onglets
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, User, Calendar, Phone, Mail, FileText,
  Stethoscope, AlertCircle, Activity,
  Thermometer, Heart, CheckCircle, ChevronDown, ChevronRight,
  Edit2, Save, X, LayoutDashboard, MapPin, Droplet,
  FlaskConical, ThumbsUp, Loader2,
} from 'lucide-react'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/context/AuthContext'
import * as patientApi from '@/features/patients/api/patientApi'
import * as consultationApi from '@/features/consultation/api/consultationApi'
import * as vitalsApi from '@/features/consultation/api/vitalsApi'
import { formatDate, calculateAge } from '@/utils/helpers'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeJson(val) {
  if (!val) return null
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return null }
}

const URGENCY_BADGE = { critique: 'danger', élevée: 'danger', modérée: 'warning', faible: 'success' }
function urgBadge(u) { return URGENCY_BADGE[u] || 'default' }

const TABS = [
  { id: 'resume', label: 'Résumé', icon: LayoutDashboard },
  { id: 'consultations', label: 'Consultations', icon: Stethoscope },
  { id: 'constantes', label: 'Constantes', icon: Activity },
  { id: 'dossier', label: 'Dossier médical', icon: FileText },
]

const VITALS_CONFIG = [
  { key: 'temperature', label: 'Température', unit: '°C', placeholder: '37.0' },
  { key: 'pression', label: 'Pression', unit: 'mmHg', placeholder: '120/80' },
  { key: 'pouls', label: 'Pouls', unit: 'bpm', placeholder: '72' },
  { key: 'spo2', label: 'SpO2', unit: '%', placeholder: '98' },
  { key: 'poids', label: 'Poids', unit: 'kg', placeholder: '70' },
  { key: 'taille', label: 'Taille', unit: 'cm', placeholder: '170' },
]

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const emptyVitals = { temperature: '', pression: '', pouls: '', spo2: '', poids: '', taille: '', observations: '' }

function dt(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── ConsultationCard ─────────────────────────────────────────────────────────
function ConsultationCard({ consult, isDoctor, onExpand, detail, loadingDetail }) {
  const [open, setOpen] = useState(false)

  const toggle = () => {
    if (!open && !detail) onExpand(consult.id)
    setOpen(o => !o)
  }

  const symptoms   = safeJson(consult.symptomes) || []
  const dd         = detail?.diagnostic_details || null
  const results    = safeJson(dd?.resultats) || []
  const analyses   = safeJson(dd?.analyses ?? detail?.analyses) || {}
  const diagMain   = dd?.diagnostic_principal || consult.diagnostic || ''
  const diagFinal  = dd?.diagnostic_final || ''
  const notes      = detail?.notes || consult.notes || ''

  const hasDetail = results.length > 0 || Object.keys(analyses).length > 0 || diagMain || notes

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
        onClick={toggle}
      >
        <span className="shrink-0">
          {open
            ? <ChevronDown className="w-4 h-4 text-slate-500" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-900">
              {consult.diagnostic || consult.motif || 'Consultation'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{dt(consult.date_consultation)}</span>
            {consult.medecin_prenom && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />Dr. {consult.medecin_prenom} {consult.medecin_nom}
              </span>
            )}
            {symptoms.length > 0 && <span>{symptoms.length} symptôme{symptoms.length > 1 ? 's' : ''}</span>}
          </div>
        </div>
        {consult.motif && (
          <span className="hidden md:block text-xs text-slate-400 italic shrink-0 max-w-[180px] truncate">
            {consult.motif}
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/40 p-4 space-y-4">
          {loadingDetail ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement des détails...
            </div>
          ) : (
            <>
              {symptoms.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Symptômes présentés</p>
                  <div className="flex flex-wrap gap-1.5">
                    {symptoms.map((s, i) => (
                      <span key={i} className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isDoctor && results.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Diagnostic IA — top {Math.min(results.length, 3)}
                  </p>
                  <div className="space-y-1.5">
                    {results.slice(0, 3).map((r, i) => (
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                        i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-slate-200'
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {i === 0 && (
                            <span className="shrink-0 text-xs font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                              #1
                            </span>
                          )}
                          <span className={`font-medium truncate ${i === 0 ? 'text-blue-800' : 'text-slate-700'}`}>
                            {r.maladie}
                          </span>
                          {r.urgence && <Badge variant={urgBadge(r.urgence)}>{r.urgence}</Badge>}
                        </div>
                        <span className={`font-bold shrink-0 ml-2 ${i === 0 ? 'text-blue-700' : 'text-slate-600'}`}>
                          {Math.round(r.score || 0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(analyses).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FlaskConical className="w-3 h-3" /> Analyses biologiques
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(analyses).map(([name, value]) => (
                      <div key={name} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-500 truncate">{name}</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {value && value !== '1' && value !== 1
                            ? String(value)
                            : <span className="text-slate-400 font-normal">—</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isDoctor && diagMain && (
                <div className={`flex items-start gap-3 px-4 py-3 rounded-xl ${
                  diagFinal && diagFinal !== diagMain
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <ThumbsUp className={`w-4 h-4 mt-0.5 shrink-0 ${
                    diagFinal && diagFinal !== diagMain ? 'text-amber-600' : 'text-emerald-600'
                  }`} />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Diagnostic retenu</p>
                    <p className="text-sm font-semibold text-slate-800">{diagFinal || diagMain}</p>
                    {diagFinal && diagFinal !== diagMain && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        Alternative au diagnostic IA ({diagMain})
                      </p>
                    )}
                  </div>
                </div>
              )}

              {notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes du médecin</p>
                  <p className="text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 italic">
                    {notes}
                  </p>
                </div>
              )}

              {!symptoms.length && !hasDetail && (
                <p className="text-sm text-slate-400 text-center py-2">Détails non disponibles</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Row helper ───────────────────────────────────────────────────────────────
function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 break-words">{value}</p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PatientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const role     = user?.role || 'medecin'
  const isDoctor = role === 'medecin'
  const isNurse  = role === 'infirmier'

  const [activeTab, setActiveTab] = useState('resume')
  const [patient, setPatient]     = useState(null)
  const [consultations, setConsultations] = useState([])
  const [vitalsHistory, setVitalsHistory] = useState([])
  const [loading, setLoading]     = useState(true)

  // Per-consultation detail cache
  const [consultDetails, setConsultDetails]   = useState({})
  const [loadingConsult, setLoadingConsult]   = useState({})

  // Nurse vitals form
  const [vitals, setVitals]         = useState(emptyVitals)
  const [savingVitals, setSavingVitals] = useState(false)
  const [vitalsSaved, setVitalsSaved]   = useState(false)
  const [vitalsError, setVitalsError]   = useState('')

  // Edit dossier médical
  const [editing, setEditing]       = useState(false)
  const [editData, setEditData]     = useState({})
  const [saving, setSaving]         = useState(false)
  const [editError, setEditError]   = useState('')
  const [editSuccess, setEditSuccess] = useState(false)

  useEffect(() => { loadAll() }, [id])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pRes, cRes, vRes] = await Promise.all([
        patientApi.getPatientById(id),
        consultationApi.getConsultationsByPatient(id),
        vitalsApi.getPatientVitals(id, 30),
      ])

      if (pRes.success) {
        const data = pRes.data?.data?.id ? pRes.data.data : pRes.data?.id ? pRes.data : null
        if (data) {
          setPatient(data)
          setEditData({
            antecedents_medicaux: data.antecedents_medicaux || '',
            allergies:            data.allergies || '',
            adresse:              data.adresse || '',
            groupe_sanguin:       data.groupe_sanguin || '',
            telephone:            data.telephone || '',
            email:                data.email || '',
          })
        }
      }
      if (cRes.success) {
        const d = cRes.data?.data || cRes.data
        setConsultations(d?.consultations || [])
      }
      if (vRes.success) {
        const d = vRes.data?.data || vRes.data
        setVitalsHistory(d?.vitals || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const loadConsultDetail = async (consultId) => {
    if (consultDetails[consultId] || loadingConsult[consultId]) return
    setLoadingConsult(prev => ({ ...prev, [consultId]: true }))
    try {
      const res = await consultationApi.getConsultationById(consultId)
      if (res.success) {
        const d = res.data?.data || res.data
        setConsultDetails(prev => ({ ...prev, [consultId]: d }))
      }
    } finally {
      setLoadingConsult(prev => ({ ...prev, [consultId]: false }))
    }
  }

  const handleSaveVitals = async (e) => {
    e.preventDefault()
    setVitalsError('')
    setSavingVitals(true)
    const r = await vitalsApi.saveVitals({ patient_id: patient.id, ...vitals })
    setSavingVitals(false)
    if (r.success) {
      setVitalsSaved(true)
      setVitals(emptyVitals)
      const vRes = await vitalsApi.getPatientVitals(id, 30)
      if (vRes.success) {
        const d = vRes.data?.data || vRes.data
        setVitalsHistory(d?.vitals || [])
      }
      setTimeout(() => setVitalsSaved(false), 3000)
    } else {
      setVitalsError(r.error || "Erreur lors de l'enregistrement")
    }
  }

  const handleSaveDossier = async () => {
    setSaving(true)
    setEditError('')
    try {
      const res = await patientApi.updatePatient(id, editData)
      if (res.success) {
        const d = res.data?.data || res.data
        setPatient(prev => ({ ...prev, ...d }))
        setEditing(false)
        setEditSuccess(true)
        setTimeout(() => setEditSuccess(false), 3000)
      } else {
        setEditError(res.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      setEditError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditError('')
    setEditData({
      antecedents_medicaux: patient.antecedents_medicaux || '',
      allergies:            patient.allergies || '',
      adresse:              patient.adresse || '',
      groupe_sanguin:       patient.groupe_sanguin || '',
      telephone:            patient.telephone || '',
      email:                patient.email || '',
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loading size="lg" text="Chargement du dossier..." /></div>
  }
  if (!patient) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Patient non trouvé</p>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/patients')}>Retour à la liste</Button>
      </div>
    )
  }

  const lastVital  = vitalsHistory[0]
  const lastConsult = consultations[0]

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/patients')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{patient.prenom} {patient.nom}</h1>
            <span className="font-mono text-sm bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-lg">
              {patient.code_patient}
            </span>
            <Badge variant={patient.sexe === 'M' ? 'info' : 'default'}>
              {patient.sexe === 'M' ? 'Homme' : 'Femme'} · {calculateAge(patient.date_naissance)} ans
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {isNurse ? 'Suivi infirmier' : 'Dossier patient complet'}
          </p>
        </div>
        {isDoctor && (
          <Link to="/consultation" state={{ patientCode: patient.code_patient }}>
            <Button variant="primary">
              <Stethoscope className="w-4 h-4" />
              Nouvelle consultation
            </Button>
          </Link>
        )}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tabId
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {tabId === 'consultations' && consultations.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tabId ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {consultations.length}
              </span>
            )}
            {tabId === 'constantes' && vitalsHistory.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tabId ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {vitalsHistory.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── RÉSUMÉ ─────────────────────────────────────────────────────────── */}
      {activeTab === 'resume' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Identity card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identité</h2>
            <Row icon={User}     label="Nom complet"  value={`${patient.prenom} ${patient.nom}`} />
            <Row icon={Calendar} label="Naissance"    value={`${formatDate(patient.date_naissance)} · ${calculateAge(patient.date_naissance)} ans`} />
            {patient.telephone && <Row icon={Phone} label="Téléphone" value={patient.telephone} />}
            {patient.email     && <Row icon={Mail}  label="Email"     value={patient.email} />}
            {patient.adresse   && <Row icon={MapPin} label="Adresse"  value={patient.adresse} />}
            {patient.groupe_sanguin && (
              <div className="flex items-center gap-3">
                <Droplet className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Groupe sanguin</p>
                  <Badge variant="danger">{patient.groupe_sanguin}</Badge>
                </div>
              </div>
            )}
            {patient.allergies && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-600">Allergies</p>
                  <p className="text-sm text-red-700">{patient.allergies}</p>
                </div>
              </div>
            )}
          </div>

          {/* Last vitals */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Dernières constantes</h2>
            {lastVital ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  {dt(lastVital.created_at)}
                  {lastVital.infirmier_prenom && ` · ${lastVital.infirmier_prenom} ${lastVital.infirmier_nom}`}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'temperature', label: 'Temp.',   unit: '°C',  warn: v => parseFloat(v) >= 37.8 },
                    { key: 'pression',    label: 'Pression',unit: 'mmHg' },
                    { key: 'pouls',       label: 'Pouls',   unit: 'bpm', warn: v => parseInt(v) > 100 || parseInt(v) < 60 },
                    { key: 'spo2',        label: 'SpO2',    unit: '%',   warn: v => parseInt(v) < 95 },
                    { key: 'poids',       label: 'Poids',   unit: 'kg' },
                    { key: 'taille',      label: 'Taille',  unit: 'cm' },
                  ].map(({ key, label, unit, warn }) => {
                    const val = lastVital[key]
                    if (!val) return null
                    const isWarn = warn ? warn(val) : false
                    return (
                      <div key={key} className={`px-3 py-2 rounded-lg border ${isWarn ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className={`text-sm font-bold ${isWarn ? 'text-amber-700' : 'text-slate-800'}`}>
                          {val} <span className="text-xs font-normal text-slate-400">{unit}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
                {lastVital.observations && (
                  <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2">{lastVital.observations}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <Activity className="w-8 h-8 mb-2" />
                <p className="text-sm">Aucune constante enregistrée</p>
              </div>
            )}
          </div>

          {/* Last consultation */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Dernière consultation</h2>
            {lastConsult ? (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-400">{dt(lastConsult.date_consultation)}</p>
                {lastConsult.motif && (
                  <p className="text-xs text-slate-500 italic">« {lastConsult.motif} »</p>
                )}
                {lastConsult.diagnostic && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs text-blue-600">Diagnostic</p>
                      <p className="text-sm font-semibold text-blue-800">{lastConsult.diagnostic}</p>
                    </div>
                  </div>
                )}
                {lastConsult.medecin_prenom && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" />Dr. {lastConsult.medecin_prenom} {lastConsult.medecin_nom}
                  </p>
                )}
                <button onClick={() => setActiveTab('consultations')} className="text-xs text-blue-600 hover:underline">
                  Voir tout l'historique →
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <FileText className="w-8 h-8 mb-2" />
                <p className="text-sm">Aucune consultation</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONSULTATIONS ──────────────────────────────────────────────────── */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {consultations.length} consultation{consultations.length !== 1 ? 's' : ''} enregistrée{consultations.length !== 1 ? 's' : ''}
            </p>
            {isDoctor && (
              <Link to="/consultation" state={{ patientCode: patient.code_patient }}>
                <Button variant="primary" size="sm">
                  <Stethoscope className="w-4 h-4" /> Nouvelle consultation
                </Button>
              </Link>
            )}
          </div>

          {consultations.length > 0 ? (
            <div className="space-y-2">
              {consultations.map(c => (
                <ConsultationCard
                  key={c.id}
                  consult={c}
                  isDoctor={isDoctor}
                  onExpand={loadConsultDetail}
                  detail={consultDetails[c.id]}
                  loadingDetail={loadingConsult[c.id]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3" />
              <p>Aucune consultation enregistrée</p>
              {isDoctor && (
                <Link to="/consultation" state={{ patientCode: patient.code_patient }}>
                  <Button variant="primary" className="mt-4" size="sm">
                    <Stethoscope className="w-4 h-4" /> Créer une consultation
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CONSTANTES ─────────────────────────────────────────────────────── */}
      {activeTab === 'constantes' && (
        <div className="space-y-5">
          {isNurse && (
            <div className="bg-white border border-emerald-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-emerald-600" /> Enregistrer des constantes
              </h2>
              {vitalsSaved ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <p className="text-sm text-emerald-700 font-medium">Constantes enregistrées avec succès</p>
                </div>
              ) : (
                <form onSubmit={handleSaveVitals} className="space-y-4">
                  {vitalsError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {vitalsError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {VITALS_CONFIG.map(({ key, label, unit, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                        <div className="flex">
                          <input type="text"
                            className="flex-1 border border-slate-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            placeholder={placeholder} value={vitals[key]}
                            onChange={e => setVitals({ ...vitals, [key]: e.target.value })} />
                          <span className="px-2 py-2 bg-slate-50 border border-l-0 border-slate-300 rounded-r-lg text-xs text-slate-500">
                            {unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Observations</label>
                    <textarea
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      rows={2} placeholder="État général du patient..."
                      value={vitals.observations}
                      onChange={e => setVitals({ ...vitals, observations: e.target.value })} />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={savingVitals}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                      {savingVitals ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">
                Historique des constantes ({vitalsHistory.length})
              </h2>
            </div>
            {vitalsHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {['Date', 'Temp.', 'Pression', 'Pouls', 'SpO2', 'Poids', 'Taille', 'Infirmier'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vitalsHistory.map((v, i) => {
                      const tempWarn  = v.temperature && parseFloat(v.temperature) >= 37.8
                      const spo2Warn  = v.spo2 && parseInt(v.spo2) < 95
                      const poulsWarn = v.pouls && (parseInt(v.pouls) > 100 || parseInt(v.pouls) < 60)
                      return (
                        <tr key={v.id} className={`border-b border-slate-100 ${i % 2 !== 0 ? 'bg-slate-50/30' : ''}`}>
                          <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{dt(v.created_at)}</td>
                          <td className={`px-4 py-3 font-medium ${tempWarn ? 'text-amber-600' : 'text-slate-800'}`}>
                            {v.temperature ? `${v.temperature}°` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{v.pression || '—'}</td>
                          <td className={`px-4 py-3 font-medium ${poulsWarn ? 'text-amber-600' : 'text-slate-700'}`}>
                            {v.pouls ? `${v.pouls} bpm` : '—'}
                          </td>
                          <td className={`px-4 py-3 font-medium ${spo2Warn ? 'text-red-600' : 'text-slate-700'}`}>
                            {v.spo2 ? `${v.spo2}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{v.poids ? `${v.poids} kg` : '—'}</td>
                          <td className="px-4 py-3 text-slate-700">{v.taille ? `${v.taille} cm` : '—'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                            {v.infirmier_prenom ? `${v.infirmier_prenom} ${v.infirmier_nom}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm">Aucune constante enregistrée pour ce patient</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DOSSIER MÉDICAL ────────────────────────────────────────────────── */}
      {activeTab === 'dossier' && (
        <div className="space-y-5">
          {editSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
              <CheckCircle className="w-4 h-4" /> Dossier médical mis à jour avec succès
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-700">Informations médicales</h2>
              {isDoctor && !editing && (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Modifier
                </button>
              )}
              {editing && (
                <div className="flex items-center gap-2">
                  <button onClick={cancelEdit}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                    <X className="w-3.5 h-3.5" /> Annuler
                  </button>
                  <button onClick={handleSaveDossier} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Enregistrer
                  </button>
                </div>
              )}
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {editError}
              </div>
            )}

            <div className="space-y-5">
              {/* Antécédents */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Antécédents médicaux
                </label>
                {editing ? (
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    rows={4} placeholder="Hypertension, diabète, chirurgies passées..."
                    value={editData.antecedents_medicaux}
                    onChange={e => setEditData({ ...editData, antecedents_medicaux: e.target.value })} />
                ) : (
                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 min-h-[70px]">
                    {patient.antecedents_medicaux || <span className="text-slate-400 italic">Aucun antécédent renseigné</span>}
                  </p>
                )}
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Allergies
                </label>
                {editing ? (
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    rows={2} placeholder="Pénicilline, arachides, latex..."
                    value={editData.allergies}
                    onChange={e => setEditData({ ...editData, allergies: e.target.value })} />
                ) : patient.allergies ? (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{patient.allergies}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                    Aucune allergie connue
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Groupe sanguin */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Groupe sanguin
                  </label>
                  {editing ? (
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      value={editData.groupe_sanguin}
                      onChange={e => setEditData({ ...editData, groupe_sanguin: e.target.value })}>
                      <option value="">— Non renseigné</option>
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  ) : (
                    patient.groupe_sanguin
                      ? <Badge variant="danger">{patient.groupe_sanguin}</Badge>
                      : <span className="text-sm text-slate-400 italic">—</span>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Téléphone
                  </label>
                  {editing ? (
                    <PhoneInput
                      value={editData.telephone}
                      onChange={val => setEditData({ ...editData, telephone: val })}
                    />
                  ) : (
                    <p className="text-sm text-slate-700">{patient.telephone || <span className="text-slate-400 italic">—</span>}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  {editing ? (
                    <input type="email"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={editData.email}
                      onChange={e => setEditData({ ...editData, email: e.target.value })} />
                  ) : (
                    <p className="text-sm text-slate-700">{patient.email || <span className="text-slate-400 italic">—</span>}</p>
                  )}
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Adresse
                </label>
                {editing ? (
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    rows={2} placeholder="Rue, quartier, ville..."
                    value={editData.adresse}
                    onChange={e => setEditData({ ...editData, adresse: e.target.value })} />
                ) : (
                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                    {patient.adresse || <span className="text-slate-400 italic">Non renseignée</span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Registration metadata */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Enregistrement</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Admis le {patient.created_at ? dt(patient.created_at) : '—'}
              </span>
              <span className="font-mono text-slate-600">Code : {patient.code_patient}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDetails
