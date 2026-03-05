import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FolderKanban, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SkeletonCard } from '../components/Skeleton'
import PageTransition from '../components/PageTransition'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
}

function pluralCategories(n) {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return 'категорий'
  if (last === 1) return 'категория'
  if (last >= 2 && last <= 4) return 'категории'
  return 'категорий'
}

function CircularProgress({ value, size = 72, stroke = 6 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#374151" strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#10b981" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (circumference * value) / 100 }}
          transition={{ type: 'spring', stiffness: 60, damping: 15, duration: 1 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-100">{value}%</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [user])

  async function fetchProjects() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setProjects(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          name: 'Новая стройка',
          progress: 0,
          settings: { categories: [] },
        })
        .select()
        .single()

      if (err) throw err
      setProjects((prev) => [data, ...prev])
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-between mb-8">
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      {/* Header + button */}
      <div className="flex items-center justify-between mb-8">
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold"
        >
          Проекты
        </motion.h1>
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {creating
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Plus className="w-4 h-4" />}
          Новый проект
        </motion.button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center">
            <FolderKanban className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-lg font-semibold text-gray-400">Проектов пока нет</p>
          <p className="text-sm text-gray-600 mt-1">Создайте первый проект, чтобы начать</p>
        </motion.div>
      )}

      {/* Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {projects.map((project) => {
          const categories = project.settings?.categories || []
          return (
            <motion.div
              key={project.id}
              variants={item}
              whileHover={{
                scale: 1.03,
                boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => navigate(`/project/${project.id}`)}
              className="bg-card border border-surface-border rounded-2xl p-5 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold truncate">{project.name}</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {categories.length} {pluralCategories(categories.length)}
                  </p>
                </div>
                <CircularProgress value={project.progress ?? 0} />
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </PageTransition>
  )
}
