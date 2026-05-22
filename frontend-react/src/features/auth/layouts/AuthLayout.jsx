/**
 * Auth Layout
 * Pass-through layout for full-page authentication routes (Login, etc.)
 */

import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return <Outlet />
}

export default AuthLayout
