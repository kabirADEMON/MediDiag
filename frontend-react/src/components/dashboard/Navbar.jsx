/**
 * Navbar Component
 * Professional top navigation bar with search, notifications, and user menu
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  User,
  LogOut,
  Settings,
  Search,
  ChevronDown,
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  BarChart3,
  UserCog,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { getInitials, cn } from '@/utils/helpers'

const BREADCRUMBS = {
  '/dashboard': 'Tableau de bord',
  '/patients': 'Patients',
  '/patients/new': 'Nouveau patient',
  '/consultation': 'Consultation',
  '/diagnostics': 'Diagnostics',
  '/statistics': 'Statistiques',
  '/settings': 'Paramètres',
  '/admin/users': 'Utilisateurs',
  '/nurse/suivi': 'Suivi patients',
  '/profile': 'Mon profil',
}

const PAGE_ICONS = {
  '/dashboard': LayoutDashboard,
  '/patients': Users,
  '/consultation': Stethoscope,
  '/diagnostics': FileText,
  '/statistics': BarChart3,
  '/admin/users': UserCog,
}

function getInitialsBg(name) {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-500',
  ]
  if (!name) return colors[0]
  return colors[name.charCodeAt(0) % colors.length]
}

export function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const menuRef = useRef(null)

  const pageName = BREADCRUMBS[location.pathname] || 'MediDiag'
  const PageIcon = PAGE_ICONS[location.pathname] || LayoutDashboard

  const initials = user
    ? getInitials((user.prenom || '') + ' ' + (user.nom || ''))
    : '?'
  const gradientClass = getInitialsBg(user?.nom || '')

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <header
      className="sticky top-0 z-30 flex items-center h-16 px-6 bg-white border-b border-slate-200/80"
      style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.03)' }}
    >
      {/* Left — Mobile hamburger + Page title */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title with icon */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
            <PageIcon className="w-4 h-4" />
          </div>
          <h1 className="text-sm font-semibold text-slate-800 tracking-tight">
            {pageName}
          </h1>
        </div>
      </div>

      {/* Center — Search bar (desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
        <div
          className={cn(
            'relative w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-200',
            searchFocused
              ? 'border-blue-300 bg-white shadow-glow-blue'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
          )}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-transparent border-none outline-none"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-2xs font-medium text-slate-400 bg-slate-100 rounded border border-slate-200">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right — User menu */}
      <div className="flex items-center gap-2">
        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              'flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-150',
              userMenuOpen
                ? 'bg-slate-100 text-slate-900'
                : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br shadow-sm',
                gradientClass
              )}
            >
              {initials}
            </div>

            {/* Name */}
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-semibold text-slate-800 leading-none">
                {user?.prenom} {user?.nom}
              </span>
              <span className="text-xs text-slate-400 capitalize mt-0.5">
                {user?.role}
              </span>
            </div>

            <ChevronDown
              className={cn(
                'hidden md:block w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
                userMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200/80 py-2 z-50 animate-scaleIn"
              style={{ boxShadow: 'var(--shadow-dropdown)' }}
            >
              {/* User info header */}
              <div className="px-4 py-3 border-b border-slate-100 mb-1">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-gradient-to-br',
                      gradientClass
                    )}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.prenom} {user?.nom}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="px-1.5">
                <button
                  onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  Mon profil
                </button>

                <button
                  onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                    <Settings className="w-3.5 h-3.5" />
                  </span>
                  Paramètres
                </button>
              </div>

              <div className="mx-3 my-1.5 h-px bg-slate-100" />

              <div className="px-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-red-500 shrink-0">
                    <LogOut className="w-3.5 h-3.5" />
                  </span>
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
