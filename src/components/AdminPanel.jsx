import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Save,
  Trash2,
  Plus,
  AlertTriangle,
  Loader2,
  GripVertical,
  Camera,
  Package,
  Warehouse,
  Archive,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

function uid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)
}

const DEFAULT_CATEGORIES = [
  { id: uid(), name: 'Кровля', progress: 0, start_date: null, end_date: null, subcategories: [] },
  { id: uid(), name: 'Стены', progress: 0, start_date: null, end_date: null, subcategories: [] },
  { id: uid(), name: 'Фундамент', progress: 0, start_date: null, end_date: null, subcategories: [] },
  { id: uid(), name: 'Электрика', progress: 0, start_date: null, end_date: null, subcategories: [] },
  { id: uid(), name: 'Сантехника', progress: 0, start_date: null, end_date: null, subcategories: [] },
  { id: uid(), name: 'Отделка', progress: 0, start_date: null, end_date: null, subcategories: [] },
]

/* ── Delete Modal ── */

function DeleteModal({ projectName, onConfirm, onCancel, deleting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-card border border-surface-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-100">Удалить проект?</h3>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          Проект <strong className="text-gray-200">«{projectName}»</strong> будет удалён
          безвозвратно.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-surface-hover hover:bg-gray-700 text-gray-200 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Удалить
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Category Row (simplified, no subcategory editing here) ── */

function CategoryRow({ cat, onUpdate, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
      className="bg-dark-bg border border-surface-border rounded-xl p-3 space-y-3"
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />
        <input
          value={cat.name}
          onChange={(e) => onUpdate({ ...cat, name: e.target.value })}
          placeholder="Название"
          className="flex-1 min-w-0 px-2.5 py-1.5 text-sm font-medium bg-card border border-surface-border rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
        />
        {confirmDelete ? (
          <div className="flex gap-1 shrink-0">
            <button onClick={onDelete} className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              Да
            </button>
            <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 text-xs bg-surface-hover text-gray-300 rounded-lg transition-colors">
              Нет
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="date"
          value={cat.start_date || ''}
          onChange={(e) => onUpdate({ ...cat, start_date: e.target.value || null })}
          className="flex-1 px-2 py-1.5 text-xs bg-card border border-surface-border rounded-lg text-gray-300 focus:outline-none focus:border-accent transition-colors"
        />
        <input
          type="date"
          value={cat.end_date || ''}
          onChange={(e) => onUpdate({ ...cat, end_date: e.target.value || null })}
          className="flex-1 px-2 py-1.5 text-xs bg-card border border-surface-border rounded-lg text-gray-300 focus:outline-none focus:border-accent transition-colors"
        />
      </div>
    </motion.div>
  )
}

/* ── Main AdminPanel ── */

export default function AdminPanel({ project, onClose, onProjectUpdated }) {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [name, setName] = useState(project.name)
  const [status, setStatus] = useState(project.status || 'active')
  const [startDate, setStartDate] = useState(project.start_date || '')
  const [endDate, setEndDate] = useState(project.end_date || '')
  const [tgPhotos, setTgPhotos] = useState(project.settings?.telegram_links?.photos || '')
  const [tgMaterials, setTgMaterials] = useState(project.settings?.telegram_links?.materials || '')
  const [tgWarehouse, setTgWarehouse] = useState(project.settings?.telegram_links?.warehouse || '')
  const [categories, setCategories] = useState(
    () => (project.settings?.categories || []).map((c) => ({ ...c }))
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setName(project.name)
    setStatus(project.status || 'active')
    setStartDate(project.start_date || '')
    setEndDate(project.end_date || '')
    setTgPhotos(project.settings?.telegram_links?.photos || '')
    setTgMaterials(project.settings?.telegram_links?.materials || '')
    setTgWarehouse(project.settings?.telegram_links?.warehouse || '')
    setCategories((project.settings?.categories || []).map((c) => ({ ...c })))
  }, [project])

  function updateCategory(id, updated) {
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }

  function deleteCategory(id) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  function addCategory() {
    setCategories((prev) => [
      ...prev,
      { id: uid(), name: '', progress: 0, start_date: null, end_date: null, subcategories: [] },
    ])
  }

  function calcProgress(cats) {
    if (cats.length === 0) return 0
    return Math.round(cats.reduce((s, c) => {
      const subs = c.subcategories || []
      const catP = subs.length > 0
        ? Math.round(subs.reduce((ss, sub) => ss + (sub.progress || 0), 0) / subs.length)
        : (c.progress || 0)
      return s + catP
    }, 0) / cats.length)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    // Recalc category progress from subcategories
    const updatedCats = categories.map((cat) => {
      const subs = cat.subcategories || []
      const catProgress = subs.length > 0
        ? Math.round(subs.reduce((s, sub) => s + (sub.progress || 0), 0) / subs.length)
        : (cat.progress || 0)
      return { ...cat, progress: catProgress }
    })

    const overallProgress = calcProgress(updatedCats)

    try {
      const { data, error: err } = await supabase
        .from('projects')
        .update({
          name,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          progress: overallProgress,
          settings: {
            ...project.settings,
            telegram_links: {
              photos: tgPhotos || null,
              materials: tgMaterials || null,
              warehouse: tgWarehouse || null,
            },
            categories: updatedCats,
          },
        })
        .eq('id', project.id)
        .select()
        .single()

      if (err) throw err
      onProjectUpdated(data)
      addToast('Проект сохранён')
      onClose()
    } catch (e) {
      setError(e.message)
      addToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error: err } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
      if (err) throw err
      addToast('Проект удалён')
      navigate('/', { replace: true })
    } catch (e) {
      setError(e.message)
      addToast(e.message, 'error')
      setDeleting(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-dark-bg border-l border-surface-border flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border shrink-0">
          <h2 className="text-lg font-bold">Настройки проекта</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-card border border-surface-border rounded-xl text-gray-100 font-medium focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Статус</label>
            <div className="flex gap-2">
              <button
                onClick={() => setStatus('active')}
                className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  status === 'active'
                    ? 'bg-emerald-600/20 border-emerald-600/50 text-emerald-400'
                    : 'bg-card border-surface-border text-gray-400 hover:text-gray-200'
                }`}
              >
                Активный
              </button>
              <button
                onClick={() => setStatus('archived')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  status === 'archived'
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                    : 'bg-card border-surface-border text-gray-400 hover:text-gray-200'
                }`}
              >
                <Archive className="w-3.5 h-3.5" /> Архив
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Даты проекта</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-card border border-surface-border rounded-xl text-gray-300 focus:outline-none focus:border-accent transition-colors"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-card border border-surface-border rounded-xl text-gray-300 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* TG Links */}
          <div className="space-y-3">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Telegram-ссылки</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-500 shrink-0" />
                <input
                  value={tgPhotos}
                  onChange={(e) => setTgPhotos(e.target.value)}
                  placeholder="Фотоотчёт — https://t.me/..."
                  className="flex-1 px-2.5 py-1.5 text-sm bg-card border border-surface-border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500 shrink-0" />
                <input
                  value={tgMaterials}
                  onChange={(e) => setTgMaterials(e.target.value)}
                  placeholder="Приход материала — https://t.me/..."
                  className="flex-1 px-2.5 py-1.5 text-sm bg-card border border-surface-border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-gray-500 shrink-0" />
                <input
                  value={tgWarehouse}
                  onChange={(e) => setTgWarehouse(e.target.value)}
                  placeholder="Склад — https://t.me/..."
                  className="flex-1 px-2.5 py-1.5 text-sm bg-card border border-surface-border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Категории ({categories.length})
              </label>
              <button
                onClick={addCategory}
                className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить
              </button>
            </div>

            <AnimatePresence initial={false}>
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  onUpdate={(updated) => updateCategory(cat.id, updated)}
                  onDelete={() => deleteCategory(cat.id)}
                />
              ))}
            </AnimatePresence>

            {categories.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">Нет категорий</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-surface-border space-y-2.5 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Удалить проект
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteModal
            projectName={name}
            deleting={deleting}
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
