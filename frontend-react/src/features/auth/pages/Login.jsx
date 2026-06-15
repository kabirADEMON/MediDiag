import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { loginSchema } from '@/utils/validators'
import { cn } from '@/utils/helpers'

const DEMO_ACCOUNTS = [
  { role: 'Médecin', email: 'medecin@demo.com', password: 'demo123' },
  { role: 'Infirmier', email: 'infirmier@demo.com', password: 'demo123' },
  { role: 'Admin', email: 'admin@demo.com', password: 'demo123' },
]

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
        setError(result.error || 'Email ou mot de passe incorrect')
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

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-col lg:w-[480px] xl:w-[520px] bg-slate-950 relative overflow-hidden shrink-0">
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(37,99,235,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(79,70,229,0.1) 0%, transparent 50%)',
          }}
        />

        <div className="relative flex flex-col h-full px-12 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
              <Activity className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">MediDiag</span>
          </div>

          {/* Main */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/20 border border-blue-600/30 text-blue-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Système opérationnel
              </span>
            </div>

            <h1 className="text-4xl font-bold text-white leading-tight mt-6 mb-4">
              Aide au diagnostic
              <br />
              médical par IA
            </h1>

            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Analyse symptomatique basée sur plus de 100 pathologies référencées.
              </p>
              
              <p 
              className="text-slate-400 text-base leading-relaxed max-w-sm">
                Précision 90.7% 
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-slate-800">
              {[
                { value: '106 ', label: 'Maladies' },
                { value: '90.7%', label: 'Précision' },
                { value: '3', label: 'Rôles' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-600">© 2026 MediDiag</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">MediDiag</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
            <p className="text-sm text-slate-500 mt-1">Accédez à votre espace sécurisé</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="votre@email.com"
                autoComplete="email"
                {...register('email')}
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                  'transition-colors duration-150',
                  errors.email
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className={cn(
                    'w-full pl-3.5 pr-10 py-2.5 rounded-lg border text-sm text-slate-900 placeholder-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                    'transition-colors duration-150',
                    errors.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg',
                'text-sm font-semibold text-white bg-blue-600',
                'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2',
                'transition-colors duration-150',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wide">Comptes de démonstration</p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="flex-1 py-2 px-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 hover:text-slate-800 transition-colors duration-150"
                >
                  {account.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
