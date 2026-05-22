/**
 * Nurse - Patient Monitoring Page
 * Simplified view for nurses: list patients, record vitals
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Search, User, Thermometer, Heart, Activity, CheckCircle, AlertCircle } from 'lucide-react'
import * as patientApi from '@/features/patients/api/patientApi'
import * as vitalsApi from '@/features/consultation/api/vitalsApi'
import { formatDate } from '@/utils/helpers'

const initialVitals = { temperature: '', pression: '', pouls: '', spo2: '', poids: '', taille: '', observations: '' }

export default function NurseSuivi() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [vitals, setVitals] = useState(initialVitals)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    setLoading(true)
    try {
      const r = await patientApi.getPatients({ limit: 100 })
      if (r.success) {
        const data = r.data?.data || r.data
        setPatients(data?.patients || [])
      }
    } catch (e) {
      setError('Impossible de charger les patients')
    }
    setLoading(false)
  }

  const filtered = patients.filter(p =>
    `${p.nom} ${p.prenom} ${p.code_patient}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleSaveVitals = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const r = await vitalsApi.saveVitals({
      patient_id: selectedPatient.id,
      ...vitals,
    })
    setSaving(false)
    if (r.success) {
      setSaved(true)
      setTimeout(() => { setSaved(false); setSelectedPatient(null); setVitals(initialVitals) }, 2000)
    } else {
      setError(r.error || 'Erreur lors de l\'enregistrement des constantes')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suivi des patients</h1>
          <p className="text-gray-600 text-sm">Enregistrez les constantes vitales</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient list */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Rechercher un patient..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">Aucun patient trouvé</div>
            ) : filtered.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedPatient(p); setVitals(initialVitals); setSaved(false) }}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedPatient?.id === p.id ? 'bg-primary-50 border-l-2 border-primary-500' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                    {p.prenom?.[0]}{p.nom?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-gray-500">{p.code_patient}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Vitals form */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
              <User className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Sélectionnez un patient</p>
              <p className="text-gray-400 text-sm mt-1">pour enregistrer ses constantes vitales</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                    {selectedPatient.prenom?.[0]}{selectedPatient.nom?.[0]}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedPatient.prenom} {selectedPatient.nom}</h2>
                    <p className="text-xs text-gray-500">{selectedPatient.code_patient} · {selectedPatient.sexe === 'M' ? 'Homme' : 'Femme'}</p>
                  </div>
                  <Link to={`/patients/${selectedPatient.id}`}
                    className="ml-auto text-xs text-primary-600 hover:underline">
                    Voir dossier
                  </Link>
                </div>
              </div>

              {saved ? (
                <div className="p-8 flex flex-col items-center text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                  <p className="text-green-700 font-medium">Constantes enregistrées</p>
                  <p className="text-gray-500 text-sm mt-1">Retour à la liste...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveVitals} className="p-5 space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    Constantes vitales
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { key: 'temperature', label: 'Température', unit: '°C', placeholder: '37.0', icon: Thermometer },
                      { key: 'pression', label: 'Pression artérielle', unit: 'mmHg', placeholder: '120/80', icon: Heart },
                      { key: 'pouls', label: 'Pouls', unit: 'bpm', placeholder: '72', icon: Heart },
                      { key: 'spo2', label: 'SpO2', unit: '%', placeholder: '98', icon: Activity },
                      { key: 'poids', label: 'Poids', unit: 'kg', placeholder: '70', icon: User },
                      { key: 'taille', label: 'Taille', unit: 'cm', placeholder: '170', icon: User },
                    ].map(({ key, label, unit, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                        <div className="flex">
                          <input
                            type="text"
                            className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder={placeholder}
                            value={vitals[key]}
                            onChange={e => setVitals({ ...vitals, [key]: e.target.value })}
                          />
                          <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-xs text-gray-500">
                            {unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Observations</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      rows={3}
                      placeholder="Notes d'observation..."
                      value={vitals.observations || ''}
                      onChange={e => setVitals({ ...vitals, observations: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setSelectedPatient(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                      Annuler
                    </button>
                    <button type="submit" disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                      {saving ? 'Enregistrement...' : 'Enregistrer les constantes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
