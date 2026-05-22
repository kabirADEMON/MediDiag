/**
 * Sidebar Component
 * Professional dark sidebar with role-based navigation
 */

import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/helpers'
import { useAuth } from '@/features/auth/context/AuthContext'
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  BarChart3,
  Settings,
  Activity,
  X,
  UserCog,
  ClipboardList,
  ChevronRight,
  Shield,
  Heart,
} from 'lucide-react'

const NAV_BY_ROLE = {
  medecin: {
    sections: [
      {
        label: 'PRINCIPAL',
        items: [
          { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Patients', href: '/patients', icon: Users },
          { name: 'Consultation', href: '/consultation', icon: Stethoscope },
          { name: 'Diagnostics', href: '/diagnostics', icon: FileText },
          { name: 'Statistiques', href: '/statistics', icon: BarChart3 },
        ],
      },
      {
        label: 'COMPTE',
        items: [
          { name: 'Paramètres', href: '/settings', icon: Settings },
        ],
      },
    ],
  },
  infirmier: {
    sections: [
      {
        label: 'PRINCIPAL',
        items: [
          { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Patients', href: '/patients', icon: Users },
          { name: 'Suivi patients', href: '/nurse/suivi', icon: ClipboardList },
        ],
      },
      {
        label: 'COMPTE',
        items: [
          { name: 'Paramètres', href: '/settings', icon: Settings },
        ],
      },
    ],
  },
  administrateur: {
    sections: [
      {
        label: 'PRINCIPAL',
        items: [
          { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
        ],
      },
      {
        label: 'ADMINISTRATION',
        items: [
          { name: 'Utilisateurs', href: '/admin/users', icon: UserCog },
          { name: 'Paramètres', href: '/settings', icon: Settings },
        ],
      },
    ],
  },
}

const roleConfig = {
  medecin: {
    label: 'Médecin',
    icon: Stethoscope,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
  },
  infirmier: {
    label: 'Infirmier(e)',
    icon: Heart,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
  },
  administrateur: {
    label: 'Administrateur',
    icon: Shield,
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
  },
}

function getInitialsBg() {
  return ''
}

function NavSection({ section, onClose }) {
  return (
    <div className="mb-1">
      <p className="px-4 mb-2 text-2xs font-bold tracking-widest uppercase text-slate-600 select-none">
        {section.label}
      </p>
      <div className="space-y-0.5 px-2">
        {section.items.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            end={item.href === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/6 hover:text-slate-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left-side indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-full" />
                )}
                <span
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-150',
                    isActive
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'text-slate-500 group-hover:text-slate-300 group-hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                </span>
                <span className="flex-1 leading-none tracking-tight">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

function SidebarContent({ user, navigation, onClose }) {
  const role = user?.role || 'medecin'
  const rc = roleConfig[role] || roleConfig.medecin
  const RoleIcon = rc.icon
  const initials = user
    ? ((user.prenom?.[0] || '') + (user.nom?.[0] || '')).toUpperCase() || '?'
    : '?'
  getInitialsBg()

  return (
    <div
      className="flex flex-col h-full bg-sidebar-gradient"
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #141e30 50%, #1e293b 100%)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-extrabold text-white tracking-tight leading-none">
            MediDiag
          </span>
          <span className="text-2xs text-slate-500 tracking-wide mt-0.5">
            Diagnostic IA
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 mb-5 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 px-2 overflow-y-auto scrollbar-none space-y-3 pb-4">
        {navigation.sections.map((section) => (
          <NavSection key={section.label} section={section} onClose={onClose} />
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* User profile section */}
      <div className="px-3 pb-4 shrink-0">
        <div className={cn(
          'flex items-center gap-3 px-3 py-3 rounded-xl border',
          rc.bg, rc.border
        )}>
          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-none">
              {user?.prenom} {user?.nom}
            </p>
            <div className={cn('flex items-center gap-1 mt-1', rc.color)}>
              <RoleIcon className="w-3 h-3 shrink-0" />
              <p className="text-2xs font-semibold truncate">{rc.label}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const navigation = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.medecin

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:w-[280px] z-20 shadow-xl">
        <SidebarContent user={user} navigation={navigation} />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col lg:hidden',
          'transform transition-transform duration-300 ease-in-out shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent user={user} navigation={navigation} onClose={onClose} />
      </aside>
    </>
  )
}

export default Sidebar
