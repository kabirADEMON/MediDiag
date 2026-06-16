import { useState, useEffect, useRef } from 'react'
import {
  Database, Upload, RefreshCw, CheckCircle, AlertCircle,
  FileText, Clock, HardDrive, Activity, ChevronDown, ChevronUp,
  Shield, Zap, Plus, Trash2, FlaskConical, BookOpen,
} from 'lucide-react'
import { get, post } from '@/api/axios'
import axiosInstance from '@/api/axios'

// ─── InfoCard ─────────────────────────────────────────────────────────────────
function InfoCard({ icon: Icon, label, value, sub, color = 'text-blue-600', bg = 'bg-blue-50' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${bg} shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 truncate">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'import', label: 'Importer CSV',     icon: Upload      },
  { id: 'add',    label: 'Ajouter une maladie', icon: BookOpen },
]

// ─── EMPTY FORM STATE ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  maladie: '',
  symptomes: ['', '', ''],
  age_min: '0',
  age_max: '100',
  sexe_predominant: 'Both',
  analyses: '',
  resultats: '',
  niveau_urgence: '',
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDataset() {
  const [tab, setTab]             = useState('import')
  const [info, setInfo]           = useState(null)
  const [backups, setBackups]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const [result, setResult]       = useState(null)
  const [showBackups, setShowBackups] = useState(false)
  const fileRef = useRef(null)

  // Add-disease form
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)

  useEffect(() => { loadInfo() }, [])

  const loadInfo = async () => {
    setLoading(true)
    const [infoRes, backupsRes] = await Promise.all([
      get('/admin/dataset/info'),
      get('/admin/dataset/backups'),
    ])
    if (infoRes.success)    setInfo(infoRes.data?.data || infoRes.data)
    if (backupsRes.success) setBackups(backupsRes.data?.data || [])
    setLoading(false)
  }

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setResult({ ok: false, message: 'Le fichier doit être un CSV (.csv)' })
      return
    }
    setUploading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await axiosInstance.post('/admin/dataset/upload', formData)
      setResult({ ok: true, message: response.data?.message || 'Dataset mis à jour !' })
      await loadInfo()
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Erreur lors de l'upload"
      setResult({ ok: false, message: msg })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleReload = async () => {
    setReloading(true)
    setResult(null)
    const res = await post('/admin/dataset/reload')
    if (res.success) {
      setResult({ ok: true, message: res.data?.message || 'Dataset rechargé avec succès' })
      await loadInfo()
    } else {
      setResult({ ok: false, message: res.error || 'Erreur lors du rechargement' })
    }
    setReloading(false)
  }

  // ── Add disease form handlers ──────────────────────────────────────────────
  const setSymptom = (i, v) =>
    setForm(f => { const s = [...f.symptomes]; s[i] = v; return { ...f, symptomes: s } })

  const addSymptomField = () => {
    if (form.symptomes.length >= 9) return
    setForm(f => ({ ...f, symptomes: [...f.symptomes, ''] }))
  }

  const removeSymptomField = (i) => {
    if (form.symptomes.length <= 1) return
    setForm(f => { const s = [...f.symptomes]; s.splice(i, 1); return { ...f, symptomes: s } })
  }

  const handleSaveDisease = async (e) => {
    e.preventDefault()
    if (!form.maladie.trim()) { setResult({ ok: false, message: 'Le nom de la maladie est requis.' }); return }
    const filledSymptomes = form.symptomes.map(s => s.trim()).filter(Boolean)
    if (filledSymptomes.length === 0) { setResult({ ok: false, message: 'Au moins un symptôme est requis.' }); return }

    setSaving(true)
    setResult(null)
    const res = await post('/admin/dataset/add-disease', {
      maladie: form.maladie.trim(),
      symptomes: filledSymptomes,
      age_min: parseInt(form.age_min) || 0,
      age_max: parseInt(form.age_max) || 100,
      sexe_predominant: form.sexe_predominant,
      analyses: form.analyses.trim(),
      resultats: form.resultats.trim(),
      niveau_urgence: form.niveau_urgence.trim(),
    })
    if (res.success) {
      const data = res.data?.data || res.data
      setResult({ ok: true, message: data?.message || `Maladie "${form.maladie}" ajoutée.` })
      setForm(EMPTY_FORM)
      await loadInfo()
    } else {
      setResult({ ok: false, message: res.error || 'Erreur lors de la sauvegarde.' })
    }
    setSaving(false)
  }

  const disk   = info?.disk       || {}
  const memory = info?.in_memory  || {}

  const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestion du dataset IA</h1>
          <p className="text-sm text-slate-400 mt-0.5">Mettez à jour la base de maladies sans redémarrer le serveur</p>
        </div>
        <button
          onClick={handleReload}
          disabled={reloading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
          {reloading ? 'Rechargement…' : 'Recharger depuis le disque'}
        </button>
      </div>

      {/* Status cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-24 animate-pulse">
              <div className="w-11 h-11 rounded-xl bg-slate-100 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard icon={Database}  label="Maladies en mémoire" value={memory.diseases_count?.toLocaleString('fr-FR')} sub="Moteur IA actif"   color="text-blue-600"    bg="bg-blue-50" />
          <InfoCard icon={Activity}  label="Symptômes indexés"   value={memory.symptoms_count?.toLocaleString('fr-FR')} sub="Après IDF"         color="text-violet-600" bg="bg-violet-50" />
          <InfoCard icon={HardDrive} label="Taille sur disque"   value={disk.size_kb ? `${disk.size_kb} Ko` : '—'}      sub={disk.filename}    color="text-emerald-600" bg="bg-emerald-50" />
          <InfoCard icon={Clock}     label="Dernière mise à jour" value={fmtDate(disk.last_modified)?.split(' ')[0]}    sub={fmtDate(disk.last_modified)?.split(' ')[1]} color="text-amber-600" bg="bg-amber-50" />
        </div>
      )}

      {/* Result banner */}
      {result && (
        <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium ${
          result.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {result.ok
            ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            : <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
          <p>{result.message}</p>
          <button onClick={() => setResult(null)} className="ml-auto text-current opacity-50 hover:opacity-100 shrink-0">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setResult(null) }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              tab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Import CSV ──────────────────────────────────────────────────── */}
      {tab === 'import' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Importer un nouveau dataset complet</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fichier CSV UTF-8 — colonnes requises :&nbsp;
              {['Maladie', 'Symptôme_1', 'Age_Min', 'Age_Max', 'Sexe_Predominant'].map(c => (
                <code key={c} className="bg-slate-100 px-1 rounded text-xs mx-0.5">{c}</code>
              ))}
            </p>
          </div>

          <div className="p-6">
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

              {uploading ? (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto">
                    <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Upload en cours…</p>
                  <p className="text-xs text-slate-400">Validation + rechargement du moteur IA</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-colors ${dragOver ? 'bg-blue-200' : 'bg-slate-100'}`}>
                    <Upload className={`w-7 h-7 ${dragOver ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {dragOver ? 'Déposez le fichier ici' : 'Glissez-déposez votre CSV ici'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">ou cliquez pour sélectionner un fichier</p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">.csv uniquement</span>
                </div>
              )}
            </div>

            {/* Steps */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Shield,   color: 'text-blue-600',    bg: 'bg-blue-50',    title: '1. Validation',      desc: 'Colonnes vérifiées, format contrôlé' },
                { icon: HardDrive,color: 'text-violet-600',  bg: 'bg-violet-50',  title: '2. Sauvegarde',      desc: 'Ancien dataset archivé automatiquement' },
                { icon: Zap,      color: 'text-emerald-600', bg: 'bg-emerald-50', title: '3. Rechargement IA', desc: 'Moteur mis à jour sans redémarrage' },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Ajouter une maladie ─────────────────────────────────────────── */}
      {tab === 'add' && (
        <form onSubmit={handleSaveDisease} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Ajouter une maladie au dataset</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              La maladie sera ajoutée au CSV actif et le moteur IA sera rechargé immédiatement.
            </p>
          </div>

          <div className="p-6 space-y-6">

            {/* Maladie name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Nom de la maladie <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="ex : Paludisme grave (Malaria)"
                value={form.maladie}
                onChange={e => setForm(f => ({ ...f, maladie: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Symptômes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Symptômes <span className="text-red-500">*</span>
                  <span className="ml-1 normal-case text-slate-400 font-normal">(max 9)</span>
                </label>
                {form.symptomes.length < 9 && (
                  <button type="button" onClick={addSymptomField}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {form.symptomes.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Symptôme ${i + 1}${i === 0 ? ' (principal)' : ''}`}
                      value={s}
                      onChange={e => setSymptom(i, e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                    {form.symptomes.length > 1 && (
                      <button type="button" onClick={() => removeSymptomField(i)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Age + Sexe */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Âge minimum</label>
                <input
                  type="number" min="0" max="120"
                  value={form.age_min}
                  onChange={e => setForm(f => ({ ...f, age_min: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Âge maximum</label>
                <input
                  type="number" min="0" max="120"
                  value={form.age_max}
                  onChange={e => setForm(f => ({ ...f, age_max: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Sexe prédominant</label>
                <select
                  value={form.sexe_predominant}
                  onChange={e => setForm(f => ({ ...f, sexe_predominant: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                >
                  <option value="Both">Les deux</option>
                  <option value="M">Masculin (M)</option>
                  <option value="F">Féminin (F)</option>
                </select>
              </div>
            </div>

            {/* Analyses */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                <FlaskConical className="w-3.5 h-3.5 inline mr-1" />
                Analyses biologiques et examens recommandés
              </label>
              <textarea
                rows={3}
                placeholder="ex : NFS, CRP, Frottis sanguin, TDR paludisme, Echographie abdominale..."
                value={form.analyses}
                onChange={e => setForm(f => ({ ...f, analyses: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Résultats attendus + Urgence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Résultats attendus <span className="text-slate-400 font-normal normal-case">(optionnel)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="ex : Anémie, Parasites présents, CRP élevée..."
                  value={form.resultats}
                  onChange={e => setForm(f => ({ ...f, resultats: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Niveau d'urgence <span className="text-slate-400 font-normal normal-case">(optionnel)</span>
                </label>
                <select
                  value={form.niveau_urgence}
                  onChange={e => setForm(f => ({ ...f, niveau_urgence: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                >
                  <option value="">Non spécifié</option>
                  <option value="critique">Critique</option>
                  <option value="élevée">Élevée</option>
                  <option value="modérée">Modérée</option>
                  <option value="faible">Faible</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setForm(EMPTY_FORM)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                Réinitialiser
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-60 transition-all"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Ajout en cours…' : 'Ajouter au dataset'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Backups */}
      {backups.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            onClick={() => setShowBackups(v => !v)}
          >
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Backups disponibles</h2>
              <p className="text-xs text-slate-400 mt-0.5">{backups.length} version(s) archivée(s)</p>
            </div>
            {showBackups ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showBackups && (
            <div className="border-t border-slate-100 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fichier</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Taille</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backups.map((b) => (
                    <tr key={b.filename} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-xs font-mono text-slate-600 truncate max-w-xs">{b.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{b.size_kb} Ko</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(b.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
