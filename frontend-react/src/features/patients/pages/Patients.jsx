import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Search, Plus, Trash2, Eye, AlertTriangle,
  ClipboardList, X, CheckCircle, Loader2,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import * as patientApi from '@/features/patients/api/patientApi'
import { calculateAge } from '@/utils/helpers'

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3"><div className="skeleton h-4 w-20 rounded" /></td>
      <td className="px-4 py-3">
        <div className="skeleton h-4 w-32 rounded mb-1.5" />
        <div className="skeleton h-3 w-24 rounded" />
      </td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-16 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-24 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-3 w-20 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-5 w-20 rounded-full" /></td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <div className="skeleton h-7 w-7 rounded-lg" />
          <div className="skeleton h-7 w-7 rounded-lg" />
        </div>
      </td>
    </tr>
  )
}

export function Patients() {
  const { user } = useAuth()
  const role = user?.role || 'medecin'
  const canDelete = role === 'medecin' || role === 'administrateur'

  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { loadPatients() }, [pagination.page])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const response = await patientApi.getPatients({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
      })
      if (response.success && response.data) {
        const d = response.data.data || response.data
        setPatients(d.patients || [])
        setPagination(prev => ({ ...prev, total: d.total || 0 }))
      }
    } catch {
      setErrorMsg('Erreur lors du chargement des patients')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    loadPatients()
  }

  const handleDeletePatient = async () => {
    if (!deleteConfirm) return
    try {
      setDeleting(true)
      const response = await patientApi.deletePatient(deleteConfirm.id)
      if (response.success) {
        setSuccessMsg(`Patient ${deleteConfirm.prenom} ${deleteConfirm.nom} supprimé`)
        setDeleteConfirm(null)
        loadPatients()
        setTimeout(() => setSuccessMsg(''), 4000)
      } else {
        setErrorMsg(response.error || 'Erreur lors de la suppression')
        setDeleteConfirm(null)
      }
    } catch {
      setErrorMsg('Erreur lors de la suppression du patient')
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {role === 'infirmier' ? 'Admissions et suivi des patients' : 'Gérez vos dossiers patients'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {role === 'infirmier' && (
            <Link to="/nurse/suivi">
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <ClipboardList className="w-4 h-4" />
                Suivi
              </button>
            </Link>
          )}
          <Link to="/patients/new">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              {role === 'infirmier' ? 'Admettre' : 'Nouveau patient'}
            </button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder-slate-400"
            placeholder="Rechercher par nom, prénom, code patient..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          <Search className="w-4 h-4" />
          Rechercher
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-sm font-semibold text-slate-700">
            {loading ? '…' : pagination.total} patient{pagination.total !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-slate-400">
            Page {pagination.page} / {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Code</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Âge / Sexe</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Admission</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : patients.length > 0
                  ? patients.map(patient => (
                    <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                          {patient.code_patient || `PAT-${String(patient.id).padStart(6, '0')}`}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-semibold text-slate-900 leading-none">
                          {patient.prenom} {patient.nom}
                        </p>
                        {patient.email && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{patient.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="text-sm text-slate-700">{calculateAge(patient.date_naissance)} ans</span>
                        <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded border ${
                          patient.sexe === 'M'
                            ? 'bg-sky-50 text-sky-700 border-sky-100'
                            : 'bg-pink-50 text-pink-700 border-pink-100'
                        }`}>
                          {patient.sexe === 'M' ? 'H' : 'F'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">
                        {patient.telephone || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                        {patient.created_at
                          ? new Date(patient.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          patient.a_ete_consulte
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            patient.a_ete_consulte ? 'bg-emerald-500' : 'bg-amber-400'
                          }`} />
                          {patient.a_ete_consulte ? 'Consulté' : 'En attente'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/patients/${patient.id}`}>
                            <button
                              title="Voir le dossier"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          {canDelete && (
                            <button
                              title="Supprimer"
                              onClick={() => setDeleteConfirm(patient)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                  : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-500">Aucun patient trouvé</p>
                        <p className="text-xs text-slate-400 mt-0.5">Modifiez votre recherche ou admettez un nouveau patient</p>
                      </td>
                    </tr>
                  )
              }
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!loading && pagination.total > pagination.limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30">
            <span className="text-xs text-slate-500">
              {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              <button
                disabled={pagination.page >= totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-red-100 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">Supprimer le patient</h3>
                <p className="text-sm text-slate-600 mt-1.5">
                  Êtes-vous sûr de vouloir supprimer{' '}
                  <strong>{deleteConfirm.prenom} {deleteConfirm.nom}</strong>{' '}
                  ({deleteConfirm.code_patient}) ? Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeletePatient}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Patients
