import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Features — public API via index.js
import { AuthLayout, Login } from '@/features/auth'
import { Patients, PatientNew, PatientDetails } from '@/features/patients'
import { Consultation, NurseSuivi } from '@/features/consultation'
import { Diagnostics, Statistics } from '@/features/clinical-engine'

// Shared pages (not feature-owned)
import Dashboard from '@/pages/Dashboard'
import Settings from '@/pages/Settings'
import AdminUsers from '@/pages/AdminUsers'
import AdminDataset from '@/pages/AdminDataset'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected routes - all authenticated users */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />

        {/* Medecin + Infirmier only */}
        <Route path="/patients" element={
          <ProtectedRoute requiredPermission="patients"><Patients /></ProtectedRoute>
        } />
        <Route path="/patients/new" element={
          <ProtectedRoute requiredRole="infirmier"><PatientNew /></ProtectedRoute>
        } />
        <Route path="/patients/:id" element={
          <ProtectedRoute requiredPermission="patients"><PatientDetails /></ProtectedRoute>
        } />

        {/* Medecin only */}
        <Route path="/consultation" element={
          <ProtectedRoute requiredPermission="diagnose"><Consultation /></ProtectedRoute>
        } />
        <Route path="/diagnostics" element={
          <ProtectedRoute requiredPermission="diagnose"><Diagnostics /></ProtectedRoute>
        } />
        <Route path="/statistics" element={
          <ProtectedRoute requiredPermission="diagnose"><Statistics /></ProtectedRoute>
        } />

        {/* Nurse routes */}
        <Route path="/nurse/suivi" element={
          <ProtectedRoute requiredRole="infirmier"><NurseSuivi /></ProtectedRoute>
        } />

        {/* Admin only */}
        <Route path="/admin/users" element={
          <ProtectedRoute requiredRole="administrateur"><AdminUsers /></ProtectedRoute>
        } />
        <Route path="/admin/dataset" element={
          <ProtectedRoute requiredRole="administrateur"><AdminDataset /></ProtectedRoute>
        } />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
