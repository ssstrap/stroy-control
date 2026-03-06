import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthForm from './AuthForm'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  return user ? <Outlet /> : <AuthForm />
}
