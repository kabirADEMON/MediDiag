import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { AlertTriangle, X } from 'lucide-react'
import Sidebar from '@/components/dashboard/Sidebar'
import Navbar from '@/components/dashboard/Navbar'
import { useAuth } from '@/features/auth/context/AuthContext'

function PasswordChangeBanner() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('pwd_banner_dismissed') === '1'
  )

  if (dismissed) return null

  const handleDismiss = () => {
    sessionStorage.setItem('pwd_banner_dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="flex-1 text-sm text-amber-800">
          Votre compte a été créé par un administrateur. Pour votre sécurité, veuillez{' '}
          <Link to="/settings" className="font-semibold underline underline-offset-2 hover:text-amber-900">
            changer votre mot de passe
          </Link>{' '}
          dès que possible.
        </p>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
          aria-label="Reporter"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {user?.must_change_password === 1 && <PasswordChangeBanner />}

        <main className="flex-1 p-6 lg:p-8 animate-fadeIn">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
