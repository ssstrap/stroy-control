import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  MessageSquare,
  ExternalLink,
  Settings,
  FolderOpen,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PageTransition from '../components/PageTransition'
import { SkeletonCategory } from '../components/Skeleton'
import CategoryAdminPanel from '../components/CategoryAdminPanel'

/* ── helpers ── */

function progressColor(v) {
  if (v < 30) return 'text-red-400'
  if (v <= 70) return 'text-yellow-400'
  return 'text-emerald-400'
}

function progressBg(v) {
  if (v < 30) return 'bg-red-500'
  if (v <= 70) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

/* ── Linear Progress ── */

function LinearProgress({ value, height = 'h-1.5' }) {
  return (
    <div className={`w-full ${height} bg-gray-800 rounded-full overflow-hidden`}>
      <motion.div
        className={`h-full rounded-full ${progressBg(value)}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 15 }}
      />
    </div>
  )
}

/* ── Subcategory Card ── */

function SubcategoryCard({ sub }) {
  const startDate = formatDate(sub.start_date)
  const endDate = formatDate(sub.end_date)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border rounded-xl p-4 ${
        sub.done
          ? 'border-emerald-700/30 bg-emerald-900/10'
          : 'border-surface-border'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {sub.done && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <h3 className={`text-sm font-semibold truncate ${sub.done ? 'text-emerald-300' : ''}`}>
            {sub.name}
          </h3>
        </div>
        <span className={`text-sm font-bold shrink-0 ${progressColor(sub.progress)}`}>
          {sub.progress}%
        </span>
      </div>

      {/* Progress bar */}
      <LinearProgress value={sub.progress} />

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 mt-3">
        {sub.workers > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span>{sub.workers}</span>
          </div>
        )}
        {(startDate || endDate) && (
          <span className="text-xs text-gray-600">
            {startDate || '?'} → {endDate || '?'}
          </span>
        )}
        {sub.telegram_link && (
          <a
            href={sub.telegram_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Telegram
          </a>
        )}
      </div>

      {/* Comment */}
      {sub.comment && (
        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-surface-border">
          <MessageSquare className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 leading-relaxed">{sub.comment}</p>
        </div>
      )}
    </motion.div>
  )
}

/* ── Stagger ── */

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

/* ── Main ── */

export default function CategoryDetail() {
  const { id: projectId, catId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)

  const isManager = profile?.role === 'manager'

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()
        if (err) throw err
        setProject(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (loading) {
    return (
      <PageTransition>
        <SkeletonCategory />
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <div className="flex items-center gap-2 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          ← Назад
        </button>
      </PageTransition>
    )
  }

  const categories = project?.settings?.categories || []
  const category = categories.find((c) => c.id === catId)

  if (!category) {
    return (
      <PageTransition>
        <div className="text-center py-16">
          <p className="text-gray-500">Категория не найдена</p>
          <button
            onClick={() => navigate('/')}
            className="mt-3 text-sm text-accent hover:text-accent-light transition-colors"
          >
            На главную
          </button>
        </div>
      </PageTransition>
    )
  }

  const subs = category.subcategories || []
  const doneSubs = subs.filter((s) => s.done).length
  const catStartDate = formatDate(category.start_date)
  const catEndDate = formatDate(category.end_date)

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-surface-border text-gray-400 hover:text-gray-100 hover:border-accent transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{category.name}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {(catStartDate || catEndDate) && (
                <span>{catStartDate || '?'} → {catEndDate || '?'}</span>
              )}
              {subs.length > 0 && (
                <span>· {doneSubs}/{subs.length} выполнено</span>
              )}
            </div>
          </div>
        </div>

        {isManager && (
          <button
            onClick={() => setShowAdmin(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/10 border border-emerald-600/30 rounded-xl text-sm text-emerald-400 hover:bg-emerald-600/20 transition-colors shrink-0"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Настройки</span>
          </button>
        )}
      </div>

      {/* Overall category progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Прогресс категории</span>
          <span className={`text-sm font-bold ${progressColor(category.progress)}`}>
            {category.progress}%
          </span>
        </div>
        <LinearProgress value={category.progress} height="h-2" />
      </div>

      {/* Subcategories */}
      {subs.length > 0 && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {subs.map((sub) => (
            <SubcategoryCard key={sub.id} sub={sub} />
          ))}
        </motion.div>
      )}

      {subs.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-card border border-surface-border flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">Подкатегорий пока нет</p>
        </div>
      )}

      {/* Admin panel for category */}
      <AnimatePresence>
        {showAdmin && (
          <CategoryAdminPanel
            project={project}
            categoryId={catId}
            onClose={() => setShowAdmin(false)}
            onProjectUpdated={(updated) => setProject(updated)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
