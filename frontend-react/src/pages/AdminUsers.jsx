/**
 * Admin - User Management Page
 */

import { useState, useEffect } from 'react'
import { UserCog, Plus, Trash2, AlertTriangle, CheckCircle, X, Eye, EyeOff, Power, PowerOff } from 'lucide-react'
import { get, del, post, patch } from '@/api/axios'

const ROLES = ['medecin', 'infirmier', 'administrateur']
const ROLE_LABELS = { medecin: 'Médecin', infirmier: 'Infirmier', administrateur: 'Administrateur' }
const ROLE_COLORS = {
  medecin: 'bg-blue-50 text-blue-700 border border-blue-100',
  infirmier: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  administrateur: 'bg-red-50 text-red-700 border border-red-100',
}

const emptyForm = { nom: '', prenom: '', email: '', password: '', role: 'medecin', specialite: '' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    const r = await get('/auth/users')
    if (r.success) {
      const data = r.data?.data || r.data
      setUsers(data?.users || [])
    } else {
      setError('Impossible de charger les utilisateurs')
    }
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const r = await del(`/auth/users/${deleteConfirm.id}`)
    if (r.success) {
      setSuccess(`${deleteConfirm.prenom} ${deleteConfirm.nom} supprimé`)
      setDeleteConfirm(null)
      loadUsers()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(r.error || 'Erreur suppression')
      setDeleteConfirm(null)
    }
  }

  const handleToggleActive = async (u) => {
    const r = await patch(`/auth/users/${u.id}/toggle-active`)
    if (r.success) {
      const d = r.data?.data || r.data
      const action = d?.is_active ? 'activé' : 'désactivé'
      setSuccess(`${u.prenom} ${u.nom} ${action}`)
      loadUsers()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(r.error || 'Erreur')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.nom || !form.prenom || !form.email || !form.password) {
      setFormError('Tous les champs obligatoires doivent être remplis')
      return
    }
    setSaving(true)
    const r = await post('/auth/users', form)
    setSaving(false)
    if (r.success) {
      setSuccess(`Utilisateur ${form.prenom} ${form.nom} créé`)
      setShowForm(false)
      setForm(emptyForm)
      loadUsers()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setFormError(r.error || r.data?.detail || 'Erreur création')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-sm text-slate-400 mt-0.5">Administrez les comptes du système</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError('') }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-slate-800">Créer un utilisateur</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'nom', label: 'Nom *', placeholder: 'Nom de famille' },
              { key: 'prenom', label: 'Prénom *', placeholder: 'Prénom' },
              { key: 'email', label: 'Email *', placeholder: 'email@exemple.com', type: 'email' },
              { key: 'specialite', label: 'Spécialité', placeholder: 'Ex: Médecine générale' },
            ].map(({ key, label, placeholder, type = 'text' }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                <input type={type}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Mot de passe *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mot de passe" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Rôle *</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-colors"
                value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Création...' : 'Créer l\'utilisateur'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-sm font-semibold text-slate-700">
            {loading ? '…' : users.length} compte{users.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Utilisateur</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rôle</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Spécialité</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="skeleton w-9 h-9 rounded-full shrink-0" />
                        <div><div className="skeleton h-4 w-28 rounded mb-1.5" /><div className="skeleton h-3 w-10 rounded" /></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="skeleton h-4 w-40 rounded" /></td>
                    <td className="px-4 py-3"><div className="skeleton h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="skeleton h-4 w-28 rounded" /></td>
                    <td className="px-4 py-3"><div className="skeleton h-5 w-14 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1"><div className="skeleton h-7 w-7 rounded-lg" /><div className="skeleton h-7 w-7 rounded-lg" /></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Aucun utilisateur</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50/70 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                          {(u.prenom?.[0] || '') + (u.nom?.[0] || '')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-none">{u.prenom} {u.nom}</p>
                          <p className="text-xs text-slate-400 mt-0.5">#{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-500">{u.specialite || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-2.5">
                      {u.is_active
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Actif</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Désactivé</span>
                      }
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={u.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {u.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(u)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Supprimer l'utilisateur</h3>
                <p className="text-sm text-slate-600 mt-1.5">
                  Êtes-vous sûr de vouloir supprimer <strong>{deleteConfirm.prenom} {deleteConfirm.nom}</strong> ({ROLE_LABELS[deleteConfirm.role] || deleteConfirm.role}) ? Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
