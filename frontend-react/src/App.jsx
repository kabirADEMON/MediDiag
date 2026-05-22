/**
 * Main App Component
 * Root component with providers and routing
 */

import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { AppRoutes } from '@/routes/AppRoutes'
import '@/styles/globals-simple.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
