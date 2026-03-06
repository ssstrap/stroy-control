import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, UserPlus, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-sm bg-card border border-surface-border rounded-2xl p-8 shadow-2xl shadow-black/20"
      >
        <h1 className="text-2xl font-bold text-center mb-1">Контроль</h1>
        <p className="text-gray-500 text-center text-sm mb-6">
          {isSignUp ? 'Создание аккаунта' : 'Вход в систему'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-dark-bg border border-surface-border rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-dark-bg border border-surface-border rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSignUp ? (
              <><UserPlus className="w-5 h-5" /> Регистрация</>
            ) : (
              <><LogIn className="w-5 h-5" /> Войти</>
            )}
          </button>
        </form>
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
          className="w-full mt-4 text-sm text-gray-500 hover:text-accent transition-colors"
        >
          {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
        </button>
      </motion.div>
    </div>
  )
}
