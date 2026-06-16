import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, User, Phone, FileText, Droplet, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { patientSchema } from '@/utils/validators'
import * as patientApi from '@/features/patients/api/patientApi'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function SectionCard({ icon: Icon, title, color = 'blue', children }) {
  const colors = {
    blue:    { bar: 'bg-blue-500',    icon: 'text-blue-600 bg-blue-50' },
    emerald: { bar: 'bg-emerald-500', icon: 'text-emerald-600 bg-emerald-50' },
    violet:  { bar: 'bg-violet-500',  icon: 'text-violet-600 bg-violet-50' },
    rose:    { bar: 'bg-rose-500',    icon: 'text-rose-600 bg-rose-50' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
        <span className={`w-1 h-5 rounded-full ${c.bar} shrink-0`} />
        <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${c.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {children} {required && <span className="text-red-500 normal-case tracking-normal">*</span>}
    </label>
  )
}

function FieldInput({ error, className = '', ...props }) {
  return (
    <>
      <input
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-300
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
          ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </>
  )
}

function FieldTextarea({ error, rows = 3, ...props }) {
  return (
    <>
      <textarea
        rows={rows}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-300 resize-none
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
          ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </>
  )
}

export function PatientNew() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [patientCode, setPatientCode] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nom: '', prenom: '', date_naissance: '', sexe: 'M',
      telephone: '', email: '', adresse: '',
      antecedents_medicaux: '', allergies: '', groupe_sanguin: '',
    },
  })

  const sexe = watch('sexe')

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      const response = await patientApi.createPatient(data)
      if (response.success) {
        const patient = response.data?.data || response.data
        setSuccess(true)
        setPatientCode(patient?.code_patient || '')
        reset()
        setTimeout(() => navigate('/patients'), 3000)
      } else {
        setError(response.error || 'Échec de la création du patient')
      }
    } catch {
      setError('Une erreur est survenue lors de la création du patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/patients')}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nouveau patient</h1>
          <p className="text-sm text-slate-400 mt-0.5">Enregistrement dans le système hospitalier</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 px-4 py-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Patient créé avec succès</p>
            {patientCode && (
              <p className="text-sm text-emerald-700 mt-1">
                Code assigné :{' '}
                <span className="font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded text-emerald-900">
                  {patientCode}
                </span>
              </p>
            )}
            <p className="text-xs text-emerald-600 mt-1">Redirection vers la liste...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Identité */}
        <SectionCard icon={User} title="Identité du patient" color="blue">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Prénom</FieldLabel>
              <FieldInput placeholder="Jean" error={errors.prenom?.message} {...register('prenom')} />
            </div>
            <div>
              <FieldLabel required>Nom</FieldLabel>
              <FieldInput placeholder="Dupont" error={errors.nom?.message} {...register('nom')} />
            </div>
            <div>
              <FieldLabel required>Date de naissance</FieldLabel>
              <FieldInput type="date" error={errors.date_naissance?.message} {...register('date_naissance')} />
            </div>
            <div>
              <FieldLabel required>Sexe</FieldLabel>
              <div className="flex gap-2 mt-1">
                {[{ v: 'M', label: 'Masculin' }, { v: 'F', label: 'Féminin' }].map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValue('sexe', v)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      sexe === v
                        ? v === 'M'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Coordonnées */}
        <SectionCard icon={Phone} title="Coordonnées" color="violet">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Téléphone</FieldLabel>
              <Controller
                name="telephone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.telephone?.message}
                  />
                )}
              />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <FieldInput
                type="email"
                placeholder="patient@exemple.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Adresse</FieldLabel>
              <FieldTextarea
                placeholder="Rue, quartier, ville..."
                rows={2}
                error={errors.adresse?.message}
                {...register('adresse')}
              />
            </div>
          </div>
        </SectionCard>

        {/* Informations médicales */}
        <SectionCard icon={FileText} title="Informations médicales" color="emerald">
          <div className="space-y-4">
            <div>
              <FieldLabel>Groupe sanguin</FieldLabel>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map(g => {
                  const selected = watch('groupe_sanguin') === g
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setValue('groupe_sanguin', selected ? '' : g)}
                      className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                        selected
                          ? 'bg-red-500 text-white border-red-500 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-red-200 hover:text-red-600'
                      }`}
                    >
                      {g}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <FieldLabel>Antécédents médicaux</FieldLabel>
              <FieldTextarea
                placeholder="Diabète, hypertension, chirurgies antérieures..."
                rows={3}
                error={errors.antecedents_medicaux?.message}
                {...register('antecedents_medicaux')}
              />
            </div>
            <div>
              <FieldLabel>Allergies connues</FieldLabel>
              <FieldTextarea
                placeholder="Pénicilline, arachides, latex..."
                rows={2}
                error={errors.allergies?.message}
                {...register('allergies')}
              />
            </div>
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || success}
          >
            <Save className="w-4 h-4" />
            Enregistrer le patient
          </Button>
        </div>
      </form>
    </div>
  )
}

export default PatientNew
