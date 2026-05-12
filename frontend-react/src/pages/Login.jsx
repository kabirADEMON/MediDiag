/**
 * Login Page
 * User authentication page
 */

import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { loginSchema } from '@/utils/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError('')

      const result = await login(data)

      if (result.success) {
        navigate(from, { replace: true })
      } else {
        setError(result.error || 'Échec de la connexion')
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
        <p className="text-gray-600 mt-1">Accédez à votre espace médical</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="medecin@example.com"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Input
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          <LogIn className="w-4 h-4" />
          Se connecter
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            S'inscrire
          </Link>
        </p>
      </div>

      {/* Demo credentials */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 font-medium mb-2">Comptes de démonstration :</p>
        <div className="space-y-1 text-xs text-gray-500">
          <p>👨‍⚕️ Médecin: medecin@demo.com / demo123</p>
          <p>👩‍⚕️ Infirmier: infirmier@demo.com / demo123</p>
          <p>👨‍💼 Admin: admin@demo.com / demo123</p>
        </div>
      </div>
    </div>
  )
}

export default Login
