import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Activity, Shield, Lock } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { loginSchema } from '@/utils/validators'
import { cn } from '@/utils/helpers'

const DEMO_ACCOUNTS = [
  { role: 'Médecin',   email: 'medecin@demo.com',   password: 'demo123', cls: 'text-blue-300 bg-white/10 border-white/20 hover:bg-white/20' },
  { role: 'Infirmier', email: 'infirmier@demo.com', password: 'demo123', cls: 'text-emerald-300 bg-white/10 border-white/20 hover:bg-white/20' },
  { role: 'Admin',     email: 'admin@demo.com',      password: 'demo123', cls: 'text-violet-300 bg-white/10 border-white/20 hover:bg-white/20' },
]

export function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuth()

  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError('')
      const result = await login(data)
      if (result.success) {
        navigate(from, { replace: true })
      } else {
        setError(result.error || 'Identifiants incorrects')
      }
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (account) => {
    setValue('email', account.email, { shouldValidate: true })
    setValue('password', account.password, { shouldValidate: true })
    setError('')
  }

  // Fond commun aux deux panneaux
  const sharedBg = {
    background: 'linear-gradient(150deg, #0f172a 0%, #0f2557 55%, #1e3a8a 100%)',
  }
  const gridOverlay = {
    backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
    backgroundSize: '40px 40px',
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:w-[520px] xl:w-[580px] shrink-0 relative overflow-hidden">

        <div className="absolute inset-0" style={sharedBg} />
        <div className="absolute inset-0 opacity-[0.04]" style={gridOverlay} />

        {/* Glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(96,165,250,0.12)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(37,99,235,0.15)' }} />

        {/* Séparateur vertical subtil */}
        <div className="absolute top-0 right-0 bottom-0 w-px"
          style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="relative flex flex-col h-full px-14 py-12">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl shadow-lg shadow-blue-900/40"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">MediDiag</span>
              <span className="block text-blue-300/60 tracking-[3px] uppercase mt-0.5" style={{ fontSize: 8 }}>
                Système Hospitalier
              </span>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 flex flex-col justify-center py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 self-start"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
              <span className="text-xs font-semibold text-blue-100/80">Système opérationnel</span>
            </div>

            <h1 className="text-[2.6rem] font-black text-white leading-[1.1] tracking-tight mb-4">
              Diagnostic médical<br />assisté par IA
            </h1>

            <p className="text-blue-200/60 text-[14px] leading-relaxed max-w-xs">
              Plateforme d'aide à la décision clinique pour les professionnels de santé.
            </p>

            {/* KPI grid */}
            <div className="mt-10 grid grid-cols-3 rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {[
                { v: '106',   l: 'Maladies référencées' },
                { v: '90.7%', l: 'Précision du modèle'  },
                { v: '3',     l: 'Rôles professionnels'  },
              ].map((s, i) => (
                <div key={i} className="px-5 py-5"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  }}>
                  <p className="text-2xl font-black text-white tabular-nums">{s.v}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(147,197,253,0.6)' }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer gauche */}
          <div className="flex items-center gap-2" style={{ color: 'rgba(147,197,253,0.4)' }}>
            <Shield className="w-3.5 h-3.5" />
            <span className="text-xs">Accès restreint · Données sécurisées · Confidentiel</span>
          </div>
        </div>
      </div>

      {/* ── Panneau droit ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-8 sm:px-12">

        <div className="absolute inset-0" style={sharedBg} />
        <div className="absolute inset-0 opacity-[0.04]" style={gridOverlay} />

        {/* Glow droit */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(96,165,250,0.10)' }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(37,99,235,0.14)' }} />

        <div className="relative z-10 w-full max-w-[380px]">

          {/* Brand mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-white">MediDiag</span>
          </div>

          {/* En-tête formulaire */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Lock className="w-3 h-3 text-blue-300" />
              <span className="text-xs font-bold text-blue-200/80 uppercase tracking-wider">Accès sécurisé</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight leading-none">Connexion</h2>
            <p className="text-sm text-blue-200/60 mt-2 leading-relaxed">
              Identifiez-vous pour accéder à votre espace professionnel.
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 mb-6 rounded-xl text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-blue-100/80 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                placeholder="prenom.nom@etablissement.com"
                autoComplete="email"
                {...register('email')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all duration-150',
                  errors.email
                    ? 'border border-red-400/50 bg-red-500/10'
                    : 'border border-white/15 bg-white/10 hover:bg-white/15 focus:bg-white/18'
                )}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-300">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-100/80 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className={cn(
                    'w-full pl-4 pr-12 py-3 rounded-xl text-sm text-white placeholder-white/30',
                    'focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all duration-150',
                    errors.password
                      ? 'border border-red-400/50 bg-red-500/10'
                      : 'border border-white/15 bg-white/10 hover:bg-white/15 focus:bg-white/18'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-300">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl mt-2',
                'text-sm font-bold text-white bg-blue-600',
                'hover:bg-blue-500 active:bg-blue-700',
                'shadow-lg shadow-blue-900/50',
                'focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-transparent',
                'transition-all duration-200',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>

          {/* Comptes démo */}
          <div className="mt-8 pt-7" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-bold text-blue-300/50 uppercase tracking-widest text-center mb-4">
              Comptes de démonstration
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className={cn(
                    'py-2.5 px-3 text-xs font-bold rounded-xl border transition-all duration-150',
                    account.cls
                  )}
                >
                  {account.role}
                </button>
              ))}
            </div>
          </div>

          {/* Footer droit */}
          <div className="flex items-center justify-center gap-2 mt-8" style={{ color: 'rgba(147,197,253,0.4)' }}>
            <Shield className="w-3.5 h-3.5" />
            <span className="text-xs">Usage uniquement destiné aux professionnels de santé</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
