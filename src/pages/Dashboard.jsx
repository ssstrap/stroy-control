import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Loader2,
  AlertCircle,
  Camera,
  Package,
  Warehouse,
  ChevronRight,
  Settings,
  FileDown,
  Archive,
  FolderKanban,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PageTransition from '../components/PageTransition'
import { SkeletonDashboard } from '../components/Skeleton'
import AdminPanel from '../components/AdminPanel'
import { generatePDF } from '../lib/pdf'

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

function pluralCategories(n) {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return 'категорий'
  if (last === 1) return 'категория'
  if (last >= 2 && last <= 4) return 'категории'
  return 'категорий'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── Circular Progress ── */

function CircularProgress({ value, size = 100, stroke = 7 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1e1e3a" strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#10b981" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (circumference * value) / 100 }}
          transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-100">{value}%</span>
        <span className="text-[10px] text-gray-500">прогресс</span>
      </div>
    </div>
  )
}

/* ── Linear Progress ── */

function LinearProgress({ value }) {
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${progressBg(value)}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 15 }}
      />
    </div>
  )
}

/* ── TG Link Button ── */

function TgButton({ icon: Icon, label, url }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 bg-surface-hover border border-surface-border rounded-xl text-sm text-gray-300 hover:text-accent hover:border-accent/30 transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  )
}

/* ── Category Row ── */

function CategoryRow({ cat, onClick }) {
  const subs = cat.subcategories || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card border border-surface-border rounded-xl p-4 cursor-pointer hover:border-accent/30 transition-colors active:bg-surface-hover"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h3 className="text-sm font-semibold truncate">{cat.name}</h3>
          {subs.length > 0 && (
            <span className="text-xs text-gray-600 shrink-0">
              {subs.length} подкат.
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-bold ${progressColor(cat.progress)}`}>
            {cat.progress}%
          </span>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>
      </div>
      <LinearProgress value={cat.progress} />
      {(cat.start_date || cat.end_date) && (
        <p className="text-xs text-gray-600 mt-2">
          {formatDate(cat.start_date)} → {formatDate(cat.end_date)}
        </p>
      )}
    </motion.div>
  )
}

/* ── container anim ── */

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

/* ── Main ── */

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)

  const isManager = profile?.role === 'manager'

  useEffect(() => {
    fetchProject()
  }, [user])

  async function fetchProject() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (err) throw err
      setProject(data)
    } catch (e) {
      if (e.message?.includes('No rows')) {
        setProject(null)
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <SkeletonDashboard />
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
      </PageTransition>
    )
  }

  if (!project) {
    return (
      <PageTransition>
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-card border border-surface-border flex items-center justify-center">
            <FolderKanban className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-lg font-semibold text-gray-400">Нет проектов</p>
          <p className="text-sm text-gray-600 mt-1">Обратитесь к менеджеру</p>
        </div>
      </PageTransition>
    )
  }

  const categories = project.settings?.categories || []
  const tgLinks = project.settings?.telegram_links || {}
  const isArchived = project.status === 'archived'

  const overallProgress =
    categories.length > 0
      ? Math.round(categories.reduce((s, c) => s + (c.progress || 0), 0) / categories.length)
      : 0

  return (
    <PageTransition>
      {/* Project Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-surface-border rounded-2xl p-5 mb-6"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate">{project.name}</h1>
              {isArchived && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-800 border border-gray-700 text-gray-400">
                  <Archive className="w-3 h-3" />
                  Архив
                </span>
              )}
            </div>
            {(project.start_date || project.end_date) && (
              <p className="text-xs text-gray-500">
                {formatDate(project.start_date)} — {formatDate(project.end_date)}
              </p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              {categories.length} {pluralCategories(categories.length)}
            </p>
          </div>
          <CircularProgress value={overallProgress} />
        </div>

        {/* TG Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <TgButton icon={Camera} label="Фотоотчёт" url={tgLinks.photos} />
          <TgButton icon={Package} label="Приход материала" url={tgLinks.materials} />
          <TgButton icon={Warehouse} label="Склад" url={tgLinks.warehouse} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => generatePDF(project)}
            className="flex items-center gap-2 px-3 py-2 bg-surface-hover border border-surface-border rounded-xl text-sm text-gray-300 hover:text-accent hover:border-accent/30 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Скачать отчёт
          </button>
          {isManager && (
            <button
              onClick={() => setShowAdmin(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600/10 border border-emerald-600/30 rounded-xl text-sm text-emerald-400 hover:bg-emerald-600/20 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Настройки
            </button>
          )}
        </div>
      </motion.div>

      {/* Categories list */}
      {categories.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Категории
          </h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                onClick={() => navigate(`/project/${project.id}/category/${cat.id}`)}
              />
            ))}
          </motion.div>
        </>
      )}

      {categories.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-gray-600">Категорий пока нет</p>
        </div>
      )}

      {/* Admin Panel */}
      {showAdmin && (
        <AdminPanel
          project={project}
          onClose={() => setShowAdmin(false)}
          onProjectUpdated={(updated) => setProject(updated)}
        />
      )}
    </PageTransition>
  )
}
