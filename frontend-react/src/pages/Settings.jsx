import { useState } from 'react'
import { User, Shield, Database, CheckCircle, Eye, EyeOff, Save, KeyRound } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { cn } from '@/utils/helpers'

const ROLE_LABEL = {
  medecin: 'Médecin',
  infirmier: 'Infirmier(e)',
  administrateur: 'Administrateur',
}

function FieldRow({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function inputCls(error) {
  return cn(
    'w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors',
    error ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'
  )
}

export function Settings() {
  const { user, updateProfile, changePassword } = useAuth()
  const role = user?.role || 'medecin'

  // Profile form
  const [profile, setProfile] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    specialite: user?.specialite || '',
  })
  const [profilePwd, setProfilePwd] = useState('')
  const [showProfilePwd, setShowProfilePwd] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password form
  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' })
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false })
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileMsg('')
    setProfileError('')
    if (!profile.nom.trim() || !profile.prenom.trim()) {
      setProfileError('Nom et prénom sont requis')
      return
    }
    if (!profilePwd) {
      setProfileError('Mot de passe requis pour valider les modifications')
      return
    }
    try {
      setSavingProfile(true)
      const result = await updateProfile({ ...profile, current_password: profilePwd })
      if (result.success) {
        setProfilePwd('')
        setProfileMsg('Profil mis à jour avec succès')
        setTimeout(() => setProfileMsg(''), 4000)
      } else {
        setProfileError(result.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      setProfileError('Une erreur est survenue')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwdMsg('')
    setPwdError('')
    if (!pwd.current || !pwd.new || !pwd.confirm) {
      setPwdError('Tous les champs sont requis')
      return
    }
    if (pwd.new !== pwd.confirm) {
      setPwdError('Les nouveaux mots de passe ne correspondent pas')
      return
    }
    if (pwd.new.length < 6) {
      setPwdError('Minimum 6 caractères')
      return
    }
    try {
      setSavingPwd(true)
      const res = await changePassword({
        current_password: pwd.current,
        new_password: pwd.new,
      })
      if (res.success) {
        setPwdMsg('Mot de passe modifié avec succès')
        setPwd({ current: '', new: '', confirm: '' })
        sessionStorage.removeItem('pwd_banner_dismissed')
        setTimeout(() => setPwdMsg(''), 4000)
      } else {
        setPwdError(res.error || res.data?.detail || 'Mot de passe actuel incorrect')
      }
    } catch {
      setPwdError('Une erreur est survenue')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-400 mt-0.5">Gérez votre profil et votre sécurité</p>
      </div>

      {/* Profile section */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Informations du profil</h2>
        </div>
        <div className="p-6">
          {/* Avatar + role */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-lg font-bold">
              {(user?.prenom?.[0] || '') + (user?.nom?.[0] || '')}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.prenom} {user?.nom}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {ROLE_LABEL[role] || role}
              </span>
            </div>
          </div>

          {profileMsg && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" /> {profileMsg}
            </div>
          )}
          {profileError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {profileError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRow label="Prénom">
                <input
                  className={inputCls(false)}
                  value={profile.prenom}
                  onChange={e => setProfile(p => ({ ...p, prenom: e.target.value }))}
                  placeholder="Prénom"
                />
              </FieldRow>
              <FieldRow label="Nom">
                <input
                  className={inputCls(false)}
                  value={profile.nom}
                  onChange={e => setProfile(p => ({ ...p, nom: e.target.value }))}
                  placeholder="Nom de famille"
                />
              </FieldRow>
            </div>

            {role !== 'administrateur' && (
              <FieldRow label="Spécialité">
                <input
                  className={inputCls(false)}
                  value={profile.specialite}
                  onChange={e => setProfile(p => ({ ...p, specialite: e.target.value }))}
                  placeholder="Ex : Médecine générale, Cardiologie..."
                />
              </FieldRow>
            )}

            <FieldRow label="Mot de passe actuel (requis pour valider)">
              <div className="relative">
                <input
                  type={showProfilePwd ? 'text' : 'password'}
                  className={inputCls(!profilePwd && profileError) + ' pr-10'}
                  value={profilePwd}
                  onChange={e => setProfilePwd(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowProfilePwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showProfilePwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FieldRow>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Password section */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Sécurité</h2>
        </div>
        <div className="p-6">
          {pwdMsg && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" /> {pwdMsg}
            </div>
          )}
          {pwdError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {pwdError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { key: 'current', label: 'Mot de passe actuel' },
              { key: 'new', label: 'Nouveau mot de passe' },
              { key: 'confirm', label: 'Confirmer le nouveau mot de passe' },
            ].map(({ key, label }) => (
              <FieldRow key={key} label={label}>
                <div className="relative">
                  <input
                    type={showPwd[key] ? 'text' : 'password'}
                    className={inputCls(false) + ' pr-10'}
                    value={pwd[key]}
                    onChange={e => setPwd(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FieldRow>
            ))}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPwd}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 disabled:opacity-60 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                {savingPwd ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* System info */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Informations système</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { label: 'Version', value: 'MediDiag v1.0.0' },
            { label: 'Modèle IA', value: 'Random Forest + Fuzzy Matching' },
            { label: 'Précision', value: '90.7%' },
            { label: 'Base de données', value: '1 000 maladies référencées' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3.5">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-medium text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Settings
