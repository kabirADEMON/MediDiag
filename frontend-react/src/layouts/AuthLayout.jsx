/**
 * Auth Layout
 * Layout for authentication pages (login, register)
 */

import { Outlet } from 'react-router-dom'
import { Activity } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MediDiag</h1>
          <p className="text-gray-600 mt-2">Diagnostic Médical Intelligent</p>
        </div>

        {/* Auth form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2024 MediDiag. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}

export default AuthLayout
