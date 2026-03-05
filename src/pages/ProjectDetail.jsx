import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  FolderOpen,
  Settings,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SkeletonDetail } from '../components/Skeleton'
import PageTransition from '../components/PageTransition'
import AdminPanel from '../components/AdminPanel'

/* ── helpers ── */

function progressColor(v) {
  if (v < 30) return '#ef4444'
  if (v <= 70) return '#eab308'
  return '#10b981'
}

function progressBg(v) {
  if (v < 30) return 'bg-red-500'
  if (v <= 70) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

/* ── circular progress ── */

function CircularProgress({ value, size = 120, stroke = 8 }) {
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
          fill="none"
          stroke="#10b981"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (circumference * value) / 100 }}
          transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-100">{value}%</span>
        <span className="text-xs text-gray-500">общий</span>
      </div>
    </div>
  )
}

/* ── linear bar ── */

function LinearProgress({ value }) {
  return (
    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${progressBg(value)}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 15 }}
      />
    </div>
  )
}

/* ── category tile ── */

const tileVariant = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
}

function CategoryTile({ cat }) {
  const [open, setOpen] = useState(false)
  const links = cat.links || []
  const photos = cat.photos || []
  const hasContent = links.length > 0 || photos.length > 0

  return (
    <motion.div
      layout
      variants={tileVariant}
      onClick={() => hasContent && setOpen((o) => !o)}
      className={`bg-card border border-surface-border rounded-xl p-4 ${
        hasContent ? 'cursor-pointer' : ''
      }`}
    >
      <motion.div layout="position" className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold truncate">{cat.name}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-sm font-bold"
            style={{ color: progressColor(cat.progress) }}
          >
            {cat.progress}%
          </span>
          {hasContent && (
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div layout="position" className="mt-3">
        <LinearProgress value={cat.progress} />
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-surface-border space-y-4">
              {links.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Ссылки
                  </p>
                  <ul className="space-y-1.5">
                    {links.map((link, i) => (
                      <li key={i}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{link.title || link.url}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {photos.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Фото
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-700 hover:ring-2 hover:ring-emerald-500 transition-all"
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── grid variants ── */

const gridVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

/* ── main ── */

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
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
  }, [id])

  if (loading) {
    return (
      <PageTransition>
        <SkeletonDetail />
      </PageTransition>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16">
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
      </div>
    )
  }

  const categories = project?.settings?.categories || []
  const overallProgress =
    categories.length > 0
      ? Math.round(
          categories.reduce((s, c) => s + (c.progress || 0), 0) / categories.length
        )
      : 0

  const isOwner = user?.id === project?.owner_id

  return (
    <PageTransition>
      {/* header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-surface-border text-gray-400 hover:text-gray-100 hover:border-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold truncate">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {project.description}
            </p>
          )}
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAdmin(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-surface-border text-sm font-medium text-gray-300 hover:text-gray-100 hover:border-accent rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Настроить</span>
          </button>
        )}
      </div>

      {/* overall progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 18 }}
        className="flex justify-center mb-10"
      >
        <CircularProgress value={overallProgress} />
      </motion.div>

      {/* empty */}
      {categories.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-card border border-surface-border flex items-center justify-center">
            <FolderOpen className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-lg font-semibold text-gray-400">Нет данных</p>
          <p className="text-sm text-gray-600 mt-1">Настройте проект через панель администратора</p>
        </motion.div>
      )}

      {/* category grid */}
      {categories.length > 0 && (
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {categories.map((cat) => (
            <CategoryTile key={cat.id} cat={cat} />
          ))}
        </motion.div>
      )}

      {/* admin panel */}
      <AnimatePresence>
        {showAdmin && project && (
          <AdminPanel
            project={project}
            onClose={() => setShowAdmin(false)}
            onProjectUpdated={(updated) => setProject(updated)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
