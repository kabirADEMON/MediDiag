import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Menu, User, LogOut, Settings, Search, ChevronDown,
  LayoutDashboard, Users, Stethoscope, FileText, BarChart3,
  UserCog, Bell, Clock, RefreshCw, X,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { getInitials, cn, calculateAge } from '@/utils/helpers'
import { get } from '@/api/axios'

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

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

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

function patientInitials(p) {
  return ((p.prenom?.[0] || '') + (p.nom?.[0] || '')).toUpperCase() || '?'
}

export function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [userMenuOpen, setUserMenuOpen]   = useState(false)
  const [bellOpen, setBellOpen]           = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const [enAttente, setEnAttente]         = useState([])
  const [bellLoading, setBellLoading]     = useState(false)
  const [bellTotal, setBellTotal]         = useState(0)

  const menuRef = useRef(null)
  const bellRef = useRef(null)

  const pageName = BREADCRUMBS[location.pathname] || 'MediDiag'
  const PageIcon = PAGE_ICONS[location.pathname] || LayoutDashboard

  const initials     = user ? getInitials((user.prenom || '') + ' ' + (user.nom || '')) : '?'
  const gradientClass = getInitialsBg(user?.nom || '')

  // Charge les patients en attente via l'endpoint existant (a_ete_consulte = 0)
  const fetchEnAttente = useCallback(async () => {
    setBellLoading(true)
    try {
      const res = await get('/patients', { params: { limit: 200, skip: 0 } })
      if (res.success) {
        const d = res.data?.data || res.data
        const tous = d.patients || []
        const enAttenteFiltered = tous.filter(p => !p.a_ete_consulte)
        setEnAttente(enAttenteFiltered.slice(0, 20))
        setBellTotal(enAttenteFiltered.length)
      }
    } catch {
      // silent
    } finally {
      setBellLoading(false)
    }
  }, [])

  // Charge au montage (pour avoir le badge à jour)
  useEffect(() => {
    if (user?.role === 'medecin') fetchEnAttente()
  }, [user?.role, fetchEnAttente])

  // Ferme sur clic extérieur
  useEffect(() => {
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const toggleBell = () => {
    if (!bellOpen) fetchEnAttente()
    setBellOpen(v => !v)
    setUserMenuOpen(false)
  }

  const isMedecin = user?.role === 'medecin'

  return (
    <header
      className="sticky top-0 z-30 flex items-center h-16 px-6 bg-white border-b border-slate-200/80"
      style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.03)' }}
    >
      {/* Gauche */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
            <PageIcon className="w-4 h-4" />
          </div>
          <h1 className="text-sm font-semibold text-slate-800 tracking-tight">{pageName}</h1>
        </div>
      </div>

      {/* Centre — barre de recherche */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
        <div className={cn(
          'relative w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-200',
          searchFocused
            ? 'border-blue-300 bg-white shadow-glow-blue'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
        )}>
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

      {/* Droite */}
      <div className="flex items-center gap-2">

        {/* ── Cloche notifications (médecin uniquement) ── */}
        {isMedecin && (
          <div className="relative" ref={bellRef}>
            <button
              onClick={toggleBell}
              className={cn(
                'relative flex items-center justify-center w-9 h-9 rounded-xl transition-all',
                bellOpen
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
              )}
              title="Patients en attente"
            >
              <Bell className="w-4 h-4" />
              {bellTotal > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold px-1 border-2 border-white">
                  {bellTotal > 99 ? '99+' : bellTotal}
                </span>
              )}
            </button>

            {/* Panneau notifications */}
            {bellOpen && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200/80 z-50 overflow-hidden"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-bold text-slate-800">Patients en attente</span>
                    {bellTotal > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {bellTotal}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={fetchEnAttente}
                      disabled={bellLoading}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
                      title="Actualiser"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', bellLoading && 'animate-spin')} />
                    </button>
                    <button
                      onClick={() => setBellOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Liste */}
                <div className="max-h-72 overflow-y-auto">
                  {bellLoading ? (
                    <div className="py-8 flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-slate-300 animate-spin" />
                      <p className="text-xs text-slate-400">Chargement...</p>
                    </div>
                  ) : enAttente.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">Tout est à jour</p>
                      <p className="text-xs text-slate-400">Tous les patients ont été consultés</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {enAttente.map(p => {
                        const initPat = patientInitials(p)
                        const color   = AVATAR_COLORS[(p.id || 0) % AVATAR_COLORS.length]
                        const age     = p.date_naissance ? calculateAge(p.date_naissance) : null
                        return (
                          <Link
                            key={p.id}
                            to={`/consultation`}
                            state={{ patientCode: p.code_patient }}
                            onClick={() => setBellOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/50 transition-colors group"
                          >
                            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0', color)}>
                              {initPat}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                                {p.prenom} {p.nom}
                              </p>
                              <p className="text-xs text-slate-400 font-mono">{p.code_patient}{age ? ` · ${age} ans` : ''}</p>
                            </div>
                            <div className="shrink-0">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                En attente
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {enAttente.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/40">
                    <Link
                      to="/patients"
                      onClick={() => setBellOpen(false)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Voir tous les patients →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Menu utilisateur ── */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setBellOpen(false) }}
            className={cn(
              'flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-150',
              userMenuOpen ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
            )}
          >
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br shadow-sm', gradientClass)}>
              {initials}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-semibold text-slate-800 leading-none">{user?.prenom} {user?.nom}</span>
              <span className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</span>
            </div>
            <ChevronDown className={cn('hidden md:block w-3.5 h-3.5 text-slate-400 transition-transform duration-200', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200/80 py-2 z-50 animate-scaleIn"
              style={{ boxShadow: 'var(--shadow-dropdown)' }}
            >
              <div className="px-4 py-3 border-b border-slate-100 mb-1">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-gradient-to-br', gradientClass)}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.prenom} {user?.nom}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

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
