import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Save,
  Trash2,
  Plus,
  ExternalLink,
  AlertTriangle,
  Loader2,
  GripVertical,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

/* ── helpers ── */

function uid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)
}

/* ── Delete Confirmation Modal ── */

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
          безвозвратно вместе со всеми данными.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-surface-hover hover:bg-surface-border text-gray-200 transition-colors"
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

/* ── Category Link Editor ── */

function LinkEditor({ links, onChange }) {
  function update(i, field, value) {
    const next = links.map((l, j) => (j === i ? { ...l, [field]: value } : l))
    onChange(next)
  }
  function add() {
    onChange([...links, { title: '', url: '' }])
  }
  function remove(i) {
    onChange(links.filter((_, j) => j !== i))
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 uppercase tracking-wide">Ссылки</p>
      <AnimatePresence initial={false}>
        {links.map((link, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input
              value={link.title}
              onChange={(e) => update(i, 'title', e.target.value)}
              placeholder="Название"
              className="flex-1 min-w-0 px-2.5 py-1.5 text-sm bg-surface border border-surface-border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-600 transition-colors"
            />
            <input
              value={link.url}
              onChange={(e) => update(i, 'url', e.target.value)}
              placeholder="https://..."
              className="flex-1 min-w-0 px-2.5 py-1.5 text-sm bg-surface border border-surface-border rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-600 transition-colors"
            />
            <button
              onClick={() => remove(i)}
              className="p-1 text-gray-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <Plus className="w-3 h-3" /> Добавить ссылку
      </button>
    </div>
  )
}

/* ── Category Card ── */

function CategoryCard({ cat, onUpdate, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="bg-surface/60 border border-surface-border rounded-xl p-4 space-y-4"
    >
      {/* name + delete */}
      <div className="flex items-center gap-3">
        <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />
        <input
          value={cat.name}
          onChange={(e) => onUpdate({ ...cat, name: e.target.value })}
          placeholder="Название категории"
          className="flex-1 min-w-0 px-3 py-2 text-sm font-medium bg-card border border-surface-border rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-600 transition-colors"
        />
        {confirmDelete ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onDelete}
              className="px-2.5 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Да
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1.5 text-xs font-medium bg-surface-hover hover:bg-surface-border text-gray-300 rounded-lg transition-colors"
            >
              Нет
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 text-gray-500 hover:text-red-400 transition-colors shrink-0"
            title="Удалить категорию"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* progress slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Прогресс</span>
          <span className="text-sm font-bold text-emerald-400">{cat.progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={cat.progress}
          onChange={(e) => onUpdate({ ...cat, progress: Number(e.target.value) })}
          className="w-full h-2 rounded-full appearance-none bg-gray-700 accent-emerald-500 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500
            [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(16,185,129,0.4)]
            [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:hover:shadow-[0_0_12px_rgba(16,185,129,0.6)]"
        />
      </div>

      {/* links */}
      <LinkEditor
        links={cat.links || []}
        onChange={(links) => onUpdate({ ...cat, links })}
      />
    </motion.div>
  )
}

/* ── Main AdminPanel ── */

export default function AdminPanel({ project, onClose, onProjectUpdated }) {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [name, setName] = useState(project.name)
  const [categories, setCategories] = useState(
    () => (project.settings?.categories || []).map((c) => ({ ...c }))
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setName(project.name)
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
      { id: uid(), name: '', progress: 0, links: [] },
    ])
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const avgProgress =
      categories.length > 0
        ? Math.round(categories.reduce((s, c) => s + (c.progress || 0), 0) / categories.length)
        : 0

    try {
      const { data, error: err } = await supabase
        .from('projects')
        .update({
          name,
          settings: { ...project.settings, categories },
          progress: avgProgress,
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
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* panel */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-dark-bg border-l border-surface-border flex flex-col overflow-hidden"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
          <h2 className="text-lg font-bold text-gray-100">Настройки проекта</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* project name */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Название проекта
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-surface-border rounded-xl text-gray-100 text-base font-medium placeholder-gray-600 focus:outline-none focus:border-emerald-600 transition-colors"
            />
          </div>

          {/* categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Категории ({categories.length})
              </label>
              <button
                onClick={addCategory}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить
              </button>
            </div>

            <AnimatePresence initial={false}>
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  onUpdate={(updated) => updateCategory(cat.id, updated)}
                  onDelete={() => deleteCategory(cat.id)}
                />
              ))}
            </AnimatePresence>

            {categories.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-6">
                Нет категорий. Нажмите «Добавить».
              </p>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-surface-border space-y-3 shrink-0">
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

      {/* delete modal */}
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
