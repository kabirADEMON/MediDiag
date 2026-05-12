/**
 * Application Routes
 * Centralized routing configuration
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Pages
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Patients from '@/pages/Patients'
import PatientNew from '@/pages/PatientNew'
import PatientDetails from '@/pages/PatientDetails'
import Consultation from '@/pages/Consultation'
import Diagnostics from '@/pages/Diagnostics'
import Statistics from '@/pages/Statistics'
import Settings from '@/pages/Settings'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/new" element={<PatientNew />} />
        <Route path="/patients/:id" element={<PatientDetails />} />
        <Route path="/consultation" element={<Consultation />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
