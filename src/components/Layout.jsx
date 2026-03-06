import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HardHat, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, profile } = useAuth()

  const roleLabel = profile?.role === 'manager' ? 'Менеджер' : 'Владелец'

  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="sticky top-0 z-30 border-b border-surface-border bg-dark-bg/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-accent" />
            </div>
            <span className="text-lg font-bold tracking-tight">Контроль</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover border border-surface-border text-gray-400">
                {roleLabel}
              </span>
              <span className="text-sm text-gray-500 truncate max-w-[160px]">
                {user?.email}
              </span>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-100 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выход</span>
            </button>
          </motion.div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
